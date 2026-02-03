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

        if (!existingUserSnap.empty) {
            // User already exists
            const doc = existingUserSnap.docs[0];
            uid = doc.id;
            userData = doc.data();
        } else {
            // 2. Create new individual user with temporary password and auto-generated slug
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
                createdNewUser: !existingUserSnap || existingUserSnap.empty,
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

import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * HTTP/1.x-compatible GET endpoint for registering a ThankYouGram (TYG) via GHL.
 *
 * Usage (example):
 *   GET /api/register_tyg?email=user@example.com&city=Boston&state=MA&country=USA&lat=42.36&lng=-71.06
 *
 * Behaviour:
 * - If no Auth user exists for the email:
 *   - Creates a Firebase Auth user with a temporary password
 *   - Creates a minimal individual `user_profiles` document with joydropCount = 1
 *   - Reserves a slug in `slugs` collection
 *   - Creates a `joydrops` record with location info (from query params)
 * - If the Auth user already exists:
 *   - Ensures a `user_profiles` document exists (creates one if missing)
 *   - Increments their joydropCount by 1
 *   - Creates a `joydrops` record with location info
 *   - If they are linked to an organization, also increments that org's `orgJoydropCount`
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const email = searchParams.get('email')?.trim().toLowerCase();
    const cityParam = searchParams.get('city') || null;
    const stateParam = searchParams.get('state') || searchParams.get('stateProvince') || null;
    const countryParam = searchParams.get('country') || null;
    const latStr = searchParams.get('lat') || searchParams.get('latitude');
    const lngStr = searchParams.get('lng') || searchParams.get('longitude');

    if (!email) {
      return NextResponse.json(
        { success: false, message: 'Email is required' },
        { status: 400 }
      );
    }

    // Very basic email format check to guard obvious bad input
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return NextResponse.json(
        { success: false, message: 'Invalid email format' },
        { status: 400 }
      );
    }

    let location: { latitude: number; longitude: number } | null = null;
    if (latStr && lngStr) {
      const lat = Number(latStr);
      const lng = Number(lngStr);
      if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
        location = { latitude: lat, longitude: lng };
      }
    }

    // 1. Find or create Auth user by email
    let userRecord;
    let createdAuthUser = false;

    try {
      userRecord = await adminAuth.getUserByEmail(email);
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        // Create a new Auth user with a temporary password
        const localPart = email.split('@')[0] || 'user';
        const tempPassword =
          Math.random().toString(36).slice(2, 10) + 'TyG!';

        userRecord = await adminAuth.createUser({
          email,
          password: tempPassword,
          displayName: localPart,
        });
        createdAuthUser = true;
      } else {
        console.error('Error looking up user by email:', error);
        return NextResponse.json(
          { success: false, message: 'Failed to look up user' },
          { status: 500 }
        );
      }
    }

    const uid = userRecord.uid;
    const userRef = adminDb.collection('user_profiles').doc(uid);

    // 2. Ensure user profile exists; create if needed
    const existingProfileSnap = await userRef.get();
    const isNewProfile = !existingProfileSnap.exists;

    // We may need a slug if creating a new profile
    let normalizedSlug: string | null = null;

    if (isNewProfile) {
      const baseSource =
        userRecord.displayName ||
        email.split('@')[0] ||
        'user';

      let baseSlug = baseSource
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .substring(0, 30);

      if (!baseSlug) {
        baseSlug = `user-${Date.now()}`;
      }

      // Ensure slug uniqueness in `slugs` collection
      normalizedSlug = baseSlug;
      let suffix = 1;

      // Loop a few times to avoid rare collisions
      // (Very unlikely, but keeps slugs unique without needing an extra index)
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const existingSlugDoc = await adminDb
          .collection('slugs')
          .doc(normalizedSlug)
          .get();

        if (!existingSlugDoc.exists) break;

        const candidate = `${baseSlug}-${suffix}`;
        // Keep within 30 chars
        normalizedSlug =
          candidate.length <= 30
            ? candidate
            : `${baseSlug.substring(
                0,
                30 - (`-${suffix}`).length
              )}-${suffix}`;

        suffix += 1;
      }
    }

    const batch = adminDb.batch();

    // 3. Prepare or update user profile data
    let profileData = existingProfileSnap.data() || {};

    if (isNewProfile) {
      profileData = {
        uid,
        email,
        userType: 'individual',
        slug: normalizedSlug,
        password: 'temporary', // flag so UI can force change later if desired
        createdAt: FieldValue.serverTimestamp(),
        joydropCount: 1, // first ThankYouGram from this endpoint
        name:
          userRecord.displayName ||
          email.split('@')[0] ||
          email,
        // Location (from GHL if provided)
        city: cityParam,
        stateProvince: stateParam,
        country: countryParam,
        contactNumber: null,
        contactEmail: email,
      };

      batch.set(userRef, profileData);

      if (normalizedSlug) {
        const slugRef = adminDb.collection('slugs').doc(normalizedSlug);
        batch.set(slugRef, {
          slug: normalizedSlug,
          userId: uid,
          userType: 'individual',
          createdAt: FieldValue.serverTimestamp(),
        });
      }
    } else {
      // Existing profile: increment joydropCount
      batch.update(userRef, {
        joydropCount: FieldValue.increment(1),
      });
    }

    // 4. Prepare Joydrop record (Tier 1 and optional Tier 2 linkage)
    const now = new Date();
    const joydropRef = adminDb.collection('joydrops').doc();

    const effectiveCity =
      cityParam || profileData.city || null;
    const effectiveState =
      stateParam || profileData.stateProvince || null;
    const effectiveCountry =
      countryParam || profileData.country || null;

    const joydropData = {
      id: joydropRef.id,
      userId: uid,
      userName:
        profileData.name ||
        userRecord.displayName ||
        email,
      organizationId: profileData.organizationId || null,
      organizationName: profileData.organizationName || null,
      timestamp: FieldValue.serverTimestamp(),
      date: now.toLocaleDateString(),
      time: now.toLocaleTimeString(),
      city: effectiveCity,
      stateProvince: effectiveState,
      country: effectiveCountry,
      location,
      url: null,
      comment: 'Registered via GHL /register_tyg',
      createdAt: FieldValue.serverTimestamp(),
    };

    batch.set(joydropRef, joydropData);

    // 5. If the user is linked to an organization, increment Tier 2 count
    if (profileData.organizationId) {
      const orgRef = adminDb
        .collection('user_profiles')
        .doc(profileData.organizationId);
      batch.update(orgRef, {
        orgJoydropCount: FieldValue.increment(1),
      });
    }

    await batch.commit();

    return NextResponse.json({
      success: true,
      email,
      uid,
      createdAuthUser,
      createdProfile: isNewProfile,
      message: isNewProfile
        ? 'New individual user created and ThankYouGram registered.'
        : 'Existing user ThankYouGram registered.',
    });
  } catch (error: any) {
    console.error('Error in register_tyg endpoint:', error);
    return NextResponse.json(
      {
        success: false,
        message: error?.message || 'Internal server error',
      },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';

// This endpoint is designed for simple HTTP/1.x integrations (e.g., GoHighLevel).
// It accepts query string parameters only (no JSON body) and uses GET.
//
// Usage example:
//   GET /api/register_tyg?email=test@example.com&city=Boston&state=MA&country=US&lat=42.36&lng=-71.06
//
// Behavior:
// - If a user profile with the given email exists:
//     - Create a ThankYouGram (joydrop) record
//     - Increment the user's joydropCount by 1
//     - If the user is linked to an organization, increment orgJoydropCount by 1
// - If no profile exists:
//     - Look for an Auth user with that email; if none, create one with a temporary password
//     - Create an individual user profile with an auto-generated slug
//     - Reserve the slug in the `slugs` collection
//     - Create a ThankYouGram (joydrop) record
//     - Initialize joydropCount to 1

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const email = searchParams.get('email');
    const cityFromReq = searchParams.get('city');
    const stateFromReq = searchParams.get('state') || searchParams.get('stateProvince');
    const countryFromReq = searchParams.get('country');
    const urlParam = searchParams.get('url');
    const commentParam = searchParams.get('comment');

    const latStr = searchParams.get('lat') || searchParams.get('latitude');
    const lngStr = searchParams.get('lng') || searchParams.get('longitude');

    if (!email) {
      return NextResponse.json(
        { success: false, message: 'Email is required' },
        { status: 400 }
      );
    }

    // Basic email normalization
    const normalizedEmail = email.trim().toLowerCase();

    // Parse optional location
    let location: { latitude: number; longitude: number } | null = null;
    if (latStr && lngStr) {
      const latitude = parseFloat(latStr);
      const longitude = parseFloat(lngStr);
      if (!Number.isNaN(latitude) && !Number.isNaN(longitude)) {
        location = { latitude, longitude };
      }
    }

    // 1. Try to find an existing user profile by email
    const existingProfileSnap = await adminDb
      .collection('user_profiles')
      .where('email', '==', normalizedEmail)
      .limit(1)
      .get();

    const now = new Date();

    // Helper to build joydrop data, shared by both flows
    const buildJoydropData = (userId: string, userData: any) => {
      return {
        id: '', // will be overwritten with doc ID below
        userId,
        userName: userData?.name || userData?.orgName || userData?.email || normalizedEmail,
        organizationId: userData?.organizationId || null,
        organizationName: userData?.organizationName || null,
        timestamp: FieldValue.serverTimestamp(),
        date: now.toLocaleDateString(),
        time: now.toLocaleTimeString(),
        city: cityFromReq || userData?.city || null,
        stateProvince: stateFromReq || userData?.stateProvince || null,
        country: countryFromReq || userData?.country || null,
        location: location,
        url: urlParam || null,
        comment: commentParam || null,
        createdAt: FieldValue.serverTimestamp(),
      };
    };

    // ========= Case 1: Existing user profile =========
    if (!existingProfileSnap.empty) {
      const profileDoc = existingProfileSnap.docs[0];
      const uid = profileDoc.id;
      const userData = profileDoc.data();

      const batch = adminDb.batch();

      const userRef = adminDb.collection('user_profiles').doc(uid);
      const joydropRef = adminDb.collection('joydrops').doc();
      const joydropData = buildJoydropData(uid, userData);
      joydropData.id = joydropRef.id;

      // 1. Create Joydrop record
      batch.set(joydropRef, joydropData);

      // 2. Increment individual's joydrop count
      batch.update(userRef, {
        joydropCount: FieldValue.increment(1),
      });

      // 3. If linked to an organization, increment Tier 2 count
      if (userData?.organizationId) {
        const orgRef = adminDb.collection('user_profiles').doc(userData.organizationId);
        batch.update(orgRef, {
          orgJoydropCount: FieldValue.increment(1),
        });
      }

      await batch.commit();

      const previousCount = userData?.joydropCount || 0;

      return NextResponse.json({
        success: true,
        newUser: false,
        userId: uid,
        joydropCount: previousCount + 1,
        message: 'ThankYouGram registered for existing user',
      });
    }

    // ========= Case 2: No existing profile – create user and profile =========

    // Try to find an existing Auth user first
    let userRecord: any = null;
    try {
      userRecord = await adminAuth.getUserByEmail(normalizedEmail);
    } catch (error: any) {
      // If the user doesn't exist in Auth, we'll create them below
      if (!error || error.code !== 'auth/user-not-found') {
        console.error('Error checking auth user by email:', error);
      }
    }

    if (!userRecord) {
      // Create a new Auth user with a temporary password
      const localPart = normalizedEmail.split('@')[0] || 'friend';
      const displayName = localPart.replace(/[._-]+/g, ' ').trim() || 'Friend';
      const tempPassword = 'TyG-' + Math.random().toString(36).slice(2, 10); // >= 6 chars

      userRecord = await adminAuth.createUser({
        email: normalizedEmail,
        password: tempPassword,
        displayName,
      });
    }

    const uid = userRecord.uid as string;

    // Generate a slug from email local part, following the same rules
    const baseLocalPart = normalizedEmail.split('@')[0] || 'user';
    let baseSlug = baseLocalPart
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 30);

    if (!baseSlug) {
      baseSlug = 'user';
    }

    // Ensure slug uniqueness in `slugs` collection
    let normalizedSlug = baseSlug;
    let counter = 1;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      // Trim again to avoid trailing hyphens after appending counter
      normalizedSlug = normalizedSlug.replace(/^-+|-+$/g, '');
      if (!normalizedSlug) {
        normalizedSlug = `user-${Date.now()}`;
      }

      const slugDoc = await adminDb.collection('slugs').doc(normalizedSlug).get();
      if (!slugDoc.exists) {
        break;
      }

      counter += 1;
      const suffix = `-${counter}`;
      normalizedSlug = (baseSlug + suffix).substring(0, 30);
    }

    const batch = adminDb.batch();

    const userRef = adminDb.collection('user_profiles').doc(uid);
    const slugRef = adminDb.collection('slugs').doc(normalizedSlug);
    const joydropRef = adminDb.collection('joydrops').doc();

    const userData = {
      uid,
      email: normalizedEmail,
      userType: 'individual',
      slug: normalizedSlug,
      password: 'temporary',
      createdAt: FieldValue.serverTimestamp(),
      joydropCount: 1, // First ThankYouGram
      name: userRecord.displayName || baseLocalPart,
      consentToJoinOrg: false,
      address: null,
      city: cityFromReq || null,
      stateProvince: stateFromReq || null,
      country: countryFromReq || null,
      contactNumber: null,
      contactEmail: normalizedEmail,
    };

    const joydropData = buildJoydropData(uid, userData);
    joydropData.id = joydropRef.id;

    // 1. Create user profile
    batch.set(userRef, userData);

    // 2. Reserve slug
    batch.set(slugRef, {
      slug: normalizedSlug,
      userId: uid,
      userType: 'individual',
      createdAt: FieldValue.serverTimestamp(),
    });

    // 3. Create Joydrop record
    batch.set(joydropRef, joydropData);

    await batch.commit();

    return NextResponse.json({
      success: true,
      newUser: true,
      userId: uid,
      joydropCount: 1,
      slug: normalizedSlug,
      message: 'New user created and ThankYouGram registered',
    });
  } catch (error: any) {
    console.error('Error in register_tyg:', error);
    return NextResponse.json(
      {
        success: false,
        message: error?.message || 'Internal server error',
      },
      { status: 500 }
    );
  }
}

