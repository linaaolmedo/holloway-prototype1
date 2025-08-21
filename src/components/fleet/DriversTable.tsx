'use client';

import { useState } from 'react';
import { DriverWithTruck } from '@/types/fleet';

interface DriversTableProps {
  drivers: DriverWithTruck[];
  loading?: boolean;
  onEdit: (driver: DriverWithTruck) => void;
  onDelete: (driver: DriverWithTruck) => void;
  onView: (driver: DriverWithTruck) => void;
  selectedDrivers?: number[];
  onSelectionChange?: (selectedIds: number[]) => void;
}

export default function DriversTable({ 
  drivers, 
  loading, 
  onEdit, 
  onDelete, 
  onView,
  selectedDrivers = [],
  onSelectionChange
}: DriversTableProps) {
  const [sortField, setSortField] = useState<string>('name');
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
      onSelectionChange(checked ? drivers.map(driver => driver.id) : []);
    }
  };

  const handleSelectDriver = (driverId: number, checked: boolean) => {
    if (onSelectionChange) {
      if (checked) {
        onSelectionChange([...selectedDrivers, driverId]);
      } else {
        onSelectionChange(selectedDrivers.filter(id => id !== driverId));
      }
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium";
    switch (status) {
      case 'Active':
        return `${baseClasses} bg-green-600 text-green-100`;
      case 'In Use':
        return `${baseClasses} bg-blue-600 text-blue-100`;
      case 'On Leave':
        return `${baseClasses} bg-yellow-600 text-yellow-100`;
      case 'Inactive':
        return `${baseClasses} bg-red-600 text-red-100`;
      default:
        return `${baseClasses} bg-gray-600 text-gray-100`;
    }
  };

  const getExpiryStatus = (expiryDate: string | null, _type: 'license' | 'medical') => {
    if (!expiryDate) return null;
    
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return <span className="text-red-400 text-xs">⚠️ Expired</span>;
    } else if (diffDays <= 30) {
      return <span className="text-yellow-400 text-xs">⚠️ Expiring</span>;
    }
    return null;
  };

  const formatPhoneNumber = (phone: string | null) => {
    if (!phone) return '-';
    // Simple phone formatting for US numbers
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
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

  if (drivers.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-12">
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-white">No drivers found</h3>
          <p className="mt-2 text-gray-400">Get started by adding your first driver.</p>
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
                    checked={selectedDrivers.length === drivers.length && drivers.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  />
                </th>
              )}
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:text-white"
                onClick={() => handleSort('name')}
              >
                Name
                {sortField === 'name' && (
                  <span className="ml-1">
                    {sortDirection === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Current Location
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:text-white"
                onClick={() => handleSort('status')}
              >
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Available HOS
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                CDL Expiry
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-gray-800 divide-y divide-gray-700">
            {drivers.map((driver) => (
              <tr key={driver.id} className="hover:bg-gray-700 transition-colors">
                {onSelectionChange && (
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-600 bg-gray-700 rounded"
                      checked={selectedDrivers.includes(driver.id)}
                      onChange={(e) => handleSelectDriver(driver.id, e.target.checked)}
                    />
                  </td>
                )}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-white">{driver.name}</div>
                  <div className="text-xs text-gray-400">{formatPhoneNumber(driver.phone)}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                  {/* This would come from GPS/ELD data - showing placeholder */}
                  {driver.status === 'In Use' ? 'US-101 S, Salinas, CA' : 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={getStatusBadge(driver.status)}>
                    {driver.status}
                  </span>
                  {driver.truck && (
                    <div className="text-xs text-gray-400 mt-1">
                      Unit {driver.truck.truck_number}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                  {/* This would come from HOS data - showing placeholder */}
                  {driver.status === 'Active' ? (
                    <>
                      <div className="w-16 bg-gray-700 rounded-full h-2">
                        <div className="bg-green-600 h-2 rounded-full" style={{width: '75%'}}></div>
                      </div>
                      <div className="text-xs text-gray-400 mt-1">34h 7m</div>
                    </>
                  ) : 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                  <div className="flex items-center space-x-2">
                    <span>{formatDate(driver.license_expiry_date)}</span>
                    {getExpiryStatus(driver.license_expiry_date, 'license')}
                  </div>
                  <div className="flex items-center space-x-2 text-xs">
                    <span className="text-gray-400">Medical: {formatDate(driver.medical_card_expiry)}</span>
                    {getExpiryStatus(driver.medical_card_expiry, 'medical')}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => onView(driver)}
                      className="text-blue-400 hover:text-blue-300 transition-colors"
                      title="View Details"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => onEdit(driver)}
                      className="text-yellow-400 hover:text-yellow-300 transition-colors"
                      title="Edit Driver"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => onDelete(driver)}
                      className="text-red-400 hover:text-red-300 transition-colors"
                      title="Delete Driver"
                      disabled={driver.status === 'In Use'}
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
