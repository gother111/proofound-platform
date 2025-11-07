/**
 * Dashboard Load Time Tracking Hook
 *
 * Tracks and reports dashboard load performance
 * PRD Reference: Part 8 NFR - Dashboard load time <2s
 */

'use client';

import { useEffect, useRef } from 'react';
import { log } from '@/lib/log';

interface DashboardLoadMetrics {
  dashboardType: 'individual' | 'organization' | 'admin';
  tileCount?: number;
  dataFetchTimeMs?: number;
  renderTimeMs?: number;
}

export function useDashboardLoadTime(metrics: DashboardLoadMetrics) {
  const startTimeRef = useRef<number>(0);
  const hasReportedRef = useRef(false);

  useEffect(() => {
    // Record start time on mount
    startTimeRef.current = performance.now();

    return () => {
      // Report on unmount
      if (!hasReportedRef.current && startTimeRef.current > 0) {
        const loadTimeMs = Math.round(performance.now() - startTimeRef.current);
        reportDashboardLoadTime({
          ...metrics,
          loadTimeMs,
        });
        hasReportedRef.current = true;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Manual trigger for when dashboard is fully loaded
  const reportComplete = (additionalMetrics?: Partial<DashboardLoadMetrics>) => {
    if (hasReportedRef.current) return;

    const loadTimeMs = Math.round(performance.now() - startTimeRef.current);
    reportDashboardLoadTime({
      ...metrics,
      ...additionalMetrics,
      loadTimeMs,
    });
    hasReportedRef.current = true;
  };

  return { reportComplete };
}

async function reportDashboardLoadTime(metrics: DashboardLoadMetrics & { loadTimeMs: number }) {
  try {
    // Log if load time exceeds 2s threshold
    if (metrics.loadTimeMs > 2000) {
      log.warn('dashboard.load_time.slow', {
        type: metrics.dashboardType,
        loadTime: metrics.loadTimeMs,
        tileCount: metrics.tileCount,
      });
    }

    // Send to backend
    await fetch('/api/analytics/dashboard-load-time', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        dashboardType: metrics.dashboardType,
        loadTimeMs: metrics.loadTimeMs,
        tileCount: metrics.tileCount,
        dataFetchTimeMs: metrics.dataFetchTimeMs,
        renderTimeMs: metrics.renderTimeMs,
        pagePath: window.location.pathname,
      }),
      keepalive: true,
    });

    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[Dashboard Load Time]', {
        type: metrics.dashboardType,
        total: `${metrics.loadTimeMs}ms`,
        dataFetch: metrics.dataFetchTimeMs ? `${metrics.dataFetchTimeMs}ms` : 'N/A',
        render: metrics.renderTimeMs ? `${metrics.renderTimeMs}ms` : 'N/A',
        withinSLA: metrics.loadTimeMs <= 2000 ? '✓' : '✗',
      });
    }
  } catch (error) {
    // Silently fail - metrics shouldn't break user experience
    console.error('Failed to report dashboard load time:', error);
  }
}
