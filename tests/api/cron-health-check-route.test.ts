import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/api/cron-auth', () => ({
  requireInternalOpsRequest: vi.fn(() => null),
}));

vi.mock('@/db', () => ({
  db: {
    execute: vi.fn(),
    select: vi.fn(),
  },
}));

vi.mock('@/lib/analytics/metrics', () => ({
  getAllMetrics: vi.fn(),
}));

vi.mock('@/lib/log', () => ({
  log: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

import { GET } from '@/app/api/cron/health-check/route';
import { db } from '@/db';
import { getAllMetrics } from '@/lib/analytics/metrics';

describe('/api/cron/health-check', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(db.execute).mockResolvedValue({} as never);
    vi.mocked(db.select).mockReturnValue({
      from: vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue([]),
      }),
    } as never);
  });

  it('warns when metrics miss the targets reported to operators', async () => {
    vi.mocked(getAllMetrics).mockResolvedValue({
      ttsc: { value: 34 },
      ttfqi: { value: 90 },
      proofFitLift: { lift: 10 },
      ttv: null,
      firstTenMinuteActivation: null,
    });

    const response = await GET(new Request('http://localhost/api/cron/health-check'));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.status).toBe('warning');
    expect(payload.checks.ttsc.status).toBe('warning');
    expect(payload.checks.ttfqi.status).toBe('warning');
    expect(payload.checks.proof_fit_acceptance.status).toBe('warning');
    expect(payload.checks.proof_fit_contract.status).toBe('warning');
  });

  it('uses the proof-fit metric key returned by getAllMetrics', async () => {
    vi.mocked(getAllMetrics).mockResolvedValue({
      ttsc: null,
      ttfqi: null,
      proofFitLift: { lift: 18 },
      ttv: null,
      firstTenMinuteActivation: null,
    });

    const response = await GET(new Request('http://localhost/api/cron/health-check'));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.status).toBe('warning');
    expect(payload.checks.proof_fit_acceptance.status).toBe('warning');
    expect(payload.checks.proof_fit_contract.status).toBe('healthy');
  });
});
