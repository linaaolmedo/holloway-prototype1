'use client';

import { useState, useEffect } from 'react';
import { CustomerWithLocations, CreateCustomerData, PAYMENT_TERMS_OPTIONS, US_STATES } from '@/types/customers';

interface CustomerFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateCustomerData) => Promise<void>;
  customer?: CustomerWithLocations | null;
  loading?: boolean;
}

export default function CustomerFormModal({
  isOpen,
  onClose,
  onSubmit,
  customer,
  loading = false
}: CustomerFormModalProps) {
  const [formData, setFormData] = useState<CreateCustomerData>({
    name: '',
    primary_contact_name: '',
    primary_contact_email: '',
    primary_contact_phone: '',
    credit_limit: undefined,
    payment_terms: 30,
    consolidated_invoicing: false,
    locations: []
  });

  const [locations, setLocations] = useState([{
    location_name: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'USA'
  }]);

  useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name,
        primary_contact_name: customer.primary_contact_name || '',
        primary_contact_email: customer.primary_contact_email || '',
        primary_contact_phone: customer.primary_contact_phone || '',
        credit_limit: customer.credit_limit,
        payment_terms: customer.payment_terms || 30,
        consolidated_invoicing: customer.consolidated_invoicing,
      });

      if (customer.customer_locations && customer.customer_locations.length > 0) {
        setLocations(customer.customer_locations.map(loc => ({
          location_name: loc.location_name || '',
          address_line1: loc.address_line1 || '',
          address_line2: loc.address_line2 || '',
          city: loc.city || '',
          state: loc.state || '',
          postal_code: loc.postal_code || '',
          country: loc.country || 'USA'
        })));
      }
    } else {
      setFormData({
        name: '',
        primary_contact_name: '',
        primary_contact_email: '',
        primary_contact_phone: '',
        credit_limit: undefined,
        payment_terms: 30,
        consolidated_invoicing: false,
      });
      setLocations([{
        location_name: '',
        address_line1: '',
        address_line2: '',
        city: '',
        state: '',
        postal_code: '',
        country: 'USA'
      }]);
    }
  }, [customer]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const submitData = {
      ...formData,
      locations: locations.filter(loc => 
        loc.location_name || loc.address_line1 || loc.city || loc.state
      )
    };

    await onSubmit(submitData);
  };

  const addLocation = () => {
    setLocations([...locations, {
      location_name: '',
      address_line1: '',
      address_line2: '',
      city: '',
      state: '',
      postal_code: '',
      country: 'USA'
    }]);
  };

  const removeLocation = (index: number) => {
    if (locations.length > 1) {
      setLocations(locations.filter((_, i) => i !== index));
    }
  };

  const updateLocation = (index: number, field: string, value: string) => {
    const updatedLocations = [...locations];
    updatedLocations[index] = { ...updatedLocations[index], [field]: value };
    setLocations(updatedLocations);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-white">
            {customer ? 'Edit Customer' : 'Add New Customer'}
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Customer Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="e.g., Farm Fresh Co."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Contact Person
              </label>
              <input
                type="text"
                value={formData.primary_contact_name}
                onChange={(e) => setFormData({ ...formData, primary_contact_name: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="e.g., Alice Johnson"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                value={formData.primary_contact_phone}
                onChange={(e) => setFormData({ ...formData, primary_contact_phone: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="e.g., 555-111-2222"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <input
                type="email"
                value={formData.primary_contact_email}
                onChange={(e) => setFormData({ ...formData, primary_contact_email: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="e.g., alice@farmfresh.com"
              />
            </div>
          </div>

          {/* Billing Information */}
          <div className="border-t border-gray-700 pt-6">
            <h3 className="text-lg font-medium text-white mb-4">Billing Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Payment Terms
                </label>
                <select
                  value={formData.payment_terms}
                  onChange={(e) => setFormData({ ...formData, payment_terms: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  {PAYMENT_TERMS_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Credit Limit ($)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.credit_limit || ''}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    credit_limit: e.target.value ? Number(e.target.value) : undefined 
                  })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="10000"
                />
              </div>

              <div className="flex items-center">
                <label className="flex items-center text-sm text-gray-300">
                  <input
                    type="checkbox"
                    checked={formData.consolidated_invoicing}
                    onChange={(e) => setFormData({ ...formData, consolidated_invoicing: e.target.checked })}
                    className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-600 bg-gray-800 rounded mr-2"
                  />
                  Consolidated Invoicing
                </label>
              </div>
            </div>
          </div>

          {/* Locations */}
          <div className="border-t border-gray-700 pt-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-white">Locations</h3>
              <button
                type="button"
                onClick={addLocation}
                className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm"
              >
                Add Location
              </button>
            </div>

            <div className="space-y-6">
              {locations.map((location, index) => (
                <div key={index} className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-md font-medium text-white">
                      Location {index + 1}
                    </h4>
                    {locations.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeLocation(index)}
                        className="text-red-400 hover:text-red-300 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Location Name
                      </label>
                      <input
                        type="text"
                        value={location.location_name}
                        onChange={(e) => updateLocation(index, 'location_name', e.target.value)}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        placeholder="e.g., Main Warehouse"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Address Line 1
                      </label>
                      <input
                        type="text"
                        value={location.address_line1}
                        onChange={(e) => updateLocation(index, 'address_line1', e.target.value)}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        placeholder="123 Billing St"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Address Line 2
                      </label>
                      <input
                        type="text"
                        value={location.address_line2}
                        onChange={(e) => updateLocation(index, 'address_line2', e.target.value)}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        placeholder="Suite 100"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        City
                      </label>
                      <input
                        type="text"
                        value={location.city}
                        onChange={(e) => updateLocation(index, 'city', e.target.value)}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        placeholder="Townsville"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        State
                      </label>
                      <select
                        value={location.state}
                        onChange={(e) => updateLocation(index, 'state', e.target.value)}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      >
                        <option value="">Select State</option>
                        {US_STATES.map(state => (
                          <option key={state.code} value={state.code}>
                            {state.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Postal Code
                      </label>
                      <input
                        type="text"
                        value={location.postal_code}
                        onChange={(e) => updateLocation(index, 'postal_code', e.target.value)}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        placeholder="90210"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Country
                      </label>
                      <input
                        type="text"
                        value={location.country}
                        onChange={(e) => updateLocation(index, 'country', e.target.value)}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        placeholder="USA"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-600 rounded-md text-gray-300 hover:text-white hover:border-gray-500 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : (customer ? 'Update Customer' : 'Add Customer')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
