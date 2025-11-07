/**
 * Performance Tracking Library
 *
 * PRD: Part 8 (lines 1813-1817)
 * Tracks custom performance metrics for monitoring SLA compliance
 */

import { log } from '@/lib/log';
import { trackEvent } from './events';

/**
 * Track page load time (Time to Interactive)
 * Target: ≤2s for TTI
 */
export function trackPageLoad(page: string, duration: number): void {
  try {
    // Log the page load metric
    log.info('performance.page_load', {
      page,
      duration,
      targetTTI: 2000,
      withinSLA: duration <= 2000,
    });

    // Track via analytics events
    trackEvent({
      eventType: 'performance_metric',
      entityType: 'page',
      entityId: page,
      properties: {
        metric: 'page_load',
        duration,
        unit: 'ms',
        target: 2000,
        withinSLA: duration <= 2000,
      },
    });
  } catch (error) {
    log.error('performance.page_load.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      page,
    });
  }
}

/**
 * Track API endpoint latency
 * Target: ≤500ms P95 latency
 */
export function trackAPILatency(endpoint: string, duration: number, method: string = 'GET'): void {
  try {
    // Log the API latency metric
    log.info('performance.api_latency', {
      endpoint,
      method,
      duration,
      targetP95: 500,
      withinSLA: duration <= 500,
    });

    // Track via analytics events
    trackEvent({
      eventType: 'performance_metric',
      entityType: 'api',
      entityId: endpoint,
      properties: {
        metric: 'api_latency',
        method,
        duration,
        unit: 'ms',
        target: 500,
        withinSLA: duration <= 500,
      },
    });
  } catch (error) {
    log.error('performance.api_latency.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      endpoint,
    });
  }
}

/**
 * Track Web Vitals (FCP, LCP, FID, CLS, TTFB)
 * These are automatically tracked by Vercel Analytics,
 * but we can also log them for our internal monitoring
 */
export interface WebVital {
  id: string;
  name: 'FCP' | 'LCP' | 'FID' | 'CLS' | 'TTFB' | 'INP';
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  navigationType: string;
}

export function trackWebVital(vital: WebVital): void {
  try {
    log.info('performance.web_vital', {
      name: vital.name,
      value: vital.value,
      rating: vital.rating,
      delta: vital.delta,
    });

    // Track via analytics events
    trackEvent({
      eventType: 'performance_metric',
      entityType: 'web_vital',
      entityId: vital.id,
      properties: {
        metric: vital.name,
        value: vital.value,
        rating: vital.rating,
        delta: vital.delta,
        navigationType: vital.navigationType,
      },
    });
  } catch (error) {
    log.error('performance.web_vital.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      vital: vital.name,
    });
  }
}

/**
 * Track custom timing metric
 * For tracking specific operations like data loading, calculations, etc.
 */
export function trackCustomTiming(
  operation: string,
  duration: number,
  metadata?: Record<string, any>
): void {
  try {
    log.info('performance.custom_timing', {
      operation,
      duration,
      ...metadata,
    });

    trackEvent({
      eventType: 'performance_metric',
      entityType: 'custom',
      entityId: operation,
      properties: {
        metric: 'custom_timing',
        duration,
        unit: 'ms',
        ...metadata,
      },
    });
  } catch (error) {
    log.error('performance.custom_timing.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      operation,
    });
  }
}

/**
 * Helper to measure and track async operations
 */
export async function measureAsync<T>(
  operation: string,
  fn: () => Promise<T>,
  metadata?: Record<string, any>
): Promise<T> {
  const startTime = Date.now();

  try {
    const result = await fn();
    const duration = Date.now() - startTime;

    trackCustomTiming(operation, duration, {
      ...metadata,
      success: true,
    });

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;

    trackCustomTiming(operation, duration, {
      ...metadata,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    throw error;
  }
}

/**
 * Helper to measure and track sync operations
 */
export function measureSync<T>(operation: string, fn: () => T, metadata?: Record<string, any>): T {
  const startTime = Date.now();

  try {
    const result = fn();
    const duration = Date.now() - startTime;

    trackCustomTiming(operation, duration, {
      ...metadata,
      success: true,
    });

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;

    trackCustomTiming(operation, duration, {
      ...metadata,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    throw error;
  }
}
