'use client';

import { useState, useEffect } from 'react';
import { LoadFilters, LoadStatus, Customer, EquipmentType } from '@/types/loads';

interface LoadsFiltersProps {
  filters: LoadFilters;
  onFiltersChange: (filters: LoadFilters) => void;
  customers: Customer[];
  equipmentTypes: EquipmentType[];
}

export default function LoadsFilters({ filters, onFiltersChange, customers, equipmentTypes }: LoadsFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const statusOptions: LoadStatus[] = ['Pending Pickup', 'In Transit', 'Delivered', 'Cancelled'];

  const updateFilter = (key: keyof LoadFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value || undefined
    });
  };

  const clearFilters = () => {
    onFiltersChange({});
  };

  const hasActiveFilters = Object.keys(filters).some(key => 
    filters[key as keyof LoadFilters] !== undefined && filters[key as keyof LoadFilters] !== ''
  );

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg mb-6">
      {/* Search Bar */}
      <div className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder="Search loads by commodity, customer..."
                value={filters.search || ''}
                onChange={(e) => updateFilter('search', e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
              <svg 
                className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Quick Status Filters */}
          <div className="flex gap-2">
            {statusOptions.map((status) => (
              <button
                key={status}
                onClick={() => updateFilter('status', filters.status === status ? undefined : status)}
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  filters.status === status
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {status === 'Pending Pickup' ? 'Pickup' : 
                 status === 'In Transit' ? 'Transit' : 
                 status}
              </button>
            ))}
          </div>

          {/* Advanced Filters Toggle */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center px-3 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
          >
            <svg 
              className={`w-5 h-5 mr-2 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
            Filters
            {hasActiveFilters && (
              <span className="ml-2 bg-red-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {Object.keys(filters).filter(key => filters[key as keyof LoadFilters]).length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Advanced Filters */}
      {isExpanded && (
        <div className="border-t border-gray-700 p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Customer Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Customer
              </label>
              <select
                value={filters.customer_id || ''}
                onChange={(e) => updateFilter('customer_id', e.target.value ? parseInt(e.target.value) : undefined)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-red-500 focus:border-red-500"
              >
                <option value="">All Customers</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Equipment Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Equipment Type
              </label>
              <select
                value={filters.equipment_type_id || ''}
                onChange={(e) => updateFilter('equipment_type_id', e.target.value ? parseInt(e.target.value) : undefined)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-red-500 focus:border-red-500"
              >
                <option value="">All Equipment</option>
                {equipmentTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Pickup Date From */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Pickup From
              </label>
              <input
                type="date"
                value={filters.pickup_date_from || ''}
                onChange={(e) => updateFilter('pickup_date_from', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>

            {/* Pickup Date To */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Pickup To
              </label>
              <input
                type="date"
                value={filters.pickup_date_to || ''}
                onChange={(e) => updateFilter('pickup_date_to', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>

            {/* Delivery Date From */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Delivery From
              </label>
              <input
                type="date"
                value={filters.delivery_date_from || ''}
                onChange={(e) => updateFilter('delivery_date_from', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>

            {/* Delivery Date To */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Delivery To
              </label>
              <input
                type="date"
                value={filters.delivery_date_to || ''}
                onChange={(e) => updateFilter('delivery_date_to', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>
          </div>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <div className="mt-4 flex justify-end">
              <button
                onClick={clearFilters}
                className="px-4 py-2 text-sm text-gray-300 hover:text-white transition-colors"
              >
                Clear All Filters
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
