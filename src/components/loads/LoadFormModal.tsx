'use client';

import { useState, useEffect } from 'react';
import { LoadWithDetails, CreateLoadData, UpdateLoadData, Customer, CustomerLocation, Carrier, EquipmentType, Driver, Truck, Trailer } from '@/types/loads';

interface LoadFormModalProps {
  load?: LoadWithDetails;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateLoadData | UpdateLoadData) => void;
  loading?: boolean;
  customers: Customer[];
  customerLocations: CustomerLocation[];
  carriers: Carrier[];
  equipmentTypes: EquipmentType[];
  drivers: Driver[];
  trucks: Truck[];
  trailers: Trailer[];
  onCustomerChange?: (customerId: number) => void;
}

export default function LoadFormModal({
  load,
  isOpen,
  onClose,
  onSubmit,
  loading,
  customers,
  customerLocations,
  carriers,
  equipmentTypes,
  drivers,
  trucks,
  trailers,
  onCustomerChange
}: LoadFormModalProps) {
  const [formData, setFormData] = useState({
    customer_id: '',
    origin_location_id: '',
    destination_location_id: '',
    equipment_type_id: '',
    commodity: '',
    weight: '',
    pickup_date: '',
    delivery_date: '',
    rate_customer: '',
    rate_carrier: '',
    assignment_type: 'external', // 'external' for carrier, 'internal' for own fleet
    carrier_id: '',
    driver_id: '',
    truck_id: '',
    trailer_id: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Debug logging for trailer issues
  console.log('🚛 Load Form Debug:', {
    allTrailers: trailers,
    trailerCount: trailers.length,
    trailerStatuses: trailers.map(t => ({ id: t.id, number: t.trailer_number, status: t.status }))
  });

  useEffect(() => {
    if (load) {
      setFormData({
        customer_id: load.customer_id.toString(),
        origin_location_id: load.origin_location_id.toString(),
        destination_location_id: load.destination_location_id.toString(),
        equipment_type_id: load.equipment_type_id.toString(),
        commodity: load.commodity || '',
        weight: load.weight?.toString() || '',
        pickup_date: load.pickup_date || '',
        delivery_date: load.delivery_date || '',
        rate_customer: load.rate_customer?.toString() || '',
        rate_carrier: load.rate_carrier?.toString() || '',
        assignment_type: load.carrier_id ? 'external' : load.driver_id ? 'internal' : 'external',
        carrier_id: load.carrier_id?.toString() || '',
        driver_id: load.driver_id?.toString() || '',
        truck_id: load.truck_id?.toString() || '',
        trailer_id: load.trailer_id?.toString() || ''
      });
    } else {
      setFormData({
        customer_id: '',
        origin_location_id: '',
        destination_location_id: '',
        equipment_type_id: '',
        commodity: '',
        weight: '',
        pickup_date: '',
        delivery_date: '',
        rate_customer: '',
        rate_carrier: '',
        assignment_type: 'external',
        carrier_id: '',
        driver_id: '',
        truck_id: '',
        trailer_id: ''
      });
    }
    setErrors({});
  }, [load, isOpen]);

  const handleInputChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }

    // Handle customer change
    if (name === 'customer_id' && value && onCustomerChange) {
      onCustomerChange(parseInt(value));
      // Reset location selections when customer changes
      setFormData(prev => ({ 
        ...prev, 
        customer_id: value,
        origin_location_id: '',
        destination_location_id: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.customer_id) newErrors.customer_id = 'Customer is required';
    if (!formData.origin_location_id) newErrors.origin_location_id = 'Origin location is required';
    if (!formData.destination_location_id) newErrors.destination_location_id = 'Destination location is required';
    if (!formData.equipment_type_id) newErrors.equipment_type_id = 'Equipment type is required';

    if (formData.assignment_type === 'external' && !formData.carrier_id) {
      newErrors.carrier_id = 'Carrier is required for external assignment';
    }

    if (formData.assignment_type === 'internal') {
      if (!formData.driver_id) newErrors.driver_id = 'Driver is required for internal assignment';
      if (!formData.truck_id) newErrors.truck_id = 'Truck is required for internal assignment';
      if (!formData.trailer_id) newErrors.trailer_id = 'Trailer is required for internal assignment';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    const data: CreateLoadData | UpdateLoadData = {
      customer_id: parseInt(formData.customer_id),
      origin_location_id: parseInt(formData.origin_location_id),
      destination_location_id: parseInt(formData.destination_location_id),
      equipment_type_id: parseInt(formData.equipment_type_id),
      commodity: formData.commodity || undefined,
      weight: formData.weight ? parseFloat(formData.weight) : undefined,
      pickup_date: formData.pickup_date || undefined,
      delivery_date: formData.delivery_date || undefined,
      rate_customer: formData.rate_customer ? parseFloat(formData.rate_customer) : undefined,
      rate_carrier: formData.rate_carrier ? parseFloat(formData.rate_carrier) : undefined,
    };

    // Add assignment based on type
    if (formData.assignment_type === 'external') {
      data.carrier_id = formData.carrier_id ? parseInt(formData.carrier_id) : undefined;
      data.driver_id = undefined;
      data.truck_id = undefined;
      data.trailer_id = undefined;
    } else {
      data.carrier_id = undefined;
      data.driver_id = formData.driver_id ? parseInt(formData.driver_id) : undefined;
      data.truck_id = formData.truck_id ? parseInt(formData.truck_id) : undefined;
      data.trailer_id = formData.trailer_id ? parseInt(formData.trailer_id) : undefined;
    }

    onSubmit(data);
  };

  const customerSpecificLocations = customerLocations.filter(
    loc => loc.customer_id.toString() === formData.customer_id
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg border border-gray-700 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">
              {load ? 'Edit Load' : 'Create New Load'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Customer and Equipment */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Customer *
                </label>
                <select
                  value={formData.customer_id}
                  onChange={(e) => handleInputChange('customer_id', e.target.value)}
                  className={`w-full px-3 py-2 bg-gray-700 border rounded-lg text-white focus:ring-2 focus:ring-red-500 ${
                    errors.customer_id ? 'border-red-500' : 'border-gray-600'
                  }`}
                >
                  <option value="">Select Customer</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name}
                    </option>
                  ))}
                </select>
                {errors.customer_id && <p className="mt-1 text-sm text-red-400">{errors.customer_id}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Equipment Type *
                </label>
                <select
                  value={formData.equipment_type_id}
                  onChange={(e) => handleInputChange('equipment_type_id', e.target.value)}
                  className={`w-full px-3 py-2 bg-gray-700 border rounded-lg text-white focus:ring-2 focus:ring-red-500 ${
                    errors.equipment_type_id ? 'border-red-500' : 'border-gray-600'
                  }`}
                >
                  <option value="">Select Equipment Type</option>
                  {equipmentTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
                {errors.equipment_type_id && <p className="mt-1 text-sm text-red-400">{errors.equipment_type_id}</p>}
              </div>
            </div>

            {/* Locations */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Origin Location *
                </label>
                <select
                  value={formData.origin_location_id}
                  onChange={(e) => handleInputChange('origin_location_id', e.target.value)}
                  disabled={!formData.customer_id}
                  className={`w-full px-3 py-2 bg-gray-700 border rounded-lg text-white focus:ring-2 focus:ring-red-500 disabled:opacity-50 ${
                    errors.origin_location_id ? 'border-red-500' : 'border-gray-600'
                  }`}
                >
                  <option value="">Select Origin</option>
                  {customerSpecificLocations.map((location) => (
                    <option key={location.id} value={location.id}>
                      {location.location_name || `${location.city}, ${location.state}`}
                    </option>
                  ))}
                </select>
                {errors.origin_location_id && <p className="mt-1 text-sm text-red-400">{errors.origin_location_id}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Destination Location *
                </label>
                <select
                  value={formData.destination_location_id}
                  onChange={(e) => handleInputChange('destination_location_id', e.target.value)}
                  disabled={!formData.customer_id}
                  className={`w-full px-3 py-2 bg-gray-700 border rounded-lg text-white focus:ring-2 focus:ring-red-500 disabled:opacity-50 ${
                    errors.destination_location_id ? 'border-red-500' : 'border-gray-600'
                  }`}
                >
                  <option value="">Select Destination</option>
                  {customerSpecificLocations.map((location) => (
                    <option key={location.id} value={location.id}>
                      {location.location_name || `${location.city}, ${location.state}`}
                    </option>
                  ))}
                </select>
                {errors.destination_location_id && <p className="mt-1 text-sm text-red-400">{errors.destination_location_id}</p>}
              </div>
            </div>

            {/* Commodity and Weight */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Commodity
                </label>
                <input
                  type="text"
                  value={formData.commodity}
                  onChange={(e) => handleInputChange('commodity', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-red-500"
                  placeholder="e.g., Sand, Gravel, Coal"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Weight (lbs)
                </label>
                <input
                  type="number"
                  value={formData.weight}
                  onChange={(e) => handleInputChange('weight', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-red-500"
                  placeholder="0"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Pickup Date
                </label>
                <input
                  type="date"
                  value={formData.pickup_date}
                  onChange={(e) => handleInputChange('pickup_date', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Delivery Date
                </label>
                <input
                  type="date"
                  value={formData.delivery_date}
                  onChange={(e) => handleInputChange('delivery_date', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>

            {/* Rates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Customer Rate ($)
                </label>
                <input
                  type="number"
                  value={formData.rate_customer}
                  onChange={(e) => handleInputChange('rate_customer', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-red-500"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Carrier Rate ($)
                </label>
                <input
                  type="number"
                  value={formData.rate_carrier}
                  onChange={(e) => handleInputChange('rate_carrier', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-red-500"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            {/* Assignment Type */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Assignment Type
              </label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="external"
                    checked={formData.assignment_type === 'external'}
                    onChange={(e) => handleInputChange('assignment_type', e.target.value)}
                    className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-600 bg-gray-700"
                  />
                  <span className="ml-2 text-gray-300">External Carrier</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="internal"
                    checked={formData.assignment_type === 'internal'}
                    onChange={(e) => handleInputChange('assignment_type', e.target.value)}
                    className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-600 bg-gray-700"
                  />
                  <span className="ml-2 text-gray-300">Own Fleet</span>
                </label>
              </div>
            </div>

            {/* Assignment Details */}
            {formData.assignment_type === 'external' ? (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Carrier
                </label>
                <select
                  value={formData.carrier_id}
                  onChange={(e) => handleInputChange('carrier_id', e.target.value)}
                  className={`w-full px-3 py-2 bg-gray-700 border rounded-lg text-white focus:ring-2 focus:ring-red-500 ${
                    errors.carrier_id ? 'border-red-500' : 'border-gray-600'
                  }`}
                >
                  <option value="">Select Carrier</option>
                  {carriers.map((carrier) => (
                    <option key={carrier.id} value={carrier.id}>
                      {carrier.name} {carrier.mc_number && `(MC: ${carrier.mc_number})`}
                    </option>
                  ))}
                </select>
                {errors.carrier_id && <p className="mt-1 text-sm text-red-400">{errors.carrier_id}</p>}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Driver
                  </label>
                  <select
                    value={formData.driver_id}
                    onChange={(e) => handleInputChange('driver_id', e.target.value)}
                    className={`w-full px-3 py-2 bg-gray-700 border rounded-lg text-white focus:ring-2 focus:ring-red-500 ${
                      errors.driver_id ? 'border-red-500' : 'border-gray-600'
                    }`}
                  >
                    <option value="">Select Driver</option>
                    {drivers.map((driver) => (
                      <option key={driver.id} value={driver.id}>
                        {driver.name}
                      </option>
                    ))}
                  </select>
                  {errors.driver_id && <p className="mt-1 text-sm text-red-400">{errors.driver_id}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Truck
                  </label>
                  <select
                    value={formData.truck_id}
                    onChange={(e) => handleInputChange('truck_id', e.target.value)}
                    className={`w-full px-3 py-2 bg-gray-700 border rounded-lg text-white focus:ring-2 focus:ring-red-500 ${
                      errors.truck_id ? 'border-red-500' : 'border-gray-600'
                    }`}
                  >
                    <option value="">Select Truck</option>
                    {trucks.map((truck) => (
                      <option key={truck.id} value={truck.id}>
                        {truck.truck_number}
                      </option>
                    ))}
                  </select>
                  {errors.truck_id && <p className="mt-1 text-sm text-red-400">{errors.truck_id}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Trailer
                  </label>
                  <select
                    value={formData.trailer_id}
                    onChange={(e) => handleInputChange('trailer_id', e.target.value)}
                    className={`w-full px-3 py-2 bg-gray-700 border rounded-lg text-white focus:ring-2 focus:ring-red-500 ${
                      errors.trailer_id ? 'border-red-500' : 'border-gray-600'
                    }`}
                  >
                    <option value="">Select Trailer</option>
                    {trailers.map((trailer) => (
                      <option key={trailer.id} value={trailer.id}>
                        {trailer.trailer_number}
                      </option>
                    ))}
                  </select>
                  {errors.trailer_id && <p className="mt-1 text-sm text-red-400">{errors.trailer_id}</p>}
                </div>
              </div>
            )}

            {/* Form Actions */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-700">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:ring-2 focus:ring-red-500 transition-colors disabled:opacity-50"
              >
                {loading ? 'Saving...' : load ? 'Update Load' : 'Create Load'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
