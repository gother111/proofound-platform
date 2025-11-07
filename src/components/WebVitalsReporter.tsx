/**
 * Web Vitals Reporter Component
 *
 * Client-side component that initializes web vitals tracking.
 * Must be mounted in the root layout.
 */

'use client';

import { useEffect } from 'react';
import { reportWebVitals } from '@/lib/analytics/web-vitals';

export function WebVitalsReporter() {
  useEffect(() => {
    reportWebVitals();
  }, []);

  return null; // No UI, just side effects
}
