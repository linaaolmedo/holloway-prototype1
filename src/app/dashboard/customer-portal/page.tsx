'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import CustomerPortalDashboard from '@/components/customers/CustomerPortalDashboard';
import NewShipmentRequestForm from '@/components/customers/NewShipmentRequestForm';
import { CustomerPortalService, CustomerShipmentRequest } from '@/services/customerPortalService';
import { useRouter } from 'next/navigation';

export default function CustomerPortalPage() {
  const { profile } = useAuth();
  const router = useRouter();
  const [showNewShipmentForm, setShowNewShipmentForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Redirect if not a customer
  if (profile && profile.role !== 'Customer') {
    router.push('/dashboard');
    return null;
  }

  const handleNewShipmentClick = () => {
    setShowNewShipmentForm(true);
  };

  const handleCancelNewShipment = () => {
    setShowNewShipmentForm(false);
  };

  const handleSubmitNewShipment = async (data: CustomerShipmentRequest) => {
    if (!profile?.customer_id) return;

    try {
      setLoading(true);
      await CustomerPortalService.createShipmentRequest(profile.customer_id, data);
      
      setNotification({
        type: 'success',
        message: 'Shipment request submitted successfully! Our dispatch team will review and assign a carrier soon.'
      });
      
      setShowNewShipmentForm(false);
      
      // Auto-hide notification after 5 seconds
      setTimeout(() => setNotification(null), 5000);
    } catch (error) {
      console.error('Error creating shipment request:', error);
      setNotification({
        type: 'error',
        message: 'Failed to submit shipment request. Please try again.'
      });
      
      // Auto-hide notification after 5 seconds
      setTimeout(() => setNotification(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Notification */}
      {notification && (
        <div className={`p-4 rounded-lg flex items-center justify-between ${
          notification.type === 'success' 
            ? 'bg-green-900 bg-opacity-20 border border-green-700' 
            : 'bg-red-900 bg-opacity-20 border border-red-700'
        }`}>
          <div className="flex items-center space-x-3">
            {notification.type === 'success' ? (
              <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.99-.833-2.76 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            )}
            <p className={notification.type === 'success' ? 'text-green-300' : 'text-red-300'}>
              {notification.message}
            </p>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Main Content */}
      {showNewShipmentForm ? (
        <NewShipmentRequestForm
          onSubmit={handleSubmitNewShipment}
          onCancel={handleCancelNewShipment}
          loading={loading}
        />
      ) : (
        <CustomerPortalDashboard onNewShipmentClick={handleNewShipmentClick} />
      )}
    </div>
  );
}