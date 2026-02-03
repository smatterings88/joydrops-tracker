import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';

// This endpoint is designed to be called from external systems (e.g., GoHighLevel)
// over simple HTTP/1.x using a GET request with query parameters.
//
// Example:
//   GET /api/register_tyg?email=test@example.com&city=Boston&country=US&stateProvince=MA&lat=42.36&lng=-71.06
//
// Required:
//   - email
//
// Optional (for location enrichment of the joydrop):
//   - city
//   - stateProvince
//   - country
//   - lat
//   - lng
//
// Behavior:
//   1. Look up an individual user by email in user_profiles.
//   2. If not found, create a new individual Firebase Auth user and user_profiles document
//      with a temporary password and auto-generated slug.
//   3. Create a joydrop document tied to that user, including any location info provided.
//   4. Increment the user's joydropCount by 1 (Tier 1).
//   5. If the user is linked to an organization, increment the organization's orgJoydropCount by 1 (Tier 2).

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const email = searchParams.get('email');

        if (!email) {
            return NextResponse.json(
                { success: false, message: 'Email is required' },
                { status: 400 }
            );
        }

        // Basic normalization
        const normalizedEmail = email.trim().toLowerCase();

        // Optional location fields from query params
        const city = searchParams.get('city');
        const stateProvince = searchParams.get('stateProvince');
        const country = searchParams.get('country');
        const lat = searchParams.get('lat');
        const lng = searchParams.get('lng');

        // 1. Look up existing individual user by email
        const profilesRef = adminDb.collection('user_profiles');
        const existingUserSnap = await profilesRef
            .where('email', '==', normalizedEmail)
            .where('userType', '==', 'individual')
            .limit(1)
            .get();

        let uid: string;
        let userData: any;
        let createdNewUser = false;

        if (!existingUserSnap.empty) {
            // User already exists
            const doc = existingUserSnap.docs[0];
            uid = doc.id;
            userData = doc.data();
        } else {
            // 2. Create new individual user with temporary password and auto-generated slug
            createdNewUser = true;
            const tempPassword = `Temp!${Math.random().toString(36).slice(2, 8)}123`;

            // Derive a basic name from email (part before @)
            const derivedName = normalizedEmail.split('@')[0] || 'Friend';

            // Generate a simple slug from email local-part; ensure it's URL-safe and short
            const rawSlug = derivedName
                .toLowerCase()
                .replace(/[^a-z0-9-]+/g, '-') // keep alphanumeric and hyphens
                .replace(/^-+|-+$/g, '')      // trim hyphens at ends
                .substring(0, 30) || `user-${Date.now()}`;

            let slug = rawSlug;

            // Ensure slug uniqueness by appending a short suffix if needed
            let attempt = 0;
            // Small loop to avoid collisions without heavy queries
            while (attempt < 5) {
                const slugDoc = await adminDb.collection('slugs').doc(slug).get();
                if (!slugDoc.exists) break;
                attempt += 1;
                slug = `${rawSlug}-${attempt}`.substring(0, 30);
            }

            // Create Auth user
            const userRecord = await adminAuth.createUser({
                email: normalizedEmail,
                password: tempPassword,
                displayName: derivedName,
            });

            uid = userRecord.uid;

            const batch = adminDb.batch();

            // User profile (minimal fields; can be enriched later)
            const userProfileRef = adminDb.collection('user_profiles').doc(uid);
            userData = {
                uid,
                email: normalizedEmail,
                userType: 'individual',
                slug,
                password: 'temporary',
                createdAt: FieldValue.serverTimestamp(),
                joydropCount: 0,
                name: derivedName,
                // Optional location info we know at creation time
                city: city || null,
                stateProvince: stateProvince || null,
                country: country || null,
            };
            batch.set(userProfileRef, userData);

            // Reserve slug
            const slugRef = adminDb.collection('slugs').doc(slug);
            batch.set(slugRef, {
                slug,
                userId: uid,
                userType: 'individual',
                createdAt: FieldValue.serverTimestamp(),
            });

            await batch.commit();
        }

        // 3. Create Joydrop Record + 4/5. Increment counts
        const batch = adminDb.batch();

        const userRef = adminDb.collection('user_profiles').doc(uid);

        const joydropRef = adminDb.collection('joydrops').doc();
        const location =
            lat && lng
                ? {
                    lat: parseFloat(lat),
                    lng: parseFloat(lng),
                }
                : null;

        const joydropData = {
            id: joydropRef.id,
            userId: uid,
            userName: userData?.name || userData?.email || 'Unknown',
            organizationId: userData?.organizationId || null,
            organizationName: userData?.organizationName || null,
            timestamp: FieldValue.serverTimestamp(),
            date: new Date().toLocaleDateString(),
            time: new Date().toLocaleTimeString(),
            city: city || userData?.city || null,
            stateProvince: stateProvince || userData?.stateProvince || null,
            country: country || userData?.country || null,
            location,
            url: null,
            comment: null,
            createdAt: FieldValue.serverTimestamp(),
            source: 'register_tyg',
        };

        batch.set(joydropRef, joydropData);

        // Increment individual joydrop count (Tier 1)
        batch.update(userRef, {
            joydropCount: FieldValue.increment(1),
        });

        // If the user is linked to an organization, increment Tier 2
        let message = 'ThankYouGram registered (Tier 1)';
        if (userData?.organizationId) {
            const orgRef = adminDb.collection('user_profiles').doc(userData.organizationId);
            batch.update(orgRef, {
                orgJoydropCount: FieldValue.increment(1),
            });
            message += ' & Organization updated (Tier 2)';
        }

        await batch.commit();

        return NextResponse.json(
            {
                success: true,
                message,
                email: normalizedEmail,
                createdNewUser,
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error('Error in register_tyg:', error);
        return NextResponse.json(
            {
                success: false,
                message: error.message || 'Internal server error',
            },
            { status: 500 }
        );
    }
}
