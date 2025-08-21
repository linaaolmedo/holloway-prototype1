'use client';

import React, { useState, useEffect } from 'react';
import { RecentAuditActivity } from '@/types/audit';
import { AuditService } from '@/services/auditService';

interface RecentActivityWidgetProps {
  className?: string;
  limit?: number;
  hours?: number;
}

export default function RecentActivityWidget({ 
  className = '',
  limit = 10,
  hours = 24
}: RecentActivityWidgetProps) {
  const [activities, setActivities] = useState<RecentAuditActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecentActivity = async () => {
      try {
        setLoading(true);
        setError(null);
        const activity = await AuditService.getRecentActivity(hours, limit);
        setActivities(activity);
      } catch (err) {
        console.error('Error fetching recent activity:', err);
        setError('Failed to load recent activity');
      } finally {
        setLoading(false);
      }
    };

    fetchRecentActivity();
  }, [hours, limit]);

  const getOperationColor = (operation: string) => {
    switch (operation) {
      case 'INSERT':
        return 'text-green-400';
      case 'UPDATE':
        return 'text-blue-400';
      case 'DELETE':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const getOperationBadge = (operation: string) => {
    const baseClasses = 'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium';
    switch (operation) {
      case 'INSERT':
        return `${baseClasses} bg-green-900 text-green-200`;
      case 'UPDATE':
        return `${baseClasses} bg-blue-900 text-blue-200`;
      case 'DELETE':
        return `${baseClasses} bg-red-900 text-red-200`;
      default:
        return `${baseClasses} bg-gray-900 text-gray-200`;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className={`bg-gray-800 rounded-lg p-6 ${className}`}>
        <h3 className="text-lg font-medium text-white mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse flex items-center space-x-3">
              <div className="w-8 h-8 bg-gray-600 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-600 rounded mb-1"></div>
                <div className="h-3 bg-gray-700 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-gray-800 rounded-lg p-6 ${className}`}>
        <h3 className="text-lg font-medium text-white mb-4">Recent Activity</h3>
        <div className="text-red-400 text-sm">{error}</div>
      </div>
    );
  }

  return (
    <div className={`bg-gray-800 rounded-lg p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-white">Recent Activity</h3>
        <span className="text-sm text-gray-400">Last {hours}h</span>
      </div>

      {activities.length === 0 ? (
        <div className="text-gray-500 text-sm py-4 text-center">
          No recent activity
        </div>
      ) : (
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <span className={getOperationBadge(activity.operation)}>
                  {activity.operation}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-300">
                  <span className="font-medium text-white">
                    {activity.table_display_name}
                  </span>
                  {' '}
                  {activity.change_description}
                </p>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-xs text-gray-400">
                    {activity.user_display_name}
                  </span>
                  <span className="text-xs text-gray-500">•</span>
                  <span className="text-xs text-gray-400">
                    {formatTimestamp(activity.changed_at)}
                  </span>
                  {activity.user_display_role && (
                    <>
                      <span className="text-xs text-gray-500">•</span>
                      <span className="text-xs text-gray-400">
                        {activity.user_display_role}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
