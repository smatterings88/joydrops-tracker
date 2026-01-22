"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SlugChecker } from '@/components/SlugChecker';
import Link from 'next/link';

export default function OrganizationRegisterPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        orgName: '',
        email: '',
        password: '',
        slug: '',
        orgType: '',
        orgCity: '',
        orgCountry: '',
        orgContactPerson: '',
        orgContactEmail: '',
    });

    const [loading, setLoading] = useState(false);
    const [isSlugAvailable, setIsSlugAvailable] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSlugChange = (slug: string) => {
        setFormData(prev => ({ ...prev, slug }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isSlugAvailable) return;

        setLoading(true);

        try {
            const res = await fetch('/api/create_organization_user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await res.json();
            if (data.success) {
                router.push('/login?registered=true');
            } else {
                alert(data.message);
            }
        } catch (error) {
            console.error(error);
            alert('Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full mx-auto bg-white rounded-xl shadow-md p-8 border-t-4 border-purple-600">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-extrabold text-gray-900">Organization Registration</h2>
                    <p className="mt-2 text-sm text-gray-600">Create a team and compete on the leaderboard</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <SlugChecker
                        value={formData.slug}
                        onChange={handleSlugChange}
                        onAvailabilityChange={setIsSlugAvailable}
                        label="Organization ID (Slug)"
                        placeholder="e.g. acme-corp"
                    />

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Organization Name</label>
                            <input required type="text" name="orgName" value={formData.orgName} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 border p-2 text-gray-900" />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Login Email</label>
                            <input required type="email" name="email" value={formData.email} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 border p-2 text-gray-900" />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Password</label>
                            <input required type="password" name="password" value={formData.password} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 border p-2 text-gray-900" />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">City</label>
                                <input required type="text" name="orgCity" value={formData.orgCity} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 border p-2 text-gray-900" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Country</label>
                                <input required type="text" name="orgCountry" value={formData.orgCountry} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 border p-2 text-gray-900" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Contact Person</label>
                            <input type="text" name="orgContactPerson" value={formData.orgContactPerson} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 border p-2 text-gray-900" />
                        </div>
                    </div>

                    <div className="bg-purple-50 p-4 rounded-md">
                        <p className="text-sm text-purple-800">
                            Your <strong>Organization Joydrop Count (Tier 2)</strong> will automatically grow as your members register joydrops.
                        </p>
                    </div>

                    <button
                        type="submit"
                        disabled={!isSlugAvailable || loading}
                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                    >
                        {loading ? 'Creating Organization...' : 'Register Organization'}
                    </button>
                </form>
                <div className="mt-4 text-center">
                    <Link href="/register" className="text-sm text-gray-500 hover:text-gray-700">Back to selection</Link>
                </div>
            </div>
        </div>
    );
}
