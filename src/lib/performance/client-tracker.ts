/**
 * Client-Side Performance Tracking
 *
 * Tracks Web Vitals and page load metrics using the Web Vitals API.
 * The former client telemetry endpoint is archived for the locked MVP corridor,
 * so metrics remain local-only unless a launch-approved transport is added.
 *
 * SLA Targets:
 * - Page load TTI P95 ≤2.5s (desktop), ≤3.5s (mobile)
 * - Dashboard P75 ≤2.0s
 */

// Web Vitals v4 replaced FID with INP; import INP to avoid build-time errors
import { onCLS, onFCP, onINP, onLCP, onTTFB, type Metric } from 'web-vitals';

interface PerformanceData {
  metricType: string;
  pageRoute: string;
  valueMs: number;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  timestamp: string;
}

// Sample rate: 10% of page loads
const SAMPLE_RATE = 0.1;

// Check if this session should be sampled
const shouldSample = (): boolean => {
  try {
    // Use session storage to ensure consistent sampling for a session.
    const stored = sessionStorage.getItem('perf_sample');
    if (stored !== null) {
      return stored === 'true';
    }

    const sample = Math.random() < SAMPLE_RATE;
    sessionStorage.setItem('perf_sample', String(sample));
    return sample;
  } catch {
    return Math.random() < SAMPLE_RATE;
  }
};

// Get device type from user agent and screen size
const getDeviceType = (): 'desktop' | 'mobile' | 'tablet' => {
  const ua = navigator.userAgent.toLowerCase();
  const width = window.innerWidth;

  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return 'tablet';
  }

  if (/mobile|iphone|ipod|blackberry|opera mini|windows phone/i.test(ua) || width < 768) {
    return 'mobile';
  }

  return 'desktop';
};

// Keep metrics local-only during launch; /api/performance/track is intentionally archived.
const recordMetricLocally = (data: PerformanceData): void => {
  try {
    window.dispatchEvent(new CustomEvent('proofound:performance-metric', { detail: data }));
  } catch (error) {
    // Silent fail
    console.debug('Performance metric recording error:', error);
  }
};

// Handle Web Vitals metric
const handleMetric = (metric: Metric): void => {
  if (!shouldSample()) return;

  const data: PerformanceData = {
    metricType: metric.name.toLowerCase(),
    pageRoute: window.location.pathname,
    valueMs: metric.value,
    deviceType: getDeviceType(),
    timestamp: new Date().toISOString(),
  };

  recordMetricLocally(data);
};

// Track Time to Interactive (TTI) - custom metric
const trackTTI = (): void => {
  if (!shouldSample()) return;

  // TTI is approximated by when the page becomes interactive
  // Use a combination of load event and long tasks
  if ('PerformanceObserver' in window) {
    try {
      let lastLongTask = 0;

      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 50) {
            // Long task threshold
            lastLongTask = entry.startTime + entry.duration;
          }
        }
      });

      observer.observe({ entryTypes: ['longtask'] });

      // Calculate TTI after load
      window.addEventListener(
        'load',
        () => {
          setTimeout(() => {
            observer.disconnect();

            const navTiming = performance.getEntriesByType(
              'navigation'
            )[0] as PerformanceNavigationTiming;
            const tti = Math.max(
              lastLongTask,
              navTiming?.domInteractive || 0,
              navTiming?.domContentLoadedEventEnd || 0
            );

            if (tti > 0) {
              const data: PerformanceData = {
                metricType: 'tti',
                pageRoute: window.location.pathname,
                valueMs: tti,
                deviceType: getDeviceType(),
                timestamp: new Date().toISOString(),
              };

              recordMetricLocally(data);
            }
          }, 5000); // Wait 5 seconds after load to capture late long tasks
        },
        { once: true }
      );
    } catch (error) {
      console.debug('TTI tracking error:', error);
    }
  }
};

// Track page load time
const trackPageLoad = (): void => {
  if (!shouldSample()) return;

  window.addEventListener(
    'load',
    () => {
      // Wait a bit for all metrics to be available
      setTimeout(() => {
        const navTiming = performance.getEntriesByType(
          'navigation'
        )[0] as PerformanceNavigationTiming;

        if (!navTiming) return;

        const loadTime = navTiming.loadEventEnd - navTiming.fetchStart;

        if (loadTime > 0) {
          const data: PerformanceData = {
            metricType: 'page_load',
            pageRoute: window.location.pathname,
            valueMs: loadTime,
            deviceType: getDeviceType(),
            timestamp: new Date().toISOString(),
          };

          recordMetricLocally(data);
        }
      }, 0);
    },
    { once: true }
  );
};

/**
 * Initialize performance tracking
 * Call this once when the app loads (e.g., in _app.tsx or layout.tsx)
 */
export const initPerformanceTracking = (): void => {
  if (typeof window === 'undefined') return; // Skip on server-side

  // Track Web Vitals
  onCLS(handleMetric);
  onFCP(handleMetric);
  onINP(handleMetric);
  onLCP(handleMetric);
  onTTFB(handleMetric);

  // Track custom metrics
  trackPageLoad();
  trackTTI();
};

/**
 * Track a custom performance mark
 * Useful for tracking specific user interactions or feature load times
 */
export const trackCustomMetric = (name: string, durationMs: number): void => {
  if (!shouldSample()) return;

  const data: PerformanceData = {
    metricType: name,
    pageRoute: window.location.pathname,
    valueMs: durationMs,
    deviceType: getDeviceType(),
    timestamp: new Date().toISOString(),
  };

  recordMetricLocally(data);
};

/**
 * Mark the start of a performance measurement
 */
export const markPerformanceStart = (name: string): void => {
  if (typeof window !== 'undefined' && 'performance' in window) {
    performance.mark(`${name}-start`);
  }
};

/**
 * Mark the end of a performance measurement and track it
 */
export const markPerformanceEnd = (name: string): void => {
  if (typeof window !== 'undefined' && 'performance' in window) {
    performance.mark(`${name}-end`);

    try {
      performance.measure(name, `${name}-start`, `${name}-end`);
      const measure = performance.getEntriesByName(name, 'measure')[0];

      if (measure) {
        trackCustomMetric(name, measure.duration);
      }

      // Clean up marks
      performance.clearMarks(`${name}-start`);
      performance.clearMarks(`${name}-end`);
      performance.clearMeasures(name);
    } catch (error) {
      console.debug('Performance measurement error:', error);
    }
  }
};

/**
 * Helper to track async operations
 */
export const trackAsyncOperation = async <T>(
  name: string,
  operation: () => Promise<T>
): Promise<T> => {
  markPerformanceStart(name);
  try {
    return await operation();
  } finally {
    markPerformanceEnd(name);
  }
};
