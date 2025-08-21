'use client';

import { useState, useEffect } from 'react';
import { CustomerFilters, PAYMENT_TERMS_OPTIONS, US_STATES } from '@/types/customers';

interface CustomersFiltersProps {
  onFiltersChange: (filters: CustomerFilters) => void;
  loading?: boolean;
}

export default function CustomersFilters({ onFiltersChange, loading }: CustomersFiltersProps) {
  const [filters, setFilters] = useState<CustomerFilters>({
    search: '',
    payment_terms: null,
    consolidated_invoicing: null,
    has_credit_limit: null,
    state: ''
  });

  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      onFiltersChange(filters);
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [filters]);

  const handleFilterChange = (key: keyof CustomerFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === '' ? null : value
    }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      payment_terms: null,
      consolidated_invoicing: null,
      has_credit_limit: null,
      state: ''
    });
  };

  const hasActiveFilters = Object.values(filters).some(value => 
    value !== null && value !== '' && value !== undefined
  );

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 mb-6">
      <div className="flex flex-col space-y-4">
        {/* Primary Search */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by customer name, contact person, or email..."
              value={filters.search || ''}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              disabled={loading}
            />
          </div>
          
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className={`px-4 py-2 rounded-md transition-colors ${
                showAdvanced 
                  ? 'bg-red-600 text-white hover:bg-red-700' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'
              }`}
            >
              Advanced
              <svg 
                className={`w-4 h-4 ml-2 inline-block transition-transform ${showAdvanced ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="px-4 py-2 bg-gray-700 text-gray-300 rounded-md hover:bg-gray-600 hover:text-white transition-colors"
                title="Clear all filters"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Advanced Filters */}
        {showAdvanced && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-gray-700">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Payment Terms
              </label>
              <select
                value={filters.payment_terms || ''}
                onChange={(e) => handleFilterChange('payment_terms', e.target.value ? Number(e.target.value) : null)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                disabled={loading}
              >
                <option value="">All Terms</option>
                {PAYMENT_TERMS_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Invoicing Type
              </label>
              <select
                value={filters.consolidated_invoicing === null ? '' : filters.consolidated_invoicing.toString()}
                onChange={(e) => handleFilterChange('consolidated_invoicing', e.target.value === '' ? null : e.target.value === 'true')}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                disabled={loading}
              >
                <option value="">All Types</option>
                <option value="true">Consolidated</option>
                <option value="false">Individual</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Credit Limit
              </label>
              <select
                value={filters.has_credit_limit === null ? '' : filters.has_credit_limit.toString()}
                onChange={(e) => handleFilterChange('has_credit_limit', e.target.value === '' ? null : e.target.value === 'true')}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                disabled={loading}
              >
                <option value="">All Customers</option>
                <option value="true">With Credit Limit</option>
                <option value="false">No Credit Limit</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                State
              </label>
              <select
                value={filters.state || ''}
                onChange={(e) => handleFilterChange('state', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                disabled={loading}
              >
                <option value="">All States</option>
                {US_STATES.map(state => (
                  <option key={state.code} value={state.code}>
                    {state.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Active Filters Summary */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-700">
            <span className="text-sm text-gray-400">Active filters:</span>
            {filters.search && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-600 text-red-100">
                Search: "{filters.search}"
                <button
                  onClick={() => handleFilterChange('search', '')}
                  className="ml-1 hover:text-red-200"
                >
                  ×
                </button>
              </span>
            )}
            {filters.payment_terms !== null && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-600 text-red-100">
                Terms: {PAYMENT_TERMS_OPTIONS.find(opt => opt.value === filters.payment_terms)?.label}
                <button
                  onClick={() => handleFilterChange('payment_terms', null)}
                  className="ml-1 hover:text-red-200"
                >
                  ×
                </button>
              </span>
            )}
            {filters.consolidated_invoicing !== null && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-600 text-red-100">
                Invoicing: {filters.consolidated_invoicing ? 'Consolidated' : 'Individual'}
                <button
                  onClick={() => handleFilterChange('consolidated_invoicing', null)}
                  className="ml-1 hover:text-red-200"
                >
                  ×
                </button>
              </span>
            )}
            {filters.has_credit_limit !== null && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-600 text-red-100">
                Credit: {filters.has_credit_limit ? 'With Limit' : 'No Limit'}
                <button
                  onClick={() => handleFilterChange('has_credit_limit', null)}
                  className="ml-1 hover:text-red-200"
                >
                  ×
                </button>
              </span>
            )}
            {filters.state && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-600 text-red-100">
                State: {US_STATES.find(state => state.code === filters.state)?.name}
                <button
                  onClick={() => handleFilterChange('state', '')}
                  className="ml-1 hover:text-red-200"
                >
                  ×
                </button>
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
