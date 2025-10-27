"use client";

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { trackPageView } from '@/lib/analytics';

/**
 * Analytics Provider Component
 * 
 * This component automatically tracks page views and manages analytics session
 * Place it in your root layout to enable analytics tracking across the app
 * 
 * Usage in app/layout.tsx:
 * <AnalyticsProvider>
 *   {children}
 * </AnalyticsProvider>
 */
export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Track page view on mount and when route changes
    const pageTitle = document.title;
    const fullPath = searchParams ? `${pathname}?${searchParams.toString()}` : pathname;
    
    trackPageView(fullPath, pageTitle);
  }, [pathname, searchParams]);

  useEffect(() => {
    // Track session start on first mount
    const sessionStart = sessionStorage.getItem('proofound_session_start');
    if (!sessionStart) {
      sessionStorage.setItem('proofound_session_start', new Date().toISOString());
    }

    // Track session end on unmount (page close/refresh)
    const handleBeforeUnload = () => {
      const start = sessionStorage.getItem('proofound_session_start');
      if (start) {
        const sessionDuration = Math.round((Date.now() - new Date(start).getTime()) / 1000);
        
        // Use sendBeacon for reliable tracking on page unload
        if (navigator.sendBeacon) {
          // Note: This would need a dedicated endpoint, but we'll use trackEvent for now
          console.log('Session duration:', sessionDuration, 'seconds');
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  return <>{children}</>;
}

