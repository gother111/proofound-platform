import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  dbExecute: vi.fn(),
  sendEmail: vi.fn(),
  issueCapabilityToken: vi.fn(),
  resolveCanonicalSiteUrl: vi.fn(),
}));

vi.mock('@/db', () => ({
  db: {
    execute: mocks.dbExecute,
  },
}));

vi.mock('@/lib/email/sender', () => ({
  sendEmail: mocks.sendEmail,
}));

vi.mock('@/lib/security/capability-tokens', () => ({
  CAPABILITY_BINDINGS: {
    EMAIL_HASH: 'email_hash',
    EMAIL_THEN_PROFILE_LOCK: 'email_then_profile_lock',
  },
  CAPABILITY_TOKEN_CLASSES: {
    SKILL_VERIFICATION_RESPONSE: 'skill_verification_response',
  },
  issueCapabilityToken: mocks.issueCapabilityToken,
}));

vi.mock('@/lib/env', () => ({
  resolveCanonicalSiteUrl: mocks.resolveCanonicalSiteUrl,
}));

import {
  processVerificationRequestReminders,
  resolveSkillVerificationReminderDueState,
  selectDueSkillVerificationReminderCandidates,
  type SkillVerificationReminderCandidate,
} from '@/lib/verification/request-reminders';

const requestId = '11111111-1111-4111-8111-111111111111';
const skillId = '22222222-2222-4222-8222-222222222222';
const requestedAt = '2026-03-18T10:00:00.000Z';
const expiresAt = '2026-04-01T10:00:00.000Z';

function candidate(
  overrides: Partial<SkillVerificationReminderCandidate> = {}
): SkillVerificationReminderCandidate {
  return {
    id: requestId,
    skillId,
    verifierEmail: 'mentor@example.com',
    verifierProfileId: null,
    verifierSource: 'peer',
    requestKind: 'generic_verification',
    requiresAuthenticatedVerifier: false,
    requestedAt,
    createdAt: requestedAt,
    expiresAt,
    requestExpiresAt: expiresAt,
    lastFollowUpAt: null,
    reminderCount: 0,
    reminderStages: [],
    emailVerificationRequested: null,
    metadata: {
      requestTransport: 'skill_verification_request',
      verifierEmail: 'mentor@example.com',
    },
    ...overrides,
  };
}

describe('skill verification request reminders', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.resolveCanonicalSiteUrl.mockReturnValue('https://proofound.io');
    mocks.issueCapabilityToken.mockResolvedValue({
      rawToken: 'raw-reminder-token',
      token: { id: 'cap-reminder-1' },
    });
    mocks.sendEmail.mockResolvedValue({ success: true, id: 'email-1' });
  });

  it('selects day-5 and day-10 pending reminders with time travel', () => {
    expect(
      resolveSkillVerificationReminderDueState({
        requestedAt,
        expiresAt,
        now: new Date('2026-03-22T10:00:00.000Z'),
      })
    ).toBeNull();

    const firstReminder = resolveSkillVerificationReminderDueState({
      requestedAt,
      expiresAt,
      now: new Date('2026-03-23T10:00:00.000Z'),
    });
    expect(firstReminder?.reminderNumber).toBe(1);

    const secondReminder = resolveSkillVerificationReminderDueState({
      requestedAt,
      expiresAt,
      lastFollowUpAt: '2026-03-23T10:00:00.000Z',
      reminderCount: 1,
      now: new Date('2026-03-28T10:00:00.000Z'),
    });
    expect(secondReminder?.reminderNumber).toBe(2);
  });

  it('prevents duplicate reminders after last-reminded state is present', () => {
    const due = selectDueSkillVerificationReminderCandidates(
      [
        candidate({
          lastFollowUpAt: '2026-03-23T10:00:00.000Z',
          reminderCount: 1,
          reminderStages: [1],
        }),
      ],
      new Date('2026-03-23T12:00:00.000Z')
    );

    expect(due).toEqual([]);
  });

  it('respects verifier email notification preferences when a verifier profile has disabled them', () => {
    const due = selectDueSkillVerificationReminderCandidates(
      [candidate({ emailVerificationRequested: false })],
      new Date('2026-03-23T10:00:00.000Z')
    );

    expect(due).toEqual([]);
  });

  it('sends due reminders and records reminder metadata idempotently', async () => {
    mocks.dbExecute
      .mockResolvedValueOnce({
        rows: [
          {
            id: requestId,
            skill_id: skillId,
            verifier_profile_id: null,
            requested_at: requestedAt,
            created_at: requestedAt,
            expires_at: expiresAt,
            request_expires_at: expiresAt,
            last_follow_up_at: null,
            email_verification_requested: null,
            metadata: {
              requestTransport: 'skill_verification_request',
              verifierEmail: 'mentor@example.com',
              verifierSource: 'peer',
              requestKind: 'generic_verification',
            },
          },
        ],
      })
      .mockResolvedValueOnce({ rows: [{ id: requestId }] });

    const result = await processVerificationRequestReminders({
      now: new Date('2026-03-23T10:00:00.000Z'),
    });

    expect(result).toEqual({
      checked: 1,
      due: 1,
      sent: 1,
      skipped: 0,
      errors: [],
    });
    expect(mocks.issueCapabilityToken).toHaveBeenCalledWith(
      expect.objectContaining({
        tokenClass: 'skill_verification_response',
        sourceId: requestId,
        actorEmail: 'mentor@example.com',
        expiresAt: new Date(expiresAt),
        revokePriorActiveTokensForScope: true,
        metadata: expect.objectContaining({
          reminder: true,
          reminderNumber: 1,
        }),
      })
    );
    expect(mocks.sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'mentor@example.com',
        subject: 'Reminder: Proofound verification request',
        html: expect.stringContaining('https://proofound.io/verify/raw-reminder-token'),
        workflow: 'verification',
      })
    );
    expect(mocks.dbExecute).toHaveBeenCalledTimes(2);
  });
});
