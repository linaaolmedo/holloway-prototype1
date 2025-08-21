'use client';

import { CustomerWithLocations } from '@/types/customers';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  customer: CustomerWithLocations | null;
  loading?: boolean;
}

export default function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  customer,
  loading = false
}: DeleteConfirmationModalProps) {
  if (!isOpen || !customer) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-lg p-6 w-full max-w-md">
        <div className="flex items-center mb-4">
          <div className="flex-shrink-0">
            <svg 
              className="w-8 h-8 text-red-400" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" 
              />
            </svg>
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-medium text-white">
              Delete Customer
            </h3>
            <p className="text-gray-400">
              This action cannot be undone.
            </p>
          </div>
        </div>

        <div className="mb-6">
          <p className="text-gray-300 mb-4">
            Are you sure you want to delete the following customer?
          </p>
          
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="space-y-2">
              <div>
                <span className="text-sm font-medium text-gray-400">Customer Name:</span>
                <span className="ml-2 text-white">{customer.name}</span>
              </div>
              
              {customer.primary_contact_name && (
                <div>
                  <span className="text-sm font-medium text-gray-400">Contact:</span>
                  <span className="ml-2 text-white">{customer.primary_contact_name}</span>
                </div>
              )}
              
              {customer.primary_contact_email && (
                <div>
                  <span className="text-sm font-medium text-gray-400">Email:</span>
                  <span className="ml-2 text-white">{customer.primary_contact_email}</span>
                </div>
              )}

              {customer.customer_locations && customer.customer_locations.length > 0 && (
                <div>
                  <span className="text-sm font-medium text-gray-400">Locations:</span>
                  <span className="ml-2 text-white">{customer.customer_locations.length} location(s)</span>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 p-3 bg-red-900 bg-opacity-20 border border-red-700 rounded-lg">
            <div className="flex items-start">
              <svg 
                className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" 
                />
              </svg>
              <div className="ml-2">
                <h4 className="text-sm font-medium text-red-300">Warning</h4>
                <p className="text-sm text-red-200 mt-1">
                  This will permanently delete the customer and all associated locations. 
                  Any loads associated with this customer will need to be handled separately.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 border border-gray-600 rounded-md text-gray-300 hover:text-white hover:border-gray-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-900"
          >
            {loading ? 'Deleting...' : 'Delete Customer'}
          </button>
        </div>
      </div>
    </div>
  );
}
