import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  getCronAuthStatus: vi.fn(),
  processWeeklyDigests: vi.fn(),
  getWeeklyDigestAvailability: vi.fn(),
  logInfo: vi.fn(),
  logWarn: vi.fn(),
  logError: vi.fn(),
}));

vi.mock('@/lib/api/cron-auth', () => ({
  getCronAuthStatus: mocks.getCronAuthStatus,
}));

vi.mock('@/lib/notifications/weekly-digest', () => ({
  processWeeklyDigests: mocks.processWeeklyDigests,
  getWeeklyDigestAvailability: mocks.getWeeklyDigestAvailability,
}));

vi.mock('@/lib/log', () => ({
  log: {
    info: mocks.logInfo,
    warn: mocks.logWarn,
    error: mocks.logError,
  },
}));

import { GET } from '../route';

describe('/api/cron/weekly-digest', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getCronAuthStatus.mockReturnValue('authorized');
    mocks.getWeeklyDigestAvailability.mockReturnValue({
      enabled: false,
      reason: 'Weekly digest delivery is temporarily disabled.',
    });
    mocks.processWeeklyDigests.mockResolvedValue({
      processed: 2,
      emailed: 2,
      createdInApp: 2,
      skipped: 0,
      errors: [],
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('returns skipped when weekly digest delivery is disabled', async () => {
    const response = await GET(new NextRequest('https://example.com/api/cron/weekly-digest'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      success: true,
      status: 'skipped',
      reason: 'Weekly digest delivery is temporarily disabled.',
      processed: 0,
      emailed: 0,
      createdInApp: 0,
      skipped: 0,
      errors: [],
    });
    expect(mocks.processWeeklyDigests).not.toHaveBeenCalled();
  });

  it('returns skipped for force requests while the digest is temporarily disabled', async () => {
    const response = await GET(
      new NextRequest('https://example.com/api/cron/weekly-digest?force=true')
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      success: true,
      status: 'skipped',
      reason: 'Weekly digest delivery is temporarily disabled.',
      processed: 0,
      emailed: 0,
      createdInApp: 0,
      skipped: 0,
      errors: [],
    });
    expect(mocks.processWeeklyDigests).not.toHaveBeenCalled();
  });
});
