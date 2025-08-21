'use client';

import React, { useState } from 'react';
import { DriverAssignment } from '@/types/driver';
import LoadingSpinner from '@/components/auth/LoadingSpinner';

interface LoadStatusUpdaterProps {
  assignment: DriverAssignment | null;
  onStatusUpdate: (status: 'In Transit' | 'Delivered') => Promise<void>;
  loading?: boolean;
}

export default function LoadStatusUpdater({ assignment, onStatusUpdate, loading }: LoadStatusUpdaterProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  if (!assignment) {
    return null;
  }

  const handleStatusUpdate = async (status: 'In Transit' | 'Delivered') => {
    if (isUpdating) return;
    
    setIsUpdating(true);
    try {
      await onStatusUpdate(status);
    } catch (error) {
      console.error('Failed to update status:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const canMarkInTransit = assignment.status === 'Pending Pickup';
  const canMarkDelivered = assignment.status === 'In Transit';

  return (
    <div className="bg-gray-800 rounded-xl p-6">
      <h2 className="text-xl font-bold text-white mb-6">Update Load Status</h2>

      <div className="space-y-4">
        {/* Current Status Display */}
        <div className="bg-gray-900 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-400 mb-2">Current Status</h3>
          <p className="text-lg font-semibold text-white">{assignment.status}</p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          {canMarkInTransit && (
            <button
              onClick={() => handleStatusUpdate('In Transit')}
              disabled={isUpdating || loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
            >
              {isUpdating ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Updating...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Mark as In Transit
                </>
              )}
            </button>
          )}

          {canMarkDelivered && (
            <button
              onClick={() => handleStatusUpdate('Delivered')}
              disabled={isUpdating || loading}
              className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
            >
              {isUpdating ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Updating...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Mark as Delivered
                </>
              )}
            </button>
          )}

          {assignment.status === 'Delivered' && (
            <div className="bg-green-900 bg-opacity-20 border border-green-700 rounded-lg p-4 text-center">
              <svg className="w-8 h-8 text-green-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-green-300 font-medium">Load Delivered</p>
              <p className="text-green-400 text-sm mt-1">Great job! Contact dispatch for your next assignment.</p>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-gray-900 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-400 mb-2">Instructions</h3>
          <div className="text-sm text-gray-300 space-y-1">
            {canMarkInTransit && (
              <p>• Click "Mark as In Transit" when you have picked up the load and are en route</p>
            )}
            {canMarkDelivered && (
              <p>• Click "Mark as Delivered" when you have successfully delivered the load</p>
            )}
            <p>• Status updates are automatically logged and sent to dispatch</p>
          </div>
        </div>
      </div>
    </div>
  );
}
