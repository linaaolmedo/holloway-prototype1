'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { CustomerPortalService, CustomerShipmentRequest } from '@/services/customerPortalService';
import { CustomerLocation, EquipmentType } from '@/types/loads';
import LoadingSpinner from '@/components/auth/LoadingSpinner';

interface NewShipmentRequestFormProps {
  onSubmit: (data: CustomerShipmentRequest) => void;
  onCancel: () => void;
  loading?: boolean;
}

export default function NewShipmentRequestForm({ 
  onSubmit, 
  onCancel, 
  loading = false 
}: NewShipmentRequestFormProps) {
  const { profile } = useAuth();
  const [formData, setFormData] = useState<CustomerShipmentRequest>({
    customer_id: profile?.customer_id || 0,
    origin_location_id: 0,
    destination_location_id: 0,
    equipment_type_id: 0,
    commodity: '',
    weight: undefined,
    pickup_date: '',
    delivery_date: '',
    rate_customer: undefined,
    special_instructions: '',
    contact_name: '',
    contact_phone: '',
    contact_email: '',
    urgency: 'Normal'
  });

  const [locations, setLocations] = useState<CustomerLocation[]>([]);
  const [equipmentTypes, setEquipmentTypes] = useState<EquipmentType[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (profile?.customer_id) {
      fetchFormData();
    }
  }, [profile]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchFormData = async () => {
    if (!profile?.customer_id) return;

    try {
      setLoadingData(true);
      const [customerLocations, equipmentTypesData] = await Promise.all([
        CustomerPortalService.getCustomerLocations(profile.customer_id),
        CustomerPortalService.getEquipmentTypes()
      ]);

      setLocations(customerLocations);
      setEquipmentTypes(equipmentTypesData);
    } catch (error) {
      console.error('Error fetching form data:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.origin_location_id) {
      newErrors.origin_location_id = 'Origin location is required';
    }
    if (!formData.destination_location_id) {
      newErrors.destination_location_id = 'Destination location is required';
    }
    if (formData.origin_location_id === formData.destination_location_id) {
      newErrors.destination_location_id = 'Destination must be different from origin';
    }
    if (!formData.equipment_type_id) {
      newErrors.equipment_type_id = 'Equipment type is required';
    }
    if (!formData.commodity) {
      newErrors.commodity = 'Commodity is required';
    }
    if (!formData.pickup_date) {
      newErrors.pickup_date = 'Pickup date is required';
    }
    if (!formData.delivery_date) {
      newErrors.delivery_date = 'Delivery date is required';
    }
    if (formData.pickup_date && formData.delivery_date && 
        new Date(formData.pickup_date) >= new Date(formData.delivery_date)) {
      newErrors.delivery_date = 'Delivery date must be after pickup date';
    }
    if (formData.weight && formData.weight <= 0) {
      newErrors.weight = 'Weight must be greater than 0';
    }
    if (formData.rate_customer && formData.rate_customer <= 0) {
      newErrors.rate_customer = 'Rate must be greater than 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name.includes('_id') || name === 'weight' || name === 'rate_customer' 
        ? (value === '' ? undefined : Number(value))
        : value
    }));

    // Clear error when field is edited
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const getLocationDisplay = (location: CustomerLocation): string => {
    const parts = [
      location.location_name,
      location.city,
      location.state
    ].filter(Boolean);
    return parts.join(', ') || 'Unknown Location';
  };

  const getTomorrowDate = (): string => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  // const getNextWeekDate = (): string => {
  //   const nextWeek = new Date();
  //   nextWeek.setDate(nextWeek.getDate() + 7);
  //   return nextWeek.toISOString().split('T')[0];
  // };

  if (loadingData) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-white">Request New Shipment</h2>
        <button
          onClick={onCancel}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Shipment Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Origin Location */}
          <div>
            <label htmlFor="origin_location_id" className="block text-sm font-medium text-gray-300 mb-2">
              Origin Location *
            </label>
            <select
              id="origin_location_id"
              name="origin_location_id"
              value={formData.origin_location_id}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent bg-gray-700 text-white"
            >
              <option value={0}>Select origin location</option>
              {locations.map((location) => (
                <option key={location.id} value={location.id}>
                  {getLocationDisplay(location)}
                </option>
              ))}
            </select>
            {errors.origin_location_id && (
              <p className="text-red-400 text-sm mt-1">{errors.origin_location_id}</p>
            )}
          </div>

          {/* Destination Location */}
          <div>
            <label htmlFor="destination_location_id" className="block text-sm font-medium text-gray-300 mb-2">
              Destination Location *
            </label>
            <select
              id="destination_location_id"
              name="destination_location_id"
              value={formData.destination_location_id}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent bg-gray-700 text-white"
            >
              <option value={0}>Select destination location</option>
              {locations.map((location) => (
                <option key={location.id} value={location.id}>
                  {getLocationDisplay(location)}
                </option>
              ))}
            </select>
            {errors.destination_location_id && (
              <p className="text-red-400 text-sm mt-1">{errors.destination_location_id}</p>
            )}
          </div>

          {/* Equipment Type */}
          <div>
            <label htmlFor="equipment_type_id" className="block text-sm font-medium text-gray-300 mb-2">
              Equipment Type *
            </label>
            <select
              id="equipment_type_id"
              name="equipment_type_id"
              value={formData.equipment_type_id}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent bg-gray-700 text-white"
            >
              <option value={0}>Select equipment type</option>
              {equipmentTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
            {errors.equipment_type_id && (
              <p className="text-red-400 text-sm mt-1">{errors.equipment_type_id}</p>
            )}
          </div>

          {/* Commodity */}
          <div>
            <label htmlFor="commodity" className="block text-sm font-medium text-gray-300 mb-2">
              Commodity *
            </label>
            <input
              type="text"
              id="commodity"
              name="commodity"
              value={formData.commodity}
              onChange={handleInputChange}
              placeholder="e.g., Grain, Sand, Fertilizer"
              className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent bg-gray-700 text-white placeholder-gray-400"
            />
            {errors.commodity && (
              <p className="text-red-400 text-sm mt-1">{errors.commodity}</p>
            )}
          </div>

          {/* Weight */}
          <div>
            <label htmlFor="weight" className="block text-sm font-medium text-gray-300 mb-2">
              Weight (lbs)
            </label>
            <input
              type="number"
              id="weight"
              name="weight"
              value={formData.weight || ''}
              onChange={handleInputChange}
              placeholder="Enter weight in pounds"
              min="0"
              step="0.01"
              className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent bg-gray-700 text-white placeholder-gray-400"
            />
            {errors.weight && (
              <p className="text-red-400 text-sm mt-1">{errors.weight}</p>
            )}
          </div>

          {/* Urgency */}
          <div>
            <label htmlFor="urgency" className="block text-sm font-medium text-gray-300 mb-2">
              Urgency Level
            </label>
            <select
              id="urgency"
              name="urgency"
              value={formData.urgency}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent bg-gray-700 text-white"
            >
              <option value="Normal">Normal</option>
              <option value="Urgent">Urgent</option>
              <option value="Emergency">Emergency</option>
            </select>
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Pickup Date */}
          <div>
            <label htmlFor="pickup_date" className="block text-sm font-medium text-gray-300 mb-2">
              Requested Pickup Date *
            </label>
            <input
              type="date"
              id="pickup_date"
              name="pickup_date"
              value={formData.pickup_date}
              onChange={handleInputChange}
              min={getTomorrowDate()}
              className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent bg-gray-700 text-white"
            />
            {errors.pickup_date && (
              <p className="text-red-400 text-sm mt-1">{errors.pickup_date}</p>
            )}
          </div>

          {/* Delivery Date */}
          <div>
            <label htmlFor="delivery_date" className="block text-sm font-medium text-gray-300 mb-2">
              Expected Delivery Date *
            </label>
            <input
              type="date"
              id="delivery_date"
              name="delivery_date"
              value={formData.delivery_date}
              onChange={handleInputChange}
              min={formData.pickup_date || getTomorrowDate()}
              className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent bg-gray-700 text-white"
            />
            {errors.delivery_date && (
              <p className="text-red-400 text-sm mt-1">{errors.delivery_date}</p>
            )}
          </div>
        </div>

        {/* Contact Information */}
        <div className="border-t border-gray-700 pt-6">
          <h3 className="text-lg font-medium text-white mb-4">Contact Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label htmlFor="contact_name" className="block text-sm font-medium text-gray-300 mb-2">
                Contact Name
              </label>
              <input
                type="text"
                id="contact_name"
                name="contact_name"
                value={formData.contact_name}
                onChange={handleInputChange}
                placeholder="Contact person for this shipment"
                className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent bg-gray-700 text-white placeholder-gray-400"
              />
            </div>

            <div>
              <label htmlFor="contact_phone" className="block text-sm font-medium text-gray-300 mb-2">
                Contact Phone
              </label>
              <input
                type="tel"
                id="contact_phone"
                name="contact_phone"
                value={formData.contact_phone}
                onChange={handleInputChange}
                placeholder="Phone number"
                className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent bg-gray-700 text-white placeholder-gray-400"
              />
            </div>

            <div>
              <label htmlFor="contact_email" className="block text-sm font-medium text-gray-300 mb-2">
                Contact Email
              </label>
              <input
                type="email"
                id="contact_email"
                name="contact_email"
                value={formData.contact_email}
                onChange={handleInputChange}
                placeholder="Email address"
                className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent bg-gray-700 text-white placeholder-gray-400"
              />
            </div>
          </div>
        </div>

        {/* Special Instructions */}
        <div>
          <label htmlFor="special_instructions" className="block text-sm font-medium text-gray-300 mb-2">
            Special Instructions
          </label>
          <textarea
            id="special_instructions"
            name="special_instructions"
            value={formData.special_instructions}
            onChange={handleInputChange}
            placeholder="Any special handling requirements, access restrictions, or additional notes..."
            rows={3}
            className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent bg-gray-700 text-white placeholder-gray-400"
          />
        </div>

        {/* Expected Rate */}
        <div>
          <label htmlFor="rate_customer" className="block text-sm font-medium text-gray-300 mb-2">
            Expected Rate (Optional)
          </label>
          <input
            type="number"
            id="rate_customer"
            name="rate_customer"
            value={formData.rate_customer || ''}
            onChange={handleInputChange}
            placeholder="Expected rate for this shipment"
            min="0"
            step="0.01"
            className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent bg-gray-700 text-white placeholder-gray-400"
          />
          <p className="text-gray-400 text-sm mt-1">
            Leave blank if you&apos;d like us to provide a quote
          </p>
          {errors.rate_customer && (
            <p className="text-red-400 text-sm mt-1">{errors.rate_customer}</p>
          )}
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-4 pt-6 border-t border-gray-700">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {loading ? (
              <>
                <LoadingSpinner size="sm" />
                <span>Submitting...</span>
              </>
            ) : (
              <span>Submit Request</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
