'use client';

import { useState, useEffect } from 'react';
import { FleetService } from '@/services/fleetService';
import { 
  TruckWithDriver,
  TrailerWithEquipment,
  DriverWithTruck,
  EquipmentType,
  Truck,
  ActiveDispatch,
  TruckFilters,
  TrailerFilters,
  DriverFilters,
  CreateTruckData,
  UpdateTruckData,
  CreateTrailerData,
  UpdateTrailerData,
  CreateDriverData,
  UpdateDriverData
} from '@/types/fleet';

// Components
import TrucksTable from '@/components/fleet/TrucksTable';
import TrailersTable from '@/components/fleet/TrailersTable';
import DriversTable from '@/components/fleet/DriversTable';
import ActiveDispatchTable from '@/components/fleet/ActiveDispatchTable';
import FleetFormModal from '@/components/fleet/FleetFormModal';
import DeleteConfirmationModal from '@/components/fleet/DeleteConfirmationModal';


type TabType = 'trucks' | 'trailers' | 'drivers' | 'active-dispatch';

export default function FleetPage() {
  const [activeTab, setActiveTab] = useState<TabType>('trucks');
  const [loading, setLoading] = useState(false);
  
  // Data states
  const [trucks, setTrucks] = useState<TruckWithDriver[]>([]);
  const [trailers, setTrailers] = useState<TrailerWithEquipment[]>([]);
  const [drivers, setDrivers] = useState<DriverWithTruck[]>([]);
  const [activeDispatch, setActiveDispatch] = useState<ActiveDispatch[]>([]);
  const [equipmentTypes, setEquipmentTypes] = useState<EquipmentType[]>([]);
  const [availableTrucks, setAvailableTrucks] = useState<Truck[]>([]);
  
  // Filter states
  const [truckFilters, setTruckFilters] = useState<TruckFilters>({ search: '' });
  const [trailerFilters, setTrailerFilters] = useState<TrailerFilters>({ search: '' });
  const [driverFilters, setDriverFilters] = useState<DriverFilters>({ search: '' });
  const [activeDispatchFilter, setActiveDispatchFilter] = useState<string>('');
  
  // Modal states
  const [formModal, setFormModal] = useState<{
    isOpen: boolean;
    type: 'truck' | 'trailer' | 'driver';
    entity?: TruckWithDriver | TrailerWithEquipment | DriverWithTruck;
  }>({ isOpen: false, type: 'truck' });
  
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    type: string;
    entity?: TruckWithDriver | TrailerWithEquipment | DriverWithTruck;
  }>({ isOpen: false, type: '' });
  
  const [formLoading, setFormLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load initial data
  useEffect(() => {
    loadAllData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Load data when filters change
  useEffect(() => {
    if (activeTab === 'trucks') {
      loadTrucks();
    }
  }, [truckFilters, activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (activeTab === 'trailers') {
      loadTrailers();
    }
  }, [trailerFilters, activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (activeTab === 'drivers') {
      loadDrivers();
    }
  }, [driverFilters, activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [equipmentTypesData, availableTrucksData] = await Promise.all([
        FleetService.getEquipmentTypes(),
        FleetService.getAvailableTrucks()
      ]);
      
      console.log('🔧 Equipment Types Loaded:', equipmentTypesData);
      console.log('📊 Available equipment types count:', equipmentTypesData.length);
      
      setEquipmentTypes(equipmentTypesData);
      setAvailableTrucks(availableTrucksData);
      
      // Load initial tab data
      await loadTrucks();
    } catch (error) {
      console.error('❌ Error loading fleet data:', error);
      console.error('Equipment types loading failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTrucks = async () => {
    try {
      const data = await FleetService.searchTrucks(truckFilters);
      console.log('🚛 Trucks loaded:', data);
      console.log('🚛 Trucks count:', data.length);
      setTrucks(data);
    } catch (error) {
      console.error('Error loading trucks:', error);
    }
  };

  const loadTrailers = async () => {
    try {
      const data = await FleetService.searchTrailers(trailerFilters);
      setTrailers(data);
    } catch (error) {
      console.error('Error loading trailers:', error);
    }
  };

  const loadDrivers = async () => {
    try {
      const data = await FleetService.searchDrivers(driverFilters);
      setDrivers(data);
    } catch (error) {
      console.error('Error loading drivers:', error);
    }
  };

  const loadActiveDispatch = async () => {
    try {
      const data = await FleetService.getActiveDispatch();
      setActiveDispatch(data);
    } catch (error) {
      console.error('Error loading active dispatch:', error);
    }
  };

  // Handle tab changes
  const handleTabChange = async (tab: TabType) => {
    setActiveTab(tab);
    
    if (tab === 'trailers' && trailers.length === 0) {
      await loadTrailers();
    } else if (tab === 'drivers' && drivers.length === 0) {
      await loadDrivers();
    } else if (tab === 'active-dispatch' && activeDispatch.length === 0) {
      await loadActiveDispatch();
    }
  };

  // Form handlers
  const handleCreateEntity = (type: 'truck' | 'trailer' | 'driver') => {
    setErrorMessage(null); // Clear any error when opening new form
    setFormModal({ isOpen: true, type, entity: undefined });
  };

  const handleEditEntity = (entity: TruckWithDriver | TrailerWithEquipment | DriverWithTruck, type: 'truck' | 'trailer' | 'driver') => {
    setErrorMessage(null); // Clear any error when opening edit form
    setFormModal({ isOpen: true, type, entity });
  };

  const handleDeleteEntity = (entity: TruckWithDriver | TrailerWithEquipment | DriverWithTruck, type: string) => {
    setDeleteModal({ isOpen: true, type, entity });
  };

  const handleFormSubmit = async (data: CreateTruckData | UpdateTruckData | CreateTrailerData | UpdateTrailerData | CreateDriverData | UpdateDriverData) => {
    setFormLoading(true);
    setErrorMessage(null); // Clear any previous errors
    try {
      if (formModal.type === 'truck') {
        if (formModal.entity) {
          await FleetService.updateTruck(formModal.entity.id, data as UpdateTruckData);
        } else {
          await FleetService.createTruck(data as CreateTruckData);
        }
        await loadTrucks();
      } else if (formModal.type === 'trailer') {
        if (formModal.entity) {
          await FleetService.updateTrailer(formModal.entity.id, data as UpdateTrailerData);
        } else {
          await FleetService.createTrailer(data as CreateTrailerData);
        }
        await loadTrailers();
      } else if (formModal.type === 'driver') {
        if (formModal.entity) {
          await FleetService.updateDriver(formModal.entity.id, data as UpdateDriverData);
        } else {
          await FleetService.createDriver(data as CreateDriverData);
        }
        await loadDrivers();
      }
      
      setFormModal({ isOpen: false, type: 'truck' });
      setErrorMessage(null); // Clear error on successful submission
    } catch (error) {
      setErrorMessage(`Error ${formModal.entity ? 'updating' : 'creating'} ${formModal.type}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      // Don't throw error to keep form modal open so user can see the error
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.entity) return;
    
    setFormLoading(true);
    try {
      if (deleteModal.type === 'truck') {
        await FleetService.deleteTruck(deleteModal.entity.id);
        await loadTrucks();
      } else if (deleteModal.type === 'trailer') {
        await FleetService.deleteTrailer(deleteModal.entity.id);
        await loadTrailers();
      } else if (deleteModal.type === 'driver') {
        await FleetService.deleteDriver(deleteModal.entity.id);
        await loadDrivers();
      }
      
      setDeleteModal({ isOpen: false, type: '' });
    } catch (error) {
      console.error('Error deleting entity:', error);
    } finally {
      setFormLoading(false);
    }
  };

  const getEntityName = (entity: TruckWithDriver | TrailerWithEquipment | DriverWithTruck | undefined, type: string) => {
    if (!entity) return '';
    if (type === 'truck') return (entity as TruckWithDriver).truck_number;
    if (type === 'trailer') return (entity as TrailerWithEquipment).trailer_number;
    if (type === 'driver') return (entity as DriverWithTruck).name;
    return '';
  };

  const tabs = [
    { id: 'trucks', label: 'Trucks', count: trucks.length },
    { id: 'trailers', label: 'Trailers', count: trailers.length },
    { id: 'drivers', label: 'Drivers', count: drivers.length },
    { id: 'active-dispatch', label: 'Active Dispatch', count: activeDispatch.length }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Fleet Management</h1>
          <p className="text-gray-400">View, add, and manage your company-owned trucks, trailers, and drivers.</p>
        </div>
        
        {activeTab !== 'active-dispatch' && (
          <button
            onClick={() => {
              const entityType = activeTab === 'trucks' ? 'truck' : 
                                activeTab === 'trailers' ? 'trailer' : 'driver';
              handleCreateEntity(entityType);
            }}
            className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add {activeTab === 'trucks' ? 'Truck' : activeTab === 'trailers' ? 'Trailer' : 'Driver'}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id as TabType)}
              className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-red-500 text-red-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className="ml-2 bg-gray-700 text-gray-300 py-0.5 px-2 rounded-full text-xs">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="bg-red-900 bg-opacity-20 border border-red-700 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-400 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-300 text-sm">{errorMessage}</p>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-red-400 hover:text-red-300 p-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Search Filter */}
      <div className="mb-6">
        <input
          type="text"
          placeholder={
            activeTab === 'active-dispatch' 
              ? "Filter by Load ID..." 
              : `Filter by ${activeTab.slice(0, -1)} number...`
          }
          value={
            activeTab === 'active-dispatch' ? activeDispatchFilter :
            activeTab === 'trucks' ? truckFilters.search :
            activeTab === 'trailers' ? trailerFilters.search :
            driverFilters.search
          }
          onChange={(e) => {
            const value = e.target.value;
            if (activeTab === 'active-dispatch') {
              setActiveDispatchFilter(value);
            } else if (activeTab === 'trucks') {
              setTruckFilters({ ...truckFilters, search: value });
            } else if (activeTab === 'trailers') {
              setTrailerFilters({ ...trailerFilters, search: value });
            } else {
              setDriverFilters({ ...driverFilters, search: value });
            }
          }}
          className="w-96 px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
        />
      </div>

      {/* Content */}
      {activeTab === 'trucks' && (
        <TrucksTable
          trucks={trucks}
          loading={loading}
          onEdit={(truck) => handleEditEntity(truck, 'truck')}
          onDelete={(truck) => handleDeleteEntity(truck, 'truck')}
          onView={(truck) => handleEditEntity(truck, 'truck')}
        />
      )}

      {activeTab === 'trailers' && (
        <TrailersTable
          trailers={trailers}
          loading={loading}
          onEdit={(trailer) => handleEditEntity(trailer, 'trailer')}
          onDelete={(trailer) => handleDeleteEntity(trailer, 'trailer')}
          onView={(trailer) => handleEditEntity(trailer, 'trailer')}
        />
      )}

      {activeTab === 'drivers' && (
        <DriversTable
          drivers={drivers}
          loading={loading}
          onEdit={(driver) => handleEditEntity(driver, 'driver')}
          onDelete={(driver) => handleDeleteEntity(driver, 'driver')}
          onView={(driver) => handleEditEntity(driver, 'driver')}
        />
      )}

      {activeTab === 'active-dispatch' && (
        <ActiveDispatchTable
          dispatches={activeDispatch}
          loading={loading}
        />
      )}

      {/* Modals */}
      <FleetFormModal
        isOpen={formModal.isOpen}
        onClose={() => setFormModal({ isOpen: false, type: 'truck' })}
        onSubmit={handleFormSubmit}
        entityType={formModal.type}
        entity={formModal.entity}
        equipmentTypes={equipmentTypes}
        availableTrucks={availableTrucks}
        loading={formLoading}
        errorMessage={errorMessage}
      />

      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, type: '' })}
        onConfirm={handleDeleteConfirm}
        entityType={deleteModal.type}
        entityName={getEntityName(deleteModal.entity, deleteModal.type)}
        loading={formLoading}
      />
    </div>
  );
}
