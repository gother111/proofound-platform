/** @vitest-environment node */

import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/db', () => ({
  db: {
    select: vi.fn(),
  },
}));

vi.mock('@/lib/feature-flags/server', () => ({
  isFeatureEnabled: vi.fn(),
}));

vi.mock('@/lib/log', () => ({
  log: {
    error: vi.fn(),
  },
}));

import { GET } from '@/app/api/feature-flags/route';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { isFeatureEnabled } from '@/lib/feature-flags/server';
import { log } from '@/lib/log';

describe('/api/feature-flags', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    (createClient as any).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: {
              id: 'user-1',
              email: 'user@example.com',
            },
          },
          error: null,
        }),
      },
    });

    const where = vi.fn().mockResolvedValue([{ orgId: 'org-1', role: 'org_owner' }]);
    const from = vi.fn().mockReturnValue({ where });
    (db.select as any).mockReturnValue({ from });

    const defaults: Record<string, boolean> = {
      FF_ACTIVATION_TIERING: true,
      FF_ASSIGNMENT_BASIC_MODE: true,
      FF_UI_VOCAB_PLAIN: true,
      FF_PRIVACY_SUMMARY: true,
      FF_QUALIFIED_INTRO_CORRIDOR: true,
      FF_STRUCTURED_FEEDBACK_REQUIRED: true,
      FF_EXACT_RANK_EXPOSURE: false,
      FF_KILL_SWITCH_INTROS: false,
      FF_KILL_SWITCH_EXACT_RANK: true,
      FF_LEGACY_MVP_SURFACES: false,
    };

    (isFeatureEnabled as any).mockImplementation(async (key: string) => defaults[key]);
  });

  it('returns launch-safe defaults including disabled legacy surfaces', async () => {
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.flags).toMatchObject({
      qualifiedIntroCorridor: true,
      structuredFeedbackRequired: true,
      exactRankExposure: false,
      killSwitchIntros: false,
      killSwitchExactRank: true,
      legacyMvpSurfaces: false,
    });
  });

  it('logs failures structurally while returning the safe public error', async () => {
    (db.select as any).mockImplementationOnce(() => {
      throw new Error('feature flag membership load failed');
    });

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({ error: 'Failed to load feature flags' });
    expect(log.error).toHaveBeenCalledWith('feature_flags.fetch_failed', {
      error: 'feature flag membership load failed',
    });
  });
});
