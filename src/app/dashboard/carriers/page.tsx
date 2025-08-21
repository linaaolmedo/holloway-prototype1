'use client';

import { useState, useEffect } from 'react';
import { CarrierWithEquipment, CreateCarrierData, UpdateCarrierData, CarrierFilters, EquipmentType } from '@/types/carriers';
import { CarrierService } from '@/services/carrierService';
import CarriersTable from '@/components/carriers/CarriersTable';
import CarrierFormModal from '@/components/carriers/CarrierFormModal';
import DeleteConfirmationModal from '@/components/carriers/DeleteConfirmationModal';
import CarriersFilters from '@/components/carriers/CarriersFilters';

export default function CarriersPage() {
  const [carriers, setCarriers] = useState<CarrierWithEquipment[]>([]);
  const [filteredCarriers, setFilteredCarriers] = useState<CarrierWithEquipment[]>([]);
  const [equipmentTypes, setEquipmentTypes] = useState<EquipmentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedCarrier, setSelectedCarrier] = useState<CarrierWithEquipment | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  // Filter states
  const [filters, setFilters] = useState<CarrierFilters>({});
  const [selectedCarriers, setSelectedCarriers] = useState<number[]>([]);
  
  // Notification state
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Load initial data
  useEffect(() => {
    loadCarriers();
    loadEquipmentTypes();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Apply filters when carriers or filters change
  useEffect(() => {
    applyFilters();
  }, [carriers, filters]); // eslint-disable-line react-hooks/exhaustive-deps

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    // Auto-dismiss after 5 seconds
    setTimeout(() => setNotification(null), 5000);
  };

  const loadCarriers = async () => {
    try {
      setLoading(true);
      const data = await CarrierService.getAllCarriers();
      setCarriers(data);
    } catch (error) {
      console.error('Error loading carriers:', error);
      showNotification('error', 'Failed to load carriers. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadEquipmentTypes = async () => {
    try {
      const data = await CarrierService.getEquipmentTypes();
      setEquipmentTypes(data);
      if (data.length === 0) {
        showNotification('error', 'No equipment types found. Please contact your administrator.');
      }
    } catch (error) {
      console.error('Error loading equipment types:', error);
      showNotification('error', 'Failed to load equipment types. Some features may not work properly.');
    }
  };

  const applyFilters = async () => {
    try {
      if (Object.keys(filters).length === 0 || Object.values(filters).every(v => !v)) {
        setFilteredCarriers(carriers);
      } else {
        const filtered = await CarrierService.searchCarriers(filters);
        setFilteredCarriers(filtered);
      }
    } catch (error) {
      console.error('Error applying filters:', error);
      showNotification('error', 'Failed to apply filters. Showing all carriers.');
      setFilteredCarriers(carriers);
    }
  };

  const handleAddCarrier = () => {
    setSelectedCarrier(null);
    setIsEditing(false);
    setIsFormModalOpen(true);
  };

  const handleEditCarrier = (carrier: CarrierWithEquipment) => {
    setSelectedCarrier(carrier);
    setIsEditing(true);
    setIsFormModalOpen(true);
  };

  const handleViewCarrier = (carrier: CarrierWithEquipment) => {
    // For now, just open in edit mode. You could create a separate view modal later
    handleEditCarrier(carrier);
  };

  const handleDeleteCarrier = (carrier: CarrierWithEquipment) => {
    setSelectedCarrier(carrier);
    setIsDeleteModalOpen(true);
  };

  const handleFormSubmit = async (data: CreateCarrierData | UpdateCarrierData) => {
    try {
      setActionLoading(true);
      
      if (isEditing && selectedCarrier) {
        await CarrierService.updateCarrier(selectedCarrier.id, data);
        showNotification('success', `Carrier "${data.name}" updated successfully.`);
      } else {
        await CarrierService.createCarrier(data as CreateCarrierData);
        showNotification('success', `Carrier "${data.name}" created successfully.`);
      }
      
      setIsFormModalOpen(false);
      setSelectedCarrier(null);
      await loadCarriers();
    } catch (error) {
      console.error('Error saving carrier:', error);
      const action = isEditing ? 'update' : 'create';
      
      // Handle specific equipment types permission error
      if (error instanceof Error && error.message.includes('permission restrictions')) {
        showNotification('error', `Carrier ${action}d successfully, but equipment types could not be assigned due to permission restrictions. Please contact your administrator.`);
      } else {
        showNotification('error', `Failed to ${action} carrier. Please try again.`);
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedCarrier) return;
    
    try {
      setActionLoading(true);
      await CarrierService.deleteCarrier(selectedCarrier.id);
      showNotification('success', `Carrier "${selectedCarrier.name}" deleted successfully.`);
      setIsDeleteModalOpen(false);
      setSelectedCarrier(null);
      await loadCarriers();
    } catch (error) {
      console.error('Error deleting carrier:', error);
      showNotification('error', `Failed to delete carrier "${selectedCarrier.name}". Please try again.`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCloseModals = () => {
    setIsFormModalOpen(false);
    setIsDeleteModalOpen(false);
    setSelectedCarrier(null);
    setIsEditing(false);
  };

  const handleFiltersChange = (newFilters: CarrierFilters) => {
    setFilters(newFilters);
  };

  const handleSelectionChange = (selectedIds: number[]) => {
    setSelectedCarriers(selectedIds);
  };

  return (
    <div className="space-y-6">
      {/* Notification */}
      {notification && (
        <div className={`p-4 rounded-lg flex items-center justify-between ${
          notification.type === 'success' 
            ? 'bg-green-900 bg-opacity-20 border border-green-700' 
            : 'bg-red-900 bg-opacity-20 border border-red-700'
        }`}>
          <div className="flex items-center space-x-3">
            {notification.type === 'success' ? (
              <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.99-.833-2.76 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            )}
            <p className={notification.type === 'success' ? 'text-green-300' : 'text-red-300'}>
              {notification.message}
            </p>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Carriers</h1>
          <p className="text-gray-400">Manage and track all your carriers.</p>
        </div>
        <button
          onClick={handleAddCarrier}
          className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:ring-2 focus:ring-red-500 transition-colors"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Carrier
        </button>
      </div>

      {/* Filters */}
      <CarriersFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        equipmentTypes={equipmentTypes}
        totalCarriers={carriers.length}
        filteredCarriers={filteredCarriers.length}
      />

      {/* Bulk Actions */}
      {selectedCarriers.length > 0 && (
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <span className="text-white">
              {selectedCarriers.length} carrier{selectedCarriers.length > 1 ? 's' : ''} selected
            </span>
            <div className="flex space-x-2">
              <button
                onClick={async () => {
                  try {
                    // Implement bulk DNU toggle
                    for (const carrierId of selectedCarriers) {
                      const carrier = carriers.find(c => c.id === carrierId);
                      if (carrier) {
                        await CarrierService.updateCarrier(carrierId, {
                          dnu_flag: !carrier.dnu_flag
                        });
                      }
                    }
                    await loadCarriers();
                    setSelectedCarriers([]);
                    showNotification('success', `Updated DNU status for ${selectedCarriers.length} carrier(s).`);
                  } catch (error) {
                    console.error('Error toggling DNU status:', error);
                    showNotification('error', 'Failed to update DNU status. Please try again.');
                  }
                }}
                disabled={actionLoading}
                className="px-3 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors disabled:opacity-50"
              >
                {actionLoading ? 'Updating...' : 'Toggle DNU'}
              </button>
              <button
                onClick={() => setSelectedCarriers([])}
                className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
              >
                Clear Selection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Carriers Table */}
      <CarriersTable
        carriers={filteredCarriers}
        loading={loading}
        onEdit={handleEditCarrier}
        onDelete={handleDeleteCarrier}
        onView={handleViewCarrier}
        selectedCarriers={selectedCarriers}
        onSelectionChange={handleSelectionChange}
      />

      {/* Form Modal */}
      <CarrierFormModal
        carrier={selectedCarrier || undefined}
        isOpen={isFormModalOpen}
        onClose={handleCloseModals}
        onSubmit={handleFormSubmit}
        loading={actionLoading}
        equipmentTypes={equipmentTypes}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        carrier={selectedCarrier}
        isOpen={isDeleteModalOpen}
        onClose={handleCloseModals}
        onConfirm={handleConfirmDelete}
        loading={actionLoading}
      />
    </div>
  );
}
