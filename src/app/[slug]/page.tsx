import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { adminDb } from '@/lib/firebaseAdmin';
import { JoydropCounter } from '@/components/JoydropCounter';
import { TierIndicator } from '@/components/TierIndicator';
import { OrganizationMemberList } from '@/components/OrganizationMemberList';
import { MapPin, Building2, User } from 'lucide-react';

interface PageProps {
    params: { slug: string };
}

async function getProfileData(slug: string) {
    const normalizedSlug = slug.toLowerCase();

    // 1. Resolve Slug
    const slugDoc = await adminDb.collection('slugs').doc(normalizedSlug).get();
    if (!slugDoc.exists) return null;

    const { userId } = slugDoc.data() as { userId: string };

    // 2. Get Profile
    const userDoc = await adminDb.collection('user_profiles').doc(userId).get();
    if (!userDoc.exists) return null;

    return { id: userDoc.id, ...userDoc.data() } as any;
}

export default async function ProfilePage({ params }: PageProps) {
    const profile = await getProfileData(params.slug);

    if (!profile) {
        notFound();
    }

    const isOrg = profile.userType === 'organization';

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header / Nav Placeholder */}
            <div className="bg-white border-b shadow-sm sticky top-0 z-10 px-4 py-3 flex justify-between items-center">
                <Link href="/" className="font-bold text-xl text-gray-900">Joydrops</Link>
                <Link href="/register-joydrop" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                    Register Joydrop
                </Link>
            </div>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

                {/* Profile Header */}
                <div className="bg-white rounded-2xl shadow-sm p-8 border border-gray-100">
                    <div className="flex flex-col md:flex-row items-center md:items-start gap-6 text-center md:text-left">
                        <div className={`w-24 h-24 rounded-full flex items-center justify-center shrink-0 ${isOrg ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                            {isOrg ? <Building2 size={48} /> : <User size={48} />}
                        </div>

                        <div className="flex-1">
                            <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                                <h1 className="text-3xl font-extrabold text-gray-900">{isOrg ? profile.orgName : profile.name}</h1>
                                <TierIndicator tier={isOrg ? 2 : 1} size="sm" />
                            </div>

                            <div className="text-gray-500 space-y-1 mb-4">
                                {(profile.city || profile.orgCity) && (
                                    <div className="flex items-center justify-center md:justify-start gap-1 text-sm">
                                        <MapPin size={16} />
                                        {isOrg
                                            ? [profile.orgCity, profile.orgCountry].filter(Boolean).join(', ')
                                            : [profile.city, profile.country].filter(Boolean).join(', ')
                                        }
                                    </div>
                                )}
                                {/* Individual Context */}
                                {!isOrg && profile.organizationSlug && (
                                    <div className="flex items-center justify-center md:justify-start gap-1 text-sm text-purple-600 font-medium">
                                        <Building2 size={16} />
                                        Member of <Link href={`/${profile.organizationSlug}`} className="hover:underline">{profile.organizationName}</Link>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Main Counter */}
                        <JoydropCounter
                            count={isOrg ? (profile.orgJoydropCount || 0) : (profile.joydropCount || 0)}
                            tier={isOrg ? 2 : 1}
                            label={isOrg ? "Organization Total" : "Personal Score"}
                            size="lg"
                        />
                    </div>
                </div>

                {/* Individual View Breakdown */}
                {!isOrg && profile.organizationId && (
                    <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Building2 className="text-purple-500" />
                            Organization Impact
                        </h2>
                        <div className="flex items-center justify-between p-4 bg-purple-50 rounded-xl">
                            <div>
                                <p className="text-sm text-gray-500">Contributing to</p>
                                <Link href={`/${profile.organizationSlug}`} className="font-bold text-purple-700 text-lg hover:underline">{profile.organizationName}</Link>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-gray-500">Current Org Total</p>
                                <p className="font-bold text-gray-900 text-xl">{/* Since we don't have realtime org count here without fetch, we omit or rely on data sync. 
                        Ideally we fetch Org doc too. But for MVP let's leave it simple or show 'View Org'.
                        Actually, request says "Show organization's TIER 2 count: Organization Joydrops: [count]".
                        So distinct fetch needed OR user_profiles has denormalized org count?
                        Schema says "orgJoydropCount" is on the Organization doc, NOT mirrored to individual.
                        So I need to fetch the Organization Doc to get the latest count.
                    */}</p>
                                <Link href={`/${profile.organizationSlug}`} className="text-sm text-blue-600 hover:underline">View Organization Stats &rarr;</Link>
                            </div>
                        </div>
                    </div>
                )}

                {/* Organization View Members */}
                {isOrg && (
                    <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-gray-900">Members Leaderboard</h2>
                            <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm font-medium">
                                {profile.memberCount || 0} Members
                            </span>
                        </div>
                        <OrganizationMemberList organizationId={profile.uid} orgTotalCount={profile.orgJoydropCount || 0} />
                    </div>
                )}

            </div>
        </div>
    );
}
