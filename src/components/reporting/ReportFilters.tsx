'use client';

import { useState } from 'react';
import { ReportSearchFilters, ReportType, ReportStatus } from '@/types/reports';

interface ReportFiltersProps {
  onFiltersChange: (filters: ReportSearchFilters) => void;
  loading?: boolean;
}

export default function ReportFilters({ onFiltersChange, loading }: ReportFiltersProps) {
  const [filters, setFilters] = useState<ReportSearchFilters>({});

  const reportTypes: { value: ReportType; label: string }[] = [
    { value: 'loads', label: 'Loads' },
    { value: 'carriers', label: 'Carriers' },
    { value: 'fleet', label: 'Fleet' },
    { value: 'customers', label: 'Customers' }
  ];

  const reportStatuses: { value: ReportStatus; label: string }[] = [
    { value: 'pending', label: 'Pending' },
    { value: 'generating', label: 'Generating' },
    { value: 'completed', label: 'Completed' },
    { value: 'failed', label: 'Failed' }
  ];

  const handleFilterChange = (key: keyof ReportSearchFilters, value: string | undefined) => {
    const newFilters = {
      ...filters,
      [key]: value || undefined
    };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const clearFilters = () => {
    const clearedFilters = {};
    setFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== undefined && value !== '');

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 mb-6">
      <div className="flex flex-wrap items-center gap-4">
        {/* Search */}
        <div className="flex-1 min-w-64">
          <label htmlFor="search" className="block text-sm font-medium text-gray-300 mb-1">
            Search Reports
          </label>
          <input
            type="text"
            id="search"
            placeholder="Search by name or description..."
            value={filters.search || ''}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            disabled={loading}
          />
        </div>

        {/* Report Type */}
        <div className="min-w-40">
          <label htmlFor="type" className="block text-sm font-medium text-gray-300 mb-1">
            Report Type
          </label>
          <select
            id="type"
            value={filters.type || ''}
            onChange={(e) => handleFilterChange('type', e.target.value as ReportType)}
            className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            disabled={loading}
          >
            <option value="">All Types</option>
            {reportTypes.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        {/* Status */}
        <div className="min-w-40">
          <label htmlFor="status" className="block text-sm font-medium text-gray-300 mb-1">
            Status
          </label>
          <select
            id="status"
            value={filters.status || ''}
            onChange={(e) => handleFilterChange('status', e.target.value as ReportStatus)}
            className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            disabled={loading}
          >
            <option value="">All Statuses</option>
            {reportStatuses.map(status => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </div>

        {/* Date Range */}
        <div className="min-w-44">
          <label htmlFor="created_from" className="block text-sm font-medium text-gray-300 mb-1">
            Created From
          </label>
          <input
            type="date"
            id="created_from"
            value={filters.created_from || ''}
            onChange={(e) => handleFilterChange('created_from', e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            disabled={loading}
          />
        </div>

        <div className="min-w-44">
          <label htmlFor="created_to" className="block text-sm font-medium text-gray-300 mb-1">
            Created To
          </label>
          <input
            type="date"
            id="created_to"
            value={filters.created_to || ''}
            onChange={(e) => handleFilterChange('created_to', e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            disabled={loading}
          />
        </div>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <div className="flex items-end">
            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-md transition-colors duration-200 flex items-center"
              disabled={loading}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Clear
            </button>
          </div>
        )}
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="text-sm text-gray-400">Active filters:</span>
          {filters.search && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-600 text-red-100">
              Search: {filters.search}
              <button
                onClick={() => handleFilterChange('search', '')}
                className="ml-1.5 h-3 w-3 rounded-full inline-flex items-center justify-center hover:bg-red-500"
              >
                <span className="sr-only">Remove filter</span>
                <svg className="h-2 w-2" fill="currentColor" viewBox="0 0 8 8">
                  <path d="M2.828 2L4 3.172 5.172 2 6 2.828 4.828 4 6 5.172 5.172 6 4 4.828 2.828 6 2 5.172 3.172 4 2 2.828z" />
                </svg>
              </button>
            </span>
          )}
          {filters.type && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-600 text-blue-100">
              Type: {reportTypes.find(t => t.value === filters.type)?.label}
              <button
                onClick={() => handleFilterChange('type', '')}
                className="ml-1.5 h-3 w-3 rounded-full inline-flex items-center justify-center hover:bg-blue-500"
              >
                <span className="sr-only">Remove filter</span>
                <svg className="h-2 w-2" fill="currentColor" viewBox="0 0 8 8">
                  <path d="M2.828 2L4 3.172 5.172 2 6 2.828 4.828 4 6 5.172 5.172 6 4 4.828 2.828 6 2 5.172 3.172 4 2 2.828z" />
                </svg>
              </button>
            </span>
          )}
          {filters.status && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-600 text-green-100">
              Status: {reportStatuses.find(s => s.value === filters.status)?.label}
              <button
                onClick={() => handleFilterChange('status', '')}
                className="ml-1.5 h-3 w-3 rounded-full inline-flex items-center justify-center hover:bg-green-500"
              >
                <span className="sr-only">Remove filter</span>
                <svg className="h-2 w-2" fill="currentColor" viewBox="0 0 8 8">
                  <path d="M2.828 2L4 3.172 5.172 2 6 2.828 4.828 4 6 5.172 5.172 6 4 4.828 2.828 6 2 5.172 3.172 4 2 2.828z" />
                </svg>
              </button>
            </span>
          )}
          {(filters.created_from || filters.created_to) && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-600 text-purple-100">
              Date Range
              <button
                onClick={() => {
                  handleFilterChange('created_from', '');
                  handleFilterChange('created_to', '');
                }}
                className="ml-1.5 h-3 w-3 rounded-full inline-flex items-center justify-center hover:bg-purple-500"
              >
                <span className="sr-only">Remove filter</span>
                <svg className="h-2 w-2" fill="currentColor" viewBox="0 0 8 8">
                  <path d="M2.828 2L4 3.172 5.172 2 6 2.828 4.828 4 6 5.172 5.172 6 4 4.828 2.828 6 2 5.172 3.172 4 2 2.828z" />
                </svg>
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
}
