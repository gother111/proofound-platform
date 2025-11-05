/**
 * Web Vitals Tracking
 * Implements PRD Gap 2: Performance monitoring
 *
 * Tracks Core Web Vitals:
 * - LCP (Largest Contentful Paint) - target ≤ 2.5s
 * - FID (First Input Delay) - target ≤ 100ms
 * - CLS (Cumulative Layout Shift) - target ≤ 0.1
 * - FCP (First Contentful Paint) - target ≤ 1.8s
 * - TTFB (Time to First Byte) - target ≤ 600ms
 */

import { onCLS, onFID, onLCP, onFCP, onTTFB, type Metric } from 'web-vitals';

export function initWebVitals() {
  // Track all Core Web Vitals
  onCLS((metric) => sendToAnalytics('CLS', metric));
  onFID((metric) => sendToAnalytics('FID', metric));
  onLCP((metric) => sendToAnalytics('LCP', metric));
  onFCP((metric) => sendToAnalytics('FCP', metric));
  onTTFB((metric) => sendToAnalytics('TTFB', metric));
}

function sendToAnalytics(name: string, metric: Metric) {
  const body = JSON.stringify({
    name,
    value: metric.value,
    rating: metric.rating,
    delta: metric.delta,
    id: metric.id,
    navigationType: metric.navigationType,
    // Additional context
    url: window.location.href,
    userAgent: navigator.userAgent,
    timestamp: Date.now(),
  });

  // Use `navigator.sendBeacon()` if available, falling back to `fetch()`.
  const blob = new Blob([body], { type: 'application/json' });
  if (navigator.sendBeacon) {
    navigator.sendBeacon('/api/analytics/web-vitals', blob);
  } else {
    fetch('/api/analytics/web-vitals', {
      method: 'POST',
      body,
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
    }).catch((error) => {
      console.error('Failed to send web vital:', error);
    });
  }
}

/**
 * Report Web Vitals helper for Next.js
 * Can be used in _app.tsx or layout.tsx
 */
export function reportWebVitals(metric: Metric) {
  sendToAnalytics(metric.name, metric);
}

/**
 * Check if metric passes PRD targets
 */
export function meetsPerformanceTarget(name: string, value: number): boolean {
  const targets: Record<string, number> = {
    LCP: 2500, // 2.5s
    FID: 100, // 100ms
    CLS: 0.1, // 0.1
    FCP: 1800, // 1.8s
    TTFB: 600, // 600ms
    TTI: 2500, // 2.5s (Time to Interactive - P95 desktop per PRD)
  };

  const target = targets[name];
  if (!target) return true;

  return value <= target;
}

/**
 * Get performance rating (good/needs-improvement/poor)
 */
export function getPerformanceRating(
  name: string,
  value: number
): 'good' | 'needs-improvement' | 'poor' {
  // Based on Web Vitals thresholds
  const thresholds: Record<string, { good: number; poor: number }> = {
    LCP: { good: 2500, poor: 4000 },
    FID: { good: 100, poor: 300 },
    CLS: { good: 0.1, poor: 0.25 },
    FCP: { good: 1800, poor: 3000 },
    TTFB: { good: 800, poor: 1800 },
  };

  const threshold = thresholds[name];
  if (!threshold) return 'good';

  if (value <= threshold.good) return 'good';
  if (value <= threshold.poor) return 'needs-improvement';
  return 'poor';
}
