'use client';

import { useState } from 'react';
import { LoadStatus } from '@/types/loads';

interface BulkActionsProps {
  selectedCount: number;
  onBulkDelete: () => void;
  onBulkStatusUpdate: (status: LoadStatus) => void;
  onClearSelection: () => void;
  loading?: boolean;
}

export default function BulkActions({
  selectedCount,
  onBulkDelete,
  onBulkStatusUpdate,
  onClearSelection,
  loading
}: BulkActionsProps) {
  const [showStatusMenu, setShowStatusMenu] = useState(false);

  const statusOptions: { value: LoadStatus; label: string; color: string }[] = [
    { value: 'Pending Pickup', label: 'Pending Pickup', color: 'text-yellow-400' },
    { value: 'In Transit', label: 'In Transit', color: 'text-blue-400' },
    { value: 'Delivered', label: 'Delivered', color: 'text-green-400' },
    { value: 'Cancelled', label: 'Cancelled', color: 'text-red-400' }
  ];

  if (selectedCount === 0) return null;

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <span className="text-white font-medium">
            {selectedCount} load{selectedCount !== 1 ? 's' : ''} selected
          </span>
          
          <div className="flex items-center space-x-2">
            {/* Update Status */}
            <div className="relative">
              <button
                onClick={() => setShowStatusMenu(!showStatusMenu)}
                disabled={loading}
                className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Update Status
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showStatusMenu && (
                <div className="absolute top-full left-0 mt-1 w-48 bg-gray-700 border border-gray-600 rounded-lg shadow-lg z-10">
                  {statusOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        onBulkStatusUpdate(option.value);
                        setShowStatusMenu(false);
                      }}
                      className={`w-full text-left px-4 py-2 hover:bg-gray-600 transition-colors ${option.color} first:rounded-t-lg last:rounded-b-lg`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Delete */}
            <button
              onClick={onBulkDelete}
              disabled={loading}
              className="flex items-center px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete
            </button>
          </div>
        </div>

        <button
          onClick={onClearSelection}
          disabled={loading}
          className="text-gray-400 hover:text-white transition-colors disabled:opacity-50"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
