"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SlugChecker } from '@/components/SlugChecker';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function OrganizationRegisterPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        // Community Identity
        orgName: '',
        orgType: '',
        orgWebsite: '',
        // Location
        orgCity: '',
        orgCountry: '',
        // Primary Contact
        contactFirstName: '',
        contactLastName: '',
        contactRole: '',
        email: '',
        password: '',
        // Scale & Impact
        orgSize: '',
        featuredPublicly: '',
        beneficiary: '',
        // Referrals
        referrals: '',
        // Consent
        consent: false,
        // Slug (auto-generated or manual)
        slug: '',
    });

    const [loading, setLoading] = useState(false);
    const [isSlugAvailable, setIsSlugAvailable] = useState(false);

    // Auto-generate slug from community name
    useEffect(() => {
        if (formData.orgName && !formData.slug) {
            const autoSlug = formData.orgName
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-+|-+$/g, '')
                .substring(0, 30);
            setFormData(prev => ({ ...prev, slug: autoSlug }));
        }
    }, [formData.orgName]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
            const checked = (e.target as HTMLInputElement).checked;
            setFormData(prev => ({ ...prev, [name]: checked }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSlugChange = (slug: string) => {
        setFormData(prev => ({ ...prev, slug }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        // Allow submission if slug is empty (will be auto-generated) or if it's available
        if (formData.slug && !isSlugAvailable) {
            alert('Please wait for slug validation or choose a different community name.');
            return;
        }

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

    // Country list for dropdown
    const countries = [
        'United States', 'Canada', 'United Kingdom', 'Australia', 'Germany', 'France', 
        'Italy', 'Spain', 'Netherlands', 'Belgium', 'Switzerland', 'Austria', 'Sweden', 
        'Norway', 'Denmark', 'Finland', 'Poland', 'Portugal', 'Greece', 'Ireland',
        'New Zealand', 'Japan', 'South Korea', 'Singapore', 'India', 'Brazil', 
        'Mexico', 'Argentina', 'Chile', 'South Africa', 'Other'
    ];

    // Community types
    const communityTypes = [
        'Non-Profit Organization',
        'Religious Community',
        'Educational Institution',
        'Corporate Social Responsibility',
        'Community Group',
        'Volunteer Organization',
        'Charity Foundation',
        'Social Movement',
        'Other'
    ];

    return (
        <div className="min-h-screen bg-gray-50 py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl w-full mx-auto bg-white rounded-xl shadow-md p-6 sm:p-8">
                <div className="text-center mb-6 sm:mb-8">
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">Community Registration</h2>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Community Identity Section */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Community Identity</h3>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Community Name<span className="text-red-500">*</span>
                            </label>
                            <input 
                                required 
                                type="text" 
                                name="orgName" 
                                value={formData.orgName} 
                                onChange={handleChange} 
                                placeholder="Community Name"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 border p-2.5 text-gray-900 text-sm" 
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Community Type<span className="text-red-500">*</span>
                            </label>
                            <select 
                                required 
                                name="orgType" 
                                value={formData.orgType} 
                                onChange={handleChange} 
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 border p-2.5 text-gray-900 text-sm bg-white"
                            >
                                <option value="">Community Type</option>
                                {communityTypes.map(type => (
                                    <option key={type} value={type}>{type}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Community Website <span className="text-gray-500 text-xs">(Optional)</span>
                            </label>
                            <input 
                                type="url" 
                                name="orgWebsite" 
                                value={formData.orgWebsite} 
                                onChange={handleChange} 
                                placeholder="Web URL goes here"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 border p-2.5 text-gray-900 text-sm" 
                            />
                        </div>
                    </div>

                    {/* Location Section */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Location</h3>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Community City<span className="text-red-500">*</span>
                                </label>
                                <input 
                                    required 
                                    type="text" 
                                    name="orgCity" 
                                    value={formData.orgCity} 
                                    onChange={handleChange} 
                                    placeholder="Community City"
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 border p-2.5 text-gray-900 text-sm" 
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Community Country<span className="text-red-500">*</span>
                                </label>
                                <select 
                                    required 
                                    name="orgCountry" 
                                    value={formData.orgCountry} 
                                    onChange={handleChange} 
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 border p-2.5 text-gray-900 text-sm bg-white"
                                >
                                    <option value="">Community Country</option>
                                    {countries.map(country => (
                                        <option key={country} value={country}>{country}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Primary Contact Section */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Primary Contact</h3>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Primary Contact First Name<span className="text-red-500">*</span>
                                </label>
                                <input 
                                    required 
                                    type="text" 
                                    name="contactFirstName" 
                                    value={formData.contactFirstName} 
                                    onChange={handleChange} 
                                    placeholder="First Name"
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 border p-2.5 text-gray-900 text-sm" 
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Primary Contact Last Name<span className="text-red-500">*</span>
                                </label>
                                <input 
                                    required 
                                    type="text" 
                                    name="contactLastName" 
                                    value={formData.contactLastName} 
                                    onChange={handleChange} 
                                    placeholder="Last Name"
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 border p-2.5 text-gray-900 text-sm" 
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Primary Contact Role/Title<span className="text-red-500">*</span>
                            </label>
                            <input 
                                required 
                                type="text" 
                                name="contactRole" 
                                value={formData.contactRole} 
                                onChange={handleChange} 
                                placeholder="Primary Contact Role/Title"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 border p-2.5 text-gray-900 text-sm" 
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Primary Contact Email<span className="text-red-500">*</span>
                            </label>
                            <input 
                                required 
                                type="email" 
                                name="email" 
                                value={formData.email} 
                                onChange={handleChange} 
                                placeholder="Your Primary Email"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 border p-2.5 text-gray-900 text-sm" 
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Password<span className="text-red-500">*</span>
                            </label>
                            <input 
                                required 
                                type="password" 
                                name="password" 
                                value={formData.password} 
                                onChange={handleChange} 
                                placeholder="Create a password"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 border p-2.5 text-gray-900 text-sm" 
                            />
                        </div>
                    </div>

                    {/* Scale & Impact Section */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Scale & Impact</h3>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Approximate number <span className="text-gray-500 text-xs font-normal">(a rough estimate is fine)</span>
                            </label>
                            <input 
                                type="text" 
                                name="orgSize" 
                                value={formData.orgSize} 
                                onChange={handleChange} 
                                placeholder="Approximate Number of Members"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 border p-2.5 text-gray-900 text-sm" 
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Is your community open to being featured publicly?<span className="text-red-500">*</span>
                            </label>
                            <div className="space-y-2">
                                <label className="flex items-center">
                                    <input 
                                        required 
                                        type="radio" 
                                        name="featuredPublicly" 
                                        value="yes" 
                                        checked={formData.featuredPublicly === 'yes'}
                                        onChange={handleChange}
                                        className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300"
                                    />
                                    <span className="ml-2 text-sm text-gray-700">Yes, of course!</span>
                                </label>
                                <label className="flex items-center">
                                    <input 
                                        required 
                                        type="radio" 
                                        name="featuredPublicly" 
                                        value="no" 
                                        checked={formData.featuredPublicly === 'no'}
                                        onChange={handleChange}
                                        className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300"
                                    />
                                    <span className="ml-2 text-sm text-gray-700">Not at this time</span>
                                </label>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                What beneficiary would you like to support?
                            </label>
                            <input 
                                type="text" 
                                name="beneficiary" 
                                value={formData.beneficiary} 
                                onChange={handleChange} 
                                placeholder="Optional. You can name a cause or leave this blank"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 border p-2.5 text-gray-900 text-sm" 
                            />
                        </div>
                    </div>

                    {/* Referrals Section */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Referrals</h3>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Other Communities You Recommend
                            </label>
                            <textarea 
                                name="referrals" 
                                value={formData.referrals} 
                                onChange={handleChange} 
                                rows={4}
                                placeholder="If you know other communities that would love this, list them here. We'll take it from there. Thanks!"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 border p-2.5 text-gray-900 text-sm resize-y" 
                            />
                        </div>
                    </div>

                    {/* Slug Checker - auto-generated from community name */}
                    {formData.slug && (
                        <div className="opacity-0 h-0 overflow-hidden">
                            <SlugChecker
                                value={formData.slug}
                                onChange={handleSlugChange}
                                onAvailabilityChange={setIsSlugAvailable}
                            />
                        </div>
                    )}

                    {/* Consent Checkbox */}
                    <div className="flex items-start">
                        <div className="flex items-center h-5">
                            <input
                                required
                                id="consent"
                                name="consent"
                                type="checkbox"
                                checked={formData.consent}
                                onChange={handleChange}
                                className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                            />
                        </div>
                        <div className="ml-3 text-sm">
                            <label htmlFor="consent" className="text-gray-700">
                                By checking this box, I consent to receive transactional messages related to my account, orders, or services I have requested. Message frequency may vary. Message & Data rates may apply. Reply HELP for help or STOP to opt-out.
                            </label>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading || (formData.slug && !isSlugAvailable)}
                        className="w-full flex justify-center items-center gap-2 py-3.5 px-6 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                    >
                        {loading ? 'Registering...' : (
                            <>
                                Register Our Community
                                <ArrowRight className="h-5 w-5" />
                            </>
                        )}
                    </button>
                </form>
                <div className="mt-4 text-center">
                    <Link href="/register" className="text-xs sm:text-sm text-gray-500 hover:text-gray-700">Back to selection</Link>
                </div>
            </div>
        </div>
    );
}
