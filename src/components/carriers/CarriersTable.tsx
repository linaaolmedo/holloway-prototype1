'use client';

import { useState } from 'react';
import { CarrierWithEquipment } from '@/types/carriers';

interface CarriersTableProps {
  carriers: CarrierWithEquipment[];
  loading?: boolean;
  onEdit: (carrier: CarrierWithEquipment) => void;
  onDelete: (carrier: CarrierWithEquipment) => void;
  onView: (carrier: CarrierWithEquipment) => void;
  selectedCarriers?: number[];
  onSelectionChange?: (selectedIds: number[]) => void;
}

export default function CarriersTable({ 
  carriers, 
  loading, 
  onEdit, 
  onDelete, 
  onView,
  selectedCarriers = [],
  onSelectionChange
}: CarriersTableProps) {
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
      onSelectionChange(checked ? carriers.map(carrier => carrier.id) : []);
    }
  };

  const handleSelectCarrier = (carrierId: number, checked: boolean) => {
    if (onSelectionChange) {
      if (checked) {
        onSelectionChange([...selectedCarriers, carrierId]);
      } else {
        onSelectionChange(selectedCarriers.filter(id => id !== carrierId));
      }
    }
  };

  const getDnuBadge = (dnuFlag: boolean) => {
    if (dnuFlag) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-600 text-red-100">
          DNU
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-600 text-green-100">
        Active
      </span>
    );
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

  const formatOperatingStates = (states: string[]) => {
    if (!states || states.length === 0) return '-';
    if (states.length <= 3) {
      return states.join(', ');
    }
    return `${states.slice(0, 3).join(', ')} +${states.length - 3} more`;
  };

  const formatEquipmentTypes = (equipmentTypes: Array<{ name: string }>) => {
    if (!equipmentTypes || equipmentTypes.length === 0) return '-';
    if (equipmentTypes.length <= 2) {
      return equipmentTypes.map(et => et.name).join(', ');
    }
    return `${equipmentTypes.slice(0, 2).map(et => et.name).join(', ')} +${equipmentTypes.length - 2} more`;
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

  if (carriers.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-12">
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-white">No carriers found</h3>
          <p className="mt-2 text-gray-400">Get started by adding your first carrier.</p>
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
                    checked={selectedCarriers.length === carriers.length && carriers.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  />
                </th>
              )}
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:text-white"
                onClick={() => handleSort('name')}
              >
                Carrier Name
                {sortField === 'name' && (
                  <span className="ml-1">
                    {sortDirection === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:text-white"
                onClick={() => handleSort('mc_number')}
              >
                MC #
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Contact Person
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Phone
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Operating States
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Equipment Types
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:text-white"
                onClick={() => handleSort('dnu_flag')}
              >
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-gray-800 divide-y divide-gray-700">
            {carriers.map((carrier) => (
              <tr key={carrier.id} className="hover:bg-gray-700 transition-colors">
                {onSelectionChange && (
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-600 bg-gray-700 rounded"
                      checked={selectedCarriers.includes(carrier.id)}
                      onChange={(e) => handleSelectCarrier(carrier.id, e.target.checked)}
                    />
                  </td>
                )}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-white">{carrier.name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                  {carrier.mc_number || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                  {carrier.primary_contact_name || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                  {formatPhoneNumber(carrier.primary_contact_phone)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                  <div className="max-w-48 truncate">
                    {carrier.primary_contact_email || '-'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                  <div className="max-w-32">
                    {formatOperatingStates(carrier.operating_states)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                  <div className="max-w-32">
                    {formatEquipmentTypes(carrier.equipment_types || [])}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getDnuBadge(carrier.dnu_flag)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => onView(carrier)}
                      className="text-blue-400 hover:text-blue-300 transition-colors"
                      title="View Details"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => onEdit(carrier)}
                      className="text-yellow-400 hover:text-yellow-300 transition-colors"
                      title="Edit Carrier"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => onDelete(carrier)}
                      className="text-red-400 hover:text-red-300 transition-colors"
                      title="Delete Carrier"
                      disabled={carrier.dnu_flag}
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
