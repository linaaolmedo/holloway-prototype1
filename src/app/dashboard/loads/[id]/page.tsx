'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { LoadWithDetails, LoadStatus, Driver, Truck, Trailer, Carrier } from '@/types/loads';
import { LoadService } from '@/services/loadService';
import { FleetService } from '@/services/fleetService';
import { useAuth } from '@/contexts/AuthContext';
import LoadFormModal from '@/components/loads/LoadFormModal';
import LoadAssignmentModal, { LoadAssignment } from '@/components/loads/LoadAssignmentModal';

export default function LoadDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { profile } = useAuth();
  const loadId = params.id as string;

  const [load, setLoad] = useState<LoadWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [trailers, setTrailers] = useState<Trailer[]>([]);
  const [carriers, setCarriers] = useState<Carrier[]>([]);
  const [assignmentLoading, setAssignmentLoading] = useState(false);

  useEffect(() => {
    if (loadId) {
      fetchLoadDetails();
      fetchAssignmentResources();
    }
  }, [loadId]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchLoadDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const loadData = await LoadService.getLoadById(parseInt(loadId));
      setLoad(loadData);
    } catch (err) {
      console.error('Error fetching load details:', err);
      setError('Failed to load shipment details');
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignmentResources = async () => {
    try {
      const [driversData, trucksData, trailersData, carriersData] = await Promise.all([
        FleetService.searchDrivers({}),
        FleetService.searchTrucks({}),
        FleetService.searchTrailers({}),
        LoadService.getCarriers()
      ]);
      
      // Extract the basic types from the search results
      setDrivers(driversData.map(d => ({
        id: d.id,
        name: d.name,
        phone: d.phone,
        license_number: d.license_number,
        license_expiry_date: d.license_expiry_date,
        medical_card_expiry: d.medical_card_expiry,
        status: d.status as 'Active' | 'On Leave' | 'Inactive',
        truck_id: d.truck_id,
        user_id: d.user_id,
        created_at: d.created_at,
        updated_at: d.updated_at,
        created_by: d.created_by,
        updated_by: d.updated_by
      })));
      
      setTrucks(trucksData.map(t => ({
        id: t.id,
        truck_number: t.truck_number,
        license_plate: t.license_plate,
        maintenance_due: t.maintenance_due,
        status: t.status as 'Available' | 'In Use' | 'Maintenance',
        created_at: t.created_at,
        updated_at: t.updated_at,
        created_by: t.created_by,
        updated_by: t.updated_by
      })));
      
      setTrailers(trailersData.map(t => ({
        id: t.id,
        trailer_number: t.trailer_number,
        license_plate: t.license_plate,
        equipment_type_id: t.equipment_type_id,
        maintenance_due: t.maintenance_due,
        status: t.status as 'Available' | 'In Use' | 'Maintenance',
        created_at: t.created_at,
        updated_at: t.updated_at,
        created_by: t.created_by,
        updated_by: t.updated_by
      })));
      
      setCarriers(carriersData);
    } catch (err) {
      console.error('Error fetching assignment resources:', err);
    }
  };

  const handleStatusChange = async (newStatus: LoadStatus) => {
    if (!load) return;

    try {
      await LoadService.updateLoadStatus(load.id, newStatus);
      setLoad({ ...load, status: newStatus });
    } catch (err) {
      console.error('Error updating load status:', err);
      setError('Failed to update load status');
    }
  };

  const handleAssignment = async (assignment: LoadAssignment) => {
    if (!load) return;

    try {
      setAssignmentLoading(true);
      
      let updatedLoad;
      if (assignment.type === 'internal') {
        updatedLoad = await LoadService.assignInternalFleet(
          load.id,
          assignment.driver_id!,
          assignment.truck_id!,
          assignment.trailer_id!
        );
      } else {
        updatedLoad = await LoadService.assignCarrier(load.id, assignment.carrier_id!);
      }
      
      setLoad(updatedLoad);
      setShowAssignmentModal(false);
    } catch (err) {
      console.error('Error assigning load:', err);
      setError('Failed to assign load');
    } finally {
      setAssignmentLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number | null) => {
    if (!amount) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getStatusColor = (status: LoadStatus) => {
    const colors = {
      'Pending Pickup': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'In Transit': 'bg-blue-100 text-blue-800 border-blue-200',
      'Delivered': 'bg-green-100 text-green-800 border-green-200',
      'Cancelled': 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (error || !load) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-xl mb-4">
            {error || 'Load not found'}
          </div>
          <button
            onClick={() => router.push('/dashboard/loads')}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Back to Loads
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.push('/dashboard/loads')}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-2xl font-semibold text-white">Load L{load.id}</h1>
            <p className="text-gray-400 mt-1">
              {load.customer?.name}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(load.status)}`}>
            {load.status}
          </span>
          {profile?.role === 'Dispatcher' && (
            <button
              onClick={() => setShowEditModal(true)}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Edit Load
            </button>
          )}
        </div>
      </div>

      {/* Load Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Route Information */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Route Information
          </h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-1">Origin</h3>
              <div className="text-white">
                <div className="font-medium">{load.origin_location?.location_name || 'Unknown Location'}</div>
                <div className="text-sm text-gray-400">
                  {load.origin_location?.address_line1}
                  {load.origin_location?.city && `, ${load.origin_location.city}`}
                  {load.origin_location?.state && `, ${load.origin_location.state}`}
                  {load.origin_location?.postal_code && ` ${load.origin_location.postal_code}`}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center py-2">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-1">Destination</h3>
              <div className="text-white">
                <div className="font-medium">{load.destination_location?.location_name || 'Unknown Location'}</div>
                <div className="text-sm text-gray-400">
                  {load.destination_location?.address_line1}
                  {load.destination_location?.city && `, ${load.destination_location.city}`}
                  {load.destination_location?.state && `, ${load.destination_location.state}`}
                  {load.destination_location?.postal_code && ` ${load.destination_location.postal_code}`}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Load Details */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            Load Details
          </h2>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-1">Equipment Type</h3>
                <div className="text-white">{load.equipment_type?.name || 'Not specified'}</div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-1">Weight</h3>
                <div className="text-white">{load.weight ? `${load.weight} lbs` : 'Not specified'}</div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-1">Commodity</h3>
              <div className="text-white">{load.commodity || 'Not specified'}</div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-1">Pickup Date</h3>
                <div className="text-white">{formatDate(load.pickup_date)}</div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-1">Delivery Date</h3>
                <div className="text-white">{formatDate(load.delivery_date)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Assignment Information */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Assignment
          </h2>
          
          <div className="space-y-4">
            {load.carrier_id ? (
              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-1">Assigned Carrier</h3>
                <div className="text-white">{load.carrier?.name || `Carrier ID: ${load.carrier_id}`}</div>
              </div>
            ) : load.driver_id ? (
              <>
                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-1">Assigned Driver</h3>
                  <div className="text-white">{load.driver?.name || `Driver ID: ${load.driver_id}`}</div>
                </div>
                {load.truck_id && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-400 mb-1">Truck</h3>
                    <div className="text-white">{load.truck?.truck_number || `Truck ID: ${load.truck_id}`}</div>
                  </div>
                )}
                {load.trailer_id && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-400 mb-1">Trailer</h3>
                    <div className="text-white">{load.trailer?.trailer_number || `Trailer ID: ${load.trailer_id}`}</div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-gray-400 italic">No assignment yet</div>
            )}
          </div>
        </div>

        {/* Financial Information */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
            Financial Information
          </h2>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-1">Customer Rate</h3>
                <div className="text-white font-semibold text-lg">{formatCurrency(load.rate_customer)}</div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-1">Carrier Rate</h3>
                <div className="text-white font-semibold text-lg">{formatCurrency(load.rate_carrier)}</div>
              </div>
            </div>
            
            {load.rate_customer && load.rate_carrier && (
              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-1">Profit Margin</h3>
                <div className="text-green-400 font-semibold">
                  {formatCurrency(load.rate_customer - load.rate_carrier)} 
                  <span className="text-sm ml-2">
                    ({Math.round(((load.rate_customer - load.rate_carrier) / load.rate_customer) * 100)}%)
                  </span>
                </div>
              </div>
            )}

            {load.invoice_id && (
              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-1">Invoice</h3>
                <div className="text-white">Invoice #{load.invoice_id}</div>
              </div>
            )}

            <div className="flex items-center space-x-2">
              <svg className={`w-5 h-5 ${load.pod_uploaded ? 'text-green-400' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className={`text-sm ${load.pod_uploaded ? 'text-green-400' : 'text-gray-400'}`}>
                {load.pod_uploaded ? 'POD Uploaded' : 'POD Pending'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      {profile?.role === 'Dispatcher' && (
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
          <div className="flex flex-wrap gap-3">
            {load.status === 'Pending Pickup' && !load.driver_id && !load.carrier_id && (
              <button
                onClick={() => setShowAssignmentModal(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Assign Load
              </button>
            )}
            
            {(load.driver_id || load.carrier_id) && load.status === 'Pending Pickup' && (
              <button
                onClick={() => handleStatusChange('In Transit')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Mark In Transit
              </button>
            )}
            
            {load.status === 'In Transit' && (
              <button
                onClick={() => handleStatusChange('Delivered')}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Mark Delivered
              </button>
            )}
            
            {(load.driver_id || load.carrier_id) && (
              <button
                onClick={async () => {
                  try {
                    const updatedLoad = await LoadService.unassignLoad(load.id);
                    setLoad(updatedLoad);
                  } catch (err) {
                    console.error('Error unassigning load:', err);
                  }
                }}
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
              >
                Unassign
              </button>
            )}
            
            <button
              onClick={() => handleStatusChange('Cancelled')}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Cancel Load
            </button>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && load && (
        <LoadFormModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSubmit={fetchLoadDetails}
          load={load}
          customers={[]}
          customerLocations={[]}
          carriers={carriers}
          equipmentTypes={[]}
          drivers={drivers}
          trucks={trucks}
          trailers={trailers}
          loading={loading}
        />
      )}

      {/* Assignment Modal */}
      {showAssignmentModal && (
        <LoadAssignmentModal
          isOpen={showAssignmentModal}
          onClose={() => setShowAssignmentModal(false)}
          onAssign={handleAssignment}
          loadId={load.id}
          drivers={drivers}
          trucks={trucks}
          trailers={trailers}
          carriers={carriers}
          equipmentTypeId={load.equipment_type_id}
          loading={assignmentLoading}
        />
      )}
    </div>
  );
}
