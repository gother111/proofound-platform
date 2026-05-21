import { beforeEach, describe, expect, it, vi } from 'vitest';

const resendSendMock = vi.hoisted(() => vi.fn());
const sentryCaptureExceptionMock = vi.hoisted(() => vi.fn());

vi.hoisted(() => {
  process.env.RESEND_API_KEY = 're_test_launch_smoke';
});

vi.mock('resend', () => ({
  Resend: class Resend {
    emails = {
      send: resendSendMock,
    };
  },
}));

vi.mock('@sentry/nextjs', () => ({
  captureException: sentryCaptureExceptionMock,
}));

import {
  sendDeletionScheduledEmail,
  sendIdentityRevealedEmail,
  sendInterviewScheduledEmail,
  sendWorkEmailVerification,
} from '@/lib/email';
import { sendDecisionFeedbackEmail } from '@/lib/email/notifications';
import {
  buildEmailDeliveryFailureLogPayload,
  recordEmailDeliveryFailure,
} from '@/lib/email/delivery-observability';
import { sendEmail } from '@/lib/email/sender';
import {
  applyWorkflowEmailPrivacy,
  buildBlindSafeVerificationRequestEmail,
  buildRevealConversationUrl,
  buildRevealNotificationEmail,
} from '@/lib/email/privacy';

