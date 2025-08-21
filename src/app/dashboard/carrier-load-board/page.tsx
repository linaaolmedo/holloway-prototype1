'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { LoadWithDetails, LoadStatus } from '@/types/loads';
import { LoadService } from '@/services/loadService';
import LoadingSpinner from '@/components/auth/LoadingSpinner';

interface CarrierDashboardFilters {
  search?: string;
  status?: LoadStatus;
  pickup_date_from?: string;
  pickup_date_to?: string;
}

export default function CarrierDashboardPage() {
  const { profile, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [loads, setLoads] = useState<LoadWithDetails[]>([]);
  const [filteredLoads, setFilteredLoads] = useState<LoadWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<CarrierDashboardFilters>({});
  
  // Load management state
  const [selectedLoad, setSelectedLoad] = useState<LoadWithDetails | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState<LoadStatus>('Pending Pickup');

  // Check if user is a carrier
  useEffect(() => {
    if (!authLoading && profile && profile.role !== 'Carrier') {
      router.push('/unauthorized');
    }
  }, [profile, authLoading, router]);

  // Load carrier's assigned loads
  useEffect(() => {
    if (profile?.carrier_id) {
      loadCarrierLoads();
    }
  }, [profile]); // eslint-disable-line react-hooks/exhaustive-deps

  // Apply filters
  useEffect(() => {
    applyFilters();
  }, [loads, filters]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadCarrierLoads = async () => {
    if (!profile?.carrier_id) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await LoadService.getCarrierLoads(profile.carrier_id);
      setLoads(data);
    } catch (err) {
      console.error('Error loading carrier loads:', err);
      setError('Failed to load your assigned loads');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...loads];

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(load => 
        load.commodity?.toLowerCase().includes(searchLower) ||
        load.customer?.name?.toLowerCase().includes(searchLower) ||
        load.origin_location?.city?.toLowerCase().includes(searchLower) ||
        load.destination_location?.city?.toLowerCase().includes(searchLower)
      );
    }

    if (filters.status) {
      filtered = filtered.filter(load => load.status === filters.status);
    }

    if (filters.pickup_date_from) {
      filtered = filtered.filter(load => 
        load.pickup_date && load.pickup_date >= filters.pickup_date_from!
      );
    }

    if (filters.pickup_date_to) {
      filtered = filtered.filter(load => 
        load.pickup_date && load.pickup_date <= filters.pickup_date_to!
      );
    }

    setFilteredLoads(filtered);
  };

  const handleUpdateStatus = (load: LoadWithDetails) => {
    setSelectedLoad(load);
    setNewStatus(load.status);
    setShowStatusModal(true);
  };

  const handleSubmitStatusUpdate = async () => {
    if (!selectedLoad) return;

    try {
      setUpdatingStatus(true);
      await LoadService.updateLoadStatus(selectedLoad.id, newStatus);
      
      setShowStatusModal(false);
      setSelectedLoad(null);
      await loadCarrierLoads(); // Refresh loads
    } catch (err) {
      console.error('Error updating load status:', err);
      setError('Failed to update load status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleMarkPODUploaded = async (loadId: number) => {
    try {
      await LoadService.markPODUploaded(loadId);
      await loadCarrierLoads(); // Refresh loads
    } catch (err) {
      console.error('Error marking POD as uploaded:', err);
      setError('Failed to mark POD as uploaded');
    }
  };

  const formatCurrency = (amount: number | null) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const getLocationString = (location: { city?: string | null; state?: string | null } | null | undefined) => {
    if (!location) return 'N/A';
    return `${location.city}, ${location.state}`;
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-white mb-2">Error</h2>
          <p className="text-gray-400 mb-4">{error}</p>
          <button 
            onClick={loadCarrierLoads}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">My Shipments</h1>
          <p className="text-gray-400">Manage your assigned loads and shipments</p>
        </div>

        {/* Filters */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Search
              </label>
              <input
                type="text"
                value={filters.search || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-white"
                placeholder="Commodity, customer, city..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Status
              </label>
              <select
                value={filters.status || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as LoadStatus }))}
                className="w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-white"
              >
                <option value="">All Statuses</option>
                <option value="Pending Pickup">Pending Pickup</option>
                <option value="In Transit">In Transit</option>
                <option value="Delivered">Delivered</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Pickup From
              </label>
              <input
                type="date"
                value={filters.pickup_date_from || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, pickup_date_from: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Pickup To
              </label>
              <input
                type="date"
                value={filters.pickup_date_to || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, pickup_date_to: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-white"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={() => setFilters({})}
                className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 h-10"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Load Count */}
        <div className="mb-4">
          <p className="text-gray-400">
            Showing {filteredLoads.length} of {loads.length} assigned shipments
          </p>
        </div>

        {/* Loads Table */}
        <div className="bg-gray-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Load Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Route
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Equipment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Dates
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Rate & Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    POD Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-gray-800 divide-y divide-gray-700">
                {filteredLoads.map((load) => (
                  <tr key={load.id} className="hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-white">
                          {load.commodity || 'N/A'}
                        </div>
                        <div className="text-sm text-gray-400">
                          {load.weight ? `${load.weight} lbs` : 'Weight N/A'}
                        </div>
                        <div className="text-sm text-gray-400">
                          Customer: {load.customer?.name || 'N/A'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm text-white">
                          <strong>From:</strong> {getLocationString(load.origin_location)}
                        </div>
                        <div className="text-sm text-white">
                          <strong>To:</strong> {getLocationString(load.destination_location)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                      {load.equipment_type?.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm text-white">
                          <strong>Pickup:</strong> {formatDate(load.pickup_date)}
                        </div>
                        <div className="text-sm text-white">
                          <strong>Delivery:</strong> {formatDate(load.delivery_date)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm text-white">
                          Rate: {formatCurrency(load.rate_carrier)}
                        </div>
                        <div className="text-sm text-gray-400">
                          Status: 
                          <span className={`ml-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            load.status === 'Delivered' ? 'bg-green-100 text-green-800' :
                            load.status === 'In Transit' ? 'bg-blue-100 text-blue-800' :
                            load.status === 'Pending Pickup' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {load.status}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {load.pod_uploaded ? (
                        <div>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            POD Uploaded
                          </span>
                        </div>
                      ) : (
                        <div>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            POD Pending
                          </span>
                          {load.status === 'Delivered' && (
                            <button
                              onClick={() => handleMarkPODUploaded(load.id)}
                              className="ml-2 text-xs text-blue-400 hover:text-blue-300"
                            >
                              Mark Uploaded
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleUpdateStatus(load)}
                        className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 text-sm mr-2"
                      >
                        Update Status
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredLoads.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-400 text-lg">No shipments found</p>
              <p className="text-gray-500 text-sm mt-2">No loads are currently assigned to your carrier</p>
            </div>
          )}
        </div>

        {/* Status Update Modal */}
        {showStatusModal && selectedLoad && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-medium text-white mb-4">
                Update Load Status
              </h3>
              
              <div className="mb-4">
                <p className="text-gray-400 text-sm mb-2">
                  Load: {selectedLoad.commodity} from {getLocationString(selectedLoad.origin_location)} 
                  to {getLocationString(selectedLoad.destination_location)}
                </p>
                <p className="text-gray-400 text-sm">
                  Current Status: {selectedLoad.status}
                </p>
                <p className="text-gray-400 text-sm">
                  Rate: {formatCurrency(selectedLoad.rate_carrier)}
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  New Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as LoadStatus)}
                  className="w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-white"
                >
                  <option value="Pending Pickup">Pending Pickup</option>
                  <option value="In Transit">In Transit</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={handleSubmitStatusUpdate}
                  disabled={updatingStatus || newStatus === selectedLoad.status}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updatingStatus ? 'Updating...' : 'Update Status'}
                </button>
                <button
                  onClick={() => {
                    setShowStatusModal(false);
                    setSelectedLoad(null);
                  }}
                  className="flex-1 bg-gray-600 text-white py-2 px-4 rounded hover:bg-gray-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
