'use client';

import { useState } from 'react';
import { TruckFilters, TrailerFilters, DriverFilters, EquipmentType } from '@/types/fleet';

type FleetFiltersType = TruckFilters | TrailerFilters | DriverFilters;

interface FleetFiltersProps {
  filters: FleetFiltersType;
  onFiltersChange: (filters: FleetFiltersType) => void;
  entityType: 'truck' | 'trailer' | 'driver';
  equipmentTypes?: EquipmentType[];
}

export default function FleetFilters({
  filters,
  onFiltersChange,
  entityType,
  equipmentTypes = []
}: FleetFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleFilterChange = (field: string, value: any) => {
    onFiltersChange({
      ...filters,
      [field]: value || undefined
    });
  };

  const clearFilters = () => {
    const emptyFilters: Record<string, FleetFiltersType> = {
      truck: { search: '', status: '', maintenance_due: undefined },
      trailer: { search: '', status: '', equipment_type: '', maintenance_due: undefined },
      driver: { search: '', status: '', license_expiry: undefined, medical_card_expiry: undefined, assigned: undefined }
    };
    onFiltersChange(emptyFilters[entityType]);
  };

  const hasActiveFilters = Object.values(filters).some(value => 
    value !== undefined && value !== '' && value !== null
  );

  const renderTruckFilters = () => (
    <>
      <div>
        <label className="block text-xs font-medium text-gray-400 mb-1">Status</label>
        <select
          value={(filters as TruckFilters).status || ''}
          onChange={(e) => handleFilterChange('status', e.target.value)}
          className="w-full px-3 py-2 text-sm bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          <option value="">All Statuses</option>
          <option value="Available">Available</option>
          <option value="In Use">In Use</option>
          <option value="Maintenance">Maintenance</option>
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-400 mb-1">Maintenance</label>
        <select
          value={(filters as TruckFilters).maintenance_due || ''}
          onChange={(e) => handleFilterChange('maintenance_due', e.target.value)}
          className="w-full px-3 py-2 text-sm bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          <option value="">All</option>
          <option value="overdue">Overdue</option>
          <option value="upcoming">Due Soon (30 days)</option>
          <option value="current">Current</option>
        </select>
      </div>
    </>
  );

  const renderTrailerFilters = () => (
    <>
      <div>
        <label className="block text-xs font-medium text-gray-400 mb-1">Status</label>
        <select
          value={(filters as TrailerFilters).status || ''}
          onChange={(e) => handleFilterChange('status', e.target.value)}
          className="w-full px-3 py-2 text-sm bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          <option value="">All Statuses</option>
          <option value="Available">Available</option>
          <option value="In Use">In Use</option>
          <option value="Maintenance">Maintenance</option>
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-400 mb-1">Equipment Type</label>
        <select
          value={(filters as TrailerFilters).equipment_type || ''}
          onChange={(e) => handleFilterChange('equipment_type', e.target.value)}
          className="w-full px-3 py-2 text-sm bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          <option value="">All Types</option>
          {equipmentTypes.map(type => (
            <option key={type.id} value={type.name}>{type.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-400 mb-1">Maintenance</label>
        <select
          value={(filters as TrailerFilters).maintenance_due || ''}
          onChange={(e) => handleFilterChange('maintenance_due', e.target.value)}
          className="w-full px-3 py-2 text-sm bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          <option value="">All</option>
          <option value="overdue">Overdue</option>
          <option value="upcoming">Due Soon (30 days)</option>
          <option value="current">Current</option>
        </select>
      </div>
    </>
  );

  const renderDriverFilters = () => (
    <>
      <div>
        <label className="block text-xs font-medium text-gray-400 mb-1">Status</label>
        <select
          value={(filters as DriverFilters).status || ''}
          onChange={(e) => handleFilterChange('status', e.target.value)}
          className="w-full px-3 py-2 text-sm bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          <option value="">All Statuses</option>
          <option value="Active">Active</option>
          <option value="On Leave">On Leave</option>
          <option value="Inactive">Inactive</option>
          <option value="In Use">In Use</option>
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-400 mb-1">Assignment</label>
        <select
          value={(filters as DriverFilters).assigned?.toString() || ''}
          onChange={(e) => handleFilterChange('assigned', e.target.value === '' ? undefined : e.target.value === 'true')}
          className="w-full px-3 py-2 text-sm bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          <option value="">All Drivers</option>
          <option value="true">Assigned to Truck</option>
          <option value="false">Unassigned</option>
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-400 mb-1">License Status</label>
        <select
          value={(filters as DriverFilters).license_expiry || ''}
          onChange={(e) => handleFilterChange('license_expiry', e.target.value)}
          className="w-full px-3 py-2 text-sm bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          <option value="">All</option>
          <option value="expired">Expired</option>
          <option value="expiring">Expiring Soon (30 days)</option>
          <option value="current">Current</option>
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-400 mb-1">Medical Card</label>
        <select
          value={(filters as DriverFilters).medical_card_expiry || ''}
          onChange={(e) => handleFilterChange('medical_card_expiry', e.target.value)}
          className="w-full px-3 py-2 text-sm bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          <option value="">All</option>
          <option value="expired">Expired</option>
          <option value="expiring">Expiring Soon (30 days)</option>
          <option value="current">Current</option>
        </select>
      </div>
    </>
  );

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          <div className="flex-1 min-w-0">
            <input
              type="text"
              placeholder={`Filter by ${entityType} number...`}
              value={filters.search || ''}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
        </div>
        
        <div className="flex items-center space-x-2 ml-4">
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="px-3 py-2 text-sm text-gray-300 hover:text-white transition-colors"
            >
              Clear Filters
            </button>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center px-3 py-2 text-sm text-gray-300 hover:text-white transition-colors"
          >
            <span className="mr-2">Filters</span>
            <svg 
              className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-gray-700">
          {entityType === 'truck' && renderTruckFilters()}
          {entityType === 'trailer' && renderTrailerFilters()}
          {entityType === 'driver' && renderDriverFilters()}
        </div>
      )}
    </div>
  );
}
