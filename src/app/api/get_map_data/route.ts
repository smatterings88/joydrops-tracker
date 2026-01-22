import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

export async function GET() {
    try {
        // Only fetch joydrops that have location data
        // Limiting to 500 for MVP performance (Cluster usage in real app)
        const snapshot = await adminDb.collection('joydrops')
            .where('location', '!=', null)
            .limit(500)
            .get();

        const joydrops = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                latitude: data.location.latitude,
                longitude: data.location.longitude,
                userName: data.userName,
                organizationName: data.organizationName,
                // Simple color coding logic for map client
                tier: data.organizationId ? 2 : 1
            };
        });

        return NextResponse.json({ joydrops });

    } catch (error) {
        console.error('Error fetching map data:', error);
        return NextResponse.json({ joydrops: [] }, { status: 500 });
    }
}
