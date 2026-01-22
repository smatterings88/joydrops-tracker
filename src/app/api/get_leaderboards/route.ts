import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import type { Query } from 'firebase-admin/firestore';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'individual'; // 'individual' | 'organization'
    const limit = parseInt(searchParams.get('limit') || '10');

    try {
        const baseRef = adminDb.collection('user_profiles');
        
        // Fetch all users of the specified type, then sort in memory
        // This avoids needing composite indexes
        let snapshot;
        if (type === 'individual') {
            snapshot = await baseRef.where('userType', '==', 'individual').get();
        } else if (type === 'organization') {
            snapshot = await baseRef.where('userType', '==', 'organization').get();
        } else {
            snapshot = await baseRef.where('userType', '==', 'individual').get();
        }

        const leaderboard = snapshot.docs
            .map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    name: type === 'individual' ? (data.name || 'Unknown') : (data.orgName || 'Unknown'),
                    slug: data.slug || '',
                    // Return appropriate count based on tier
                    count: type === 'individual' ? (data.joydropCount || 0) : (data.orgJoydropCount || 0),
                    memberCount: type === 'organization' ? (data.memberCount || 0) : undefined,
                    location: type === 'organization'
                        ? `${data.orgCity || ''}, ${data.orgCountry || ''}`.trim() || 'Unknown'
                        : `${data.city || ''}, ${data.country || ''}`.trim() || 'Unknown'
                };
            })
            // Sort by count descending
            .sort((a, b) => b.count - a.count)
            // Take top N
            .slice(0, limit);

        return NextResponse.json({
            leaderboard,
            tierType: type
        });

    } catch (error: any) {
        console.error('Error fetching leaderboard:', error);
        // Return empty array instead of 500 to prevent UI breaking
        return NextResponse.json({ 
            leaderboard: [], 
            tierType: type,
            error: error.message || 'Failed to fetch' 
        }, { status: 200 });
    }
}
