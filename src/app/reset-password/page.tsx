'use client';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '@/components/auth/LoadingSpinner';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const { updatePassword, signOut, user, loading: authLoading } = useAuth();
  const router = useRouter();

  // Check if user is authenticated (they should be after clicking the email link)
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  const validatePassword = (pwd: string) => {
    if (pwd.length < 6) {
      return 'Password must be at least 6 characters long';
    }
    
    // Check for basic complexity (at least one letter and one number/symbol)
    const hasLetter = /[a-zA-Z]/.test(pwd);
    const hasNumberOrSymbol = /[0-9!@#$%^&*(),.?":{}|<>]/.test(pwd);
    
    if (!hasLetter || !hasNumberOrSymbol) {
      return 'Password should include both letters and numbers/symbols for better security';
    }
    
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Validate password strength
    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    setIsLoading(true);

    try {
      const result = await updatePassword(password);

      if (result.error) {
        setError(result.error.message || 'Failed to update password');
        setIsLoading(false);
      } else {
        setIsLoading(false);
        
        // Small delay to ensure UI updates properly
        setTimeout(() => {
          setSuccess('Password updated successfully! Signing out and redirecting to login...');
          
          // Sign out the user and redirect to login page
          setTimeout(() => {
            console.log('Starting sign out and redirect process...');
            
            // Primary timeout - force redirect if signOut takes too long
            const forceRedirectTimeout = setTimeout(() => {
              console.log('Sign out taking too long, forcing redirect...');
              localStorage.clear();
              sessionStorage.clear();
              window.location.href = '/';
            }, 2000); // 2 second timeout for signOut
            
            // Absolute fallback timeout - ensure redirect happens no matter what
            const absoluteFallbackTimeout = setTimeout(() => {
              console.log('Absolute fallback redirect executing...');
              localStorage.clear();
              sessionStorage.clear();
              window.location.href = '/';
            }, 4000); // 4 second absolute timeout
            
            signOut()
              .then(() => {
                console.log('Sign out successful');
                clearTimeout(forceRedirectTimeout);
                clearTimeout(absoluteFallbackTimeout);
                
                // Clear all browser storage to ensure complete logout
                localStorage.clear();
                sessionStorage.clear();
                
                // Force redirect to login page
                window.location.href = '/';
              })
              .catch((error) => {
                console.error('Error signing out:', error);
                clearTimeout(forceRedirectTimeout);
                clearTimeout(absoluteFallbackTimeout);
                
                // Clear all browser storage even if signout fails
                localStorage.clear();
                sessionStorage.clear();
                
                // Force redirect even if signout fails
                window.location.href = '/';
              });
          }, 2000);
        }, 100);
      }
    } catch (error) {
      console.error('Password update error:', error);
      setError('An unexpected error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  // Show loading while checking auth state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Redirect if not authenticated
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-gray-800 rounded-2xl shadow-2xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4 transform rotate-45">
              <span className="text-2xl text-white font-bold transform -rotate-45">H</span>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">
              Set New Password
            </h1>
            <p className="text-gray-400 text-sm">
              Enter your new password below to complete the reset process.
            </p>
          </div>

          {success ? (
            <div className="space-y-4">
              <div className="bg-green-900 bg-opacity-20 border border-green-700 rounded-lg p-4">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <div>
                    <p className="text-green-300 text-sm font-medium">Password Updated Successfully!</p>
                    <p className="text-green-400 text-xs mt-1">You&apos;ll be signed out and redirected to login with your new password.</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent bg-gray-700 text-white placeholder-gray-400"
                  placeholder="Enter your new password"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent bg-gray-700 text-white placeholder-gray-400"
                  placeholder="Confirm your new password"
                  disabled={isLoading}
                />
              </div>

              {/* Password requirements */}
              <div className="bg-gray-700 bg-opacity-50 rounded-lg p-3">
                <p className="text-xs text-gray-400 mb-2">Password requirements:</p>
                <ul className="text-xs space-y-1">
                  <li className={`flex items-center ${password.length >= 6 ? 'text-green-400' : 'text-gray-400'}`}>
                    <span className="mr-2">{password.length >= 6 ? '✓' : '•'}</span>
                    At least 6 characters long
                  </li>
                  <li className={`flex items-center ${/[a-zA-Z]/.test(password) ? 'text-green-400' : 'text-gray-400'}`}>
                    <span className="mr-2">{/[a-zA-Z]/.test(password) ? '✓' : '•'}</span>
                    Contains letters
                  </li>
                  <li className={`flex items-center ${/[0-9!@#$%^&*(),.?":{}|<>]/.test(password) ? 'text-green-400' : 'text-gray-400'}`}>
                    <span className="mr-2">{/[0-9!@#$%^&*(),.?":{}|<>]/.test(password) ? '✓' : '•'}</span>
                    Contains numbers or symbols
                  </li>
                  <li className={`flex items-center ${password && confirmPassword && password === confirmPassword ? 'text-green-400' : 'text-gray-400'}`}>
                    <span className="mr-2">{password && confirmPassword && password === confirmPassword ? '✓' : '•'}</span>
                    Passwords match
                  </li>
                  <li className={`flex items-center ${password && password !== 'password' && password !== '123456' && password !== 'qwerty' ? 'text-green-400' : 'text-gray-400'}`}>
                    <span className="mr-2">{password && password !== 'password' && password !== '123456' && password !== 'qwerty' ? '✓' : '•'}</span>
                    Different from common passwords
                  </li>
                </ul>
              </div>

              {error && (
                <div className="bg-red-900 bg-opacity-20 border border-red-700 rounded-lg p-3">
                  <p className="text-red-300 text-sm">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || !!success}
                className={`w-full py-3 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center ${
                  success 
                    ? 'bg-green-600 text-white' 
                    : 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500'
                }`}
              >
                {isLoading ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Updating Password...
                  </>
                ) : success ? (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Password Updated Successfully!
                  </>
                ) : (
                  'Update Password'
                )}
              </button>
            </form>
          )}

          {/* Additional Options */}
          <div className="mt-6 pt-6 border-t border-gray-700">
            <p className="text-center text-sm text-gray-400">
              Remember your password?{' '}
              <button
                onClick={() => router.push('/')}
                className="text-red-400 hover:text-red-300 transition-colors"
              >
                Back to login
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
