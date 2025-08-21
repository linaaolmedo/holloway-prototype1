'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface AuditInfoProps {
  createdBy?: string | null;
  updatedBy?: string | null;
  createdAt?: string;
  updatedAt?: string;
  className?: string;
}

interface UserInfo {
  id: string;
  name: string;
}

export default function AuditInfo({ 
  createdBy, 
  updatedBy, 
  createdAt, 
  updatedAt,
  className = ''
}: AuditInfoProps) {
  const [creatorInfo, setCreatorInfo] = useState<UserInfo | null>(null);
  const [updaterInfo, setUpdaterInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchUserInfo = async () => {
      if (!createdBy && !updatedBy) return;
      
      setLoading(true);
      try {
        const userIds = [createdBy, updatedBy].filter(Boolean) as string[];
        
        if (userIds.length > 0) {
          const { data, error } = await supabase
            .from('users')
            .select('id, name')
            .in('id', userIds);

          if (error) {
            console.error('Error fetching user info:', error);
          } else if (data) {
            const creator = data.find(user => user.id === createdBy);
            const updater = data.find(user => user.id === updatedBy);
            
            setCreatorInfo(creator || null);
            setUpdaterInfo(updater || null);
          }
        }
      } catch (error) {
        console.error('Error fetching user info:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserInfo();
  }, [createdBy, updatedBy]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }).format(date);
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className={`text-xs text-gray-500 ${className}`}>
        <div className="animate-pulse">Loading audit info...</div>
      </div>
    );
  }

  const showCreated = createdAt || createdBy;
  const showUpdated = (updatedAt && updatedAt !== createdAt) || (updatedBy && updatedBy !== createdBy);

  if (!showCreated && !showUpdated) {
    return null;
  }

  return (
    <div className={`text-xs text-gray-500 space-y-1 ${className}`}>
      {showCreated && (
        <div className="flex items-center space-x-2">
          <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span>
            Created {formatDate(createdAt)}
            {creatorInfo && (
              <span className="font-medium text-gray-400"> by {creatorInfo.name}</span>
            )}
          </span>
        </div>
      )}
      
      {showUpdated && (
        <div className="flex items-center space-x-2">
          <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          <span>
            Updated {formatDate(updatedAt)}
            {updaterInfo && (
              <span className="font-medium text-gray-400"> by {updaterInfo.name}</span>
            )}
          </span>
        </div>
      )}
    </div>
  );
}
