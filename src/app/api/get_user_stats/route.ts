import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');

    if (!slug) {
        return NextResponse.json({ error: 'Slug required' }, { status: 400 });
    }

    try {
        const slugDoc = await adminDb.collection('slugs').doc(slug.toLowerCase()).get();

        if (!slugDoc.exists) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const { userId } = slugDoc.data() as { userId: string };
        const userDoc = await adminDb.collection('user_profiles').doc(userId).get();

        if (!userDoc.exists) {
            return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
        }

        const data = userDoc.data();

        // Return appropriate structure based on type
        if (data?.userType === 'organization') {
            return NextResponse.json({
                name: data.orgName,
                userType: 'organization',
                joydropCount: data.orgJoydropCount || 0, // TIER 2
                slug: data.slug,
                memberCount: data.memberCount || 0,
                // members: ... (fetching members here might be heavy, easier to use separate API or client fetch)
            });
        } else {
            return NextResponse.json({
                name: data?.name,
                userType: 'individual',
                joydropCount: data?.joydropCount || 0, // TIER 1
                slug: data?.slug,
                organizationName: data?.organizationName,
                organizationSlug: data?.organizationSlug,
            });
        }

    } catch (error) {
        console.error('Error fetching stats:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