describe('workflow email privacy helper', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SITE_URL = 'https://proofound.io';
    process.env.RESEND_API_KEY = 're_test_launch_smoke';
  });

  const hiddenLeakageTerms = [
    'Jordan Rivera',
    'jordan@example.com',
    'Acme Org',
    'Stockholm School of Economics',
    'Jordan_Rivera_resume.pdf',
    'https://storage.supabase.co/private/Jordan_Rivera_resume.pdf',
    'Promoted to lead engineer after hidden reference review',
    'Private role title',
  ];

  function expectNoHiddenLeakage(rendered: string) {
    for (const term of hiddenLeakageTerms) {
      expect(rendered).not.toContain(term);
    }
  }

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
    expectNoHiddenLeakage(`${email.html}\n${email.text}`);
  });

  it('builds candidate reveal-request emails with candidate URLs and no hidden identity fields', () => {
    const conversationUrl = buildRevealConversationUrl({
      baseUrl: 'https://proofound.io',
      conversationId: 'conversation-1',
      role: 'candidate',
    });

    expect(conversationUrl).toBe(
      'https://proofound.io/app/i/communications?section=messages&conversation=conversation-1'
    );

    const email = buildRevealNotificationEmail({
      kind: 'request',
      recipientRole: 'candidate',
      conversationUrl: conversationUrl!,
      revealedName: 'Jordan Rivera',
    });
    const rendered = `${email.html}\n${email.text}`;

    expect(email.subject).toBe('Reveal request waiting in Proofound');
    expect(rendered).toContain(
      '/app/i/communications?section=messages&conversation=conversation-1'
    );
    expect(rendered).not.toContain('Jordan Rivera');
    expect(rendered).not.toContain('jordan@example.com');
    expect(rendered).not.toContain('Stockholm');
    expect(rendered).not.toContain('raw-proof-artifact.pdf');
    expectNoHiddenLeakage(rendered);
  });

  it('builds organization reveal-approved emails with org URLs and only consented fields', () => {
    const conversationUrl = buildRevealConversationUrl({
      baseUrl: 'https://proofound.io/',
      conversationId: 'conversation-1',
      role: 'organization',
      orgSlug: 'acme',
    });

    expect(conversationUrl).toBe(
      'https://proofound.io/app/o/acme/communications?section=messages&conversation=conversation-1'
    );

    const email = buildRevealNotificationEmail({
      kind: 'approved',
      recipientRole: 'organization',
      conversationUrl: conversationUrl!,
      revealedName: 'Jordan Rivera',
    });
    const rendered = `${email.html}\n${email.text}`;

    expect(email.subject).toBe('Reveal approved in Proofound');
    expect(rendered).toContain(
      '/app/o/acme/communications?section=messages&conversation=conversation-1'
    );
    expect(rendered).toContain('Jordan Rivera');
    expect(rendered).not.toContain('jordan@example.com');
    expect(rendered).not.toContain('Stockholm');
    expect(rendered).not.toContain('raw-proof-artifact.pdf');
    expect(rendered).not.toContain('https://storage.supabase.co/private/raw-proof-artifact.pdf');
  });

  it('omits non-consented post-reveal values that look like emails, files, or storage URLs', () => {
    const unsafeValues = [
      'jordan@example.com',
      'Jordan_Rivera_resume.pdf',
      'https://storage.supabase.co/private/Jordan_Rivera_resume.pdf',
    ];

    for (const revealedName of unsafeValues) {
      const email = buildRevealNotificationEmail({
        kind: 'approved',
        recipientRole: 'organization',
        conversationUrl:
          'https://proofound.io/app/o/acme/communications?section=messages&conversation=conversation-1',
        revealedName,
      });
      const rendered = `${email.html}\n${email.text}`;

      expect(rendered).not.toContain(revealedName);
      expect(rendered).not.toContain('Now visible:');
    }
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

  it('never carries upload-style filenames into revealed-stage workflow email payloads', () => {
    expect(
      applyWorkflowEmailPrivacy(
        {
          subject: 'Reveal approved',
          candidateName: 'Jordan Rivera',
          artifactDisplayName: 'Jordan_Rivera_resume.pdf',
        },
        {
          stage: 'revealed',
          identityVisible: true,
          artifactVisible: true,
        }
      )
    ).toEqual({
      subject: 'Reveal approved',
      candidateName: 'Jordan Rivera',
      artifactDisplayName: 'the shared document',
    });
  });

  it('never carries raw storage URLs into workflow email payloads', () => {
    expect(
      applyWorkflowEmailPrivacy(
        {
          subject: 'Reveal approved',
          artifactDisplayName: 'https://storage.supabase.co/private/jordan_resume.pdf',
        },
        {
          stage: 'revealed',
          artifactVisible: true,
        }
      )
    ).toEqual({
      subject: 'Reveal approved',
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
          platform: 'manual',
          meetingUrl: 'https://example.com/manual-room',
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

  it('smoke-builds staging transactional emails for verification, reveal, interview, decision, and deletion', async () => {
    resendSendMock.mockResolvedValue({ data: { id: 're_smoke' } });

    const revealRequestEmail = buildRevealNotificationEmail({
      kind: 'request',
      recipientRole: 'candidate',
      conversationUrl:
        'https://proofound.io/app/i/communications?section=messages&conversation=conversation-1',
      revealedName: 'Jordan Rivera',
    });

    await expect(
      sendWorkEmailVerification('worker@example.com', 'token-123', 'Worker')
    ).resolves.toBeUndefined();
    await expect(
      sendEmail({
        to: 'candidate@example.com',
        subject: revealRequestEmail.subject,
        html: revealRequestEmail.html,
        text: revealRequestEmail.text,
        workflow: 'reveal_request',
      })
    ).resolves.toEqual({ success: true, id: 're_smoke' });
    await expect(
      sendIdentityRevealedEmail('ops@example.com', 'Hiring team', 'organization', {
        revealedName: 'Jordan Rivera',
        orgSlug: 'acme',
        conversationId: 'conversation-1',
        profileId: 'profile-1',
      })
    ).resolves.toBeUndefined();
    const identityRevealPayload = resendSendMock.mock.calls.at(-1)?.[0];
    const identityRevealEmail = JSON.stringify(identityRevealPayload?.react);
    expect(identityRevealEmail).toContain('Proof-review participant now visible');
    expect(identityRevealEmail).toContain('organization');
    expect(identityRevealEmail).toContain('conversation to continue');
    expect(identityRevealEmail).not.toContain('Candidate now visible');
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
          platform: 'manual',
          meetingUrl: 'https://example.com/manual-room',
          interviewId: 'interview-1',
        },
        { stage: 'masked' }
      )
    ).resolves.toBeUndefined();
    await expect(
      sendDecisionFeedbackEmail({
        to: 'candidate@example.com',
        candidateName: 'Jordan Rivera',
        organizationName: 'Acme Org',
        decision: 'rejected',
        assignmentTitle: 'Private role title',
        feedback: 'Use the authenticated workflow for details.',
        privacy: { stage: 'masked' },
      })
    ).resolves.toEqual({ success: true, id: 're_smoke' });
    await expect(
      sendDeletionScheduledEmail(
        'candidate@example.com',
        'user-1',
        new Date('2026-04-18T10:00:00.000Z')
      )
    ).resolves.toBeUndefined();

    expect(resendSendMock).toHaveBeenCalledTimes(6);
  });

  it('keeps pre-reveal reveal, interview, and decision email bodies free of hidden identity and proof details', async () => {
    resendSendMock.mockResolvedValue({ data: { id: 're_privacy' } });

    const revealRequestEmail = buildRevealNotificationEmail({
      kind: 'request',
      recipientRole: 'candidate',
      conversationUrl:
        'https://proofound.io/app/i/communications?section=messages&conversation=conversation-1',
      revealedName: 'Jordan Rivera',
    });
    expectNoHiddenLeakage(`${revealRequestEmail.html}\n${revealRequestEmail.text}`);

    await sendInterviewScheduledEmail(
      'reviewer@example.com',
      'Taylor',
      'organization',
      {
        candidateName: 'Jordan Rivera',
        organizationName: 'Acme Org',
        roleTitle: 'Private role title',
        scheduledAt: '2026-03-18T10:00:00.000Z',
        duration: 45,
        platform: 'manual',
        meetingUrl: 'https://example.com/manual-room',
        interviewId: 'interview-1',
      },
      { stage: 'masked' }
    );

    await sendDecisionFeedbackEmail({
      to: 'candidate@example.com',
      candidateName: 'Jordan Rivera',
      organizationName: 'Acme Org',
      decision: 'rejected',
      assignmentTitle: 'Private role title',
      feedback: 'Promoted to lead engineer after hidden reference review',
      privacy: { stage: 'masked' },
    });

    const renderedEmails = resendSendMock.mock.calls
      .map((call) => JSON.stringify(call[0]))
      .join('\n');

    expectNoHiddenLeakage(renderedEmails);
  });

  it('redacts delivery failure logs and emits an operational alert without raw tokens', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const error = new Error(
      'Resend failed for jordan@example.com with token=raw-token-123 and file Jordan_Rivera_resume.pdf'
    );

    const payload = buildEmailDeliveryFailureLogPayload({
      workflow: 'verification',
      error,
      reason: 'provider_error',
    });

    expect(JSON.stringify(payload)).not.toContain('jordan@example.com');
    expect(JSON.stringify(payload)).not.toContain('raw-token-123');
    expect(JSON.stringify(payload)).not.toContain('Jordan_Rivera_resume.pdf');

    recordEmailDeliveryFailure({
      workflow: 'verification',
      error,
      reason: 'provider_error',
    });

    expect(sentryCaptureExceptionMock).toHaveBeenCalledWith(
      error,
      expect.objectContaining({
        tags: expect.objectContaining({
          area: 'transactional_email',
          workflow: 'verification',
        }),
      })
    );
    expect(consoleErrorSpy.mock.calls.join('\n')).not.toContain('raw-token-123');

    consoleErrorSpy.mockRestore();
  });
});
