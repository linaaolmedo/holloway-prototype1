'use client';

/**
 * Hook to trigger analytics refresh from anywhere in the app
 * Use this in forms/components when they create/update/delete data
 * that should trigger analytics to refresh
 */
export function useAnalyticsRefresh() {
  const triggerRefresh = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('analytics-refresh'));
    }
  };

  return { triggerAnalyticsRefresh: triggerRefresh };
}
