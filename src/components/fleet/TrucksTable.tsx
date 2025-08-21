'use client';

import { useState } from 'react';
import { TruckWithDriver } from '@/types/fleet';

interface TrucksTableProps {
  trucks: TruckWithDriver[];
  loading?: boolean;
  onEdit: (truck: TruckWithDriver) => void;
  onDelete: (truck: TruckWithDriver) => void;
  onView: (truck: TruckWithDriver) => void;
  selectedTrucks?: number[];
  onSelectionChange?: (selectedIds: number[]) => void;
}

export default function TrucksTable({ 
  trucks, 
  loading, 
  onEdit, 
  onDelete, 
  onView,
  selectedTrucks = [],
  onSelectionChange
}: TrucksTableProps) {
  const [sortField, setSortField] = useState<string>('truck_number');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (onSelectionChange) {
      onSelectionChange(checked ? trucks.map(truck => truck.id) : []);
    }
  };

  const handleSelectTruck = (truckId: number, checked: boolean) => {
    if (onSelectionChange) {
      if (checked) {
        onSelectionChange([...selectedTrucks, truckId]);
      } else {
        onSelectionChange(selectedTrucks.filter(id => id !== truckId));
      }
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium";
    switch (status) {
      case 'Available':
        return `${baseClasses} bg-green-600 text-green-100`;
      case 'In Use':
        return `${baseClasses} bg-blue-600 text-blue-100`;
      case 'Maintenance':
        return `${baseClasses} bg-red-600 text-red-100`;
      default:
        return `${baseClasses} bg-gray-600 text-gray-100`;
    }
  };

  const getMaintenanceStatus = (maintenanceDue: string | null) => {
    if (!maintenanceDue) return null;
    
    const today = new Date();
    const dueDate = new Date(maintenanceDue);
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return <span className="text-red-400 text-xs">⚠️ Overdue</span>;
    } else if (diffDays <= 30) {
      return <span className="text-yellow-400 text-xs">⚠️ Due Soon</span>;
    }
    return null;
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-lg border border-gray-700">
        <div className="animate-pulse">
          <div className="h-12 bg-gray-900 rounded-t-lg"></div>
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-800 border-b border-gray-700 last:border-b-0"></div>
          ))}
        </div>
      </div>
    );
  }

  if (trucks.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-12">
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-white">No trucks found</h3>
          <p className="mt-2 text-gray-400">Get started by adding your first truck.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-700">
          <thead className="bg-gray-900">
            <tr>
              {onSelectionChange && (
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-600 bg-gray-700 rounded"
                    checked={selectedTrucks.length === trucks.length && trucks.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  />
                </th>
              )}
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:text-white"
                onClick={() => handleSort('truck_number')}
              >
                Unit #
                {sortField === 'truck_number' && (
                  <span className="ml-1">
                    {sortDirection === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Make/Model
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                VIN
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:text-white"
                onClick={() => handleSort('status')}
              >
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Assigned Driver
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Next Maintenance
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-gray-800 divide-y divide-gray-700">
            {trucks.map((truck) => (
              <tr key={truck.id} className="hover:bg-gray-700 transition-colors">
                {onSelectionChange && (
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-600 bg-gray-700 rounded"
                      checked={selectedTrucks.includes(truck.id)}
                      onChange={(e) => handleSelectTruck(truck.id, e.target.checked)}
                    />
                  </td>
                )}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-white">{truck.truck_number}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                  {truck.make || 'Freightliner'}
                  <div className="text-xs text-gray-400">
                    {truck.model || 'Cascadia'} ({truck.year || '2019'})
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                  {truck.license_plate || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={getStatusBadge(truck.status)}>
                    {truck.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                  {truck.driver ? truck.driver.name : 'None'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                  <div className="flex items-center space-x-2">
                    <span>{formatDate(truck.maintenance_due)}</span>
                    {getMaintenanceStatus(truck.maintenance_due)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => onView(truck)}
                      className="text-blue-400 hover:text-blue-300 transition-colors"
                      title="View Details"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => onEdit(truck)}
                      className="text-yellow-400 hover:text-yellow-300 transition-colors"
                      title="Edit Truck"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => onDelete(truck)}
                      className="text-red-400 hover:text-red-300 transition-colors"
                      title="Delete Truck"
                      disabled={truck.status === 'In Use'}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
