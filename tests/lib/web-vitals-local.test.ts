import { afterEach, describe, expect, it, vi } from 'vitest';

const callbacks: Record<string, (metric: any) => void> = {};

vi.mock('web-vitals', () => ({
  onCLS: vi.fn((callback) => {
    callbacks.CLS = callback;
  }),
  onFCP: vi.fn((callback) => {
    callbacks.FCP = callback;
  }),
  onINP: vi.fn((callback) => {
    callbacks.INP = callback;
  }),
  onLCP: vi.fn((callback) => {
    callbacks.LCP = callback;
  }),
  onTTFB: vi.fn((callback) => {
    callbacks.TTFB = callback;
  }),
}));

describe('web vitals local instrumentation', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    for (const key of Object.keys(callbacks)) {
      delete callbacks[key];
    }
  });

  it('keeps web vitals local instead of logging to console or calling archived APIs', async () => {
    const { reportWebVitals } = await import('@/lib/analytics/web-vitals');
    const observedVitals: unknown[] = [];
    const handleVital = (event: Event) => {
      observedVitals.push((event as CustomEvent).detail);
    };
    const consoleDebug = vi.spyOn(console, 'debug').mockImplementation(() => {});
    const consoleLog = vi.spyOn(console, 'log').mockImplementation(() => {});
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.stubGlobal('fetch', vi.fn());

    window.addEventListener('proofound:web-vital', handleVital);
    reportWebVitals();
    callbacks.LCP?.({
      name: 'LCP',
      value: 1200,
      delta: 1200,
      id: 'vital-1',
      navigationType: 'navigate',
    });
    window.removeEventListener('proofound:web-vital', handleVital);

    expect(fetch).not.toHaveBeenCalled();
    expect(consoleDebug).not.toHaveBeenCalled();
    expect(consoleLog).not.toHaveBeenCalled();
    expect(consoleError).not.toHaveBeenCalled();
    expect(observedVitals).toHaveLength(1);
    expect(observedVitals[0]).toMatchObject({
      type: 'captured',
      metricName: 'LCP',
      value: 1200,
      rating: 'good',
      pagePath: '/',
    });
  });
});
