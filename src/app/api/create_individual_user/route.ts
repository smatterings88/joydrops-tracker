import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const {
            email,
            password,
            name,
            slug,
            organizationId,
            consentToJoinOrg,
            // Optional personal fields
            address, city, stateProvince, country, contactNumber, contactEmail
        } = body;

        // Validate required fields
        if (!email || !password || !name || !slug) {
            return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
        }

        const normalizedSlug = slug.toLowerCase();

        // Check slug available again (race condition prevention)
        const slugRef = adminDb.collection('slugs').doc(normalizedSlug);
        const slugDoc = await slugRef.get();
        if (slugDoc.exists) {
            return NextResponse.json({ success: false, message: 'Slug already taken' }, { status: 409 });
        }

        // 1. Create Auth User
        const userRecord = await adminAuth.createUser({
            email,
            password,
            displayName: name,
        });

        const uid = userRecord.uid;
        const batch = adminDb.batch();

        // 2. Prepare User Profile
        const userProfileRef = adminDb.collection('user_profiles').doc(uid);
        let userData: any = {
            uid,
            email,
            userType: 'individual',
            slug: normalizedSlug,
            password: 'temporary', // requirement
            createdAt: FieldValue.serverTimestamp(),
            joydropCount: 0, // TIER 1 initialized to 0
            name,
            consentToJoinOrg: !!consentToJoinOrg,
            // Optional fields
            address: address || null,
            city: city || null,
            stateProvince: stateProvince || null,
            country: country || null,
            contactNumber: contactNumber || null,
            contactEmail: contactEmail || null,
        };

        // 3. Handle Organization Link (if selected)
        if (organizationId) {
            const orgRef = adminDb.collection('user_profiles').doc(organizationId);
            const orgDoc = await orgRef.get();

            if (!orgDoc.exists) {
                // Fallback if org ID is invalid: just register without org
                console.warn(`Organization ID ${organizationId} not found, registering without org.`);
            } else {
                const orgData = orgDoc.data();
                userData = {
                    ...userData,
                    organizationId,
                    organizationName: orgData?.orgName || '',
                    organizationSlug: orgData?.slug || '',
                };

                // Add to organization_members collection
                const memberRef = adminDb.collection('organization_members').doc();
                batch.set(memberRef, {
                    id: memberRef.id,
                    organizationId,
                    organizationSlug: orgData?.slug || '',
                    individualId: uid,
                    individualSlug: normalizedSlug,
                    individualName: name,
                    joinedAt: FieldValue.serverTimestamp(),
                });

                // Increment Organization Member Count
                // Note: New user has 0 joydrops, so NO increase to Tier 2 count yet.
                batch.update(orgRef, {
                    memberCount: FieldValue.increment(1)
                });
            }
        }

        // 4. Create User Profile
        batch.set(userProfileRef, userData);

        // 5. Reserve Slug
        batch.set(slugRef, {
            slug: normalizedSlug,
            userId: uid,
            userType: 'individual',
            createdAt: FieldValue.serverTimestamp(),
        });

        await batch.commit();

        return NextResponse.json({
            success: true,
            uid,
            slug: normalizedSlug,
            message: 'User created successfully'
        });

    } catch (error: any) {
        console.error('Error creating individual user:', error);
        return NextResponse.json({
            success: false,
            message: error.message || 'Internal server error'
        }, { status: 500 });
    }
}
