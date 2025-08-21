'use client';

import { useState, useEffect } from 'react';
import { CarrierFilters, US_STATES, EquipmentType } from '@/types/carriers';

interface CarriersFiltersProps {
  filters: CarrierFilters;
  onFiltersChange: (filters: CarrierFilters) => void;
  equipmentTypes: EquipmentType[];
  totalCarriers: number;
  filteredCarriers: number;
}

export default function CarriersFilters({
  filters,
  onFiltersChange,
  equipmentTypes,
  totalCarriers,
  filteredCarriers
}: CarriersFiltersProps) {
  const [localFilters, setLocalFilters] = useState<CarrierFilters>(filters);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleFilterChange = (key: keyof CarrierFilters, value: any) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const clearFilters = () => {
    const emptyFilters: CarrierFilters = {};
    setLocalFilters(emptyFilters);
    onFiltersChange(emptyFilters);
  };

  const hasActiveFilters = Object.values(localFilters).some(value => 
    value !== undefined && value !== null && value !== ''
  );

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-white">Filters</h3>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-400">
            Showing {filteredCarriers} of {totalCarriers} carriers
          </span>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-sm text-red-400 hover:text-red-300 transition-colors"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Search */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Search
          </label>
          <div className="relative">
            <input
              type="text"
              value={localFilters.search || ''}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              placeholder="Name, MC#, or contact..."
              className="w-full pl-10 pr-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-red-500"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Operating State */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Operating State
          </label>
          <select
            value={localFilters.operating_state || ''}
            onChange={(e) => handleFilterChange('operating_state', e.target.value || undefined)}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-red-500"
          >
            <option value="">All States</option>
            {US_STATES.map((state) => (
              <option key={state.code} value={state.code}>
                {state.name} ({state.code})
              </option>
            ))}
          </select>
        </div>

        {/* Equipment Type */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Equipment Type
          </label>
          <select
            value={localFilters.equipment_type || ''}
            onChange={(e) => handleFilterChange('equipment_type', e.target.value || undefined)}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-red-500"
          >
            <option value="">All Equipment</option>
            {equipmentTypes.map((type) => (
              <option key={type.id} value={type.name}>
                {type.name}
              </option>
            ))}
          </select>
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Status
          </label>
          <select
            value={localFilters.dnu_flag === undefined ? '' : localFilters.dnu_flag ? 'dnu' : 'active'}
            onChange={(e) => {
              if (e.target.value === '') {
                handleFilterChange('dnu_flag', undefined);
              } else {
                handleFilterChange('dnu_flag', e.target.value === 'dnu');
              }
            }}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-red-500"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="dnu">Do Not Use</option>
          </select>
        </div>
      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="mt-4 pt-4 border-t border-gray-700">
          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-gray-400">Active filters:</span>
            
            {localFilters.search && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-600 text-red-100">
                Search: "{localFilters.search}"
                <button
                  onClick={() => handleFilterChange('search', undefined)}
                  className="ml-1 text-red-200 hover:text-white"
                >
                  ×
                </button>
              </span>
            )}
            
            {localFilters.operating_state && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-600 text-blue-100">
                State: {localFilters.operating_state}
                <button
                  onClick={() => handleFilterChange('operating_state', undefined)}
                  className="ml-1 text-blue-200 hover:text-white"
                >
                  ×
                </button>
              </span>
            )}
            
            {localFilters.equipment_type && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-600 text-green-100">
                Equipment: {localFilters.equipment_type}
                <button
                  onClick={() => handleFilterChange('equipment_type', undefined)}
                  className="ml-1 text-green-200 hover:text-white"
                >
                  ×
                </button>
              </span>
            )}
            
            {localFilters.dnu_flag !== undefined && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-600 text-yellow-100">
                Status: {localFilters.dnu_flag ? 'Do Not Use' : 'Active'}
                <button
                  onClick={() => handleFilterChange('dnu_flag', undefined)}
                  className="ml-1 text-yellow-200 hover:text-white"
                >
                  ×
                </button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
