'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export default function CustomerAccessDebugger() {
  const { user, profile } = useAuth();
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const runDiagnostics = async () => {
    setLoading(true);
    try {
      const diagnostics: any = {
        authUser: user,
        userProfile: profile,
        timestamp: new Date().toISOString()
      };

      // Test direct database role query
      try {
        const { data: roleData, error: roleError } = await supabase
          .rpc('get_user_role');
        diagnostics.databaseRole = { data: roleData, error: roleError };
      } catch (error) {
        diagnostics.databaseRole = { error: error };
      }

      // Test customer count
      try {
        const { count, error: countError } = await supabase
          .from('customers')
          .select('*', { count: 'exact', head: true });
        diagnostics.customerCount = { count, error: countError };
      } catch (error) {
        diagnostics.customerCount = { error: error };
      }

      // Test customer query
      try {
        const { data: customerData, error: customerError } = await supabase
          .from('customers')
          .select('id, name')
          .limit(5);
        diagnostics.customerQuery = { data: customerData, error: customerError };
      } catch (error) {
        diagnostics.customerQuery = { error: error };
      }

      // Test user profile query
      try {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', user?.id)
          .single();
        diagnostics.userProfileQuery = { data: userData, error: userError };
      } catch (error) {
        diagnostics.userProfileQuery = { error: error };
      }

      setDebugInfo(diagnostics);
    } catch (error) {
      console.error('Diagnostic error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fixUserRole = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('users')
        .update({ 
          role: 'Dispatcher',
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating user role:', error);
        alert('Failed to update user role: ' + error.message);
      } else {
        console.log('Successfully updated user role:', data);
        alert('User role updated to Dispatcher. Please refresh the page.');
        window.location.reload();
      }
    } catch (error) {
      console.error('Error fixing user role:', error);
      alert('Failed to fix user role');
    }
  };

  useEffect(() => {
    if (user) {
      runDiagnostics();
    }
  }, [user]);

  if (!user) {
    return (
      <div className="bg-yellow-900 border border-yellow-600 rounded-lg p-4">
        <h3 className="text-lg font-medium text-yellow-300 mb-2">Debug Panel</h3>
        <p className="text-yellow-200">No authenticated user found.</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 border border-gray-600 rounded-lg p-6 mt-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-white">Customer Access Debugger</h3>
        <div className="flex space-x-2">
          <button
            onClick={runDiagnostics}
            disabled={loading}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors disabled:opacity-50"
          >
            {loading ? 'Running...' : 'Run Diagnostics'}
          </button>
          <button
            onClick={fixUserRole}
            className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
          >
            Fix Role to Dispatcher
          </button>
        </div>
      </div>

      {debugInfo && (
        <div className="space-y-4">
          <div className="bg-gray-900 rounded p-4">
            <h4 className="font-medium text-white mb-2">Auth Context</h4>
            <pre className="text-sm text-gray-300 overflow-x-auto">
              {JSON.stringify({
                userId: debugInfo.authUser?.id,
                email: debugInfo.authUser?.email,
                profileRole: debugInfo.userProfile?.role,
                profileName: debugInfo.userProfile?.name
              }, null, 2)}
            </pre>
          </div>

          <div className="bg-gray-900 rounded p-4">
            <h4 className="font-medium text-white mb-2">Database Role Function</h4>
            <pre className="text-sm text-gray-300 overflow-x-auto">
              {JSON.stringify(debugInfo.databaseRole, null, 2)}
            </pre>
          </div>

          <div className="bg-gray-900 rounded p-4">
            <h4 className="font-medium text-white mb-2">Customer Access Test</h4>
            <pre className="text-sm text-gray-300 overflow-x-auto">
              {JSON.stringify({
                count: debugInfo.customerCount,
                sampleData: debugInfo.customerQuery
              }, null, 2)}
            </pre>
          </div>

          <div className="bg-gray-900 rounded p-4">
            <h4 className="font-medium text-white mb-2">User Profile in Database</h4>
            <pre className="text-sm text-gray-300 overflow-x-auto">
              {JSON.stringify(debugInfo.userProfileQuery, null, 2)}
            </pre>
          </div>
        </div>
      )}

      <div className="mt-4 p-4 bg-yellow-900 border border-yellow-600 rounded">
        <p className="text-sm text-yellow-200">
          <strong>Issue:</strong> If customers aren't showing, it's likely because the user's role in the database 
          doesn't match the expected 'Dispatcher' role required by RLS policies.
        </p>
      </div>
    </div>
  );
}
