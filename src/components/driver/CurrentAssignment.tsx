'use client';

import React from 'react';
import { DriverAssignment } from '@/types/driver';

interface CurrentAssignmentProps {
  assignment: DriverAssignment | null;
  loading?: boolean;
}

export default function CurrentAssignment({ assignment, loading }: CurrentAssignmentProps) {
  if (loading) {
    return (
      <div className="bg-gray-800 rounded-xl p-6 animate-pulse">
        <div className="h-6 bg-gray-700 rounded mb-4"></div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-700 rounded w-3/4"></div>
          <div className="h-4 bg-gray-700 rounded w-1/2"></div>
          <div className="h-4 bg-gray-700 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="bg-gray-800 rounded-xl p-6 text-center">
        <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
        <h3 className="text-lg font-medium text-white mb-2">No Current Assignment</h3>
        <p className="text-gray-400">You don't have any active loads assigned. Contact dispatch for your next assignment.</p>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending Pickup':
        return 'bg-yellow-900 text-yellow-300 border-yellow-700';
      case 'In Transit':
        return 'bg-blue-900 text-blue-300 border-blue-700';
      case 'Delivered':
        return 'bg-green-900 text-green-300 border-green-700';
      default:
        return 'bg-gray-900 text-gray-300 border-gray-700';
    }
  };

  const formatLocation = (location: any) => {
    if (!location) return 'Unknown Location';
    const parts = [
      location.location_name,
      location.city,
      location.state
    ].filter(Boolean);
    return parts.join(', ');
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not scheduled';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="bg-gray-800 rounded-xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">Current Assignment</h2>
        <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(assignment.status)}`}>
          {assignment.status}
        </div>
      </div>

      {/* Load ID and Customer */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <h3 className="text-sm font-medium text-gray-400 mb-1">Load ID</h3>
          <p className="text-lg font-semibold text-white">#{assignment.id}</p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-400 mb-1">Customer</h3>
          <p className="text-lg font-semibold text-white">{assignment.customer?.name || 'Unknown Customer'}</p>
        </div>
      </div>

      {/* Route Information */}
      <div className="bg-gray-900 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold text-white mb-4">Route Details</h3>
        
        {/* Pickup Information */}
        <div className="flex items-start space-x-3 mb-4">
          <div className="w-3 h-3 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
          <div className="flex-1">
            <h4 className="text-sm font-medium text-green-400 mb-1">Pickup Location</h4>
            <p className="text-white font-medium">{formatLocation(assignment.origin_location)}</p>
            <p className="text-sm text-gray-400">
              Scheduled: {formatDate(assignment.pickup_date)}
            </p>
          </div>
        </div>

        {/* Route line */}
        <div className="flex justify-center mb-4">
          <div className="w-px h-8 bg-gray-600"></div>
        </div>

        {/* Delivery Information */}
        <div className="flex items-start space-x-3">
          <div className="w-3 h-3 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
          <div className="flex-1">
            <h4 className="text-sm font-medium text-red-400 mb-1">Delivery Location</h4>
            <p className="text-white font-medium">{formatLocation(assignment.destination_location)}</p>
            <p className="text-sm text-gray-400">
              Due: {formatDate(assignment.delivery_date)}
            </p>
          </div>
        </div>
      </div>

      {/* Commodity and Equipment */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <h3 className="text-sm font-medium text-gray-400 mb-1">Commodity</h3>
          <p className="text-white font-medium">{assignment.commodity || 'Not specified'}</p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-400 mb-1">Weight</h3>
          <p className="text-white font-medium">
            {assignment.weight ? `${assignment.weight.toLocaleString()} lbs` : 'Not specified'}
          </p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-400 mb-1">Equipment</h3>
          <p className="text-white font-medium">{assignment.equipment_type?.name || 'Not specified'}</p>
        </div>
      </div>
    </div>
  );
}
