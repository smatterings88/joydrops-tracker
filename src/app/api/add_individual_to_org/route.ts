import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { addMemberToOrg } from '@/lib/tierCalculations';

export async function POST(request: Request) {
    try {
        const { organizationId, individualEmail } = await request.json();

        if (!organizationId || !individualEmail) {
            return NextResponse.json({ success: false, message: 'Missing fields' }, { status: 400 });
        }

        // Find individual by email
        const usersRef = adminDb.collection('user_profiles');
        const snapshot = await usersRef
            .where('email', '==', individualEmail)
            .where('userType', '==', 'individual')
            .limit(1)
            .get();

        if (snapshot.empty) {
            return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
        }

        const individualDoc = snapshot.docs[0];
        const individualData = individualDoc.data();

        // Check constraints
        if (individualData.organizationId) {
            return NextResponse.json({
                success: false,
                message: 'User already belongs to an organization'
            }, { status: 409 });
        }

        if (!individualData.consentToJoinOrg) {
            return NextResponse.json({
                success: false,
                message: 'User has not consented to join an organization'
            }, { status: 403 });
        }

        // Perform the update logic (Tier 2 recalculation)
        const result = await addMemberToOrg(organizationId, individualDoc.id, individualData);

        return NextResponse.json({
            success: true,
            message: `Successfully added ${individualData.name} to organization. Added ${result.addedJoydrops} ThankYouGrams to Tier 2 count.`,
            newOrgCount: 'Updated' // Client should refetch
        });

    } catch (error: any) {
        console.error('Error adding member:', error);
        return NextResponse.json({
            success: false,
            message: error.message || 'Internal server error'
        }, { status: 500 });
    }
}
