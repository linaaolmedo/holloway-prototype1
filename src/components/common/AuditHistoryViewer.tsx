'use client';

import React, { useState, useEffect } from 'react';
import { AuditHistoryEntry } from '@/types/audit';
import { AuditService } from '@/services/auditService';

interface AuditHistoryViewerProps {
  tableName: string;
  recordId: string;
  className?: string;
}

export default function AuditHistoryViewer({ 
  tableName, 
  recordId, 
  className = '' 
}: AuditHistoryViewerProps) {
  const [auditHistory, setAuditHistory] = useState<AuditHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const fetchAuditHistory = async () => {
      try {
        setLoading(true);
        setError(null);
        const history = await AuditService.getAuditHistory(tableName, recordId);
        setAuditHistory(history);
      } catch (err) {
        console.error('Error fetching audit history:', err);
        setError('Failed to load audit history');
      } finally {
        setLoading(false);
      }
    };

    if (tableName && recordId) {
      fetchAuditHistory();
    }
  }, [tableName, recordId]);

  const getOperationIcon = (operation: string) => {
    switch (operation) {
      case 'INSERT':
        return (
          <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center">
            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
        );
      case 'UPDATE':
        return (
          <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v10a2 2 0 002 2h5m-5-6a2 2 0 002-2v-2a2 2 0 00-2-2H6m5 6v6a2 2 0 002 2h2a2 2 0 002-2v-6a2 2 0 00-2-2h-2z" />
            </svg>
          </div>
        );
      case 'DELETE':
        return (
          <div className="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center">
            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-6 h-6 bg-gray-600 rounded-full flex items-center justify-center">
            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className={`${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-600 rounded mb-2"></div>
          <div className="h-3 bg-gray-700 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-red-400 text-sm ${className}`}>
        {error}
      </div>
    );
  }

  if (auditHistory.length === 0) {
    return (
      <div className={`text-gray-500 text-sm ${className}`}>
        No audit history available
      </div>
    );
  }

  const visibleHistory = expanded ? auditHistory : auditHistory.slice(0, 3);

  return (
    <div className={className}>
      <div className="space-y-3">
        {visibleHistory.map((entry) => (
          <div key={entry.id} className="flex items-start space-x-3">
            {getOperationIcon(entry.operation)}
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-300">
                {entry.change_description}
              </p>
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-xs text-gray-500">
                  {entry.user_display_name}
                </span>
                <span className="text-xs text-gray-600">•</span>
                <span className="text-xs text-gray-500">
                  {formatTimestamp(entry.changed_at)}
                </span>
                {entry.user_display_role && (
                  <>
                    <span className="text-xs text-gray-600">•</span>
                    <span className="text-xs text-gray-500">
                      {entry.user_display_role}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {auditHistory.length > 3 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-3 text-xs text-blue-400 hover:text-blue-300 transition-colors"
        >
          {expanded 
            ? `Hide ${auditHistory.length - 3} older entries` 
            : `Show ${auditHistory.length - 3} more entries`
          }
        </button>
      )}
    </div>
  );
}
