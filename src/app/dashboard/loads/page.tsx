'use client';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LoadWithDetails, LoadFilters, CreateLoadData, UpdateLoadData, Customer, CustomerLocation, EquipmentType, Carrier, Driver, Truck, Trailer } from '@/types/loads';
import { LoadService } from '@/services/loadService';
import LoadsTable from '@/components/loads/LoadsTable';
import LoadsFilters from '@/components/loads/LoadsFilters';
import LoadFormModal from '@/components/loads/LoadFormModal';
import DeleteConfirmationModal from '@/components/loads/DeleteConfirmationModal';
import BulkActions from '@/components/loads/BulkActions';

export default function LoadsPage() {
  const router = useRouter();
  
  // State
  const [loads, setLoads] = useState<LoadWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<LoadFilters>({});
  const [selectedLoads, setSelectedLoads] = useState<number[]>([]);
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedLoad, setSelectedLoad] = useState<LoadWithDetails | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  // Supporting data
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerLocations, setCustomerLocations] = useState<CustomerLocation[]>([]);
  const [carriers, setCarriers] = useState<Carrier[]>([]);
  const [equipmentTypes, setEquipmentTypes] = useState<EquipmentType[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [trailers, setTrailers] = useState<Trailer[]>([]);

  // Load data
  useEffect(() => {
    loadLoads();
    loadSupportingData();
  }, [filters]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadLoads = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await LoadService.getLoads(filters);
      setLoads(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load loads');
    } finally {
      setLoading(false);
    }
  };

  const loadSupportingData = async () => {
    try {
      const [
        customersData,
        carriersData,
        equipmentTypesData,
        driversData,
        trucksData,
        trailersData,
        locationsData
      ] = await Promise.all([
        LoadService.getCustomers(),
        LoadService.getCarriers(),
        LoadService.getEquipmentTypes(),
        LoadService.getDrivers(),
        LoadService.getTrucks(),
        LoadService.getTrailers(),
        LoadService.getCustomerLocations()
      ]);

      setCustomers(customersData);
      setCarriers(carriersData);
      setEquipmentTypes(equipmentTypesData);
      setDrivers(driversData);
      setTrucks(trucksData);
      setTrailers(trailersData);
      setCustomerLocations(locationsData);
    } catch (err) {
      console.error('Failed to load supporting data:', err);
    }
  };

  const handleCustomerChange = async (customerId: number) => {
    try {
      const locations = await LoadService.getCustomerLocations(customerId);
      setCustomerLocations(locations);
    } catch (err) {
      console.error('Failed to load customer locations:', err);
    }
  };

  // CRUD operations
  const handleCreateLoad = async (data: CreateLoadData | UpdateLoadData) => {
    try {
      setModalLoading(true);
      await LoadService.createLoad(data as CreateLoadData);
      setShowCreateModal(false);
      loadLoads();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create load');
    } finally {
      setModalLoading(false);
    }
  };

  const handleUpdateLoad = async (data: UpdateLoadData) => {
    if (!selectedLoad) return;
    
    try {
      setModalLoading(true);
      await LoadService.updateLoad(selectedLoad.id, data);
      setShowEditModal(false);
      setSelectedLoad(null);
      loadLoads();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update load');
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteLoad = async () => {
    if (!selectedLoad) return;
    
    try {
      setModalLoading(true);
      await LoadService.deleteLoad(selectedLoad.id);
      setShowDeleteModal(false);
      setSelectedLoad(null);
      loadLoads();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete load');
    } finally {
      setModalLoading(false);
    }
  };

  // Bulk operations
  const handleBulkDelete = async () => {
    try {
      setModalLoading(true);
      await LoadService.bulkDelete(selectedLoads);
      setShowDeleteModal(false);
      setSelectedLoads([]);
      loadLoads();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete loads');
    } finally {
      setModalLoading(false);
    }
  };

  const handleBulkStatusUpdate = async (status: string) => {
    try {
      setModalLoading(true);
      await LoadService.bulkUpdateStatus(selectedLoads, status);
      setSelectedLoads([]);
      loadLoads();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update loads');
    } finally {
      setModalLoading(false);
    }
  };

  // Event handlers
  const handleEdit = (load: LoadWithDetails) => {
    setSelectedLoad(load);
    setShowEditModal(true);
  };

  const handleDelete = (load: LoadWithDetails) => {
    setSelectedLoad(load);
    setShowDeleteModal(true);
  };

  const handleView = (load: LoadWithDetails) => {
    router.push(`/dashboard/loads/${load.id}`);
  };

  const handleBulkDeleteClick = () => {
    setSelectedLoad(null);
    setShowDeleteModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Loads</h1>
          <p className="text-gray-400 mt-1">
            Manage shipments, track deliveries, and monitor load status
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Load
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-600/10 border border-red-600/20 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <span className="text-red-300">{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-400 hover:text-red-300"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <LoadsFilters
        filters={filters}
        onFiltersChange={setFilters}
        customers={customers}
        equipmentTypes={equipmentTypes}
      />

      {/* Bulk Actions */}
      <BulkActions
        selectedCount={selectedLoads.length}
        onBulkDelete={handleBulkDeleteClick}
        onBulkStatusUpdate={handleBulkStatusUpdate}
        onClearSelection={() => setSelectedLoads([])}
        loading={modalLoading}
      />

      {/* Table */}
      <LoadsTable
        loads={loads}
        loading={loading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onView={handleView}
        selectedLoads={selectedLoads}
        onSelectionChange={setSelectedLoads}
      />

      {/* Modals */}
      <LoadFormModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateLoad}
        loading={modalLoading}
        customers={customers}
        customerLocations={customerLocations}
        carriers={carriers}
        equipmentTypes={equipmentTypes}
        drivers={drivers}
        trucks={trucks}
        trailers={trailers}
        onCustomerChange={handleCustomerChange}
      />

      <LoadFormModal
        load={selectedLoad || undefined}
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedLoad(null);
        }}
        onSubmit={handleUpdateLoad}
        loading={modalLoading}
        customers={customers}
        customerLocations={customerLocations}
        carriers={carriers}
        equipmentTypes={equipmentTypes}
        drivers={drivers}
        trucks={trucks}
        trailers={trailers}
        onCustomerChange={handleCustomerChange}
      />

      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedLoad(null);
        }}
        onConfirm={selectedLoad ? handleDeleteLoad : handleBulkDelete}
        loading={modalLoading}
        load={selectedLoad || undefined}
        loadCount={selectedLoads.length}
      />
    </div>
  );
}
