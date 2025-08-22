'use client';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { CustomerPortalService } from '@/services/customerPortalService';
import { InvoiceWithDetails, BillingFilters } from '@/types/billing';
import LoadingSpinner from '@/components/auth/LoadingSpinner';

export default function CustomerBillingPage() {
  const { profile } = useAuth();
  const [invoices, setInvoices] = useState<InvoiceWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<BillingFilters>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'outstanding' | 'paid'>('all');

  const fetchInvoices = useCallback(async () => {
    if (!profile?.customer_id) return;

    try {
      setLoading(true);
      const data = await CustomerPortalService.getCustomerInvoices(profile.customer_id, filters);
      setInvoices(data);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  }, [profile?.customer_id, filters]);

  useEffect(() => {
    if (profile?.customer_id) {
      fetchInvoices();
    }
  }, [profile?.customer_id, fetchInvoices]);

  const handleTabChange = (tab: 'all' | 'outstanding' | 'paid') => {
    setActiveTab(tab);
    const newFilters: BillingFilters = { ...filters };
    
    if (tab === 'outstanding') {
      newFilters.is_paid = false;
    } else if (tab === 'paid') {
      newFilters.is_paid = true;
    } else {
      delete newFilters.is_paid;
    }
    
    setFilters(newFilters);
  };

  const handleFilterChange = (key: keyof BillingFilters, value: string | boolean | undefined) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === '' ? undefined : value
    }));
  };

  const handleSearch = () => {
    setFilters(prev => ({
      ...prev,
      invoice_number: searchTerm || undefined
    }));
  };

  const clearFilters = () => {
    setFilters({});
    setSearchTerm('');
    setActiveTab('all');
  };

  const formatCurrency = (amount: number | null) => {
    if (!amount) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const isOverdue = (invoice: InvoiceWithDetails) => {
    if (invoice.is_paid || !invoice.due_date) return false;
    return new Date(invoice.due_date) < new Date();
  };

  const getDaysUntilDue = (invoice: InvoiceWithDetails) => {
    if (invoice.is_paid || !invoice.due_date) return null;
    const dueDate = new Date(invoice.due_date);
    const today = new Date();
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getStatusDisplay = (invoice: InvoiceWithDetails) => {
    if (invoice.is_paid) {
      return (
        <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
          Paid
        </span>
      );
    }

    if (isOverdue(invoice)) {
      return (
        <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
          Overdue
        </span>
      );
    }

    const daysUntilDue = getDaysUntilDue(invoice);
    if (daysUntilDue !== null && daysUntilDue <= 7) {
      return (
        <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
          Due Soon
        </span>
      );
    }

    return (
      <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
        Outstanding
      </span>
    );
  };

  const getTotalAmounts = () => {
    const outstanding = invoices
      .filter(inv => !inv.is_paid)
      .reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
    
    const paid = invoices
      .filter(inv => inv.is_paid)
      .reduce((sum, inv) => sum + (inv.total_amount || 0), 0);

    const overdue = invoices
      .filter(inv => !inv.is_paid && isOverdue(inv))
      .reduce((sum, inv) => sum + (inv.total_amount || 0), 0);

    return { outstanding, paid, overdue };
  };

  const filteredInvoices = () => {
    switch (activeTab) {
      case 'outstanding':
        return invoices.filter(inv => !inv.is_paid);
      case 'paid':
        return invoices.filter(inv => inv.is_paid);
      default:
        return invoices;
    }
  };

  if (!profile || profile.role !== 'Customer') {
    return <div className="text-gray-400">Access denied</div>;
  }

  const { outstanding, paid, overdue } = getTotalAmounts();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Billing & Invoices</h1>
          <p className="text-gray-400">View and manage your invoices and payments</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Outstanding Balance</p>
              <p className="text-3xl font-bold text-red-400">{formatCurrency(outstanding)}</p>
              <p className="text-xs text-gray-500 mt-1">
                {invoices.filter(inv => !inv.is_paid).length} unpaid invoices
              </p>
            </div>
            <div className="p-3 bg-red-600 rounded-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Overdue Amount</p>
              <p className="text-3xl font-bold text-yellow-400">{formatCurrency(overdue)}</p>
              <p className="text-xs text-gray-500 mt-1">
                {invoices.filter(inv => !inv.is_paid && isOverdue(inv)).length} overdue invoices
              </p>
            </div>
            <div className="p-3 bg-yellow-600 rounded-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.99-.833-2.76 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Total Paid</p>
              <p className="text-3xl font-bold text-green-400">{formatCurrency(paid)}</p>
              <p className="text-xs text-gray-500 mt-1">
                {invoices.filter(inv => inv.is_paid).length} paid invoices
              </p>
            </div>
            <div className="p-3 bg-green-600 rounded-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Search Invoice
            </label>
            <div className="flex">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Invoice number..."
                className="flex-1 px-3 py-2 border border-gray-600 rounded-l-lg focus:ring-2 focus:ring-red-500 focus:border-transparent bg-gray-700 text-white placeholder-gray-400"
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <button
                onClick={handleSearch}
                className="px-4 py-2 bg-red-600 text-white rounded-r-lg hover:bg-red-700 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Date From */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Date From
            </label>
            <input
              type="date"
              value={filters.date_from || ''}
              onChange={(e) => handleFilterChange('date_from', e.target.value)}
              className="w-full px-3 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent bg-gray-700 text-white"
            />
          </div>

          {/* Date To */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Date To
            </label>
            <input
              type="date"
              value={filters.date_to || ''}
              onChange={(e) => handleFilterChange('date_to', e.target.value)}
              className="w-full px-3 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent bg-gray-700 text-white"
            />
          </div>

          {/* Clear Filters */}
          <div className="flex items-end">
            <button
              onClick={clearFilters}
              className="w-full px-4 py-2 text-gray-400 hover:text-white border border-gray-600 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        <div className="border-b border-gray-700">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'all', label: 'All Invoices', count: invoices.length },
              { id: 'outstanding', label: 'Outstanding', count: invoices.filter(inv => !inv.is_paid).length },
              { id: 'paid', label: 'Paid', count: invoices.filter(inv => inv.is_paid).length }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id as 'all' | 'outstanding' | 'paid')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-red-500 text-red-400'
                    : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </nav>
        </div>

        {/* Invoices Table */}
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <LoadingSpinner size="lg" />
          </div>
        ) : filteredInvoices().length === 0 ? (
          <div className="text-center p-8">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-300">No invoices found</h3>
            <p className="mt-1 text-sm text-gray-400">
              {Object.keys(filters).length > 0 ? 'Try adjusting your filters' : 'You have no invoices yet'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Invoice
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Date Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Due Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Paid Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-gray-800 divide-y divide-gray-700">
                {filteredInvoices().map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-white">
                        {invoice.invoice_number || `#${invoice.id}`}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-300">{formatDate(invoice.date_created)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-300">
                        {invoice.due_date ? formatDate(invoice.due_date) : 'N/A'}
                      </div>
                      {!invoice.is_paid && invoice.due_date && (
                        <div className="text-xs text-gray-400">
                          {(() => {
                            const days = getDaysUntilDue(invoice);
                            if (days === null) return '';
                            if (days < 0) return `${Math.abs(days)} days overdue`;
                            if (days === 0) return 'Due today';
                            return `${days} days remaining`;
                          })()}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-white">
                        {formatCurrency(invoice.total_amount)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusDisplay(invoice)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-300">
                        {invoice.paid_date ? formatDate(invoice.paid_date) : '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button className="text-red-400 hover:text-red-300 mr-3">
                        View PDF
                      </button>
                      {!invoice.is_paid && (
                        <button className="text-green-400 hover:text-green-300">
                          Pay Now
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
