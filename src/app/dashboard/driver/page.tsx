'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DriverService } from '@/services/driverService';
import { DriverDashboardData } from '@/types/driver';
import CurrentAssignment from '@/components/driver/CurrentAssignment';
import LoadStatusUpdater from '@/components/driver/LoadStatusUpdater';
import DispatchMessages from '@/components/driver/DispatchMessages';
import ContactDispatchModal from '@/components/driver/ContactDispatchModal';
import LoadingSpinner from '@/components/auth/LoadingSpinner';

export default function DriverDashboard() {
  const { user, profile } = useAuth();
  const [dashboardData, setDashboardData] = useState<DriverDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isContactDispatchOpen, setIsContactDispatchOpen] = useState(false);

  // Load dashboard data
  const loadDashboardData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      const data = await DriverService.getDriverDashboardData(user.id);
      setDashboardData(data);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadDashboardData();
  }, [user]);

  // Handle status updates
  const handleStatusUpdate = async (status: 'In Transit' | 'Delivered') => {
    if (!user || !dashboardData?.currentAssignment) return;

    try {
      const updatedAssignment = await DriverService.updateLoadStatus(
        { load_id: dashboardData.currentAssignment.id, status },
        user.id
      );

      // Update the dashboard data with the new assignment status
      setDashboardData(prev => prev ? {
        ...prev,
        currentAssignment: updatedAssignment
      } : prev);

      // Reload messages to get the automatic status update message
      if (dashboardData.currentAssignment) {
        const updatedMessages = await DriverService.getLoadMessages(dashboardData.currentAssignment.id);
        setDashboardData(prev => prev ? {
          ...prev,
          messages: updatedMessages
        } : prev);
      }
    } catch (err) {
      console.error('Failed to update status:', err);
      throw err; // Re-throw to let the component handle the error display
    }
  };

  // Handle sending messages
  const handleSendMessage = async (message: string) => {
    if (!user || !dashboardData?.currentAssignment) return;

    try {
      const newMessage = await DriverService.sendMessage(
        { load_id: dashboardData.currentAssignment.id, message },
        user.id
      );

      // Add the new message to the list
      setDashboardData(prev => prev ? {
        ...prev,
        messages: [...prev.messages, newMessage]
      } : prev);
    } catch (err) {
      console.error('Failed to send message:', err);
      throw err; // Re-throw to let the component handle the error display
    }
  };

  // Handle contacting dispatch
  const handleContactDispatch = async (message: string, urgency: 'low' | 'medium' | 'high') => {
    if (!user) return;

    try {
      await DriverService.contactDispatch(user.id, message, urgency);
    } catch (err) {
      console.error('Failed to contact dispatch:', err);
      throw err; // Re-throw to let the component handle the error display
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="text-gray-400 mt-4">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="bg-red-900 bg-opacity-20 border border-red-700 rounded-xl p-6 text-center">
        <svg className="w-12 h-12 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.996-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        <h3 className="text-lg font-medium text-red-300 mb-2">Unable to Load Dashboard</h3>
        <p className="text-red-400 mb-4">{error}</p>
        <button
          onClick={loadDashboardData}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Show no driver profile state
  if (!dashboardData?.driverProfile) {
    return (
      <div className="bg-yellow-900 bg-opacity-20 border border-yellow-700 rounded-xl p-6 text-center">
        <svg className="w-12 h-12 text-yellow-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.996-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        <h3 className="text-lg font-medium text-yellow-300 mb-2">Driver Profile Not Found</h3>
        <p className="text-yellow-400">
          Your account is not set up as a driver. Please contact dispatch to set up your driver profile.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gray-800 rounded-xl p-6">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">
              Welcome, {dashboardData.driverProfile.name}
            </h1>
            <p className="text-gray-400">Driver Portal - {profile?.role}</p>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Current Assignment - Full width on mobile, 2 cols on desktop */}
        <div className="xl:col-span-2">
          <CurrentAssignment 
            assignment={dashboardData.currentAssignment}
            loading={loading}
          />
        </div>

        {/* Status Updater */}
        <div>
          <LoadStatusUpdater
            assignment={dashboardData.currentAssignment}
            onStatusUpdate={handleStatusUpdate}
            loading={loading}
          />
        </div>
      </div>

      {/* Messages - Full width */}
      {dashboardData.currentAssignment && (
        <div className="space-y-6">
          <DispatchMessages
            messages={dashboardData.messages}
            onSendMessage={handleSendMessage}
            loading={loading}
            currentUserId={user?.id}
          />
          
          {/* Additional Actions for Drivers with Assignments */}
          <div className="bg-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">Need Help?</h2>
            <button 
              onClick={() => setIsContactDispatchOpen(true)}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg transition-colors flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <span>Contact Dispatch Directly</span>
            </button>
            <p className="text-sm text-gray-400 mt-2">
              Use this for urgent issues or questions not related to your current load
            </p>
          </div>
        </div>
      )}

      {/* Quick Actions for when no assignment */}
      {!dashboardData.currentAssignment && (
        <div className="bg-gray-800 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button 
              onClick={() => setIsContactDispatchOpen(true)}
              className="bg-gray-700 hover:bg-gray-600 text-white p-4 rounded-lg text-left transition-colors"
            >
              <svg className="w-6 h-6 text-blue-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <h3 className="font-medium mb-1">Contact Dispatch</h3>
              <p className="text-sm text-gray-400">Call or message dispatch for your next assignment</p>
            </button>
            
            <button 
              onClick={loadDashboardData}
              className="bg-gray-700 hover:bg-gray-600 text-white p-4 rounded-lg text-left transition-colors"
            >
              <svg className="w-6 h-6 text-green-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <h3 className="font-medium mb-1">Refresh Dashboard</h3>
              <p className="text-sm text-gray-400">Check for new assignments</p>
            </button>
          </div>
        </div>
      )}

      {/* Contact Dispatch Modal */}
      <ContactDispatchModal
        isOpen={isContactDispatchOpen}
        onClose={() => setIsContactDispatchOpen(false)}
        onSendMessage={handleContactDispatch}
        driverName={dashboardData?.driverProfile?.name}
      />
    </div>
  );
}
