'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

export default function UnauthorizedPage() {
  const { profile, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-red-600 rounded-lg flex items-center justify-center mb-6">
            <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          
          <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
          
          <p className="text-gray-400 mb-6">
            You don&apos;t have permission to access this resource.
          </p>
          
          {profile && (
            <div className="bg-gray-800 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-300">
                <span className="text-gray-500">Logged in as:</span> {profile.name}
              </p>
              <p className="text-sm text-gray-300">
                <span className="text-gray-500">Role:</span> {profile.role}
              </p>
            </div>
          )}
          
          <div className="space-y-4">
            <Link 
              href="/dashboard"
              className="block w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
            >
              Back to Dashboard
            </Link>
            
            <button
              onClick={handleSignOut}
              className="block w-full bg-gray-700 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
