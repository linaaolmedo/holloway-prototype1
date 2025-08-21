'use client';

import { useState, useEffect } from 'react';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '@/components/auth/LoadingSpinner';
import ForgotPasswordModal from '@/components/auth/ForgotPasswordModal';

interface LoginFormData {
  email: string;
  password: string;
}



export default function Home() {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const { user, signIn, loading: authLoading } = useAuth();
  const router = useRouter();

  // Redirect if already logged in
  useEffect(() => {
    if (user && !authLoading) {
      router.push('/dashboard');
    }
  }, [user, authLoading, router]);

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setFormData({ 
      email: '', 
      password: ''
    });
    setError(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      const { user: signedInUser, error: signInError } = await signIn(formData.email, formData.password);
      
      if (signInError) {
        setError(signInError.message || 'Login failed');
        setIsLoading(false);
        return;
      }

      if (signedInUser) {
        // Redirect will happen via useEffect above
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('An unexpected error occurred');
      setIsLoading(false);
    }
  };

  const handleBackToRoles = () => {
    setSelectedRole(null);
    setFormData({ email: '', password: '' });
    setError(null);
  };

  // Show loading if checking auth state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Don't render login if already authenticated
  if (user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const getRoleIcon = (role: UserRole) => {
    const iconProps = "w-6 h-6";
    const icons = {
      Dispatcher: (
        <svg className={iconProps} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      ),
      Customer: (
        <svg className={iconProps} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      Carrier: (
        <svg className={iconProps} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
        </svg>
      ),
      Driver: (
        <svg className={iconProps} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      )
    };
    return icons[role];
  };

  const getRoleDescription = (role: UserRole) => {
    const descriptions = {
      Dispatcher: 'Load management and operations control',
      Customer: 'Shipment management and tracking',
      Carrier: 'Load bidding and fleet management',
      Driver: 'Mobile access and load updates'
    };
    return descriptions[role];
  };

  const getRoleColor = (role: UserRole) => {
    const colors = {
      Dispatcher: 'bg-red-600 hover:bg-red-700',
      Customer: 'bg-gray-600 hover:bg-gray-700',
      Carrier: 'bg-gray-600 hover:bg-gray-700',
      Driver: 'bg-gray-600 hover:bg-gray-700'
    };
    return colors[role];
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {!selectedRole ? (
          // Role Selection View
          <div className="bg-gray-800 rounded-2xl shadow-2xl p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4 transform rotate-45">
                <span className="text-2xl text-white font-bold transform -rotate-45">H</span>
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">
                Holloway
              </h1>
              <h2 className="text-xl font-semibold text-white mb-4">
                BulkFlow TMS
              </h2>
              <p className="text-gray-400 text-sm">
                Select your login method to continue.
              </p>
            </div>

            {/* Role Selection */}
            <div className="space-y-3">
              {(['Dispatcher', 'Driver', 'Carrier', 'Customer'] as UserRole[]).map((role) => (
                <button
                  key={role}
                  onClick={() => handleRoleSelect(role)}
                  className={`w-full py-4 px-6 rounded-lg transition-colors duration-200 flex items-center space-x-3 ${getRoleColor(role)}`}
                >
                  <div className="text-white">
                    {getRoleIcon(role)}
                  </div>
                  <span className="text-white font-medium text-left flex-1">
                    Login as {role}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          // Login Form View
          <div className="bg-gray-800 rounded-2xl shadow-2xl p-8">
            {/* Header with Back Button */}
            <div className="flex items-center mb-8">
              <button
                onClick={handleBackToRoles}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="flex-1 text-center">
                <div className={`w-12 h-12 ${selectedRole === 'Dispatcher' ? 'bg-red-600' : 'bg-gray-600'} rounded-lg flex items-center justify-center text-white mx-auto mb-3`}>
                  {getRoleIcon(selectedRole)}
                </div>
                <h1 className="text-xl font-bold text-white">
                  {selectedRole} Login
                </h1>
                <p className="text-sm text-gray-400">
                  {getRoleDescription(selectedRole)}
                </p>
              </div>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent bg-gray-700 text-white placeholder-gray-400"
                  placeholder="Enter your email"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent bg-gray-700 text-white placeholder-gray-400"
                  placeholder="Enter your password"
                />
              </div>

              {/* Error message */}
              {error && (
                <div className="bg-red-900 bg-opacity-20 border border-red-700 rounded-lg p-3">
                  <p className="text-red-300 text-sm">{error}</p>
                </div>
              )}



              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input type="checkbox" className="rounded border-gray-600 text-red-600 focus:ring-red-500 bg-gray-700" />
                  <span className="ml-2 text-sm text-gray-400">Remember me</span>
                </label>
                <button 
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-sm text-red-400 hover:text-red-300 transition-colors"
                >
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isLoading ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Signing in...
                  </>
                ) : (
                  `Sign in as ${selectedRole}`
                )}
              </button>
            </form>

            {/* Additional Options */}
            <div className="mt-6 pt-6 border-t border-gray-700">
              <p className="text-center text-sm text-gray-400">
                Need help? Contact{' '}
                <a href="#" className="text-red-400 hover:text-red-300">
                  support
                </a>
              </p>
            </div>
          </div>
        )}
        
        {/* Forgot Password Modal */}
        {selectedRole && (
          <ForgotPasswordModal
            isOpen={showForgotPassword}
            onClose={() => setShowForgotPassword(false)}
            userRole={selectedRole}
          />
        )}
      </div>
    </div>
  );
}
