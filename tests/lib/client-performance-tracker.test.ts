import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { trackCustomMetric } from '@/lib/performance/client-tracker';

vi.mock('web-vitals', () => ({
  onCLS: vi.fn(),
  onFCP: vi.fn(),
  onINP: vi.fn(),
  onLCP: vi.fn(),
  onTTFB: vi.fn(),
}));

describe('client performance tracker', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    vi.spyOn(Math, 'random').mockReturnValue(0);
    Object.defineProperty(navigator, 'sendBeacon', {
      configurable: true,
      value: vi.fn(),
    });
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('keeps launch performance metrics local instead of calling the archived API', () => {
    const observedMetrics: unknown[] = [];
    const handleMetric = (event: Event) => {
      observedMetrics.push((event as CustomEvent).detail);
    };

    window.addEventListener('proofound:performance-metric', handleMetric);
    trackCustomMetric('proof_pack_render', 123);
    window.removeEventListener('proofound:performance-metric', handleMetric);

    expect(navigator.sendBeacon).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
    expect(observedMetrics).toHaveLength(1);
    expect(observedMetrics[0]).toMatchObject({
      metricType: 'proof_pack_render',
      pageRoute: '/',
      valueMs: 123,
      deviceType: 'desktop',
    });
  });
});
