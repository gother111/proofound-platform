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

import { GET } from '@/app/api/feature-flags/route';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { isFeatureEnabled } from '@/lib/feature-flags/server';
import { FEATURE_FLAG_KEYS } from '@/lib/featureFlags';

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
      FF_ASSISTIVE_AI_UI: true,
      FF_PROOF_ARTIFACT_OCR_BETA: false,
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
      assistiveAiUi: true,
      proofArtifactOcrBeta: false,
    });
  });

  it('keeps assistive AI server and client defaults aligned while OCR beta stays off', async () => {
    const originalAssistiveAi = process.env.NEXT_PUBLIC_FF_ASSISTIVE_AI_UI;
    const originalOcrBeta = process.env.NEXT_PUBLIC_FF_PROOF_ARTIFACT_OCR_BETA;

    try {
      delete process.env.NEXT_PUBLIC_FF_ASSISTIVE_AI_UI;
      delete process.env.NEXT_PUBLIC_FF_PROOF_ARTIFACT_OCR_BETA;
      vi.resetModules();
      const defaults = await import('@/lib/featureFlags');

      expect(defaults.FEATURE_FLAG_DEFAULTS[FEATURE_FLAG_KEYS.ASSISTIVE_AI_UI]).toBe(true);
      expect(defaults.getFeatureFlagDefault(FEATURE_FLAG_KEYS.ASSISTIVE_AI_UI)).toBe(true);
      expect(defaults.CLIENT_FF_DEFAULTS.assistiveAiUi).toBe(true);

      expect(defaults.FEATURE_FLAG_DEFAULTS[FEATURE_FLAG_KEYS.PROOF_ARTIFACT_OCR_BETA]).toBe(false);
      expect(defaults.getFeatureFlagDefault(FEATURE_FLAG_KEYS.PROOF_ARTIFACT_OCR_BETA)).toBe(false);
      expect(defaults.CLIENT_FF_DEFAULTS.proofArtifactOcrBeta).toBe(false);

      process.env.NEXT_PUBLIC_FF_ASSISTIVE_AI_UI = 'false';
      vi.resetModules();
      const overridden = await import('@/lib/featureFlags');
      expect(overridden.getFeatureFlagDefault(FEATURE_FLAG_KEYS.ASSISTIVE_AI_UI)).toBe(false);
      expect(overridden.CLIENT_FF_DEFAULTS.assistiveAiUi).toBe(false);
    } finally {
      if (originalAssistiveAi == null) {
        delete process.env.NEXT_PUBLIC_FF_ASSISTIVE_AI_UI;
      } else {
        process.env.NEXT_PUBLIC_FF_ASSISTIVE_AI_UI = originalAssistiveAi;
      }

      if (originalOcrBeta == null) {
        delete process.env.NEXT_PUBLIC_FF_PROOF_ARTIFACT_OCR_BETA;
      } else {
        process.env.NEXT_PUBLIC_FF_PROOF_ARTIFACT_OCR_BETA = originalOcrBeta;
      }
      vi.resetModules();
    }
  });
});
