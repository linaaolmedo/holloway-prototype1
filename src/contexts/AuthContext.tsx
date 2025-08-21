'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

// Types for our user profile
export type UserRole = 'Dispatcher' | 'Customer' | 'Carrier' | 'Driver';

export interface UserProfile {
  id: string;
  role: UserRole;
  customer_id: number | null;
  carrier_id: number | null;
  name: string | null;
  email: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuthContextType {
  user: SupabaseUser | null;
  profile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ user: SupabaseUser | null; error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  updatePassword: (password: string) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch user profile from our public.users table
  const fetchUserProfile = async (userId: string): Promise<UserProfile | null> => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        // If user profile doesn't exist, try to create one
        if (error.code === 'PGRST116') {
          console.log('User profile not found, attempting to create one...');
          return await createUserProfile(userId);
        }
        console.error('Error fetching user profile:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  };

  // Create user profile when it doesn't exist
  const createUserProfile = async (userId: string): Promise<UserProfile | null> => {
    try {
      // Get user info from auth.users
      const { data: authUser, error: authError } = await supabase.auth.getUser();
      
      if (authError || !authUser.user) {
        console.error('Error getting auth user:', authError);
        return null;
      }

      // Check if this user is a driver by looking in the drivers table
      const { data: driverData } = await supabase
        .from('drivers')
        .select('*')
        .eq('user_id', userId)
        .single();

      let role: UserRole = 'Driver'; // Default to Driver for company.com emails
      let name = authUser.user.email?.split('@')[0] || 'Unknown User';

      // If found in drivers table, use their name and confirm driver role
      if (driverData) {
        name = driverData.name;
        role = 'Driver';
      } else if (authUser.user.email?.includes('@company.com')) {
        // This is likely a driver account, keep Driver role
        role = 'Driver';
        // Capitalize the first letter of the name
        name = name.charAt(0).toUpperCase() + name.slice(1);
      } else {
        // Check other patterns for different user types
        if (authUser.user.email?.includes('dispatcher')) {
          role = 'Dispatcher';
        } else if (authUser.user.email?.includes('customer')) {
          role = 'Customer';
        } else if (authUser.user.email?.includes('carrier')) {
          role = 'Carrier';
        }
      }

      // Create the user profile
      const { data: newProfile, error: createError } = await supabase
        .from('users')
        .insert({
          id: userId,
          role: role,
          name: name,
          email: authUser.user.email,
          customer_id: null,
          carrier_id: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating user profile:', createError);
        return null;
      }

      console.log('Successfully created user profile:', newProfile);
      return newProfile;
    } catch (error) {
      console.error('Error creating user profile:', error);
      return null;
    }
  };

  // Refresh profile data
  const refreshProfile = async () => {
    if (user) {
      const userProfile = await fetchUserProfile(user.id);
      setProfile(userProfile);
    }
  };

  // Handle auth state changes
  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
        } else if (session) {
          setSession(session);
          setUser(session.user);
          
          // Fetch user profile
          const userProfile = await fetchUserProfile(session.user.id);
          setProfile(userProfile);
        }
      } catch (error) {
        console.error('Error getting initial session:', error);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          // Fetch user profile when user signs in
          const userProfile = await fetchUserProfile(session.user.id);
          setProfile(userProfile);
        } else {
          // Clear profile when user signs out
          setProfile(null);
        }

        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Sign in function
  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        return { user: null, error };
      }

      return { user: data.user, error: null };
    } catch (error) {
      return { user: null, error: error instanceof Error ? error : new Error(String(error)) };
    }
  };

  // Sign out function
  const signOut = async () => {
    try {
      // Clear local state first
      setUser(null);
      setProfile(null);
      setSession(null);
      
      // Sign out from Supabase with scope 'local' to clear everything
      await supabase.auth.signOut({ scope: 'local' });
    } catch (error) {
      console.error('Error signing out:', error);
      // Even if signOut fails, clear local state
      setUser(null);
      setProfile(null);
      setSession(null);
    }
  };

  // Reset password function
  const resetPassword = async (email: string) => {
    try {
      // Send password reset email - Supabase will handle user existence internally
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || window?.location?.origin || 'http://localhost:3000'}/reset-password`,
      });

      if (error) {
        // Handle specific error cases
        if (error.message?.includes('User not found') || error.message?.includes('Invalid email')) {
          return { 
            error: new Error('No account found with this email address.')
          };
        }
        
        // Return the original error for other cases
        return { error };
      }

      return { error: null };
    } catch (error) {
      console.error('Unexpected error in resetPassword:', error);
      return { error: error instanceof Error ? error : new Error(String(error)) };
    }
  };

  // Update password function
  const updatePassword = async (password: string) => {
    return new Promise<{ error: Error | null }>((resolve) => {
      let resolved = false;
      
      // Set up a listener for auth state changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, _session) => {
          if (resolved) return;
          
          if (event === 'USER_UPDATED') {
            resolved = true;
            subscription.unsubscribe();
            resolve({ error: null });
          }
        }
      );
      
      // Start the password update
      supabase.auth.updateUser({ password: password }).catch((error) => {
        if (resolved) return;
        
        // Handle specific error cases
        if (error.message?.includes('New password should be different from the old password')) {
          resolved = true;
          subscription.unsubscribe();
          resolve({ 
            error: new Error('Your new password must be different from your current password. Please choose a different password.')
          });
          return;
        }
        
        if (error.message?.includes('Password should be at least')) {
          resolved = true;
          subscription.unsubscribe();
          resolve({ 
            error: new Error('Password must be at least 6 characters long.')
          });
          return;
        }

        if (error.message?.includes('weak password') || error.message?.includes('Password is too weak')) {
          resolved = true;
          subscription.unsubscribe();
          resolve({ 
            error: new Error('Password is too weak. Please choose a stronger password with a mix of letters, numbers, and symbols.')
          });
          return;
        }

        // For other errors, still resolve as error
        resolved = true;
        subscription.unsubscribe();
        resolve({ error: error instanceof Error ? error : new Error(String(error)) });
      });
      
      // Set a timeout to prevent hanging forever
      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          subscription.unsubscribe();
          resolve({ 
            error: new Error('Password update timed out. Please try again.')
          });
        }
      }, 8000);
    });
  };

  const value: AuthContextType = {
    user,
    profile,
    session,
    loading,
    signIn,
    signOut,
    refreshProfile,
    resetPassword,
    updatePassword
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Helper hook to check if user has a specific role
export function useRole(requiredRole: UserRole) {
  const { profile } = useAuth();
  return profile?.role === requiredRole;
}

// Helper hook to check if user has any of the specified roles
export function useRoles(requiredRoles: UserRole[]) {
  const { profile } = useAuth();
  return profile?.role ? requiredRoles.includes(profile.role) : false;
}
