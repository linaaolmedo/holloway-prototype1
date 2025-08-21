'use client';


import { BillingTableProps, LoadReadyForInvoice, InvoiceWithDetails } from '@/types/billing';

export default function BillingTable({
  activeTab,
  data,
  loading = false,
  selectedItems,
  onSelectionChange,
  onCreateInvoice,
  onViewInvoice,
  onMarkPaid
}: BillingTableProps) {


  const formatCurrency = (amount: number | null) => {
    if (amount === null || amount === undefined) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const calculateAgingDays = (deliveryDate: string | null, dueDate?: string | null) => {
    if (!deliveryDate && !dueDate) return 0;
    const referenceDate = dueDate || deliveryDate;
    if (!referenceDate) return 0;
    
    const now = new Date();
    const date = new Date(referenceDate);
    return Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  };

  const getAgingColor = (days: number) => {
    if (days <= 30) return 'text-green-400';
    if (days <= 60) return 'text-yellow-400';
    return 'text-red-400';
  };



  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = data.map(item => item.id);
      onSelectionChange(allIds);
    } else {
      onSelectionChange([]);
    }
  };

  const handleSelectItem = (itemId: number, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedItems, itemId]);
    } else {
      onSelectionChange(selectedItems.filter(id => id !== itemId));
    }
  };

  const isAllSelected = data.length > 0 && selectedItems.length === data.length;
  const isSomeSelected = selectedItems.length > 0 && selectedItems.length < data.length;

  const renderTableHeader = () => {
    if (activeTab === 'ready') {
      return (
        <tr className="border-b border-gray-700">
          <th className="px-6 py-3 text-left">
            <input
              type="checkbox"
              checked={isAllSelected}
              ref={(el) => {
                if (el) el.indeterminate = isSomeSelected;
              }}
              onChange={(e) => handleSelectAll(e.target.checked)}
              className="rounded border-gray-600 bg-gray-700 text-red-600 focus:ring-red-500"
            />
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
            Load ID
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
            Customer
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
            Delivered On
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
            Aging
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
            Amount
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
            Billing Status
          </th>
        </tr>
      );
    } else {
      return (
        <tr className="border-b border-gray-700">
          <th className="px-6 py-3 text-left">
            <input
              type="checkbox"
              checked={isAllSelected}
              ref={(el) => {
                if (el) el.indeterminate = isSomeSelected;
              }}
              onChange={(e) => handleSelectAll(e.target.checked)}
              className="rounded border-gray-600 bg-gray-700 text-red-600 focus:ring-red-500"
            />
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
            Invoice #
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
            Customer
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
            Actions
          </th>
        </tr>
      );
    }
  };

  const renderReadyForInvoiceRow = (load: LoadReadyForInvoice) => {
    const agingDays = load.days_since_delivery;
    const isSelected = selectedItems.includes(load.id);

    return (
      <tr key={load.id} className="border-b border-gray-700 hover:bg-gray-750">
        <td className="px-6 py-4">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => handleSelectItem(load.id, e.target.checked)}
            className="rounded border-gray-600 bg-gray-700 text-red-600 focus:ring-red-500"
          />
        </td>
        <td className="px-6 py-4 text-sm text-white font-medium">
          {load.id}
        </td>
        <td className="px-6 py-4 text-sm text-white">
          {load.customer?.name || 'Unknown Customer'}
        </td>
        <td className="px-6 py-4 text-sm text-white">
          {formatDate(load.delivery_date)}
        </td>
        <td className="px-6 py-4 text-sm">
          <span className={getAgingColor(agingDays)}>
            {agingDays} days
          </span>
        </td>
        <td className="px-6 py-4 text-sm text-white font-medium">
          {formatCurrency(load.rate_customer)}
        </td>
        <td className="px-6 py-4">
          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-900 text-blue-100">
            Ready to Invoice
          </span>
        </td>
      </tr>
    );
  };

  const renderInvoiceRow = (invoice: InvoiceWithDetails) => {
    const isSelected = selectedItems.includes(invoice.id);
    const agingDays = calculateAgingDays(null, invoice.due_date);

    return (
      <tr key={invoice.id} className="border-b border-gray-700 hover:bg-gray-750">
        <td className="px-6 py-4">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => handleSelectItem(invoice.id, e.target.checked)}
            className="rounded border-gray-600 bg-gray-700 text-red-600 focus:ring-red-500"
          />
        </td>
        <td className="px-6 py-4 text-sm text-white font-medium">
          {invoice.invoice_number || `INV-${invoice.id}`}
        </td>
        <td className="px-6 py-4 text-sm text-white">
          {invoice.customer?.name || 'Unknown Customer'}
        </td>
        <td className="px-6 py-4 text-sm text-white">
          {formatDate(invoice.date_created)}
        </td>
        <td className="px-6 py-4 text-sm text-white">
          {formatDate(invoice.due_date)}
        </td>
        <td className="px-6 py-4 text-sm text-white font-medium">
          {formatCurrency(invoice.total_amount)}
        </td>
        <td className="px-6 py-4">
          {invoice.is_paid ? (
            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-900 text-green-100">
              Paid
            </span>
          ) : (
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
              agingDays > 30 ? 'bg-red-900 text-red-100' : 'bg-yellow-900 text-yellow-100'
            }`}>
              {agingDays > 30 ? 'Overdue' : 'Outstanding'}
            </span>
          )}
        </td>
        <td className="px-6 py-4 text-sm">
          <div className="flex space-x-2">
            <button
              onClick={() => onViewInvoice?.(invoice)}
              className="text-blue-400 hover:text-blue-300 transition-colors"
              title="View Invoice"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </button>
            {!invoice.is_paid && (
              <button
                onClick={() => onMarkPaid?.(invoice)}
                className="text-green-400 hover:text-green-300 transition-colors"
                title="Mark as Paid"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </button>
            )}
          </div>
        </td>
      </tr>
    );
  };

  if (loading) {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-lg">
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto"></div>
          <p className="text-gray-400 mt-4">Loading billing data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
      {/* Action Bar */}
      {selectedItems.length > 0 && activeTab === 'ready' && (
        <div className="bg-gray-700 px-6 py-3 border-b border-gray-600">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-300">
              {selectedItems.length} load{selectedItems.length !== 1 ? 's' : ''} selected
            </span>
            <button
              onClick={() => {
                const selectedLoads = data.filter(item => 
                  selectedItems.includes(item.id)
                ) as LoadReadyForInvoice[];
                onCreateInvoice?.(selectedLoads);
              }}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-md transition-colors"
            >
              Create Invoice ({selectedItems.length})
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-700">
          <thead className="bg-gray-700">
            {renderTableHeader()}
          </thead>
          <tbody className="bg-gray-800 divide-y divide-gray-700">
            {data.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-gray-400">
                  No results found
                </td>
              </tr>
            ) : (
              data.map(item => {
                if (activeTab === 'ready') {
                  return renderReadyForInvoiceRow(item as LoadReadyForInvoice);
                } else {
                  return renderInvoiceRow(item as InvoiceWithDetails);
                }
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="bg-gray-700 px-6 py-3 border-t border-gray-600">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-300">
            {data.length === 0 ? '0' : '1'} of {data.length} row{data.length !== 1 ? 's' : ''} selected
          </div>
          <div className="flex items-center space-x-2">
            <button
              disabled
              className="px-3 py-1 text-sm text-gray-500 bg-gray-600 rounded cursor-not-allowed"
            >
              Previous
            </button>
            <button
              disabled
              className="px-3 py-1 text-sm text-gray-500 bg-gray-600 rounded cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
