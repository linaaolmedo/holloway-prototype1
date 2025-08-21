'use client';

import { CarrierWithEquipment } from '@/types/carriers';

interface DeleteConfirmationModalProps {
  carrier: CarrierWithEquipment | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
}

export default function DeleteConfirmationModal({
  carrier,
  isOpen,
  onClose,
  onConfirm,
  loading
}: DeleteConfirmationModalProps) {
  if (!isOpen || !carrier) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg border border-gray-700 w-full max-w-md">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">
              Delete Carrier
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

          <div className="mb-6">
            <div className="flex items-center mb-4">
              <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-600 bg-opacity-20">
                <svg className="h-6 w-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.996-.833-2.5 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
            </div>
            
            <div className="text-center">
              <p className="text-gray-300 mb-4">
                Are you sure you want to delete the carrier <strong className="text-white">{carrier.name}</strong>?
              </p>
              
              {carrier.mc_number && (
                <p className="text-sm text-gray-400 mb-4">
                  MC Number: {carrier.mc_number}
                </p>
              )}

              <div className="bg-red-900 bg-opacity-20 border border-red-600 rounded-lg p-3 mb-4">
                <p className="text-red-300 text-sm">
                  <strong>Warning:</strong> This action cannot be undone. All associated data including:
                </p>
                <ul className="text-red-300 text-sm mt-2 list-disc list-inside text-left">
                  <li>Equipment type associations</li>
                  <li>Load assignments (will be unassigned)</li>
                  <li>Bid history</li>
                  <li>Uploaded documents</li>
                </ul>
                <p className="text-red-300 text-sm mt-2">
                  will be affected or removed.
                </p>
              </div>

              <div className="bg-yellow-900 bg-opacity-20 border border-yellow-600 rounded-lg p-3">
                <p className="text-yellow-300 text-sm">
                  <strong>Alternative:</strong> Consider marking this carrier as &quot;Do Not Use&quot; instead of deleting, 
                  which preserves historical data while preventing future assignments.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:ring-2 focus:ring-red-500 transition-colors disabled:opacity-50"
            >
              {loading ? 'Deleting...' : 'Delete Carrier'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
