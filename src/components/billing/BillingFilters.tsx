'use client';

import { useState, useEffect } from 'react';
import { BillingFilters, Customer } from '@/types/billing';

interface BillingFiltersProps {
  filters: BillingFilters;
  onFiltersChange: (filters: BillingFilters) => void;
  customers: Customer[];
  loading?: boolean;
}

export default function BillingFilters({ 
  filters, 
  onFiltersChange, 
  customers, 
  loading 
}: BillingFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [localFilters, setLocalFilters] = useState<BillingFilters>(filters);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      onFiltersChange(localFilters);
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [localFilters]);

  const handleFilterChange = (key: keyof BillingFilters, value: any) => {
    setLocalFilters(prev => ({
      ...prev,
      [key]: value === '' ? undefined : value
    }));
  };

  const clearFilters = () => {
    const clearedFilters: BillingFilters = {};
    setLocalFilters(clearedFilters);
  };

  const hasActiveFilters = Object.values(localFilters).some(value => 
    value !== undefined && value !== null && value !== ''
  );

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4 flex-1">
          <div className="flex-1 min-w-0">
            <input
              type="text"
              placeholder="Search by invoice number, customer..."
              value={localFilters.search || ''}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              disabled={loading}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
            />
          </div>
        </div>
        
        <div className="flex items-center space-x-2 ml-4">
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              disabled={loading}
              className="px-3 py-2 text-sm text-gray-300 hover:text-white transition-colors disabled:opacity-50"
            >
              Clear Filters
            </button>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            disabled={loading}
            className="flex items-center px-3 py-2 text-sm text-gray-300 hover:text-white transition-colors disabled:opacity-50"
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
          {/* Customer Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Customer
            </label>
            <select
              value={localFilters.customer_id || ''}
              onChange={(e) => handleFilterChange('customer_id', e.target.value ? parseInt(e.target.value) : undefined)}
              disabled={loading}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
            >
              <option value="">All Customers</option>
              {customers.map(customer => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </select>
          </div>

          {/* Invoice Number Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Invoice Number
            </label>
            <input
              type="text"
              placeholder="Invoice number..."
              value={localFilters.invoice_number || ''}
              onChange={(e) => handleFilterChange('invoice_number', e.target.value)}
              disabled={loading}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
            />
          </div>

          {/* Date From Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Date From
            </label>
            <input
              type="date"
              value={localFilters.date_from || ''}
              onChange={(e) => handleFilterChange('date_from', e.target.value)}
              disabled={loading}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
            />
          </div>

          {/* Date To Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Date To
            </label>
            <input
              type="date"
              value={localFilters.date_to || ''}
              onChange={(e) => handleFilterChange('date_to', e.target.value)}
              disabled={loading}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
            />
          </div>

          {/* Payment Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Payment Status
            </label>
            <select
              value={localFilters.is_paid === undefined ? '' : localFilters.is_paid.toString()}
              onChange={(e) => {
                const value = e.target.value;
                handleFilterChange('is_paid', value === '' ? undefined : value === 'true');
              }}
              disabled={loading}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
            >
              <option value="">All Statuses</option>
              <option value="false">Outstanding</option>
              <option value="true">Paid</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
}
