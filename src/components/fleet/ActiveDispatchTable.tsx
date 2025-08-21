'use client';

import { useState } from 'react';
import { ActiveDispatch } from '@/types/fleet';

interface ActiveDispatchTableProps {
  dispatches: ActiveDispatch[];
  loading?: boolean;
}

export default function ActiveDispatchTable({ 
  dispatches, 
  loading
}: ActiveDispatchTableProps) {
  const [sortField, setSortField] = useState<string>('driver_name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium";
    switch (status) {
      case 'Active':
        return `${baseClasses} bg-green-600 text-green-100`;
      case 'In Transit':
        return `${baseClasses} bg-blue-600 text-blue-100`;
      case 'Pending Pickup':
        return `${baseClasses} bg-yellow-600 text-yellow-100`;
      default:
        return `${baseClasses} bg-gray-600 text-gray-100`;
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-lg border border-gray-700">
        <div className="animate-pulse">
          <div className="h-12 bg-gray-900 rounded-t-lg"></div>
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-800 border-b border-gray-700 last:border-b-0"></div>
          ))}
        </div>
      </div>
    );
  }

  if (dispatches.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-12">
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-white">No active drivers</h3>
          <p className="mt-2 text-gray-400">All drivers are currently on leave or inactive.</p>
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
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:text-white"
                onClick={() => handleSort('driver_name')}
              >
                Name
                {sortField === 'driver_name' && (
                  <span className="ml-1">
                    {sortDirection === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Current Location
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
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
            {dispatches.map((dispatch) => (
              <tr key={dispatch.driver_id} className="hover:bg-gray-700 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-white">{dispatch.driver_name}</div>
                  <div className="text-sm text-gray-400">{dispatch.driver_phone || 'No phone'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                  {dispatch.current_load ? (
                    <div>
                      <div className="font-medium text-white">{dispatch.current_load.load_id}</div>
                      <div className="text-gray-400">{dispatch.current_load.origin} → {dispatch.current_load.destination}</div>
                    </div>
                  ) : (
                    'N/A'
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={getStatusBadge(dispatch.current_load?.status || dispatch.status)}>
                    {dispatch.current_load?.status || 'Available'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                  {dispatch.available_hours}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                  -<br/>
                  <span className="text-gray-400">Medical: -</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <button 
                    className="text-blue-400 hover:text-blue-300"
                    title="View Details"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>
                  <button 
                    className="text-yellow-400 hover:text-yellow-300"
                    title="Edit"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button 
                    className="text-red-400 hover:text-red-300"
                    title="Delete"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Footer with selection count and pagination */}
      <div className="px-6 py-3 bg-gray-900 border-t border-gray-700 flex items-center justify-between">
        <div className="text-sm text-gray-400">
          0 of {dispatches.length} row(s) selected.
        </div>
        <div className="flex items-center space-x-2">
          <button className="px-3 py-1 text-sm text-gray-400 hover:text-white disabled:opacity-50" disabled>
            Previous
          </button>
          <button className="px-3 py-1 text-sm text-gray-400 hover:text-white disabled:opacity-50" disabled>
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
