'use client';

import { useState, useEffect } from 'react';
import { CarrierWithEquipment, CreateCarrierData, UpdateCarrierData, EquipmentType, US_STATES } from '@/types/carriers';
import { CarrierService } from '@/services/carrierService';

interface CarrierFormModalProps {
  carrier?: CarrierWithEquipment;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateCarrierData | UpdateCarrierData) => void;
  loading?: boolean;
  equipmentTypes: EquipmentType[];
}

export default function CarrierFormModal({
  carrier,
  isOpen,
  onClose,
  onSubmit,
  loading,
  equipmentTypes
}: CarrierFormModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    mc_number: '',
    primary_contact_name: '',
    primary_contact_email: '',
    primary_contact_phone: '',
    operating_states: [] as string[],
    dnu_flag: false,
    equipment_type_ids: [] as number[]
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [validatingMC, setValidatingMC] = useState(false);

  useEffect(() => {
    if (carrier) {
      setFormData({
        name: carrier.name,
        mc_number: carrier.mc_number || '',
        primary_contact_name: carrier.primary_contact_name || '',
        primary_contact_email: carrier.primary_contact_email || '',
        primary_contact_phone: carrier.primary_contact_phone || '',
        operating_states: carrier.operating_states || [],
        dnu_flag: carrier.dnu_flag,
        equipment_type_ids: carrier.equipment_types?.map(et => et.id) || []
      });
    } else {
      setFormData({
        name: '',
        mc_number: '',
        primary_contact_name: '',
        primary_contact_email: '',
        primary_contact_phone: '',
        operating_states: [],
        dnu_flag: false,
        equipment_type_ids: []
      });
    }
    setErrors({});
  }, [carrier, isOpen]);

  const handleInputChange = (name: string, value: string | boolean | string[] | number[]) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleStateChange = (stateCode: string, checked: boolean) => {
    const newStates = checked
      ? [...formData.operating_states, stateCode]
      : formData.operating_states.filter(s => s !== stateCode);
    
    handleInputChange('operating_states', newStates);
  };

  const handleEquipmentTypeChange = (equipmentTypeId: number, checked: boolean) => {
    const newEquipmentTypes = checked
      ? [...formData.equipment_type_ids, equipmentTypeId]
      : formData.equipment_type_ids.filter(id => id !== equipmentTypeId);
    
    handleInputChange('equipment_type_ids', newEquipmentTypes);
  };

  const validateMCNumber = async (mcNumber: string): Promise<boolean> => {
    if (!mcNumber.trim()) return true;

    const timeoutId = setTimeout(() => {
      setValidatingMC(false);
      console.warn('MC validation timeout - clearing loading state');
    }, 10000); // 10 second timeout

    try {
      setValidatingMC(true);
      const isValid = await CarrierService.validateMCNumber(mcNumber, carrier?.id);
      clearTimeout(timeoutId);
      
      if (!isValid) {
        setErrors(prev => ({ 
          ...prev, 
          mc_number: 'This MC number is already in use by another active carrier' 
        }));
      } else {
        // Clear any existing MC number error if validation passes
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.mc_number;
          return newErrors;
        });
      }
      return isValid;
    } catch (error) {
      console.error('Error validating MC number:', error);
      clearTimeout(timeoutId);
      setErrors(prev => ({ 
        ...prev, 
        mc_number: 'Unable to validate MC number. Please try again.' 
      }));
      return false;
    } finally {
      setValidatingMC(false);
    }
  };

  const validateForm = async (): Promise<boolean> => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Carrier name is required';
    }

    if (formData.primary_contact_email && !isValidEmail(formData.primary_contact_email)) {
      newErrors.primary_contact_email = 'Please enter a valid email address';
    }

    if (formData.primary_contact_phone && !isValidPhoneNumber(formData.primary_contact_phone)) {
      newErrors.primary_contact_phone = 'Please enter a valid phone number';
    }

    setErrors(newErrors);

    // Validate MC number if provided
    let mcIsValid = true;
    if (formData.mc_number.trim()) {
      mcIsValid = await validateMCNumber(formData.mc_number);
    }

    return Object.keys(newErrors).length === 0 && mcIsValid;
  };

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const isValidPhoneNumber = (phone: string) => {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length >= 10 && phoneRegex.test(cleaned);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const isValid = await validateForm();
    if (!isValid) return;

    const data: CreateCarrierData | UpdateCarrierData = {
      name: formData.name.trim(),
      mc_number: formData.mc_number.trim() || undefined,
      primary_contact_name: formData.primary_contact_name.trim() || undefined,
      primary_contact_email: formData.primary_contact_email.trim() || undefined,
      primary_contact_phone: formData.primary_contact_phone.trim() || undefined,
      operating_states: formData.operating_states,
      dnu_flag: formData.dnu_flag,
      equipment_type_ids: formData.equipment_type_ids
    };

    onSubmit(data);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg border border-gray-700 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">
              {carrier ? 'Edit Carrier' : 'Add New Carrier'}
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
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Carrier Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={`w-full px-3 py-2 bg-gray-700 border rounded-lg text-white focus:ring-2 focus:ring-red-500 ${
                    errors.name ? 'border-red-500' : 'border-gray-600'
                  }`}
                  placeholder="Enter carrier name"
                />
                {errors.name && <p className="mt-1 text-sm text-red-400">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  MC Number
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.mc_number}
                    onChange={(e) => handleInputChange('mc_number', e.target.value)}
                    onBlur={async (e) => {
                      if (e.target.value.trim()) {
                        try {
                          await validateMCNumber(e.target.value);
                        } catch (error) {
                          console.error('MC validation failed:', error);
                          setValidatingMC(false); // Ensure loading state is cleared
                        }
                      } else {
                        // Clear errors and validation state for empty field
                        setErrors(prev => {
                          const newErrors = { ...prev };
                          delete newErrors.mc_number;
                          return newErrors;
                        });
                        setValidatingMC(false);
                      }
                    }}
                    className={`w-full px-3 py-2 bg-gray-700 border rounded-lg text-white focus:ring-2 focus:ring-red-500 ${
                      errors.mc_number ? 'border-red-500' : 'border-gray-600'
                    }`}
                    placeholder="MC-123456"
                  />
                  {validatingMC && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin h-4 w-4 border-2 border-red-500 rounded-full border-t-transparent"></div>
                    </div>
                  )}
                </div>
                {errors.mc_number && <p className="mt-1 text-sm text-red-400">{errors.mc_number}</p>}
              </div>
            </div>

            {/* Contact Information */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Primary Contact Name
                </label>
                <input
                  type="text"
                  value={formData.primary_contact_name}
                  onChange={(e) => handleInputChange('primary_contact_name', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-red-500"
                  placeholder="Contact person name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.primary_contact_email}
                  onChange={(e) => handleInputChange('primary_contact_email', e.target.value)}
                  className={`w-full px-3 py-2 bg-gray-700 border rounded-lg text-white focus:ring-2 focus:ring-red-500 ${
                    errors.primary_contact_email ? 'border-red-500' : 'border-gray-600'
                  }`}
                  placeholder="email@example.com"
                />
                {errors.primary_contact_email && <p className="mt-1 text-sm text-red-400">{errors.primary_contact_email}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.primary_contact_phone}
                  onChange={(e) => handleInputChange('primary_contact_phone', e.target.value)}
                  className={`w-full px-3 py-2 bg-gray-700 border rounded-lg text-white focus:ring-2 focus:ring-red-500 ${
                    errors.primary_contact_phone ? 'border-red-500' : 'border-gray-600'
                  }`}
                  placeholder="(555) 123-4567"
                />
                {errors.primary_contact_phone && <p className="mt-1 text-sm text-red-400">{errors.primary_contact_phone}</p>}
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.dnu_flag}
                  onChange={(e) => handleInputChange('dnu_flag', e.target.checked)}
                  className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-600 bg-gray-700 rounded"
                />
                <span className="ml-2 text-gray-300">Mark as Do Not Use (DNU)</span>
              </label>
              <p className="mt-1 text-sm text-gray-400">
                Carriers marked as DNU will not be available for load assignments
              </p>
            </div>

            {/* Operating States */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Operating States
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 max-h-48 overflow-y-auto border border-gray-600 rounded-lg p-3 bg-gray-700">
                {US_STATES.map((state) => (
                  <label key={state.code} className="flex items-center text-sm">
                    <input
                      type="checkbox"
                      checked={formData.operating_states.includes(state.code)}
                      onChange={(e) => handleStateChange(state.code, e.target.checked)}
                      className="h-3 w-3 text-red-600 focus:ring-red-500 border-gray-600 bg-gray-800 rounded"
                    />
                    <span className="ml-2 text-gray-300">{state.code}</span>
                  </label>
                ))}
              </div>
              <p className="mt-1 text-sm text-gray-400">
                Selected: {formData.operating_states.length} states
              </p>
            </div>

            {/* Equipment Types */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Equipment Types
              </label>
              {equipmentTypes.length === 0 ? (
                <div className="border border-gray-600 rounded-lg p-3 bg-gray-700">
                  <p className="text-gray-400 text-sm">No equipment types available. Please contact your administrator.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-48 overflow-y-auto border border-gray-600 rounded-lg p-3 bg-gray-700">
                  {equipmentTypes.map((equipmentType) => (
                    <label key={equipmentType.id} className="flex items-center text-sm">
                      <input
                        type="checkbox"
                        checked={formData.equipment_type_ids.includes(equipmentType.id)}
                        onChange={(e) => handleEquipmentTypeChange(equipmentType.id, e.target.checked)}
                        className="h-3 w-3 text-red-600 focus:ring-red-500 border-gray-600 bg-gray-800 rounded"
                      />
                      <span className="ml-2 text-gray-300">{equipmentType.name}</span>
                    </label>
                  ))}
                </div>
              )}
              <p className="mt-1 text-sm text-gray-400">
                Selected: {formData.equipment_type_ids.length} equipment types
              </p>
            </div>

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
                disabled={loading || validatingMC}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:ring-2 focus:ring-red-500 transition-colors disabled:opacity-50"
              >
                {loading ? 'Saving...' : validatingMC ? 'Validating...' : carrier ? 'Update Carrier' : 'Add Carrier'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
