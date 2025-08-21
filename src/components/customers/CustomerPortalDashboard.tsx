'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { CustomerPortalService, CustomerDashboardStats } from '@/services/customerPortalService';

import Link from 'next/link';

interface CustomerPortalDashboardProps {
  onNewShipmentClick: () => void;
}

export default function CustomerPortalDashboard({ onNewShipmentClick }: CustomerPortalDashboardProps) {
  const { profile } = useAuth();
  const [stats, setStats] = useState<CustomerDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (profile?.customer_id) {
      fetchDashboardStats();
    }
  }, [profile]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchDashboardStats = async () => {
    if (!profile?.customer_id) return;

    try {
      setLoading(true);
      setError(null);
      const dashboardStats = await CustomerPortalService.getDashboardStats(profile.customer_id);
      setStats(dashboardStats);
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      'Pending Pickup': 'bg-yellow-100 text-yellow-800',
      'In Transit': 'bg-blue-100 text-blue-800',
      'Delivered': 'bg-green-100 text-green-800',
      'Cancelled': 'bg-gray-100 text-gray-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-gray-800 rounded-lg p-6 border border-gray-700 animate-pulse">
              <div className="h-4 bg-gray-600 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-600 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-600 rounded w-full"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900 bg-opacity-20 border border-red-700 rounded-lg p-4">
        <p className="text-red-300">{error}</p>
        <button 
          onClick={fetchDashboardStats}
          className="mt-2 text-red-400 hover:text-red-300 text-sm"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!stats) {
    return <div className="text-gray-400">No data available</div>;
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h2 className="text-2xl font-bold text-white mb-2">Welcome Back!</h2>
        <p className="text-gray-400 mb-4">
          Track your shipments and manage your account from here.
        </p>
        <button 
          onClick={onNewShipmentClick}
          className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Request New Shipment</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Shipments */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Total Shipments</p>
              <p className="text-3xl font-bold text-white">{stats.total_shipments}</p>
              <p className="text-xs text-gray-500 mt-1">All time</p>
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
              <p className="text-3xl font-bold text-white">{stats.in_transit}</p>
              <p className="text-xs text-gray-500 mt-1">Currently moving</p>
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
              <p className="text-3xl font-bold text-white">{stats.pending_pickup}</p>
              <p className="text-xs text-gray-500 mt-1">Awaiting pickup</p>
            </div>
            <div className="p-3 bg-yellow-600 rounded-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Outstanding Balance */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Outstanding Balance</p>
              <p className="text-3xl font-bold text-white">{formatCurrency(stats.outstanding_amount)}</p>
              <p className="text-xs text-gray-500 mt-1">{stats.outstanding_invoices} unpaid invoices</p>
            </div>
            <div className="p-3 bg-red-600 rounded-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Shipments */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Recent Shipments</h3>
            <Link 
              href="/dashboard/customer-shipments" 
              className="text-red-400 hover:text-red-300 text-sm"
            >
              View All
            </Link>
          </div>
          
          {stats.recent_shipments.length === 0 ? (
            <p className="text-gray-400 text-sm">No recent shipments</p>
          ) : (
            <div className="space-y-3">
              {stats.recent_shipments.map((shipment) => (
                <div key={shipment.id} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-white font-medium">#{shipment.id}</span>
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(shipment.status)}`}>
                        {shipment.status}
                      </span>
                    </div>
                    <p className="text-gray-400 text-sm mt-1">
                      {shipment.commodity || 'Bulk Material'}
                    </p>
                    <p className="text-gray-500 text-xs">
                      {shipment.pickup_date ? formatDate(shipment.pickup_date) : 'TBD'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-medium">
                      {shipment.rate_customer ? formatCurrency(shipment.rate_customer) : 'TBD'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Invoices */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Recent Invoices</h3>
            <Link 
              href="/dashboard/customer-billing" 
              className="text-red-400 hover:text-red-300 text-sm"
            >
              View All
            </Link>
          </div>
          
          {stats.recent_invoices.length === 0 ? (
            <p className="text-gray-400 text-sm">No recent invoices</p>
          ) : (
            <div className="space-y-3">
              {stats.recent_invoices.map((invoice) => (
                <div key={invoice.id} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-white font-medium">
                        {invoice.invoice_number || `#${invoice.id}`}
                      </span>
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        invoice.is_paid 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {invoice.is_paid ? 'Paid' : 'Outstanding'}
                      </span>
                    </div>
                    <p className="text-gray-500 text-xs">
                      {formatDate(invoice.date_created)}
                    </p>
                    {invoice.due_date && !invoice.is_paid && (
                      <p className="text-yellow-400 text-xs">
                        Due: {formatDate(invoice.due_date)}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-white font-medium">
                      {formatCurrency(invoice.total_amount || 0)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button 
            onClick={onNewShipmentClick}
            className="flex items-center space-x-3 p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
          >
            <div className="p-2 bg-red-600 rounded-lg">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div className="text-left">
              <p className="text-white font-medium">New Shipment</p>
              <p className="text-gray-400 text-sm">Request a new shipment</p>
            </div>
          </button>

          <Link 
            href="/dashboard/customer-shipments"
            className="flex items-center space-x-3 p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
          >
            <div className="p-2 bg-blue-600 rounded-lg">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div className="text-left">
              <p className="text-white font-medium">Track Shipments</p>
              <p className="text-gray-400 text-sm">View all your shipments</p>
            </div>
          </Link>

          <Link 
            href="/dashboard/customer-billing"
            className="flex items-center space-x-3 p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
          >
            <div className="p-2 bg-green-600 rounded-lg">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div className="text-left">
              <p className="text-white font-medium">View Billing</p>
              <p className="text-gray-400 text-sm">Check invoices and payments</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
