import Link from 'next/link';
import { User, Building2 } from 'lucide-react';

export default function RegisterPage() {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <div className="max-w-4xl w-full text-center space-y-8">
                <div>
                    <h1 className="text-4xl font-bold text-gray-900 tracking-tight">Join ThankYouGram</h1>
                    <p className="mt-4 text-xl text-gray-500">Choose your account type to get started</p>
                </div>

                <div className="grid md:grid-cols-2 gap-8 mt-12">
                    {/* Individual Card */}
                    <Link
                        href="/register/individual"
                        className="group relative p-8 bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-blue-500 text-left"
                    >
                        <div className="h-14 w-14 bg-blue-100 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <User className="h-8 w-8 text-blue-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Individual</h2>
                        <p className="text-gray-500 mb-6">
                            Track your own ThankYouGrams, join organizations, and see your personal impact grow.
                        </p>
                        <span className="text-blue-600 font-medium group-hover:translate-x-1 inline-flex items-center transition-transform">
                            Register as Individual &rarr;
                        </span>
                    </Link>

                    {/* Organization Card */}
                    <Link
                        href="/register/organization"
                        className="group relative p-8 bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-purple-500 text-left"
                    >
                        <div className="h-14 w-14 bg-purple-100 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <Building2 className="h-8 w-8 text-purple-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Organization</h2>
                        <p className="text-gray-500 mb-6">
                            Create a team profile, aggregate member ThankYouGrams, and compete on the leaderboard.
                        </p>
                        <span className="text-purple-600 font-medium group-hover:translate-x-1 inline-flex items-center transition-transform">
                            Register Organization &rarr;
                        </span>
                    </Link>
                </div>

                <p className="text-sm text-gray-400 mt-8">
                    Already have an account? <Link href="/login" className="text-blue-600 hover:underline">Sign in</Link>
                </p>
            </div>
        </div>
    );
}
