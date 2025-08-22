'use client';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { CustomerPortalService } from '@/services/customerPortalService';
import { LoadWithDetails, LoadFilters } from '@/types/loads';
import LoadingSpinner from '@/components/auth/LoadingSpinner';

export default function CustomerShipmentsPage() {
  const { profile } = useAuth();
  const [shipments, setShipments] = useState<LoadWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<LoadFilters>({});
  const [searchTerm, setSearchTerm] = useState('');

  const fetchShipments = useCallback(async () => {
    if (!profile?.customer_id) return;

    try {
      setLoading(true);
      const data = await CustomerPortalService.getCustomerShipments(profile.customer_id, filters);
      setShipments(data);
    } catch (error) {
      console.error('Error fetching shipments:', error);
    } finally {
      setLoading(false);
    }
  }, [profile?.customer_id, filters]);

  useEffect(() => {
    if (profile?.customer_id) {
      fetchShipments();
    }
  }, [profile?.customer_id, fetchShipments]);

  const handleFilterChange = (key: keyof LoadFilters, value: string | undefined) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === '' ? undefined : value
    }));
  };

  const handleSearch = () => {
    setFilters(prev => ({
      ...prev,
      search: searchTerm || undefined
    }));
  };

  const clearFilters = () => {
    setFilters({});
    setSearchTerm('');
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

  const formatCurrency = (amount: number | null) => {
    if (!amount) return 'TBD';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'TBD';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getLocationDisplay = (location: { location_name?: string | null; city?: string | null; state?: string | null } | null | undefined) => {
    if (!location) return 'Unknown';
    const parts = [location.location_name, location.city, location.state].filter(Boolean);
    return parts.join(', ') || 'Unknown Location';
  };

  if (!profile || profile.role !== 'Customer') {
    return <div className="text-gray-400">Access denied</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">My Shipments</h1>
          <p className="text-gray-400">Track and manage all your shipments</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Search Commodity
            </label>
            <div className="flex">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by commodity..."
                className="flex-1 px-3 py-2 border border-gray-600 rounded-l-lg focus:ring-2 focus:ring-red-500 focus:border-transparent bg-gray-700 text-white placeholder-gray-400"
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <button
                onClick={handleSearch}
                className="px-4 py-2 bg-red-600 text-white rounded-r-lg hover:bg-red-700 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Status
            </label>
            <select
              value={filters.status || ''}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent bg-gray-700 text-white"
            >
              <option value="">All Statuses</option>
              <option value="Pending Pickup">Pending Pickup</option>
              <option value="In Transit">In Transit</option>
              <option value="Delivered">Delivered</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          {/* Pickup Date From */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Pickup Date From
            </label>
            <input
              type="date"
              value={filters.pickup_date_from || ''}
              onChange={(e) => handleFilterChange('pickup_date_from', e.target.value)}
              className="w-full px-3 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent bg-gray-700 text-white"
            />
          </div>

          {/* Pickup Date To */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Pickup Date To
            </label>
            <input
              type="date"
              value={filters.pickup_date_to || ''}
              onChange={(e) => handleFilterChange('pickup_date_to', e.target.value)}
              className="w-full px-3 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent bg-gray-700 text-white"
            />
          </div>
        </div>

        {/* Clear Filters */}
        <div className="flex justify-end">
          <button
            onClick={clearFilters}
            className="text-gray-400 hover:text-white text-sm"
          >
            Clear All Filters
          </button>
        </div>
      </div>

      {/* Shipments Table */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-white">
            Shipments ({shipments.length})
          </h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center p-8">
            <LoadingSpinner size="lg" />
          </div>
        ) : shipments.length === 0 ? (
          <div className="text-center p-8">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-300">No shipments found</h3>
            <p className="mt-1 text-sm text-gray-400">
              {Object.keys(filters).length > 0 ? 'Try adjusting your filters' : 'You have no shipments yet'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Shipment ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Commodity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Origin
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Destination
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Pickup Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Delivery Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Carrier
                  </th>
                </tr>
              </thead>
              <tbody className="bg-gray-800 divide-y divide-gray-700">
                {shipments.map((shipment) => (
                  <tr key={shipment.id} className="hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-white">#{shipment.id}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-300">{shipment.commodity || 'N/A'}</div>
                      {shipment.weight && (
                        <div className="text-xs text-gray-400">{shipment.weight} lbs</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-300">
                        {getLocationDisplay(shipment.origin_location)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-300">
                        {getLocationDisplay(shipment.destination_location)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-300">{formatDate(shipment.pickup_date)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-300">{formatDate(shipment.delivery_date)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(shipment.status)}`}>
                        {shipment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-white">
                        {formatCurrency(shipment.rate_customer)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-300">
                        {shipment.carrier?.name || 'Unassigned'}
                      </div>
                      {shipment.driver && (
                        <div className="text-xs text-gray-400">{shipment.driver.name}</div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
