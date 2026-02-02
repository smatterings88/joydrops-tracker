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
            // Community Identity
            orgType,
            orgWebsite,
            // Location
            orgCity,
            orgCountry,
            // Primary Contact
            contactFirstName,
            contactLastName,
            contactRole,
            // Scale & Impact
            orgSize,
            featuredPublicly,
            beneficiary,
            // Referrals
            referrals,
            // Legacy fields (for backward compatibility)
            orgAddress,
            orgStateProvince,
            orgContactPerson,
            orgContactNumber,
            orgContactEmail,
        } = body;

        if (!email || !password || !orgName) {
            return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
        }

        // Auto-generate slug from orgName if not provided
        let normalizedSlug = slug?.toLowerCase() || orgName
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')
            .substring(0, 30);
        
        // Ensure slug is not empty
        if (!normalizedSlug) {
            normalizedSlug = `org-${Date.now()}`;
        }
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
            orgWebsite: orgWebsite || null,
            orgAddress: orgAddress || null,
            orgCity: orgCity || null,
            orgStateProvince: orgStateProvince || null,
            orgCountry: orgCountry || null,
            
            // Primary Contact (new fields)
            contactFirstName: contactFirstName || null,
            contactLastName: contactLastName || null,
            contactRole: contactRole || null,
            // Legacy contact fields (for backward compatibility)
            orgContactPerson: orgContactPerson || contactFirstName && contactLastName 
                ? `${contactFirstName} ${contactLastName}`.trim() 
                : null,
            orgContactNumber: orgContactNumber || null,
            orgContactEmail: orgContactEmail || email || null,
            
            // Scale & Impact
            orgSize: orgSize || null,
            featuredPublicly: featuredPublicly || null,
            beneficiary: beneficiary || null,
            
            // Referrals
            referrals: referrals || null,

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
