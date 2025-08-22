// force redeploy

'use client';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import RecentActivityWidget from '@/components/common/RecentActivityWidget';
import RecentNotificationsWidget from '@/components/notifications/RecentNotificationsWidget';
import { DashboardService, DashboardMetrics } from '@/services/dashboardService';

export default function DashboardPage() {
  const { profile, user } = useAuth();
  const router = useRouter();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [recentLoads, setRecentLoads] = useState<Array<{ id: string; status: string; destination: string; puDate: string; delDate: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Redirect users to their appropriate portals
  useEffect(() => {
    if (profile?.role === 'Customer') {
      router.push('/dashboard/customer-portal');
    } else if (profile?.role === 'Carrier') {
      router.push('/dashboard/carrier-load-board');
    } else if (profile?.role === 'Driver') {
      router.push('/dashboard/driver');
    }
  }, [profile, router]);

  // Load dashboard data
  const loadDashboardData = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      setError(null);
      
      const [metricsData, recentLoadsData] = await Promise.all([
        DashboardService.getDashboardMetrics(),
        DashboardService.getRecentActiveLoads(6)
      ]);
      
      setMetrics(metricsData);
      setRecentLoads(recentLoadsData);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
      console.error('Dashboard loading error:', err);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-refresh functionality
  useEffect(() => {
    if (autoRefresh && user) {
      // Refresh every 30 seconds for responsive updates (reduced from 15s to prevent interference)
      intervalRef.current = setInterval(() => {
        loadDashboardData(false); // Don't show loading spinner for background refreshes
      }, 30000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [autoRefresh, user]); // eslint-disable-line react-hooks/exhaustive-deps

  // Listen for analytics refresh events (triggered when load status changes)
  useEffect(() => {
    const handleAnalyticsRefresh = () => {
      if (user) {
        loadDashboardData(false);
      }
    };

    if (user) {
      window.addEventListener('analytics-refresh', handleAnalyticsRefresh);
    }
    return () => {
      window.removeEventListener('analytics-refresh', handleAnalyticsRefresh);
    };
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  // Refresh when window becomes visible (user switches back to tab)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && autoRefresh && user) {
        loadDashboardData(false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [autoRefresh, user]); // eslint-disable-line react-hooks/exhaustive-deps

  // Clean up intervals when user logs out
  useEffect(() => {
    if (!user && intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      setAutoRefresh(false);
    }
  }, [user]);

  const toggleAutoRefresh = () => {
    setAutoRefresh(!autoRefresh);
  };

  const getStatusColor = (status: string) => {
    const colors = {
      'Pending Pickup': 'bg-red-100 text-red-800',
      'In Transit': 'bg-blue-100 text-blue-800',
      'Delivered': 'bg-green-100 text-green-800',
      'Cancelled': 'bg-gray-100 text-gray-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  // Show loading state
  if (loading && !metrics) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          {lastUpdated && (
            <p className="text-sm text-gray-400 mt-1">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-gray-400">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={toggleAutoRefresh}
              className="rounded border-gray-600 text-blue-600 focus:ring-blue-500 bg-gray-700"
            />
            Auto-refresh (15s)
          </label>
          <button 
            onClick={() => loadDashboardData(true)}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Refreshing...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh Now
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-800 border border-red-600 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-red-100">{error}</span>
          </div>
        </div>
      )}

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {/* Total Loads */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Total Loads</p>
              <p className="text-3xl font-bold text-white">{metrics?.totalLoads || 0}</p>
              <p className="text-xs text-gray-500 mt-1">All active and completed loads</p>
            </div>
            <div className="p-3 bg-gray-700 rounded-lg">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
          </div>
        </div>

        {/* In Transit */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">In Transit</p>
              <p className="text-3xl font-bold text-white">{metrics?.inTransit || 0}</p>
              <p className="text-xs text-gray-500 mt-1">Currently moving loads</p>
            </div>
            <div className="p-3 bg-blue-600 rounded-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Pending Pickup */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Pending Pickup</p>
              <p className="text-3xl font-bold text-white">{metrics?.pendingPickup || 0}</p>
              <p className="text-xs text-gray-500 mt-1">Loads awaiting pickup</p>
            </div>
            <div className="p-3 bg-gray-700 rounded-lg">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Delivered */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Delivered</p>
              <p className="text-3xl font-bold text-white">{metrics?.delivered || 0}</p>
              <p className="text-xs text-gray-500 mt-1">Successfully delivered</p>
            </div>
            <div className="p-3 bg-green-600 rounded-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Ready to Invoice */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Ready to Invoice</p>
              <p className="text-3xl font-bold text-white">{metrics?.readyToInvoice || 0}</p>
              <p className="text-xs text-gray-500 mt-1">Delivered loads awaiting an invoice</p>
            </div>
            <div className="p-3 bg-yellow-600 rounded-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Second Row - Recent Activity, Notifications, and Recent Loads */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Audit Activity */}
        <RecentActivityWidget 
          className="border border-gray-700"
          limit={6}
          hours={24}
        />

        {/* Recent Notifications */}
        <RecentNotificationsWidget 
          className="border border-gray-700"
          limit={6}
        />

        {/* Recent Active Loads */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Recent Active Loads</h3>
          </div>
          <p className="text-sm text-gray-400 mb-4">Latest active loads</p>
          
          <div className="space-y-3">
            {recentLoads.length > 0 ? recentLoads.map((load) => (
              <div key={load.id} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-white font-medium">{load.id}</span>
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(load.status)}`}>
                      {load.status}
                    </span>
                  </div>
                  <p className="text-gray-400 text-sm mt-1">{load.destination}</p>
                  <p className="text-gray-500 text-xs">PU: {load.puDate} | Del: {load.delDate}</p>
                </div>
              </div>
            )) : (
              <div className="text-center py-4">
                <p className="text-gray-400">No recent loads found</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Third Row - Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Shipment Status */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Active Shipment Status</h3>
          </div>
          <p className="text-sm text-gray-400 mb-6">Distribution of active (non-delivered) shipment statuses</p>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-gray-300">Pending Pickup</span>
              </div>
              <span className="text-white font-medium">{metrics?.pendingPickup || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-gray-300">In Transit</span>
              </div>
              <span className="text-white font-medium">{metrics?.inTransit || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-gray-300">Delivered</span>
              </div>
              <span className="text-white font-medium">{metrics?.delivered || 0}</span>
            </div>
          </div>

          <div className="mt-6">
            <div className="flex h-2 bg-gray-700 rounded-full overflow-hidden">
              {metrics && (metrics.pendingPickup + metrics.inTransit + metrics.delivered) > 0 ? (
                <>
                  <div 
                    className="bg-red-500 flex-none" 
                    style={{ 
                      width: `${(metrics.pendingPickup / (metrics.pendingPickup + metrics.inTransit + metrics.delivered)) * 100}%` 
                    }}
                  ></div>
                  <div 
                    className="bg-blue-500 flex-none" 
                    style={{ 
                      width: `${(metrics.inTransit / (metrics.pendingPickup + metrics.inTransit + metrics.delivered)) * 100}%` 
                    }}
                  ></div>
                  <div 
                    className="bg-green-500 flex-none" 
                    style={{ 
                      width: `${(metrics.delivered / (metrics.pendingPickup + metrics.inTransit + metrics.delivered)) * 100}%` 
                    }}
                  ></div>
                </>
              ) : (
                <div className="bg-gray-600 w-full"></div>
              )}
            </div>
          </div>
        </div>

        {/* Bulk Freight Analytics */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Bulk Freight Analytics</h3>
          </div>
          <p className="text-sm text-gray-400 mb-6">Performance for delivered bulk loads</p>
          
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-300">Tons Delivered</span>
                <span className="text-white font-medium">1,247</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '78%' }}></div>
              </div>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-300">Avg. Rate / Ton</span>
                <span className="text-white font-medium">$54.20</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: '65%' }}></div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-700">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-white">94.2%</p>
                  <p className="text-xs text-gray-400">On-Time Delivery</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-white">$67,338</p>
                  <p className="text-xs text-gray-400">Total Revenue</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
