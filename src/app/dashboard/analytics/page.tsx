'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { AnalyticsService } from '@/services/analyticsService';
import { AnalyticsDashboard } from '@/types/analytics';
import { AnalyticsProvider } from '@/contexts/AnalyticsContext';
import { useAuth } from '@/contexts/AuthContext';
import MonthlyRevenueChart from '@/components/analytics/MonthlyRevenueChart';
import ShipmentStatusChart from '@/components/analytics/ShipmentStatusChart';
import TopCustomersWidget from '@/components/analytics/TopCustomersWidget';
import SummaryStatsWidget from '@/components/analytics/SummaryStatsWidget';

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const loadAnalytics = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      setError(null);
      const data = await AnalyticsService.getAnalyticsDashboard();
      setAnalytics(data);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics data');
      console.error('Analytics loading error:', err);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  // Auto-refresh functionality
  useEffect(() => {
    if (autoRefresh && user) {
      // Refresh every 30 seconds for responsive updates (reduced from 15s to prevent interference)
      intervalRef.current = setInterval(() => {
        loadAnalytics(false); // Don't show loading spinner for background refreshes
      }, 30000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [autoRefresh, user, loadAnalytics]);

  // Refresh when window becomes visible (user switches back to tab)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && autoRefresh && user) {
        loadAnalytics(false);
      }
    };

    const handleFocus = () => {
      if (autoRefresh && user) {
        loadAnalytics(false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [autoRefresh, user, loadAnalytics]);

  // Initial load
  useEffect(() => {
    if (user) {
      loadAnalytics();
    }
  }, [user, loadAnalytics]);

  // Listen for global analytics refresh events
  useEffect(() => {
    const handleGlobalRefresh = () => {
      if (autoRefresh && user) {
        loadAnalytics(false);
      }
    };

    if (typeof window !== 'undefined' && user) {
      window.addEventListener('analytics-refresh', handleGlobalRefresh);
      
      return () => {
        window.removeEventListener('analytics-refresh', handleGlobalRefresh);
      };
    }
  }, [autoRefresh, user, loadAnalytics]);

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

  const formatLastUpdated = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    }).format(date);
  };

  const analyticsContent = (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Operational Analytics</h1>
          <p className="text-gray-600 mt-1">
            Insights into your shipping performance and trends
          </p>
          {lastUpdated && (
            <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-green-500' : 'bg-gray-400'}`}></span>
              Last updated: {formatLastUpdated(lastUpdated)}
              {autoRefresh && <span className="text-green-600">(Auto-updating)</span>}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={toggleAutoRefresh}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            Auto-refresh (15s)
          </label>
          <button 
            onClick={() => loadAnalytics(true)}
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

      {/* Summary Stats */}
      <SummaryStatsWidget
        totalRevenue={analytics?.total_revenue_ytd || 0}
        totalLoads={analytics?.total_loads_ytd || 0}
        averageLoadValue={analytics?.average_load_value || 0}
        loading={loading}
      />

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Revenue Chart */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Revenue</h3>
          <p className="text-gray-600 text-sm mb-4">Track revenue performance over the year.</p>
          <MonthlyRevenueChart 
            data={analytics?.monthly_revenue || []} 
            loading={loading}
          />
        </div>

        {/* Shipment Status Overview */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Shipment Status Overview</h3>
          <p className="text-gray-600 text-sm mb-4">Current distribution of all shipment statuses.</p>
          <ShipmentStatusChart 
            data={analytics?.shipment_status || []} 
            loading={loading}
          />
        </div>
      </div>

      {/* Additional Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Customers */}
        <TopCustomersWidget
          data={analytics?.top_customers || []}
          loading={loading}
        />

        {/* Fleet Utilization */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Fleet Utilization</h3>
          {loading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex justify-between items-center">
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-32"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-16"></div>
                </div>
              ))}
            </div>
          ) : analytics?.fleet_utilization ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Trucks</span>
                <span className="font-semibold">{analytics.fleet_utilization.total_trucks}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Active (In Use)</span>
                <span className="font-semibold text-green-600">{analytics.fleet_utilization.active_trucks}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Available</span>
                <span className="font-semibold text-blue-600">{analytics.fleet_utilization.available_trucks}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Maintenance</span>
                <span className="font-semibold text-orange-600">{analytics.fleet_utilization.maintenance_trucks}</span>
              </div>
              <div className="border-t pt-3 mt-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-900 font-medium">Utilization Rate</span>
                  <span className="font-bold text-lg text-blue-600">
                    {analytics.fleet_utilization.utilization_percentage}%
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No fleet data available</p>
          )}
        </div>
      </div>

      {/* Carrier Performance */}
      {analytics?.carrier_performance && analytics.carrier_performance.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Carrier Performance</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Carrier
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Loads
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Revenue
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Average Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    On-Time %
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {analytics.carrier_performance.map((carrier) => (
                  <tr key={carrier.carrier_id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {carrier.carrier_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {carrier.total_loads}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'USD',
                        minimumFractionDigits: 0,
                      }).format(carrier.total_revenue)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'USD',
                        minimumFractionDigits: 0,
                      }).format(carrier.average_rate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                        carrier.on_time_percentage >= 90 
                          ? 'bg-green-100 text-green-800' 
                          : carrier.on_time_percentage >= 80 
                          ? 'bg-yellow-100 text-yellow-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {carrier.on_time_percentage}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );

  if (error) {
    return (
      <AnalyticsProvider onRefresh={() => loadAnalytics(false)}>
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="text-lg font-medium text-red-800 mb-2">Error Loading Analytics</h3>
            <p className="text-red-600">{error}</p>
            <button 
              onClick={() => loadAnalytics(true)}
              className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </AnalyticsProvider>
    );
  }

  return (
    <AnalyticsProvider onRefresh={() => loadAnalytics(false)}>
      {analyticsContent}
    </AnalyticsProvider>
  );
}
