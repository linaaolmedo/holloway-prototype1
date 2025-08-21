'use client';

import { useAuth, UserRole } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: UserRole[];
  redirectTo?: string;
}

export default function ProtectedRoute({ 
  children, 
  requiredRoles = [],
  redirectTo = '/'
}: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      // If no user is logged in, redirect to login
      if (!user) {
        router.push(redirectTo);
        return;
      }

      // If user doesn&apos;t have required role, redirect
      if (requiredRoles.length > 0 && profile && !requiredRoles.includes(profile.role)) {
        router.push('/unauthorized');
        return;
      }
    }
  }, [user, profile, loading, requiredRoles, redirectTo, router]);

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

  // If no user, don&apos;t render children (redirect will happen)
  if (!user) {
    return null;
  }

  // If role requirements not met, don&apos;t render children
  if (requiredRoles.length > 0 && profile && !requiredRoles.includes(profile.role)) {
    return null;
  }

  return <>{children}</>;
}
