"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { TierIndicator } from '@/components/TierIndicator';
import { Navbar } from '@/components/Navbar';
import { MapPin, Loader2, CheckCircle2 } from 'lucide-react';

export default function RegisterJoydropPage() {
    const { user, userProfile, loading } = useAuth();
    const router = useRouter();

    const [formData, setFormData] = useState({
        url: '',
        comment: '',
        didJoydrop: false,
    });

    const [location, setLocation] = useState<{ latitude: number, longitude: number } | null>(null);
    const [locStatus, setLocStatus] = useState<'idle' | 'locating' | 'found' | 'error'>('idle');

    const [submitting, setSubmitting] = useState(false);
    const [successData, setSuccessData] = useState<{ individual: number, org?: number } | null>(null);
    const [error, setError] = useState('');

    // Protected Route Check
    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    // Geolocation
    useEffect(() => {
        if ('geolocation' in navigator) {
            setLocStatus('locating');
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setLocation({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude
                    });
                    setLocStatus('found');
                },
                (err) => {
                    console.error("Location error:", err);
                    setLocStatus('error');
                }
            );
        } else {
            setLocStatus('error');
        }
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.didJoydrop) return;
        if (!user) return;

        setSubmitting(true);
        setError('');

        try {
            const res = await fetch('/api/register_joydrop', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user.uid,
                    url: formData.url,
                    comment: formData.comment,
                    location: location
                }),
            });

            const data = await res.json();

            if (data.success) {
                setSuccessData({
                    individual: data.individualCount,
                    org: data.organizationCount !== 'N/A' && data.organizationCount !== 'Updated' ? Number(data.organizationCount) : undefined
                });
                // Clear form
                setFormData({ url: '', comment: '', didJoydrop: false });
            } else {
                setError(data.message);
            }
        } catch (err) {
            console.error(err);
            setError("Failed to submit joydrop");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading || !user) {
        return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" /></div>;
    }

    if (successData) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
                <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full text-center space-y-6">
                    <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle2 className="w-10 h-10 text-green-600" />
                    </div>

                    <h2 className="text-3xl font-bold text-gray-900">Joydrop Registered!</h2>
                    <p className="text-gray-500">Your counts have been updated.</p>

                    <div className="grid grid-cols-2 gap-4 mt-6">
                        <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                            <TierIndicator tier={1} size="sm" className="mb-2 bg-white/50" showLabel={false} />
                            <p className="text-sm text-blue-600 uppercase tracking-wide font-semibold">My Count</p>
                            <p className="text-4xl font-bold text-blue-700">{successData.individual}</p>
                        </div>

                        {userProfile?.organizationId && (
                            <div className="p-4 bg-purple-50 rounded-xl border border-purple-100">
                                <TierIndicator tier={2} size="sm" className="mb-2 bg-white/50" showLabel={false} />
                                <p className="text-sm text-purple-600 uppercase tracking-wide font-semibold">Org Count</p>
                                <p className="text-2xl font-bold text-purple-700">Updated (+1)</p>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={() => setSuccessData(null)}
                        className="w-full py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-black transition-colors"
                    >
                        Register Another
                    </button>

                    <button
                        onClick={() => router.push(`/${userProfile?.slug}`)}
                        className="w-full py-3 text-gray-500 hover:text-gray-900 font-medium"
                    >
                        Go to Profile
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-lg w-full mx-auto bg-white rounded-xl shadow-md p-8">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-extrabold text-gray-900">Register a Joydrop</h2>
                    <p className="mt-2 text-sm text-gray-600">Track your positive impact</p>
                </div>

                {error && <div className="bg-red-50 text-red-700 p-3 rounded mb-4">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Location Badge */}
                    <div className={`flex items-center justify-center gap-2 p-2 rounded-lg text-sm ${locStatus === 'found' ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-500'}`}>
                        <MapPin className="w-4 h-4" />
                        {locStatus === 'locating' && "Detecting location..."}
                        {locStatus === 'found' && "Location detected"}
                        {locStatus === 'error' && "Location unavailable (will verify without pin)"}
                        {locStatus === 'idle' && "Waiting for location..."}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Optional Details</label>
                        <input
                            type="url"
                            placeholder="Related URL (optional)"
                            className="block w-full rounded-md border-gray-300 border p-2 mb-3 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900"
                            value={formData.url}
                            onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                        />
                        <textarea
                            placeholder="Comment or thought (optional)"
                            rows={3}
                            className="block w-full rounded-md border-gray-300 border p-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900"
                            value={formData.comment}
                            onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                        />
                    </div>

                    <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
                        <label className="flex items-center space-x-3 cursor-pointer">
                            <input
                                type="checkbox"
                                required
                                checked={formData.didJoydrop}
                                onChange={(e) => setFormData({ ...formData, didJoydrop: e.target.checked })}
                                className="h-6 w-6 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                            />
                            <span className="text-lg font-medium text-blue-900">I did a joydrop!</span>
                        </label>
                    </div>

                    <button
                        type="submit"
                        disabled={submitting || !formData.didJoydrop}
                        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-lg font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all hover:scale-[1.02]"
                    >
                        {submitting ? <Loader2 className="animate-spin" /> : 'Register Joydrop'}
                    </button>
                </form>
                <div className="mt-4 text-center">
                    <button onClick={() => router.back()} className="text-sm text-gray-500 hover:text-gray-700">Cancel</button>
                </div>
                </div>
            </div>
        </div>
    );
}
