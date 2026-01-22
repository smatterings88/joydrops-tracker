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

        // Check slug
        const slugRef = adminDb.collection('slugs').doc(normalizedSlug);
        const slugDoc = await slugRef.get();
        if (slugDoc.exists) {
            return NextResponse.json({ success: false, message: 'Slug already taken' }, { status: 409 });
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
            orgName,
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
