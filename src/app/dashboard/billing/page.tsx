'use client';

import { useState, useEffect, useCallback } from 'react';
import { BillingService } from '@/services/billingService';
import { 
  BillingSummary, 
  BillingFilters as BillingFiltersType, 
  BillingTab, 
  LoadReadyForInvoice, 
  InvoiceWithDetails,
  CreateInvoiceData,
  Customer
} from '@/types/billing';
import BillingSummaryCards from '@/components/billing/BillingSummaryCards';
import BillingFilters from '@/components/billing/BillingFilters';
import BillingTable from '@/components/billing/BillingTable';
import CreateInvoiceModal from '@/components/billing/CreateInvoiceModal';

export default function BillingPage() {
  const [activeTab, setActiveTab] = useState<'ready' | 'outstanding' | 'paid'>('ready');
  const [summary, setSummary] = useState<BillingSummary>({
    ready_to_invoice: { count: 0, amount: 0 },
    outstanding_invoices: { count: 0, amount: 0 },
    paid_last_30_days: { count: 0, amount: 0 }
  });
  const [filters, setFilters] = useState<BillingFiltersType>({});
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [tableData, setTableData] = useState<(LoadReadyForInvoice | InvoiceWithDetails)[]>([]);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [createInvoiceModalOpen, setCreateInvoiceModalOpen] = useState(false);
  const [selectedLoadsForInvoice, setSelectedLoadsForInvoice] = useState<LoadReadyForInvoice[]>([]);
  const [createInvoiceLoading, setCreateInvoiceLoading] = useState(false);

  const tabs: BillingTab[] = [
    {
      id: 'ready',
      label: 'Ready for Invoice',
      count: summary.ready_to_invoice.count
    },
    {
      id: 'outstanding',
      label: 'Outstanding',
      count: summary.outstanding_invoices.count
    },
    {
      id: 'paid',
      label: 'Paid',
      count: summary.paid_last_30_days.count
    }
  ];

  // Load summary data
  const loadSummary = useCallback(async () => {
    try {
      setSummaryLoading(true);
      const summaryData = await BillingService.getBillingSummary();
      setSummary(summaryData);
    } catch (error) {
      console.error('Error loading billing summary:', error);
    } finally {
      setSummaryLoading(false);
    }
  }, []);

  // Load table data based on active tab and filters
  const loadTableData = useCallback(async () => {
    try {
      setLoading(true);
      let data: (LoadReadyForInvoice | InvoiceWithDetails)[] = [];

      switch (activeTab) {
        case 'ready':
          data = await BillingService.getLoadsReadyForInvoice(filters);
          break;
        case 'outstanding':
          data = await BillingService.getOutstandingInvoices(filters);
          break;
        case 'paid':
          data = await BillingService.getPaidInvoicesLast30Days(filters);
          break;
      }

      setTableData(data);
      setSelectedItems([]); // Clear selection when data changes
    } catch (error) {
      console.error(`Error loading ${activeTab} data:`, error);
      setTableData([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab, filters]);

  // Load customers for filters
  const loadCustomers = useCallback(async () => {
    try {
      const customersData = await BillingService.getCustomers();
      setCustomers(customersData);
    } catch (error) {
      console.error('Error loading customers:', error);
    }
  }, []);

  // Initial data loading
  useEffect(() => {
    loadSummary();
    loadCustomers();
  }, [loadSummary, loadCustomers]);

  // Reload table data when dependencies change
  useEffect(() => {
    loadTableData();
  }, [activeTab, filters, loadTableData]);

  // Listen for analytics refresh events
  useEffect(() => {
    const handleAnalyticsRefresh = () => {
      loadSummary();
      loadTableData();
    };

    window.addEventListener('analytics-refresh', handleAnalyticsRefresh);
    return () => window.removeEventListener('analytics-refresh', handleAnalyticsRefresh);
  }, [loadSummary, loadTableData]);

  const handleTabChange = (tabId: 'ready' | 'outstanding' | 'paid') => {
    setActiveTab(tabId);
    setSelectedItems([]);
  };

  const handleFiltersChange = (newFilters: BillingFiltersType) => {
    setFilters(newFilters);
    setSelectedItems([]);
  };

  const handleCreateInvoice = (loads: LoadReadyForInvoice[]) => {
    // Group loads by customer
    const customerGroups = loads.reduce((groups, load) => {
      const customerId = load.customer_id;
      if (!groups[customerId]) {
        groups[customerId] = [];
      }
      groups[customerId].push(load);
      return groups;
    }, {} as Record<number, LoadReadyForInvoice[]>);

    // For now, handle only single customer selection
    const customerIds = Object.keys(customerGroups);
    if (customerIds.length > 1) {
      alert('Please select loads from the same customer to create an invoice.');
      return;
    }

    setSelectedLoadsForInvoice(loads);
    setCreateInvoiceModalOpen(true);
  };

  const handleInvoiceSubmit = async (invoiceData: CreateInvoiceData) => {
    try {
      setCreateInvoiceLoading(true);
      await BillingService.createInvoice(invoiceData);
      
      // Close modal and refresh data
      setCreateInvoiceModalOpen(false);
      setSelectedLoadsForInvoice([]);
      setSelectedItems([]);
      
      // Refresh summary and table data
      loadSummary();
      loadTableData();

      // Show success message
      alert('Invoice created successfully!');
    } catch (error) {
      console.error('Error creating invoice:', error);
      alert('Failed to create invoice. Please try again.');
    } finally {
      setCreateInvoiceLoading(false);
    }
  };

  const handleMarkPaid = async (invoice: InvoiceWithDetails) => {
    try {
      await BillingService.markInvoicePaid(invoice.id);
      
      // Refresh data
      loadSummary();
      loadTableData();

      alert('Invoice marked as paid successfully!');
    } catch (error) {
      console.error('Error marking invoice as paid:', error);
      alert('Failed to mark invoice as paid. Please try again.');
    }
  };

  const handleViewInvoice = (invoice: InvoiceWithDetails) => {
    // For now, just show an alert. In a real app, this would open a detailed invoice view
    alert(`Viewing invoice ${invoice.invoice_number || `INV-${invoice.id}`}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Billing Center</h1>
        <p className="text-gray-400 mt-1">
          Manage invoices and track payments for all delivered loads.
        </p>
      </div>

      {/* Summary Cards */}
      <BillingSummaryCards summary={summary} loading={summaryLoading} />

      {/* Tabs */}
      <div className="border-b border-gray-700">
        <nav className="flex space-x-8">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-red-500 text-red-500'
                  : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </nav>
      </div>

      {/* Filters */}
      <BillingFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        customers={customers}
        loading={loading}
      />

      {/* Table */}
      <BillingTable
        activeTab={activeTab}
        data={tableData}
        loading={loading}
        selectedItems={selectedItems}
        onSelectionChange={setSelectedItems}
        onCreateInvoice={handleCreateInvoice}
        onViewInvoice={handleViewInvoice}
        onMarkPaid={handleMarkPaid}
      />

      {/* Create Invoice Modal */}
      <CreateInvoiceModal
        isOpen={createInvoiceModalOpen}
        onClose={() => {
          setCreateInvoiceModalOpen(false);
          setSelectedLoadsForInvoice([]);
        }}
        onSubmit={handleInvoiceSubmit}
        selectedLoads={selectedLoadsForInvoice}
        loading={createInvoiceLoading}
      />
    </div>
  );
}
