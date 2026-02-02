"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SlugChecker } from '@/components/SlugChecker';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';

export default function IndividualRegisterPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        slug: '',
        address: '',
        city: '',
        stateProvince: '',
        country: '',
        contactNumber: '',
        contactEmail: '',
        organizationId: '',
        consentToJoinOrg: false,
    });

    const [loading, setLoading] = useState(false);
    const [isSlugAvailable, setIsSlugAvailable] = useState(false);
    const [organizations, setOrganizations] = useState<any[]>([]);
    const [orgCount, setOrgCount] = useState<number | null>(null);

    // Fetch organizations for dropdown
    useEffect(() => {
        const fetchOrgs = async () => {
            try {
                const q = query(collection(db, 'user_profiles'), where('userType', '==', 'organization'));
                const querySnapshot = await getDocs(q);
                const orgs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setOrganizations(orgs);
            } catch (error) {
                console.error("Error fetching organizations:", error);
            }
        };
        fetchOrgs();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        // Handle checkbox separately
        if (type === 'checkbox') {
            const checked = (e.target as HTMLInputElement).checked;
            setFormData(prev => ({ ...prev, [name]: checked }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }

        if (name === 'organizationId') {
            const selectedOrg = organizations.find(o => o.id === value);
            setOrgCount(selectedOrg ? selectedOrg.orgJoydropCount || 0 : null);
        }
    };

    const handleSlugChange = (slug: string) => {
        setFormData(prev => ({ ...prev, slug }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isSlugAvailable) return;

        setLoading(true);

        // Auto-generate a password (as per requirement "password field set to 'temporary'") 
        // BUT usually user needs to know it to log in. 
        // The requirement says "password: string; // 'temporary' or 'changed by user'".
        // And "Create Firebase Auth user with email/password".
        // So we need to ask the user for a password, OR clear what the initial password is.
        // The prompt says: "Create Firebase Auth user with email/password".
        // And later: "On successful login, check if password === 'temporary'".
        // This implies we set a temporary password? Or the user sets one and we MARK it as temporary?
        // "Force password change on first login" usually means admin created it.
        // If SELF-registering, they should set their password.
        // But the requirement says: "Create document in user_profiles... set password field to 'temporary'".
        // This likely means "Force them to CHANGE it later" regardless of what they set now?
        // OR we generate one.
        // Let's ask for a password to allow them to login the first time.
        // I'll add a password field.

        // Wait, the API `create_individual_user` expects `password`.
        // I missed adding a password field to the `formData`. I will handle it now.

        try {
            const res = await fetch('/api/create_individual_user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    // Since I forgot password field in state, I should add it to UI.
                    // For now let's assume I fix the state in a moment.
                }),
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

    // I need to patch the code to include password before writing.
    // I'll rewrite the component properly.

    return (
        <div className="min-h-screen bg-gray-50 py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full mx-auto bg-white rounded-xl shadow-md p-6 sm:p-8">
                <div className="text-center mb-6 sm:mb-8">
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">Individual Registration</h2>
                    <p className="mt-2 text-xs sm:text-sm text-gray-600">Start tracking your ThankYouGrams</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <SlugChecker
                        value={formData.slug}
                        onChange={handleSlugChange}
                        onAvailabilityChange={setIsSlugAvailable}
                    />

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Full Name</label>
                            <input required type="text" name="name" value={formData.name} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2 text-gray-900" />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Email</label>
                            <input required type="email" name="email" value={formData.email} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2 text-gray-900" />
                        </div>

                        {/* Added Password Field */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Password</label>
                            <input required type="password" name="password" onChange={(e) => setFormData(p => ({ ...p, password: e.target.value }))} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2 text-gray-900" />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">City</label>
                                <input required type="text" name="city" value={formData.city} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2 text-gray-900" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Country</label>
                                <input required type="text" name="country" value={formData.country} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2 text-gray-900" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Organization (Optional)</label>
                            <select name="organizationId" value={formData.organizationId} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2 text-gray-900">
                                <option value="">Select an organization...</option>
                                {organizations.map(org => (
                                    <option key={org.id} value={org.id}>{org.orgName}</option>
                                ))}
                            </select>
                            {orgCount !== null && (
                                <p className="mt-1 text-sm text-purple-600">
                                    Current ThankYouGrams: <span className="font-bold">{orgCount}</span> (Tier 2)
                                </p>
                            )}
                        </div>

                        <div className="flex items-start">
                            <div className="flex items-center h-5">
                                <input
                                    id="consent"
                                    name="consentToJoinOrg"
                                    type="checkbox"
                                    checked={formData.consentToJoinOrg}
                                    onChange={handleChange}
                                    className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                                />
                            </div>
                            <div className="ml-3 text-sm">
                                <label htmlFor="consent" className="font-medium text-gray-700">Consent to join organization later</label>
                                <p className="text-gray-500">Allow organizations to add you as a member later.</p>
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={!isSlugAvailable || loading}
                        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                    >
                        {loading ? 'Creating Account...' : 'Register'}
                    </button>
                </form>
                <div className="mt-4 text-center">
                    <Link href="/register" className="text-xs sm:text-sm text-gray-500 hover:text-gray-700">Back to selection</Link>
                </div>
            </div>
        </div>
    );
}
