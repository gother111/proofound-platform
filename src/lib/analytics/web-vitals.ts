/**
 * Web Vitals Instrumentation
 *
 * Tracks Core Web Vitals metrics for performance monitoring.
 * PRD Reference: Part 8 NFR - Performance Monitoring
 *
 * Target thresholds (PRD):
 * - LCP (Largest Contentful Paint): ≤2.5s
 * - FID (First Input Delay): ≤100ms
 * - CLS (Cumulative Layout Shift): ≤0.1
 * - FCP (First Contentful Paint): ≤1.8s
 * - TTFB (Time to First Byte): ≤600ms
 */

'use client';

import { onCLS, onINP, onLCP, onFCP, onTTFB, type Metric } from 'web-vitals';

// Thresholds per PRD
export const WEB_VITALS_THRESHOLDS = {
  LCP: 2500, // 2.5s
  INP: 200, // 200ms target (replaces FID)
  CLS: 0.1,
  FCP: 1800, // 1.8s
  TTFB: 600, // 600ms
} as const;

interface PerformanceMetricPayload {
  metricName: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
  navigationType: string;
  pagePath: string;
}

/**
 * Send metric to backend for storage and analysis
 */
async function sendMetricToBackend(payload: PerformanceMetricPayload): Promise<void> {
  try {
    // Use sendBeacon for reliability (works even on page unload)
    if (navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify(payload)], {
        type: 'application/json',
      });
      navigator.sendBeacon('/api/analytics/web-vitals', blob);
    } else {
      // Fallback to fetch
      fetch('/api/analytics/web-vitals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true,
      }).catch((error) => {
        console.error('Failed to send web vital:', error);
      });
    }
  } catch (error) {
    console.error('Failed to send web vital:', error);
  }
}

/**
 * Get rating based on metric thresholds
 */
function getRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  const thresholds = {
    LCP: [2500, 4000],
    INP: [200, 500],
    CLS: [0.1, 0.25],
    FCP: [1800, 3000],
    TTFB: [600, 1500],
  } as const;

  const [good, poor] = thresholds[name as keyof typeof thresholds] || [0, Infinity];

  if (value <= good) return 'good';
  if (value <= poor) return 'needs-improvement';
  return 'poor';
}

/**
 * Process and send metric
 */
function trackMetric(metric: Metric): void {
  const payload: PerformanceMetricPayload = {
    metricName: metric.name,
    value: metric.value,
    rating: getRating(metric.name, metric.value),
    delta: metric.delta,
    id: metric.id,
    navigationType: metric.navigationType,
    pagePath: window.location.pathname,
  };

  sendMetricToBackend(payload);

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Web Vitals] ${metric.name}:`, {
      value: Math.round(metric.value),
      rating: payload.rating,
      threshold: WEB_VITALS_THRESHOLDS[metric.name as keyof typeof WEB_VITALS_THRESHOLDS],
    });
  }
}

/**
 * Initialize Web Vitals tracking
 *
 * Call this from your root layout component (client-side only)
 */
export function reportWebVitals(): void {
  try {
    onCLS(trackMetric);
    onINP(trackMetric);
    onLCP(trackMetric);
    onFCP(trackMetric);
    onTTFB(trackMetric);
  } catch (error) {
    console.error('Failed to initialize web vitals:', error);
  }
}

/**
 * Check if a metric passes the threshold
 */
export function isMetricGood(metricName: string, value: number): boolean {
  const threshold = WEB_VITALS_THRESHOLDS[metricName as keyof typeof WEB_VITALS_THRESHOLDS];
  return threshold !== undefined && value <= threshold;
}

/**
 * Format metric value for display
 */
export function formatMetricValue(metricName: string, value: number): string {
  if (metricName === 'CLS') {
    return value.toFixed(3);
  }
  return `${Math.round(value)}ms`;
}
