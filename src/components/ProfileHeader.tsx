"use client";

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { LogOut, LayoutDashboard, Users } from 'lucide-react';
import { isAdmin } from '@/lib/adminUtils';

export function ProfileHeader() {
    const { user, userProfile, logout } = useAuth();
    const router = useRouter();
    const admin = user ? isAdmin(user.email) : false;

    const handleLogout = async () => {
        await logout();
        router.push('/');
    };

    return (
        <div className="bg-white border-b shadow-sm sticky top-0 z-10 px-4 py-3 flex justify-between items-center">
            <Link href="/" className="font-bold text-xl text-gray-900">Joydrops</Link>
            <div className="flex items-center gap-3">
                {user && (
                    <>
                        {admin && (
                            <>
                                <Link 
                                    href="/admin/dashboard" 
                                    className="flex items-center gap-1 text-purple-600 hover:text-purple-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-purple-50 transition-colors"
                                >
                                    <LayoutDashboard className="h-4 w-4" />
                                    Dashboard
                                </Link>
                                <Link 
                                    href="/admin/manage-users" 
                                    className="flex items-center gap-1 text-purple-600 hover:text-purple-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-purple-50 transition-colors"
                                >
                                    <Users className="h-4 w-4" />
                                    Manage Users
                                </Link>
                            </>
                        )}
                        {userProfile?.userType === 'organization' && !admin && (
                            <Link 
                                href="/admin/manage-users" 
                                className="flex items-center gap-1 text-purple-600 hover:text-purple-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-purple-50 transition-colors"
                            >
                                <Users className="h-4 w-4" />
                                Add Members
                            </Link>
                        )}
                        <Link href="/register-joydrop" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                            Register Joydrop
                        </Link>
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
                        >
                            <LogOut className="h-4 w-4" />
                            Log out
                        </button>
                    </>
                )}
                {!user && (
                    <Link href="/register-joydrop" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                        Register Joydrop
                    </Link>
                )}
            </div>
        </div>
    );
}
