'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { NotificationService, NotificationData } from '@/services/notificationService';
import { formatDistanceToNow } from 'date-fns';

interface RecentNotificationsWidgetProps {
  limit?: number;
  className?: string;
}

export default function RecentNotificationsWidget({ 
  limit = 5, 
  className = '' 
}: RecentNotificationsWidgetProps) {
  const { profile } = useAuth();
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.id) {
      fetchNotifications();
    }
  }, [profile?.id, limit]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchNotifications = async () => {
    if (!profile?.id) return;

    try {
      setLoading(true);
      const data = await NotificationService.getUserNotifications(profile.id, limit);
      setNotifications(data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: number) => {
    try {
      await NotificationService.markAsRead(notificationId);
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId ? { ...notif, read: true } : notif
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'new_shipment_request':
        return (
          <div className="p-2 bg-blue-600 rounded-lg">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
        );
      case 'load_update':
        return (
          <div className="p-2 bg-green-600 rounded-lg">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      case 'invoice_created':
        return (
          <div className="p-2 bg-yellow-600 rounded-lg">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        );
      case 'new_bid':
        return (
          <div className="p-2 bg-red-600 rounded-lg">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      case 'delivery_completed':
        return (
          <div className="p-2 bg-green-600 rounded-lg">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8a2 2 0 012-2h10a2 2 0 012 2v10a2 2 0 01-2 2H7a2 2 0 01-2-2V8zm2 2h10m-5 5l-3-3m0 0l1.5-1.5M9 12l1.5-1.5" />
            </svg>
          </div>
        );
      case 'driver_message':
        return (
          <div className="p-2 bg-purple-600 rounded-lg">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="p-2 bg-gray-600 rounded-lg">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
            </svg>
          </div>
        );
    }
  };

  const handleNotificationClick = (notification: NotificationData) => {
    if (!notification.read && notification.id) {
      handleMarkAsRead(notification.id);
    }

    // Handle navigation based on notification type
    if (notification.type === 'new_shipment_request' && notification.data?.load_id) {
      window.location.href = `/dashboard/loads/${notification.data.load_id}`;
    } else if (notification.type === 'new_bid' && notification.data?.load_id) {
      window.location.href = `/dashboard/loads/${notification.data.load_id}`;
    } else if (notification.type === 'load_update' && notification.data?.load_id) {
      window.location.href = `/dashboard/loads/${notification.data.load_id}`;
    } else if (notification.type === 'delivery_completed' && notification.data?.load_id) {
      window.location.href = `/dashboard/loads/${notification.data.load_id}`;
    } else if (notification.type === 'driver_message' && notification.data?.load_id) {
      window.location.href = `/dashboard/loads/${notification.data.load_id}`;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'new_shipment_request':
        return 'New Shipment Request';
      case 'load_update':
        return 'Load Update';
      case 'invoice_created':
        return 'Invoice Created';
      case 'payment_received':
        return 'Payment Received';
      case 'new_bid':
        return 'New Bid';
      case 'bid_accepted':
        return 'Bid Accepted';
      case 'bid_rejected':
        return 'Bid Rejected';
      case 'delivery_completed':
        return 'Delivery Completed';
      case 'driver_message':
        return 'Driver Message';
      default:
        return 'Notification';
    }
  };

  if (loading) {
    return (
      <div className={`bg-gray-800 rounded-lg p-6 border border-gray-700 ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Recent Notifications</h3>
        </div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center space-x-3 animate-pulse">
              <div className="w-10 h-10 bg-gray-600 rounded-lg"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-600 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-600 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gray-800 rounded-lg p-6 border border-gray-700 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Recent Notifications</h3>
        {notifications.length > 0 && (
          <span className="text-sm text-gray-400">
            {notifications.filter(n => !n.read).length} unread
          </span>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-8">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
          </svg>
          <h4 className="mt-2 text-sm font-medium text-gray-300">No notifications</h4>
          <p className="mt-1 text-sm text-gray-400">You&apos;re all caught up!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              onClick={() => handleNotificationClick(notification)}
              className={`flex items-start space-x-3 p-3 rounded-lg cursor-pointer transition-colors ${
                !notification.read 
                  ? 'bg-gray-700 hover:bg-gray-600' 
                  : 'hover:bg-gray-700'
              }`}
            >
              {getNotificationIcon(notification.type)}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className={`text-sm font-medium ${
                    !notification.read ? 'text-white' : 'text-gray-300'
                  }`}>
                    {getTypeLabel(notification.type)}
                  </p>
                  <div className="flex items-center space-x-2">
                    {!notification.read && (
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    )}
                    <span className="text-xs text-gray-500">
                      {notification.created_at && formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-gray-400 mt-1 line-clamp-2">
                  {notification.message}
                </p>
                {(notification.data as { customer_name?: string })?.customer_name && (
                  <p className="text-xs text-gray-500 mt-1">
                    Customer: {(notification.data as { customer_name: string }).customer_name}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {notifications.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-700">
          <button 
            onClick={() => {
              // Could navigate to a full notifications page or open notification dropdown
            }}
            className="w-full text-center text-sm text-red-400 hover:text-red-300 transition-colors"
          >
            View all notifications
          </button>
        </div>
      )}
    </div>
  );
}
