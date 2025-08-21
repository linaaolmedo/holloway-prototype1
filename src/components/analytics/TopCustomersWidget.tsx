'use client';

import { TopCustomer } from '@/types/analytics';

interface TopCustomersWidgetProps {
  data: TopCustomer[];
  loading?: boolean;
}

export default function TopCustomersWidget({ data, loading = false }: TopCustomersWidgetProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Customers</h3>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex justify-between items-center">
              <div className="space-y-1">
                <div className="h-4 bg-gray-200 rounded animate-pulse w-32"></div>
                <div className="h-3 bg-gray-100 rounded animate-pulse w-20"></div>
              </div>
              <div className="h-4 bg-gray-200 rounded animate-pulse w-24"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Customers</h3>
      <div className="space-y-4">
        {data.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No customer data available</p>
        ) : (
          data.map((customer, index) => (
            <div key={customer.customer_id} className="flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-blue-800">
                    {index + 1}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {customer.customer_name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {customer.load_count} loads
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900">
                  {formatCurrency(customer.total_revenue)}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
