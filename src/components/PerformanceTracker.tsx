/**
 * Performance Tracker Component
 *
 * Initializes client-side performance monitoring when the app loads.
 * Uses Web Vitals API to track TTI, FCP, LCP, CLS, FID, and custom metrics.
 */

'use client';

import { useEffect } from 'react';
import { initPerformanceTracking } from '@/lib/performance/client-tracker';

export function PerformanceTracker() {
  useEffect(() => {
    // Initialize performance tracking on mount
    initPerformanceTracking();
  }, []);

  // This component doesn't render anything
  return null;
}
