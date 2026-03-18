import { beforeEach, describe, expect, it, vi } from 'vitest';

const resendSendMock = vi.hoisted(() => vi.fn());

vi.mock('resend', () => ({
  Resend: class Resend {
    emails = {
      send: resendSendMock,
    };
  },
}));

import { sendInterviewScheduledEmail } from '@/lib/email';
import {
  applyWorkflowEmailPrivacy,
  buildBlindSafeVerificationRequestEmail,
} from '@/lib/email/privacy';

describe('workflow email privacy helper', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SITE_URL = 'https://proofound.io';
  });

  it('builds pre-reveal verification emails without requester or artifact details', () => {
    const email = buildBlindSafeVerificationRequestEmail({
      verifyUrl: 'https://proofound.io/verify/token-123',
      expiresInDays: 7,
      ctaLabel: 'Review Request',
      requestKind: 'generic_verification',
    });

    expect(email.subject).toBe('Proofound verification request');
    expect(email.html).toContain('secure review flow');
    expect(email.html).toContain('https://proofound.io/verify/token-123');
    expect(email.html).not.toContain('Alice');
    expect(email.html).not.toContain('TypeScript');
    expect(email.text).not.toContain('Alice');
    expect(email.text).not.toContain('TypeScript');
  });

  it('masks hidden identity, org, school, and artifact data in masked-stage workflow payloads', () => {
    expect(
      applyWorkflowEmailPrivacy(
        {
          subject: 'Interview with Acme Org',
          organizationName: 'Acme Org',
          schoolName: 'Stockholm School of Economics',
          candidateName: 'Jordan Rivera',
          revealedName: 'Jordan Rivera',
          artifactDisplayName: 'jordan_resume.pdf',
        },
        {
          stage: 'masked',
          neutralSubject: 'Proofound workflow update',
          identityVisible: false,
          organizationVisible: false,
          schoolVisible: false,
          artifactVisible: false,
        }
      )
    ).toEqual({
      subject: 'Proofound workflow update',
      organizationName: 'the organization',
      schoolName: 'the institution',
      candidateName: 'your match',
      revealedName: 'your match',
      artifactDisplayName: 'the shared document',
    });
  });

  it('keeps masked-stage interview emails neutral in the active sender', async () => {
    resendSendMock.mockResolvedValueOnce({ id: 're_123' });

    await expect(
      sendInterviewScheduledEmail(
        'reviewer@example.com',
        'Taylor',
        'organization',
        {
          candidateName: 'Jordan Rivera',
          organizationName: 'Acme Org',
          scheduledAt: '2026-03-18T10:00:00.000Z',
          duration: 45,
          platform: 'zoom',
          meetingUrl: 'https://zoom.us/j/123',
          interviewId: 'interview-1',
        },
        {
          stage: 'masked',
        }
      )
    ).resolves.toBeUndefined();

    const payload = resendSendMock.mock.calls[0]?.[0];
    const renderedEmail = JSON.stringify(payload?.react);

    expect(payload?.subject).toBe('Proofound workflow update');
    expect(renderedEmail).not.toContain('Acme Org');
    expect(renderedEmail).not.toContain('Jordan Rivera');
    expect(renderedEmail).not.toContain('jordan_resume.pdf');
  });
});
