import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  generateFairnessNoteResult: vi.fn(),
  logInfo: vi.fn(),
  logWarn: vi.fn(),
  logError: vi.fn(),
}));

vi.mock('@/lib/analytics/fairness-note-generator', () => ({
  generateFairnessNoteResult: (...args: unknown[]) => mocks.generateFairnessNoteResult(...args),
}));

vi.mock('@/lib/log', () => ({
  log: {
    info: mocks.logInfo,
    warn: mocks.logWarn,
    error: mocks.logError,
  },
}));

import { GET } from '@/app/api/cron/fairness-note/route';

describe('GET /api/cron/fairness-note', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = 'cron-secret';
    delete process.env.CRON_SECRET_PREVIEW;
    delete process.env.NEXT_PUBLIC_CRON_SECRET;
  });

  it('returns degraded success when cohort data is insufficient', async () => {
    mocks.generateFairnessNoteResult.mockResolvedValue({
      noteId: 'note-1',
      status: 'insufficient_data',
      releaseVersion: '2026-03-06',
      cohortsAnalyzed: 0,
      findingsCount: 1,
      hasSignificantGaps: false,
      message: 'Insufficient data for analysis',
    });

    const response = await GET(
      new NextRequest('https://example.com/api/cron/fairness-note', {
        headers: { authorization: 'Bearer cron-secret' },
      })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      success: true,
      message: 'Insufficient data for analysis',
      noteId: 'note-1',
    });
  });

  it('rejects requests with an invalid cron secret', async () => {
    const response = await GET(
      new NextRequest('https://example.com/api/cron/fairness-note', {
        headers: { authorization: 'Bearer wrong-secret' },
      })
    );
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toEqual({ error: 'Unauthorized' });
  });
});
