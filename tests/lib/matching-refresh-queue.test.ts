import { afterEach, describe, expect, it } from 'vitest';

import {
  resolveMatchingRefreshWorkerBatchSize,
  resolveMatchingRefreshWorkerConcurrency,
} from '@/lib/matching/refresh-queue';

describe('matching refresh queue defaults', () => {
  afterEach(() => {
    delete process.env.MATCHING_REFRESH_WORKER_BATCH_SIZE;
    delete process.env.MATCHING_REFRESH_WORKER_CONCURRENCY;
  });

  it('defaults the worker batch size to 100 jobs', () => {
    expect(resolveMatchingRefreshWorkerBatchSize()).toBe(100);
  });

  it('still allows env overrides for batch size and concurrency', () => {
    process.env.MATCHING_REFRESH_WORKER_BATCH_SIZE = '160';
    process.env.MATCHING_REFRESH_WORKER_CONCURRENCY = '6';

    expect(resolveMatchingRefreshWorkerBatchSize()).toBe(160);
    expect(resolveMatchingRefreshWorkerConcurrency()).toBe(6);
  });
});
