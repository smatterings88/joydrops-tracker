"use client";

import React, { useEffect, useState } from 'react';
import { TierIndicator } from './TierIndicator';
import { Loader2, Trophy } from 'lucide-react';
import Link from 'next/link';

interface LeaderboardItem {
    id: string;
    name: string;
    slug: string;
    count: number;
    memberCount?: number;
    location: string;
}

interface DualTierLeaderboardProps {
    type: 'individual' | 'organization';
}

export const DualTierLeaderboard: React.FC<DualTierLeaderboardProps> = ({ type }) => {
    const [items, setItems] = useState<LeaderboardItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                const res = await fetch(`/api/get_leaderboards?type=${type}&limit=10`);
                const data = await res.json();
                setItems(data.leaderboard || []);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchLeaderboard();
    }, [type]);

    const isTier1 = type === 'individual';

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-gray-400" /></div>;

    return (
        <div className={`bg-white rounded-xl shadow-sm border overflow-hidden ${isTier1 ? 'border-blue-100' : 'border-purple-100'}`}>
            <div className={`p-4 border-b ${isTier1 ? 'bg-blue-50/50' : 'bg-purple-50/50'} flex justify-between items-center`}>
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    <Trophy className={`w-5 h-5 ${isTier1 ? 'text-blue-500' : 'text-purple-500'}`} />
                    {isTier1 ? 'Top Individuals (Tier 1)' : 'Top Organizations (Tier 2)'}
                </h3>
                <TierIndicator tier={isTier1 ? 1 : 2} size="sm" />
            </div>

            <div className="divide-y divide-gray-100">
                {items.length === 0 && <div className="p-4 text-center text-gray-500">No data yet</div>}

                {items.map((item, index) => (
                    <div key={item.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-4">
                            <span className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${index === 0 ? 'bg-yellow-100 text-yellow-700' :
                                    index === 1 ? 'bg-gray-100 text-gray-700' :
                                        index === 2 ? 'bg-orange-100 text-orange-700' :
                                            'text-gray-500'
                                }`}>
                                {index + 1}
                            </span>
                            <div>
                                <Link href={`/${item.slug}`} className="font-medium text-gray-900 hover:text-blue-600 block">
                                    {item.name}
                                </Link>
                                <div className="text-xs text-gray-500 flex gap-2">
                                    <span>{item.location}</span>
                                    {!isTier1 && <span>• {item.memberCount} Mbrs</span>}
                                </div>
                            </div>
                        </div>
                        <div className={`font-bold tabular-nums ${isTier1 ? 'text-blue-600' : 'text-purple-600'}`}>
                            {item.count}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
