import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

export async function GET() {
    try {
        // Fetch all joydrops (Firestore doesn't support != on nested objects)
        // Filter for those with location data in code
        // Limiting to 1000 for MVP performance (Cluster usage in real app)
        // Note: Using limit without orderBy to avoid index requirements
        const snapshot = await adminDb.collection('joydrops')
            .limit(1000)
            .get();

        const joydrops = snapshot.docs
            .map(doc => {
                const data = doc.data();
                // Only include joydrops that have valid location data
                if (data.location && 
                    typeof data.location.latitude === 'number' && 
                    typeof data.location.longitude === 'number') {
                    return {
                        id: doc.id,
                        latitude: data.location.latitude,
                        longitude: data.location.longitude,
                        userName: data.userName || 'Unknown',
                        organizationName: data.organizationName || null,
                        // Simple color coding logic for map client
                        tier: data.organizationId ? 2 : 1
                    };
                }
                return null;
            })
            .filter((drop): drop is NonNullable<typeof drop> => drop !== null);

        console.log(`Fetched ${joydrops.length} joydrops with location data out of ${snapshot.docs.length} total`);

        return NextResponse.json({ joydrops });

    } catch (error) {
        console.error('Error fetching map data:', error);
        return NextResponse.json({ joydrops: [], error: 'Failed to fetch map data' }, { status: 500 });
    }
}
