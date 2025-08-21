'use client';

import { BillingSummary } from '@/types/billing';

interface BillingSummaryCardsProps {
  summary: BillingSummary;
  loading?: boolean;
}

export default function BillingSummaryCards({ summary, loading }: BillingSummaryCardsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const cards = [
    {
      title: 'Ready to Invoice',
      amount: summary.ready_to_invoice.amount,
      count: summary.ready_to_invoice.count,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      bgColor: 'bg-blue-600',
      textColor: 'text-blue-100'
    },
    {
      title: 'Outstanding Invoices',
      amount: summary.outstanding_invoices.amount,
      count: summary.outstanding_invoices.count,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      bgColor: 'bg-yellow-600',
      textColor: 'text-yellow-100'
    },
    {
      title: 'Paid (Last 30 Days)',
      amount: summary.paid_last_30_days.amount,
      count: summary.paid_last_30_days.count,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      bgColor: 'bg-green-600',
      textColor: 'text-green-100'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {cards.map((card, index) => (
        <div key={index} className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center">
                <div className={`p-3 rounded-lg ${card.bgColor} ${card.textColor} mr-4`}>
                  {card.icon}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-400 mb-1">
                    {card.title}
                  </p>
                  {loading ? (
                    <div className="space-y-2">
                      <div className="h-8 bg-gray-700 rounded animate-pulse w-24"></div>
                      <div className="h-4 bg-gray-700 rounded animate-pulse w-16"></div>
                    </div>
                  ) : (
                    <>
                      <p className="text-2xl font-bold text-white">
                        {formatCurrency(card.amount)}
                      </p>
                      <p className="text-xs text-gray-400">
                        {card.count} {card.count === 1 ? 'item' : 'items'}
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="ml-4">
              <div className="text-right">
                <div className="text-sm text-gray-400">
                  {card.title === 'Ready to Invoice' && 'Loads'}
                  {card.title === 'Outstanding Invoices' && 'Invoices'}
                  {card.title === 'Paid (Last 30 Days)' && 'Invoices'}
                </div>
                {!loading && (
                  <div className="text-lg font-semibold text-white">
                    {card.count}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
