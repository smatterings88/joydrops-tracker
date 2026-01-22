"use client";

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Droplets, LogOut } from 'lucide-react';

export function Navbar() {
    const { user, userProfile, logout } = useAuth();
    const router = useRouter();

    const handleLogout = async () => {
        await logout();
        router.push('/');
    };

    return (
        <nav className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="bg-blue-600 p-1.5 rounded-lg">
                            <Droplets className="h-6 w-6 text-white" />
                        </div>
                        <span className="font-bold text-xl text-gray-900">Joydrops</span>
                    </Link>
                    <div className="flex items-center gap-4">
                        {user ? (
                            <>
                                {userProfile?.slug && (
                                    <Link 
                                        href={`/${userProfile.slug}`} 
                                        className="text-gray-600 hover:text-gray-900 font-medium"
                                    >
                                        My Profile
                                    </Link>
                                )}
                                <Link 
                                    href="/register-joydrop" 
                                    className="text-gray-600 hover:text-gray-900 font-medium"
                                >
                                    Register Joydrop
                                </Link>
                                <button
                                    onClick={handleLogout}
                                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium"
                                >
                                    <LogOut className="h-4 w-4" />
                                    Log out
                                </button>
                            </>
                        ) : (
                            <>
                                <Link href="/login" className="text-gray-600 hover:text-gray-900 font-medium">
                                    Log in
                                </Link>
                                <Link href="/register" className="bg-gray-900 text-white px-4 py-2 rounded-lg font-medium hover:bg-black transition-colors">
                                    Get Started
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}
