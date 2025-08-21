'use client';

import { createContext, useContext, ReactNode } from 'react';

interface AnalyticsContextType {
  triggerRefresh: () => void;
}

const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined);

interface AnalyticsProviderProps {
  children: ReactNode;
  onRefresh?: () => void;
}

export function AnalyticsProvider({ children, onRefresh }: AnalyticsProviderProps) {
  const triggerRefresh = () => {
    if (onRefresh) {
      onRefresh();
    }
    // Also dispatch a custom event for any analytics components listening
    window.dispatchEvent(new CustomEvent('analytics-refresh'));
  };

  return (
    <AnalyticsContext.Provider value={{ triggerRefresh }}>
      {children}
    </AnalyticsContext.Provider>
  );
}

export function useAnalytics() {
  const context = useContext(AnalyticsContext);
  if (!context) {
    // Return a no-op function if not within provider
    return { triggerRefresh: () => {} };
  }
  return context;
}

// Hook for analytics components to listen for global refresh events
export function useAnalyticsRefresh(callback: () => void) {
  const handleRefresh = () => callback();

  if (typeof window !== 'undefined') {
    window.addEventListener('analytics-refresh', handleRefresh);
    
    // Cleanup on unmount
    return () => {
      window.removeEventListener('analytics-refresh', handleRefresh);
    };
  }
  
  return () => {};
}
