import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextResponse } from 'next/server';

const mocks = vi.hoisted(() => ({
  requireApiAuth: vi.fn(),
  profileFindFirst: vi.fn(),
  orgMemberFindFirst: vi.fn(),
  calculateTTSC: vi.fn(),
  calculateTTFQI: vi.fn(),
  calculateTTV: vi.fn(),
  calculatePACLift: vi.fn(),
  getAllMetrics: vi.fn(),
  checkRateLimit: vi.fn(),
  getRateLimitHeaders: vi.fn(),
  logInfo: vi.fn(),
  logWarn: vi.fn(),
  logError: vi.fn(),
}));

vi.mock('@/lib/api/auth', () => ({
  requireApiAuth: mocks.requireApiAuth,
}));

vi.mock('@/db', () => ({
  db: {
    query: {
      profiles: { findFirst: mocks.profileFindFirst },
      organizationMembers: { findFirst: mocks.orgMemberFindFirst },
    },
  },
}));

vi.mock('@/lib/analytics/metrics', () => ({
  calculateTTSC: mocks.calculateTTSC,
  calculateTTFQI: mocks.calculateTTFQI,
  calculateTTV: mocks.calculateTTV,
  calculatePACLift: mocks.calculatePACLift,
  getAllMetrics: mocks.getAllMetrics,
}));

vi.mock('@/lib/rate-limit/index', () => ({
  RATE_LIMITS: { api: {} },
  checkRateLimit: mocks.checkRateLimit,
  getRateLimitHeaders: mocks.getRateLimitHeaders,
}));

vi.mock('@/lib/log', () => ({
  log: {
    info: mocks.logInfo,
    warn: mocks.logWarn,
    error: mocks.logError,
  },
}));

import { GET } from '../route';

function makeRequest(url: string) {
  const request = new Request(url) as any;
  request.nextUrl = new URL(url);
  return request;
}

describe('/api/metrics', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.checkRateLimit.mockResolvedValue({
      allowed: true,
      result: { reset: Date.now() + 60_000 },
    });
    mocks.getRateLimitHeaders.mockReturnValue({
      'x-ratelimit-limit': '100',
      'x-ratelimit-remaining': '99',
      'x-ratelimit-reset': `${Date.now() + 60_000}`,
    });
    mocks.requireApiAuth.mockResolvedValue({ user: { id: 'user-1' } });
    mocks.profileFindFirst.mockResolvedValue({ platformRole: null });
    mocks.orgMemberFindFirst.mockResolvedValue({
      orgId: 'org-1',
      role: 'org_owner',
    });
  });

  it('returns 400 when metric query parameter is invalid', async () => {
    const response = await GET(makeRequest('https://example.com/api/metrics?metric=bad'));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe('Invalid metric parameter');
  });

  it('returns 400 when startDate is invalid', async () => {
    const response = await GET(
      makeRequest('https://example.com/api/metrics?metric=ttv&startDate=not-a-date')
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe('Invalid startDate parameter');
  });

  it('returns 403 when user is neither platform admin nor active org owner/manager', async () => {
    mocks.orgMemberFindFirst.mockResolvedValue(null);

    const response = await GET(makeRequest('https://example.com/api/metrics?metric=all'));
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error).toBe('Forbidden');
  });

  it('returns metric payload for authorized org owner requests', async () => {
    mocks.calculateTTV.mockResolvedValue({
      metric: 'TTV',
      value: 5,
      unit: 'days',
      target: 7,
      onTrack: true,
      sampleSize: 10,
      calculatedAt: new Date('2026-02-12T00:00:00.000Z'),
    });

    const response = await GET(
      makeRequest(
        'https://example.com/api/metrics?metric=ttv&startDate=2026-02-01T00:00:00.000Z&endDate=2026-02-12T00:00:00.000Z&cohort=alpha_1'
      )
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.metrics.ttv.value).toBe(5);
    expect(mocks.calculateTTV).toHaveBeenCalledTimes(1);
    expect(mocks.calculateTTV.mock.calls[0][0]).toBe('alpha_1');
  });

  it('returns 401 passthrough response when auth fails', async () => {
    mocks.requireApiAuth.mockResolvedValue(
      NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    );

    const response = await GET(makeRequest('https://example.com/api/metrics?metric=all'));
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error).toBe('Unauthorized');
  });

  it('fetches all metrics when metric=all', async () => {
    mocks.getAllMetrics.mockResolvedValue({ ttv: { value: 5 } });

    const response = await GET(makeRequest('https://example.com/api/metrics?metric=all'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.metrics).toEqual({ ttv: { value: 5 } });
    expect(mocks.getAllMetrics).toHaveBeenCalledTimes(1);
  });
});
