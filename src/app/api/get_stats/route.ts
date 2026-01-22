import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

export async function GET() {
    try {
        // Get total joydrops count
        const joydropsSnapshot = await adminDb.collection('joydrops').get();
        const totalJoydrops = joydropsSnapshot.size;

        // Get total users count
        const usersSnapshot = await adminDb.collection('user_profiles').get();
        const totalUsers = usersSnapshot.size;

        // Get individual users count
        const individualsSnapshot = await adminDb.collection('user_profiles')
            .where('userType', '==', 'individual')
            .get();
        const totalIndividuals = individualsSnapshot.size;

        // Get organizations count
        const orgsSnapshot = await adminDb.collection('user_profiles')
            .where('userType', '==', 'organization')
            .get();
        const totalOrganizations = orgsSnapshot.size;

        return NextResponse.json({
            totalJoydrops,
            totalUsers,
            totalIndividuals,
            totalOrganizations
        });

    } catch (error: any) {
        console.error('Error fetching stats:', error);
        return NextResponse.json({
            totalJoydrops: 0,
            totalUsers: 0,
            totalIndividuals: 0,
            totalOrganizations: 0,
            error: error.message || 'Failed to fetch stats'
        }, { status: 200 });
    }
}
