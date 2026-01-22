"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { TierIndicator } from './TierIndicator';
import { ContributionBar } from './ContributionBar';

interface Member {
    id: string;
    name: string;
    slug: string;
    joydropCount: number;
    joinedAt: any;
}

interface OrganizationMemberListProps {
    organizationId: string;
    orgTotalCount: number;
}

export const OrganizationMemberList: React.FC<OrganizationMemberListProps> = ({
    organizationId,
    orgTotalCount
}) => {
    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMembers = async () => {
            try {
                const res = await fetch(`/api/get_organization_members?organizationId=${organizationId}`);
                const data = await res.json();
                if (data.members) {
                    // Sort by count desc
                    const sorted = data.members.sort((a: Member, b: Member) => b.joydropCount - a.joydropCount);
                    setMembers(sorted);
                }
            } catch (error) {
                console.error("Failed to fetch members", error);
            } finally {
                setLoading(false);
            }
        };

        if (organizationId) {
            fetchMembers();
        }
    }, [organizationId]);

    if (loading) return <div className="flex justify-center p-4"><Loader2 className="animate-spin text-purple-600" /></div>;

    if (members.length === 0) {
        return <div className="text-center p-8 bg-gray-50 rounded-lg text-gray-500">No members yet.</div>;
    }

    return (
        <div className="space-y-4">
            {members.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-lg hover:shadow-sm transition-shadow">
                    <div className="flex-1 min-w-0 mr-4">
                        <Link href={`/${member.slug}`} className="text-lg font-medium text-gray-900 hover:text-blue-600 truncate block">
                            {member.name}
                        </Link>
                        <div className="flex items-center gap-2 mt-1">
                            <TierIndicator tier={1} size="sm" />
                            <span className="text-sm font-bold text-gray-700">{member.joydropCount} joydrops</span>
                        </div>
                    </div>

                    <div className="w-32 hidden sm:block">
                        <ContributionBar individualCount={member.joydropCount} totalOrgCount={orgTotalCount} />
                    </div>
                </div>
            ))}
        </div>
    );
};
