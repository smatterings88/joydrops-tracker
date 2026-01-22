import { adminDb } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * Calculates contribution percentage for display.
 * @param individualCount User's Tier 1 count
 * @param orgTotalCount Organization's Tier 2 count
 */
export function calculateContribution(individualCount: number, orgTotalCount: number): number {
    if (!orgTotalCount || orgTotalCount === 0) return 0;
    // Cap at 100% just in case of data sync issues
    return Math.min(100, Math.round((individualCount / orgTotalCount) * 100));
}

/**
 * Adds an individual to an organization and updates Tier 2 count atomically.
 * This is the critical "Tier 2 Recalculation" logic.
 */
export async function addMemberToOrg(
    organizationId: string,
    individualId: string,
    individualData: any
) {
    const batch = adminDb.batch();

    const orgRef = adminDb.collection('user_profiles').doc(organizationId);
    const individualRef = adminDb.collection('user_profiles').doc(individualId);
    const memberRef = adminDb.collection('organization_members').doc(); // Auto-ID

    // 1. Get current Org data to ensure it exists and get slug/name
    const orgDoc = await orgRef.get();
    if (!orgDoc.exists) throw new Error("Organization not found");
    const orgData = orgDoc.data();

    // 2. Update Member (Tier 1 user)
    batch.update(individualRef, {
        organizationId: organizationId,
        organizationSlug: orgData?.slug || '',
        organizationName: orgData?.orgName || '',
        // Mark consent as fulfilled if you want, or leave it.
    });

    // 3. Create Member Record
    batch.set(memberRef, {
        id: memberRef.id,
        organizationId: organizationId,
        organizationSlug: orgData?.slug || '',
        individualId: individualId,
        individualSlug: individualData.slug,
        individualName: individualData.name || individualData.email,
        joinedAt: FieldValue.serverTimestamp(),
    });

    // 4. Update Organization (Tier 2)
    // Increment member count +1
    // Increment Joydrop count + individual's CURRENT count
    const joydropsToAdd = individualData.joydropCount || 0;

    batch.update(orgRef, {
        memberCount: FieldValue.increment(1),
        orgJoydropCount: FieldValue.increment(joydropsToAdd)
    });

    await batch.commit();

    return {
        success: true,
        addedJoydrops: joydropsToAdd,
        newOrgName: orgData?.orgName
    };
}
