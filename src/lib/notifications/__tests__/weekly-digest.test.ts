import { afterEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  sendEmail: vi.fn(),
}));

vi.mock('@/db', () => ({
  db: {},
}));

vi.mock('@/db/schema', () => ({
  notificationPreferences: {},
  notifications: {},
  profiles: {},
}));

vi.mock('@/lib/email/sender', () => ({
  sendEmail: mocks.sendEmail,
}));

vi.mock('@/lib/momentum/summary', () => ({
  getMomentumSummary: vi.fn(),
}));

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(),
}));

import {
  buildWeeklyDigestEmail,
  getWeeklyDigestAvailability,
  processWeeklyDigests,
} from '../weekly-digest';

describe('weekly digest availability', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it('defaults to enabled', () => {
    const availability = getWeeklyDigestAvailability();

    expect(availability).toEqual({
      enabled: true,
      reason: null,
    });
    expect(mocks.sendEmail).not.toHaveBeenCalled();
  });

  it('is disabled only when WEEKLY_DIGEST_ENABLED is false', async () => {
    vi.stubEnv('WEEKLY_DIGEST_ENABLED', 'false');

    const availability = getWeeklyDigestAvailability();
    const result = await processWeeklyDigests();

    expect(availability).toEqual({
      enabled: false,
      reason: 'Weekly digest delivery is disabled by WEEKLY_DIGEST_ENABLED=false.',
    });
    expect(result).toEqual({
      processed: 0,
      emailed: 0,
      createdInApp: 0,
      skipped: 0,
      errors: [],
    });
    expect(mocks.sendEmail).not.toHaveBeenCalled();
  });

  it('builds a valid no-match digest with readiness nudges', () => {
    const email = buildWeeklyDigestEmail({
      userId: 'user-zero-match',
      persona: 'individual',
      subject: 'Proofound weekly digest',
      summary:
        'Market activity is currently low. Focus on readiness actions to improve match quality as volume grows.',
      topActions: [
        {
          id: 'add-proof',
          title: 'Add one fresh proof',
          description: 'Attach a recent artifact to make your strongest skill easier to review.',
          priority: 'high',
          category: 'verification',
          actionUrl: '/app/i/expertise',
        },
      ],
      updates: [],
      metrics: {
        totalMatches: 0,
        highQualityMatches: 0,
        pendingVerifications: 0,
        readinessScore: 20,
      },
      generatedAt: '2026-03-23T10:00:00.000Z',
    });

    expect(email.html).toContain('No matches yet.');
    expect(email.html).toContain('Add one fresh proof');
    expect(email.text).toContain('request one verification');
    expect(email.text).toContain('- totalMatches: 0');
  });
});
