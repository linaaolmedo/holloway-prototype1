'use client';

import { LoadWithDetails } from '@/types/loads';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
  load?: LoadWithDetails;
  loadCount?: number;
}

export default function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  loading,
  load,
  loadCount
}: DeleteConfirmationModalProps) {
  if (!isOpen) return null;

  const isMultiple = loadCount && loadCount > 1;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg border border-gray-700 w-full max-w-md">
        <div className="p-6">
          <div className="flex items-center mb-4">
            <div className="flex-shrink-0">
              <svg 
                className="h-6 w-6 text-red-400" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.732 16.5c-.77.833.192 2.5 1.732 2.5z" 
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-medium text-white">
                {isMultiple ? 'Delete Multiple Loads' : 'Delete Load'}
              </h3>
            </div>
          </div>

          <div className="mb-6">
            <p className="text-gray-300">
              {isMultiple ? (
                <>Are you sure you want to delete <strong>{loadCount} loads</strong>? This action cannot be undone.</>
              ) : (
                <>
                  Are you sure you want to delete load{' '}
                  <strong className="text-red-400">
                    BF-{load?.id.toString().padStart(4, '0')}
                  </strong>
                  {load?.customer?.name && (
                    <> for {load.customer.name}</>
                  )}
                  ? This action cannot be undone.
                </>
              )}
            </p>
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-gray-300 hover:text-white transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:ring-2 focus:ring-red-500 transition-colors disabled:opacity-50"
            >
              {loading ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
