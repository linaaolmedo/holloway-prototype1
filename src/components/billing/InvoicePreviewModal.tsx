'use client';

import { useState } from 'react';
import { InvoiceWithDetails } from '@/types/billing';
import { BillingService } from '@/services/billingService';

interface InvoicePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: InvoiceWithDetails | null;
  onDownloadPDF?: (invoice: InvoiceWithDetails) => void;
  isDownloading?: boolean;
}

export default function InvoicePreviewModal({ 
  isOpen, 
  onClose, 
  invoice,
  onDownloadPDF,
  isDownloading = false 
}: InvoicePreviewModalProps) {
  if (!isOpen || !invoice) return null;

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleDownloadClick = () => {
    if (onDownloadPDF) {
      onDownloadPDF(invoice);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gray-50">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Invoice Preview</h2>
            <p className="text-gray-600 mt-1">
              {invoice.invoice_number || `INV-${invoice.id}`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {onDownloadPDF && (
              <button
                onClick={handleDownloadClick}
                disabled={isDownloading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {isDownloading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                    Downloading...
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Download PDF
                  </>
                )}
              </button>
            )}
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Invoice Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="bg-white p-8" style={{ fontFamily: 'Arial, sans-serif' }}>
            {/* Company Header */}
            <div className="flex justify-between items-start mb-8">
              <div>
                <h1 className="text-3xl font-bold text-red-500 mb-2">Holloway Logistics</h1>
                <p className="text-gray-600">Transportation Management System</p>
                <p className="text-gray-600">Phone: (555) 123-4567</p>
                <p className="text-gray-600">Email: billing@hollowaylogistics.com</p>
              </div>
              <div className="text-right">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">INVOICE</h2>
                <div className="space-y-1">
                  <p><span className="font-semibold">Invoice #:</span> {invoice.invoice_number || `INV-${invoice.id}`}</p>
                  <p><span className="font-semibold">Date:</span> {formatDate(invoice.date_created)}</p>
                  <p><span className="font-semibold">Due Date:</span> {invoice.due_date ? formatDate(invoice.due_date) : 'N/A'}</p>
                  <div className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                    invoice.is_paid 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-orange-100 text-orange-800'
                  }`}>
                    {invoice.is_paid ? 'PAID' : 'OUTSTANDING'}
                  </div>
                </div>
              </div>
            </div>

            {/* Bill To & Payment Terms */}
            <div className="grid grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="text-lg font-semibold text-red-500 mb-3">Bill To:</h3>
                <div className="text-gray-800">
                  <p className="font-semibold">{invoice.customer?.name || 'Unknown Customer'}</p>
                  <p>Email: {invoice.customer?.email || 'N/A'}</p>
                  <p>Phone: {invoice.customer?.phone || 'N/A'}</p>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-red-500 mb-3">Payment Terms:</h3>
                <div className="text-gray-800">
                  <p>Net 30 days</p>
                  <p className="font-semibold">Total: {formatCurrency(invoice.total_amount)}</p>
                </div>
              </div>
            </div>

            {/* Loads Table */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-red-500 mb-4">Loads:</h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Load ID</th>
                      <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Commodity</th>
                      <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Origin</th>
                      <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Destination</th>
                      <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Delivery</th>
                      <th className="border border-gray-300 px-4 py-2 text-right font-semibold">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.loads && invoice.loads.length > 0 ? (
                      invoice.loads.map((load) => (
                        <tr key={load.id} className="hover:bg-gray-50">
                          <td className="border border-gray-300 px-4 py-2">{load.id}</td>
                          <td className="border border-gray-300 px-4 py-2">{load.commodity || 'N/A'}</td>
                          <td className="border border-gray-300 px-4 py-2">{load.pickup_location || 'N/A'}</td>
                          <td className="border border-gray-300 px-4 py-2">{load.delivery_location || 'N/A'}</td>
                          <td className="border border-gray-300 px-4 py-2">
                            {load.delivery_date ? formatDate(load.delivery_date) : 'N/A'}
                          </td>
                          <td className="border border-gray-300 px-4 py-2 text-right font-semibold">
                            {formatCurrency(load.rate)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="border border-gray-300 px-4 py-4 text-center text-gray-500">
                          No loads associated with this invoice
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Totals */}
            <div className="flex justify-end mb-8">
              <div className="w-64 space-y-2">
                <div className="flex justify-between py-2">
                  <span className="font-semibold">Subtotal:</span>
                  <span>{formatCurrency(invoice.total_amount)}</span>
                </div>
                <div className="border-t pt-2">
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total:</span>
                    <span>{formatCurrency(invoice.total_amount)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Instructions */}
            <div className="border-t pt-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Payment Instructions:</h3>
              <p className="text-sm text-gray-600">
                Please remit payment within 30 days of invoice date. Include invoice number on payment.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
