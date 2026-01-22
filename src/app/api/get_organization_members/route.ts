import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');

    if (!organizationId) {
        return NextResponse.json({ members: [], totalOrgCount: 0 });
    }

    try {
        // 1. Get Org Metadata (for current total count)
        const orgDoc = await adminDb.collection('user_profiles').doc(organizationId).get();
        const orgTotalCount = orgDoc.exists ? orgDoc.data()?.orgJoydropCount || 0 : 0;

        // 2. Get Members
        // Using organization_members collection to find IDs, then fetching user profiles to get CURRENT counts.
        // Why? Because 'organization_members' might not have the realtime count if we don't sync it.
        // Actually, user_profiles has the live 'joydropCount'.
        // So we query user_profiles where organizationId == X.
        const membersSnapshot = await adminDb.collection('user_profiles')
            .where('organizationId', '==', organizationId)
            .get();

        const members = membersSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                name: data.name,
                slug: data.slug,
                joydropCount: data.joydropCount || 0, // TIER 1
                city: data.city || '',
                country: data.country || '',
                joinedAt: data.createdAt, // approximation
            };
        });

        return NextResponse.json({
            members,
            totalOrgCount
        });

    } catch (error) {
        console.error('Error fetching members:', error);
        return NextResponse.json({ members: [], error: 'Failed to fetch' }, { status: 500 });
    }
}
