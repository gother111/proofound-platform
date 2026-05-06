// @vitest-environment node

import { describe, expect, it } from 'vitest';

import {
  assertStartFromCvAccess,
  countStartFromCvPages,
  getStartFromCvLaunchSummary,
  resolveStartFromCvConfig,
  StartFromCvDraftOutputSchema,
  StartFromCvUnsupportedSkillDraftSchema,
} from '@/lib/ai/start-from-cv';

describe('Start from CV guardrails', () => {
  it('is disabled by default with browser OCR off', () => {
    const config = resolveStartFromCvConfig({});

    expect(config.enabled).toBe(false);
    expect(config.openBetaEnabled).toBe(false);
    expect(config.publicBrowserOcrEnabled).toBe(false);
    expect(config.maxFileSizeMb).toBe(5);
    expect(config.maxPages).toBe(4);
    expect(config.userDailyLimit).toBe(3);
    expect(config.globalDailyLimit).toBe(20);
  });

  it('keeps legacy invite access closed for a non-beta individual user when open beta is off', async () => {
    await expect(
      assertStartFromCvAccess({
        userId: '11111111-1111-4111-8111-111111111111',
        persona: 'individual',
        orgIds: [],
        env: {
          START_FROM_CV_BETA_ENABLED: 'true',
          NEXT_PUBLIC_CV_IMPORT_OCR_ENABLED: 'false',
        },
      })
    ).rejects.toMatchObject({ code: 'START_FROM_CV_NOT_INVITED' });
  });

  it('opens beta access to authenticated individual users when open beta is enabled', async () => {
    await expect(
      assertStartFromCvAccess({
        userId: '11111111-1111-4111-8111-111111111111',
        persona: 'individual',
        orgIds: [],
        env: {
          START_FROM_CV_BETA_ENABLED: 'true',
          START_FROM_CV_OPEN_BETA_ENABLED: 'true',
          NEXT_PUBLIC_CV_IMPORT_OCR_ENABLED: 'false',
        },
      })
    ).resolves.toBeUndefined();
  });

  it('keeps organization profiles outside Start from CV even during open beta', async () => {
    await expect(
      assertStartFromCvAccess({
        userId: '11111111-1111-4111-8111-111111111111',
        persona: 'organization',
        orgIds: [],
        env: {
          START_FROM_CV_BETA_ENABLED: 'true',
          START_FROM_CV_OPEN_BETA_ENABLED: 'true',
          NEXT_PUBLIC_CV_IMPORT_OCR_ENABLED: 'false',
        },
      })
    ).rejects.toMatchObject({ code: 'INDIVIDUAL_ONLY' });
  });

  it('reports beta blockers when enabled without open beta or an invite audience', () => {
    const summary = getStartFromCvLaunchSummary({
      START_FROM_CV_BETA_ENABLED: 'true',
      NEXT_PUBLIC_CV_IMPORT_OCR_ENABLED: 'false',
    });

    expect(summary.enabled).toBe(true);
    expect(summary.ok).toBe(false);
    expect(summary.blockers).toContain('invite_audience_not_configured');
  });

  it('reports authenticated-user beta readiness without requiring invite lists', () => {
    const summary = getStartFromCvLaunchSummary({
      START_FROM_CV_BETA_ENABLED: 'true',
      START_FROM_CV_OPEN_BETA_ENABLED: 'true',
      NEXT_PUBLIC_CV_IMPORT_OCR_ENABLED: 'false',
    });

    expect(summary.enabled).toBe(true);
    expect(summary.openBetaEnabled).toBe(true);
    expect(summary.authenticatedUserBeta).toBe(true);
    expect(summary.inviteOnly).toBe(false);
    expect(summary.allowedUserCount).toBe(0);
    expect(summary.allowedOrgCount).toBe(0);
    expect(summary.ok).toBe(true);
    expect(summary.blockers).not.toContain('invite_audience_not_configured');
  });

  it('blocks launch status if browser CV OCR is enabled with Start from CV', () => {
    const summary = getStartFromCvLaunchSummary({
      START_FROM_CV_BETA_ENABLED: 'true',
      START_FROM_CV_OPEN_BETA_ENABLED: 'true',
      NEXT_PUBLIC_CV_IMPORT_OCR_ENABLED: 'true',
    });

    expect(summary.ok).toBe(false);
    expect(summary.blockers).toContain('browser_cv_import_ocr_enabled');
  });

  it('counts PDF pages and applies image page defaults', () => {
    const pdf = Buffer.from('%PDF-1.7 /Type /Page /Type /Page');

    expect(countStartFromCvPages('application/pdf', new Uint8Array(pdf))).toBe(2);
    expect(countStartFromCvPages('image/png', new Uint8Array([1, 2, 3]))).toBe(1);
  });

  it('keeps unsupported skill drafts explicitly unsupported with no trust or matching lift', () => {
    const skill = StartFromCvUnsupportedSkillDraftSchema.parse({
      id: 'skill-1',
      skillLabel: 'TypeScript',
      sourceContext: 'Mentioned in redacted CV text.',
    });

    expect(skill).toMatchObject({
      status: 'unsupported_draft',
      requiresProof: true,
      requiresUserConfirmation: true,
      noTrustLift: true,
      noMatchingLift: true,
      noVerificationState: true,
    });
  });

  it('requires user review and does not include score, rank, shortlist, or recommendation fields', () => {
    const parsed = StartFromCvDraftOutputSchema.parse({
      importSessionId: '11111111-1111-4111-8111-111111111111',
      sourceType: 'cv',
      extractionStatus: 'completed',
      privacyWarnings: [],
      workContextDrafts: [],
      educationContextDrafts: [],
      volunteeringContextDrafts: [],
      proofPackIdeaDrafts: [],
      artifactLinkDrafts: [],
      unsupportedSkillDrafts: [],
      discardedUnsafeItems: [],
      requiresUserReview: true,
    });

    const serialized = JSON.stringify(parsed);
    expect(parsed.requiresUserReview).toBe(true);
    expect(serialized).not.toMatch(/score|rank|shortlist|recommendedRole|fitScore/i);
  });
});
