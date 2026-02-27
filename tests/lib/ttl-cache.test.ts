import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  clearTtlCache,
  getOrSetTtlCache,
  PLATFORM_PERF_CACHE_TTL_MS,
} from '@/lib/performance/ttl-cache';

describe('ttl cache utility', () => {
  beforeEach(() => {
    clearTtlCache();
  });

  it('returns cached value inside TTL after an initial miss', async () => {
    let now = 1_000;
    const compute = vi.fn(async () => ({ score: 88 }));

    const first = await getOrSetTtlCache('k1', compute, {
      ttlMs: PLATFORM_PERF_CACHE_TTL_MS,
      now: () => now,
    });

    now += 5_000;

    const second = await getOrSetTtlCache('k1', compute, {
      ttlMs: PLATFORM_PERF_CACHE_TTL_MS,
      now: () => now,
    });

    expect(first).toEqual({ score: 88 });
    expect(second).toEqual({ score: 88 });
    expect(compute).toHaveBeenCalledTimes(1);
  });

  it('recomputes after TTL expiry', async () => {
    let now = 2_000;
    const compute = vi
      .fn<() => Promise<number>>()
      .mockResolvedValueOnce(10)
      .mockResolvedValueOnce(20);

    const first = await getOrSetTtlCache('k2', compute, {
      ttlMs: 1_000,
      now: () => now,
    });

    now += 2_000;

    const second = await getOrSetTtlCache('k2', compute, {
      ttlMs: 1_000,
      now: () => now,
    });

    expect(first).toBe(10);
    expect(second).toBe(20);
    expect(compute).toHaveBeenCalledTimes(2);
  });

  it('dedupes in-flight concurrent requests for the same key', async () => {
    let resolve: (value: string) => void;
    const compute = vi.fn(
      () =>
        new Promise<string>((res) => {
          resolve = res;
        })
    );

    const firstPromise = getOrSetTtlCache('k3', compute);
    const secondPromise = getOrSetTtlCache('k3', compute);

    expect(compute).toHaveBeenCalledTimes(1);

    resolve!('ready');

    await expect(firstPromise).resolves.toBe('ready');
    await expect(secondPromise).resolves.toBe('ready');
  });
});
