'use client';

import { useState, useEffect } from 'react';
import { 
  CreateTruckData, 
  UpdateTruckData, 
  CreateTrailerData, 
  UpdateTrailerData, 
  CreateDriverData, 
  UpdateDriverData,
  TruckWithDriver,
  TrailerWithEquipment,
  DriverWithTruck,
  EquipmentType,
  Truck,
  TRUCK_STATUSES,
  TRAILER_STATUSES,
  DRIVER_STATUSES
} from '@/types/fleet';

type FleetEntity = TruckWithDriver | TrailerWithEquipment | DriverWithTruck;
type FleetType = 'truck' | 'trailer' | 'driver';

interface FleetFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateTruckData | UpdateTruckData | CreateTrailerData | UpdateTrailerData | CreateDriverData | UpdateDriverData) => Promise<void>;
  entityType: FleetType;
  entity?: FleetEntity;
  equipmentTypes?: EquipmentType[];
  availableTrucks?: Truck[];
  loading?: boolean;
  errorMessage?: string | null;
}

export default function FleetFormModal({
  isOpen,
  onClose,
  onSubmit,
  entityType,
  entity,
  equipmentTypes = [],
  // availableTrucks = [],
  loading = false,
  errorMessage = null
}: FleetFormModalProps) {
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEditing = Boolean(entity);
  const title = isEditing 
    ? `Edit ${entityType.charAt(0).toUpperCase() + entityType.slice(1)}` 
    : `Add ${entityType.charAt(0).toUpperCase() + entityType.slice(1)}`;

  useEffect(() => {
    if (isOpen) {
      console.log('🚛 FleetFormModal opened:', { entityType, equipmentTypes });
      console.log('📋 Available equipment types:', equipmentTypes);
      
      if (entity) {
        setFormData(entity);
      } else {
        // Initialize with default values based on entity type
        const defaultData: Record<FleetType, Record<string, unknown>> = {
          truck: {
            truck_number: '',
            license_plate: '',
            make: '',
            model: '',
            year: '',
            status: 'Available'
          },
          trailer: {
            trailer_number: '',
            license_plate: '',
            equipment_type_id: equipmentTypes[0]?.id || null,
            status: 'Available'
          },
          driver: {
            name: '',
            phone: '',
            license_number: '',
            status: 'Active'
          }
        };
        setFormData(defaultData[entityType]);
      }
      setErrors({});
    }
  }, [isOpen, entity, entityType, equipmentTypes]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    const newErrors: Record<string, string> = {};
    
    if (entityType === 'truck') {
      if (!(formData.truck_number as string)?.trim()) {
        newErrors.truck_number = 'Truck number is required';
      }
    } else if (entityType === 'trailer') {
      if (!(formData.trailer_number as string)?.trim()) {
        newErrors.trailer_number = 'Trailer number is required';
      }
      if (!formData.equipment_type_id) {
        newErrors.equipment_type_id = 'Equipment type is required';
      }
    } else if (entityType === 'driver') {
      if (!(formData.name as string)?.trim()) {
        newErrors.name = 'Driver name is required';
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      await onSubmit(formData);
      onClose();
    } catch (_error) {
      // Error is handled by parent component, no need to log here
      // Parent component will display the error message in the UI
    }
  };

  const handleInputChange = (field: string, value: string | number | boolean) => {
    setFormData((prev: Record<string, unknown>) => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  if (!isOpen) return null;



  const renderTruckForm = () => {
    return (
      <>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Unit Number
          </label>
        <input
          type="text"
          value={(formData.truck_number as string) || ''}
          onChange={(e) => handleInputChange('truck_number', e.target.value)}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-red-500"
          placeholder="e.g., H-105"
        />
        {errors.truck_number && (
          <p className="mt-1 text-sm text-red-400">{errors.truck_number}</p>
        )}
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          VIN
        </label>
        <input
          type="text"
          value={(formData.license_plate as string) || ''}
          onChange={(e) => handleInputChange('license_plate', e.target.value)}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-red-500"
          placeholder="17-digit VIN"
        />
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Make
          </label>
          <input
            type="text"
            value={(formData.make as string) || ''}
            onChange={(e) => handleInputChange('make', e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            placeholder="e.g., Peterbilt"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Model
          </label>
          <input
            type="text"
            value={(formData.model as string) || ''}
            onChange={(e) => handleInputChange('model', e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            placeholder="e.g., 579"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Year
          </label>
          <input
            type="text"
            value={(formData.year as string) || ''}
            onChange={(e) => handleInputChange('year', e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            placeholder="2025"
          />
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Status
        </label>
        <select
          value={(formData.status as string) || 'Available'}
          onChange={(e) => handleInputChange('status', e.target.value)}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          {TRUCK_STATUSES.map(status => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>
      </div>
    </>
    );
  };

  const renderTrailerForm = () => {
    return (
      <>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Unit Number
          </label>
        <input
          type="text"
          value={(formData.trailer_number as string) || ''}
          onChange={(e) => handleInputChange('trailer_number', e.target.value)}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-red-500"
          placeholder="e.g., TR-201"
        />
        {errors.trailer_number && (
          <p className="mt-1 text-sm text-red-400">{errors.trailer_number}</p>
        )}
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          VIN
        </label>
        <input
          type="text"
          value={(formData.license_plate as string) || ''}
          onChange={(e) => handleInputChange('license_plate', e.target.value)}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-red-500"
          placeholder="17-digit VIN"
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Trailer Type
        </label>
        <select
          value={(formData.equipment_type_id as string) || ''}
          onChange={(e) => handleInputChange('equipment_type_id', parseInt(e.target.value))}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          <option value="">Select Trailer Type</option>
          {equipmentTypes.map(type => (
            <option key={type.id} value={type.id}>{type.name}</option>
          ))}
        </select>
        {errors.equipment_type_id && (
          <p className="mt-1 text-sm text-red-400">{errors.equipment_type_id}</p>
        )}
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Status
        </label>
        <select
          value={(formData.status as string) || 'Available'}
          onChange={(e) => handleInputChange('status', e.target.value)}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          {TRAILER_STATUSES.map(status => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>
      </div>
    </>
    );
  };

  const renderDriverForm = () => {
    return (
      <>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Full Name
          </label>
        <input
          type="text"
          value={(formData.name as string) || ''}
          onChange={(e) => handleInputChange('name', e.target.value)}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-red-500"
          placeholder="e.g., John Doe"
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-400">{errors.name}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            CDL Number
          </label>
          <input
            type="text"
            value={(formData.license_number as string) || ''}
            onChange={(e) => handleInputChange('license_number', e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            placeholder="e.g., D12345678"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Phone Number
          </label>
          <input
            type="tel"
            value={(formData.phone as string) || ''}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            placeholder="e.g., 555-123-4567"
          />
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Status
        </label>
        <select
          value={(formData.status as string) || 'Active'}
          onChange={(e) => handleInputChange('status', e.target.value)}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          {DRIVER_STATUSES.map(status => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>
      </div>
    </>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg border border-gray-700 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-white">{title}</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Error Message */}
        {errorMessage && (
          <div className="px-6 py-4 border-b border-gray-700">
            <div className="bg-red-900 bg-opacity-20 border border-red-700 rounded-lg p-3">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-400 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-red-300 text-sm">{errorMessage}</p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="px-6 py-4">
          {entityType === 'truck' && renderTruckForm()}
          {entityType === 'trailer' && renderTrailerForm()}
          {entityType === 'driver' && renderDriverForm()}

          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-600 border border-gray-600 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : 
                isEditing ? `Update ${entityType.charAt(0).toUpperCase() + entityType.slice(1)}` : 
                `Add ${entityType.charAt(0).toUpperCase() + entityType.slice(1)}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
