import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const {
            email,
            password,
            orgName,
            slug,
            orgType,
            orgAddress,
            orgCity,
            orgStateProvince,
            orgCountry,
            orgContactPerson,
            orgContactNumber,
            orgContactEmail,
            orgSize
        } = body;

        if (!email || !password || !orgName || !slug) {
            return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
        }

        const normalizedSlug = slug.toLowerCase();
        const normalizedOrgName = orgName.trim();

        // Check slug
        const slugRef = adminDb.collection('slugs').doc(normalizedSlug);
        const slugDoc = await slugRef.get();
        if (slugDoc.exists) {
            return NextResponse.json({ success: false, message: 'Slug already taken' }, { status: 409 });
        }

        // Check for duplicate organization name (case-insensitive)
        // Fetch all organizations and check names in memory since Firestore doesn't support case-insensitive queries
        const orgsSnapshot = await adminDb.collection('user_profiles')
            .where('userType', '==', 'organization')
            .get();

        const existingOrgNames = orgsSnapshot.docs.map(doc => {
            const data = doc.data();
            return data.orgName?.trim().toLowerCase() || '';
        });

        const normalizedOrgNameLower = normalizedOrgName.toLowerCase();
        if (existingOrgNames.includes(normalizedOrgNameLower)) {
            return NextResponse.json({ 
                success: false, 
                message: 'An organization with this name already exists. Please choose a different name.' 
            }, { status: 409 });
        }

        // Create Auth User
        const userRecord = await adminAuth.createUser({
            email,
            password,
            displayName: orgName,
        });

        const uid = userRecord.uid;
        const batch = adminDb.batch();

        // Create Org Profile
        const userProfileRef = adminDb.collection('user_profiles').doc(uid);
        const orgData = {
            uid,
            email,
            userType: 'organization',
            slug: normalizedSlug,
            password: 'temporary',
            createdAt: FieldValue.serverTimestamp(),

            // Organization fields
            orgName: normalizedOrgName, // Store normalized (trimmed) name
            orgType: orgType || null,
            orgAddress: orgAddress || null,
            orgCity: orgCity || null,
            orgStateProvince: orgStateProvince || null,
            orgCountry: orgCountry || null,
            orgContactPerson: orgContactPerson || null,
            orgContactNumber: orgContactNumber || null,
            orgContactEmail: orgContactEmail || null,
            orgSize: orgSize || null,

            // Metrics
            orgJoydropCount: 0, // TIER 2 initialized to 0
            memberCount: 0,
        };

        batch.set(userProfileRef, orgData);

        // Reserve Slug
        batch.set(slugRef, {
            slug: normalizedSlug,
            userId: uid,
            userType: 'organization',
            createdAt: FieldValue.serverTimestamp(),
        });

        await batch.commit();

        return NextResponse.json({
            success: true,
            uid,
            slug: normalizedSlug,
            message: 'Organization created successfully'
        });

    } catch (error: any) {
        console.error('Error creating organization:', error);
        return NextResponse.json({
            success: false,
            message: error.message || 'Internal server error'
        }, { status: 500 });
    }
}
