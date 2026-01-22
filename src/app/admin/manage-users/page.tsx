"use client";

import React, { useState } from 'react';
import { Loader2, Search, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

export default function ManageUsersPage() {
    const { userProfile } = useAuth();

    // Ideally this page is for super admin, so they can select any org.
    // OR if this is "Organization Admin", they can only add to their own org.
    // The prompt says "Organization admin can add an individual to their organization".
    // So we default to adding to current user's org.

    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null); // success message
    const [error, setError] = useState('');

    const handleAddMember = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userProfile?.organizationId && userProfile?.userType !== 'organization') {
            setError("You must be part of an organization to add members.");
            return;
        }

        // If user is the Org account itself (userType organization), use its UID as orgId.
        // If user is a Member admin, use their organizationId.
        const targetOrgId = userProfile.userType === 'organization' ? userProfile.uid : userProfile.organizationId;

        setLoading(true);
        setError('');
        setResult(null);

        try {
            const res = await fetch('/api/add_individual_to_org', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    organizationId: targetOrgId,
                    individualEmail: email
                })
            });

            const data = await res.json();

            if (data.success) {
                setResult(data);
                setEmail('');
            } else {
                setError(data.message);
            }

        } catch (err) {
            console.error(err);
            setError("Request failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <div className="bg-white border-b shadow-sm sticky top-0 z-10 px-4 py-3 flex justify-between items-center">
                <Link href="/admin/dashboard" className="font-bold text-xl text-gray-900">Manage Users</Link>
                <Link href="/" className="text-sm font-medium text-blue-600">Back to App</Link>
            </div>

            <div className="max-w-xl mx-auto px-4 py-12 space-y-8">
                <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Add Member to Organization</h2>
                    <p className="text-gray-500 text-sm mb-6">
                        Enter the email of an existing individual user to add them to your organization.
                        They must have "Consent to join" enabled effectively.
                    </p>

                    {error && <div className="bg-red-50 text-red-700 p-3 rounded mb-4 text-sm">{error}</div>}

                    {result && (
                        <div className="bg-green-50 text-green-700 p-3 rounded mb-4 text-sm">
                            <p className="font-bold">{result.message}</p>
                        </div>
                    )}

                    <form onSubmit={handleAddMember} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">User Email</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                <input
                                    type="email"
                                    required
                                    className="block w-full pl-9 rounded-md border-gray-300 border p-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900"
                                    placeholder="jane@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400"
                        >
                            {loading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Add Member & Recalculate'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
