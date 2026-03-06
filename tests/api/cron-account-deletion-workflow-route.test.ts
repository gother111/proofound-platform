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

import { GET } from '@/app/api/cron/account-deletion-workflow/route';

describe('GET /api/cron/account-deletion-workflow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = 'cron-secret';
    mocks.generateFairnessNoteResult.mockResolvedValue({
      noteId: 'note-1',
      status: 'success',
      releaseVersion: '2026-03-06',
      cohortsAnalyzed: 2,
      findingsCount: 1,
      hasSignificantGaps: true,
    });
  });

  it('returns success when fairness note generation succeeds', async () => {
    const response = await GET(
      new NextRequest('https://example.com/api/cron/account-deletion-workflow', {
        headers: { authorization: 'Bearer cron-secret' },
      })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.fairnessNote).toEqual({
      status: 'success',
      noteId: 'note-1',
    });
  });

  it('surfaces insufficient data as degraded success', async () => {
    mocks.generateFairnessNoteResult.mockResolvedValue({
      noteId: 'note-insufficient',
      status: 'insufficient_data',
      releaseVersion: '2026-03-06',
      cohortsAnalyzed: 0,
      findingsCount: 1,
      hasSignificantGaps: false,
      message: 'Insufficient data for analysis',
    });

    const response = await GET(
      new NextRequest('https://example.com/api/cron/account-deletion-workflow', {
        headers: { authorization: 'Bearer cron-secret' },
      })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.fairnessNote).toEqual({
      status: 'insufficient_data',
      noteId: 'note-insufficient',
    });
  });

  it('preserves success response when fairness note generation truly fails', async () => {
    mocks.generateFairnessNoteResult.mockRejectedValue(new Error('db unavailable'));

    const response = await GET(
      new NextRequest('https://example.com/api/cron/account-deletion-workflow', {
        headers: { authorization: 'Bearer cron-secret' },
      })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.fairnessNote).toEqual({
      status: 'error',
      noteId: null,
    });
  });
});
