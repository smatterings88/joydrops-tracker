import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebaseAdmin';

export async function POST(request: Request) {
    try {
        const { uid, newPassword } = await request.json();

        if (!uid || !newPassword) {
            return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
        }

        if (newPassword.length < 6) {
            return NextResponse.json({ success: false, message: 'Password must be at least 6 characters' }, { status: 400 });
        }

        // Update Auth Password
        await adminAuth.updateUser(uid, {
            password: newPassword,
        });

        // Update Firestore status
        await adminDb.collection('user_profiles').doc(uid).update({
            password: 'changed_by_user'
        });

        return NextResponse.json({
            success: true,
            message: 'Password changed successfully'
        });

    } catch (error: any) {
        console.error('Error changing password:', error);
        return NextResponse.json({
            success: false,
            message: error.message || 'Internal server error'
        }, { status: 500 });
    }
}
