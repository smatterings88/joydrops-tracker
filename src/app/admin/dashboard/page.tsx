"use client";

import React, { useEffect, useState } from 'react';
import { DualTierLeaderboard } from '@/components/DualTierLeaderboard';
import MapView from '@/components/MapView';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';

interface Stats {
    totalJoydrops: number;
    totalUsers: number;
    totalIndividuals: number;
    totalOrganizations: number;
}

export default function AdminDashboard() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch('/api/get_stats');
                const data = await res.json();
                setStats(data);
            } catch (err) {
                console.error('Error fetching stats:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <div className="bg-white border-b shadow-sm sticky top-0 z-10 px-4 py-3 flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <Link href="/" className="font-bold text-xl text-gray-900">Joydrops Admin</Link>
                    <span className="bg-gray-100 px-2 py-0.5 rounded text-xs text-gray-500">Dashboard</span>
                </div>
                <div className="flex gap-4">
                    <Link href="/admin/manage-users" className="text-sm font-medium text-gray-600 hover:text-gray-900">Manage Users</Link>
                    <Link href="/" className="text-sm font-medium text-blue-600">Back to App</Link>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

                {/* Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <p className="text-sm text-gray-500">Total Joydrops</p>
                        {loading ? (
                            <Loader2 className="animate-spin text-gray-400 mt-2" size={24} />
                        ) : (
                            <p className="text-2xl font-bold text-gray-900">{stats?.totalJoydrops ?? 0}</p>
                        )}
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <p className="text-sm text-gray-500">Total Users</p>
                        {loading ? (
                            <Loader2 className="animate-spin text-gray-400 mt-2" size={24} />
                        ) : (
                            <p className="text-2xl font-bold text-gray-900">{stats?.totalUsers ?? 0}</p>
                        )}
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <p className="text-sm text-gray-500">Individuals</p>
                        {loading ? (
                            <Loader2 className="animate-spin text-gray-400 mt-2" size={24} />
                        ) : (
                            <p className="text-2xl font-bold text-gray-900">{stats?.totalIndividuals ?? 0}</p>
                        )}
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <p className="text-sm text-gray-500">Organizations</p>
                        {loading ? (
                            <Loader2 className="animate-spin text-gray-400 mt-2" size={24} />
                        ) : (
                            <p className="text-2xl font-bold text-gray-900">{stats?.totalOrganizations ?? 0}</p>
                        )}
                    </div>
                </div>

                {/* Map Section */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">Global Impact Map</h2>
                    <MapView />
                </div>

                {/* Leaderboards Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <DualTierLeaderboard type="individual" />
                    <DualTierLeaderboard type="organization" />
                </div>

            </div>
        </div>
    );
}
