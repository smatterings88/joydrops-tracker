import Link from 'next/link';
import { UserSearch } from 'lucide-react';

export default function NotFound() {
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
            <div className="text-center max-w-md">
                <div className="mb-6">
                    <UserSearch className="w-16 h-16 text-gray-400 mx-auto" />
                </div>
                <h1 className="text-4xl font-bold text-gray-900 mb-4">Profile Not Found</h1>
                <p className="text-gray-600 mb-8">
                    The profile you're looking for doesn't exist or may have been removed.
                </p>
                <div className="space-y-3">
                    <Link
                        href="/"
                        className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                    >
                        Go to Home
                    </Link>
                    <div>
                        <Link
                            href="/register"
                            className="text-blue-600 hover:text-blue-700 font-medium"
                        >
                            Create your profile →
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
