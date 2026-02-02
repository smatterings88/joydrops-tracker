import Link from 'next/link';
import { ArrowRight, ShieldCheck, Trophy, Users } from 'lucide-react';
import { Navbar } from '@/components/Navbar';

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <Navbar />

      {/* Hero Section */}
      <div className="relative overflow-hidden pt-16 pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 tracking-tight mb-6">
              Track your impact, <br />
              <span className="text-blue-600">amplify your joy.</span>
            </h1>
            <p className="text-xl text-gray-500 mb-10 leading-relaxed">
              ThankYouGram introduces a revolutionary <strong>2-Tier Tracking System</strong>.
              Every good deed counts twice: once for your personal score, and once for your organization's collective impact.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/register/individual" className="w-full sm:w-auto px-8 py-4 bg-blue-600 text-white rounded-xl font-bold text-lg hover:bg-blue-700 transition-all flex items-center justify-center gap-2">
                Join as Individual <ArrowRight className="w-5 h-5" />
              </Link>
              <Link href="/register/organization" className="w-full sm:w-auto px-8 py-4 bg-purple-100 text-purple-700 rounded-xl font-bold text-lg hover:bg-purple-200 transition-all">
                Register Organization
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Section */}
      <div className="bg-gray-50 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-12">

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
                <Trophy className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Tier 1: Personal Growth</h3>
              <p className="text-gray-500">
                Track your own ThankYouGrams and build your personal legacy. Every action you log increases your personal score immediately.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-6">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Tier 2: Collection Action</h3>
              <p className="text-gray-500">
                Join an organization and your actions automatically count towards their total. Compete together on the global leaderboard.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-6">
                <ShieldCheck className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Verified Impact</h3>
              <p className="text-gray-500">
                With geolocation verification and real-time tracking, every ThankYouGram is a verified step towards a better world.
              </p>
            </div>

          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t py-12">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-400">
          <p>&copy; 2026 ThankYouGram. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
