import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

export async function POST(request: Request) {
    try {
        const { slug } = await request.json();

        if (!slug || typeof slug !== 'string') {
            return NextResponse.json(
                { available: false, message: 'Invalid slug format' },
                { status: 400 }
            );
        }

        const normalizedSlug = slug.toLowerCase();

        // Check strict length and format on server side too
        // Allow alphanumeric and hyphens, but not at start/end
        if (normalizedSlug.length > 30 || !/^[a-z0-9-]+$/.test(normalizedSlug) || normalizedSlug.startsWith('-') || normalizedSlug.endsWith('-')) {
            return NextResponse.json(
                { available: false, message: 'Invalid slug format' },
                { status: 400 }
            );
        }

        // Check existence in 'slugs' collection
        const slugDoc = await adminDb.collection('slugs').doc(normalizedSlug).get();

        if (slugDoc.exists) {
            return NextResponse.json(
                { available: false, message: 'Slug already taken' },
                { status: 200 }
            );
        }

        return NextResponse.json(
            { available: true, message: 'Available' },
            { status: 200 }
        );
    } catch (error) {
        console.error('Error checking slug:', error);
        return NextResponse.json(
            { available: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}
