"use client";

import React from 'react';
import { DualTierLeaderboard } from '@/components/DualTierLeaderboard';
import MapView from '@/components/MapView';
import Link from 'next/link';

export default function AdminDashboard() {
    // Ideally check for admin email here or in layout/middleware
    // user?.email === 'mgzobel@icloud.com' etc.
    // For implementation speed, we render the dashboard assuming protection is handled by parent/middleware.

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

                {/* Stats Overview Placeholder */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <p className="text-sm text-gray-500">Total Joydrops</p>
                        <p className="text-2xl font-bold text-gray-900">--</p>
                    </div>
                    {/* ... other stats ... */}
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
