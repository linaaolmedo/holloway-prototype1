'use client';

import { useState, useEffect } from 'react';
import { CreateInvoiceModalProps, CreateInvoiceData } from '@/types/billing';

export default function CreateInvoiceModal({
  isOpen,
  onClose,
  onSubmit,
  selectedLoads,
  loading = false
}: CreateInvoiceModalProps) {
  const [formData, setFormData] = useState({
    due_date: '',
    notes: ''
  });

  useEffect(() => {
    if (isOpen && selectedLoads.length > 0) {
      // Calculate default due date based on customer payment terms
      const customer = selectedLoads[0]?.customer;
      const paymentTerms = customer?.payment_terms || 30;
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + paymentTerms);
      
      setFormData({
        due_date: dueDate.toISOString().split('T')[0],
        notes: ''
      });
    }
  }, [isOpen, selectedLoads]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedLoads.length === 0) return;

    const invoiceData: CreateInvoiceData = {
      customer_id: selectedLoads[0].customer_id,
      load_ids: selectedLoads.map(load => load.id),
      due_date: formData.due_date || undefined,
      notes: formData.notes || undefined
    };

    onSubmit(invoiceData);
  };

  const formatCurrency = (amount: number | null) => {
    if (amount === null || amount === undefined) return '$0.00';
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

  const totalAmount = selectedLoads.reduce((sum, load) => sum + (load.rate_customer || 0), 0);
  const customer = selectedLoads[0]?.customer;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h3 className="text-lg font-medium text-white">
            Create Invoice
          </h3>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-gray-400 hover:text-white transition-colors disabled:opacity-50"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
            {/* Invoice Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-gray-700 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-gray-300 mb-2">Customer</h4>
                <p className="text-white font-medium">{customer?.name}</p>
                <p className="text-sm text-gray-400">
                  Payment Terms: {customer?.payment_terms ? `Net ${customer.payment_terms}` : 'Net 30'}
                </p>
              </div>
              <div className="bg-gray-700 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-gray-300 mb-2">Invoice Total</h4>
                <p className="text-2xl font-bold text-white">{formatCurrency(totalAmount)}</p>
                <p className="text-sm text-gray-400">
                  {selectedLoads.length} load{selectedLoads.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            {/* Invoice Settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Due Date
                </label>
                <input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
                  disabled={loading}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Invoice notes..."
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  disabled={loading}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                />
              </div>
            </div>

            {/* Load Details */}
            <div className="bg-gray-700 rounded-lg overflow-hidden">
              <div className="p-4 border-b border-gray-600">
                <h4 className="text-sm font-medium text-gray-300">Loads to Invoice</h4>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-600">
                  <thead className="bg-gray-600">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Load ID
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Route
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Delivered On
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-gray-700 divide-y divide-gray-600">
                    {selectedLoads.map(load => (
                      <tr key={load.id}>
                        <td className="px-4 py-3 text-sm text-white font-medium">
                          {load.id}
                        </td>
                        <td className="px-4 py-3 text-sm text-white">
                          <div>
                            <div className="text-xs text-gray-400">From:</div>
                            <div>{load.origin_location?.city}, {load.origin_location?.state}</div>
                            <div className="text-xs text-gray-400 mt-1">To:</div>
                            <div>{load.destination_location?.city}, {load.destination_location?.state}</div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-white">
                          {formatDate(load.delivery_date)}
                        </td>
                        <td className="px-4 py-3 text-sm text-white font-medium">
                          {formatCurrency(load.rate_customer)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-600">
                    <tr>
                      <td colSpan={3} className="px-4 py-3 text-sm font-medium text-white text-right">
                        Total:
                      </td>
                      <td className="px-4 py-3 text-sm font-bold text-white">
                        {formatCurrency(totalAmount)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end space-x-4 p-6 border-t border-gray-700">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-gray-300 hover:text-white transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || selectedLoads.length === 0}
              className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {loading && (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              Create Invoice
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
