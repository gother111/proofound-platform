import { Resend } from 'resend';
import { VerifyEmail } from '../../emails/VerifyEmail';
import { VerifyEmailIndividual } from '../../emails/VerifyEmailIndividual';
import { VerifyEmailOrganization } from '../../emails/VerifyEmailOrganization';
import { ResetPassword } from '../../emails/ResetPassword';
import { OrgInvite } from '../../emails/OrgInvite';
import CandidateInvite from '../../emails/CandidateInvite';
import { DeletionScheduled } from '../../emails/DeletionScheduled';
import { DeletionReminder } from '../../emails/DeletionReminder';
import { DeletionComplete } from '../../emails/DeletionComplete';
import WorkEmailVerification from '../../emails/WorkEmailVerification';
import SkillVerificationRequest from '../../emails/SkillVerificationRequest';
import NewMatchNotification from '../../emails/NewMatchNotification';
import FeedbackRequest from '../../emails/FeedbackRequest';
import InterviewScheduled from '../../emails/InterviewScheduled';
import IdentityRevealed from '../../emails/IdentityRevealed';
import VerificationApproved from '../../emails/VerificationApproved';
import VerificationRejected from '../../emails/VerificationRejected';
import LinkedInVerificationPendingReview from '../../emails/LinkedInVerificationPendingReview';
import { sendDebugIngest } from '@/lib/debug-ingest';
import { EMAIL_CONFIG, shouldSkipTransactionalEmailDelivery } from './email/config';
import {
  recordEmailDeliveryFailure,
  type TransactionalEmailWorkflow,
} from './email/delivery-observability';
import {
  applyWorkflowEmailPrivacy,
  buildRevealConversationUrl,
  type WorkflowEmailPrivacyOptions,
} from './email/privacy';
import { resolveCanonicalSiteUrl } from './env';

type ResendEmailPayload = Parameters<InstanceType<typeof Resend>['emails']['send']>[0];
type ResendEmailResult = Awaited<ReturnType<InstanceType<typeof Resend>['emails']['send']>>;

const resend = EMAIL_CONFIG.apiKey ? new Resend(EMAIL_CONFIG.apiKey) : null;
const fromEmail = EMAIL_CONFIG.from;

function recordLegacyEmailFailure(workflow: TransactionalEmailWorkflow, error: unknown) {
  recordEmailDeliveryFailure({
    workflow,
    error,
    provider: 'resend',
    reason: 'exception',
  });
}

async function sendLegacyResendEmail(payload: ResendEmailPayload): Promise<ResendEmailResult> {
  if (shouldSkipTransactionalEmailDelivery()) {
    return {
      data: { id: 'transactional-email-delivery-skipped' },
      error: null,
    } as ResendEmailResult;
  }

  if (!resend) {
    throw new Error('Email service not configured');
  }

  return resend.emails.send(payload);
}

function buildCanonicalEmailUrl(
  pathname: string,
  searchParams?: Record<string, string | number | boolean | null | undefined>
): string {
  const baseUrl = resolveCanonicalSiteUrl();
  if (!baseUrl) {
    throw new Error('canonical_site_url_missing');
  }

  const normalizedPath = pathname.startsWith('/') ? pathname : `/${pathname}`;
  const url = new URL(normalizedPath, `${baseUrl}/`);

  for (const [key, value] of Object.entries(searchParams ?? {})) {
    if (value === null || value === undefined) {
      continue;
    }

    const stringValue = String(value);
    if (stringValue.trim().length === 0) {
      continue;
    }

    url.searchParams.set(key, stringValue);
  }

  return url.toString();
}

export async function sendVerificationEmail(email: string, token: string, persona?: string) {
  try {
    const verifyUrl = buildCanonicalEmailUrl('/verify-email', { token });
    // Choose template based on persona
    let subject = 'Verify your email - Proofound';
    let template;

    if (persona === 'individual') {
      subject = 'Welcome to Proofound! Verify your email';
      template = VerifyEmailIndividual({ verifyUrl });
    } else if (persona === 'org_member') {
      subject = 'Welcome to Proofound! Verify your organization email';
      template = VerifyEmailOrganization({ verifyUrl });
    } else {
      // Default template for 'unknown' or missing persona
      template = VerifyEmail({ verifyUrl });
    }

    await sendLegacyResendEmail({
      from: fromEmail,
      to: email,
      subject,
      react: template,
    });
  } catch (error) {
    recordLegacyEmailFailure('verification', error);
    throw new Error('Failed to send verification email');
  }
}

export async function sendPasswordResetEmail(email: string, token: string) {
  try {
    const resetUrl = buildCanonicalEmailUrl('/reset-password', { token });
    await sendLegacyResendEmail({
      from: fromEmail,
      to: email,
      subject: 'Reset your password - Proofound',
      react: ResetPassword({ resetUrl }),
    });
  } catch (error) {
    recordLegacyEmailFailure('password_reset', error);
    throw new Error('Failed to send password reset email');
  }
}

export async function sendOrgInviteEmail(
  email: string,
  orgName: string,
  role: string,
  token: string,
  _orgSlug?: string
) {
  if (shouldSkipTransactionalEmailDelivery()) {
    return;
  }

  try {
    const inviteUrl = buildCanonicalEmailUrl('/accept-invite', { token });
    await sendLegacyResendEmail({
      from: fromEmail,
      to: email,
      subject: `You've been invited to join ${orgName} on Proofound`,
      react: OrgInvite({ orgName, role, inviteUrl }),
    });
  } catch (error) {
    recordLegacyEmailFailure('organization_invite', error);
    throw new Error('Failed to send org invite email');
  }
}

export async function sendCandidateInviteEmail(
  email: string,
  orgName: string,
  inviteUrl: string,
  expiryDays: number
) {
  try {
    await sendLegacyResendEmail({
      from: fromEmail,
      to: email,
      subject: `${orgName} invited you to share your Proof Card on Proofound`,
      react: CandidateInvite({
        orgName,
        inviteUrl,
        expiryDays,
      }),
    });
  } catch (error) {
    recordLegacyEmailFailure('candidate_invite', error);
    throw new Error('Failed to send candidate invite email');
  }
}

export async function sendDeletionScheduledEmail(
  email: string,
  userId: string,
  scheduledDate: Date
): Promise<void> {
  try {
    const settingsUrl = buildCanonicalEmailUrl('/settings', { tab: 'privacy' });
    await sendLegacyResendEmail({
      from: fromEmail,
      to: email,
      subject: 'Account Deletion Request Received - Proofound',
      react: DeletionScheduled({ scheduledDate, settingsUrl }),
    });
  } catch (error) {
    recordLegacyEmailFailure('deletion', error);
    throw new Error('Failed to send deletion scheduled email');
  }
}

export async function sendDeletionReminderEmail(
  email: string,
  userId: string,
  scheduledDate: Date,
  daysRemaining: number
): Promise<void> {
  try {
    const settingsUrl = buildCanonicalEmailUrl('/settings', { tab: 'privacy' });
    await sendLegacyResendEmail({
      from: fromEmail,
      to: email,
      subject: 'Account Deletion Update - Proofound',
      react: DeletionReminder({ scheduledDate, daysRemaining, settingsUrl }),
    });
  } catch (error) {
    recordLegacyEmailFailure('deletion', error);
    throw new Error('Failed to send deletion reminder email');
  }
}

export async function sendDeletionCompleteEmail(email: string, userId: string): Promise<void> {
  try {
    await sendLegacyResendEmail({
      from: fromEmail,
      to: email,
      subject: 'Your Proofound Account Has Been Deleted',
      react: DeletionComplete({ userId }),
    });
  } catch (error) {
    recordLegacyEmailFailure('deletion', error);
    throw new Error('Failed to send deletion complete email');
  }
}

export async function sendWorkEmailVerification(
  email: string,
  token: string,
  userName: string
): Promise<void> {
  try {
    const verifyUrl = buildCanonicalEmailUrl('/verify-work-email', { token });
    const result = await sendLegacyResendEmail({
      from: fromEmail,
      to: email,
      subject: 'Verify your work email - Proofound',
      react: WorkEmailVerification({ verifyUrl, userName }),
    });

    if (result && typeof result === 'object' && 'error' in result && result.error) {
      const errorMessage =
        typeof result.error === 'object' && result.error !== null && 'message' in result.error
          ? String((result.error as { message?: unknown }).message || 'Unknown email service error')
          : String(result.error);
      throw new Error(errorMessage);
    }
  } catch (error) {
    recordLegacyEmailFailure('verification', error);
    throw new Error('Failed to send work email verification');
  }
}

export async function sendSkillVerificationRequest(
  verifierEmail: string,
  requesterName: string,
  requesterHandle: string,
  skillName: string,
  token: string,
  message?: string
): Promise<void> {
  try {
    const verifyUrl = buildCanonicalEmailUrl(`/verify/${encodeURIComponent(token)}`);
    const declineUrl = verifyUrl;
    await sendLegacyResendEmail({
      from: fromEmail,
      to: verifierEmail,
      subject: `${requesterName} requested your skill verification - Proofound`,
      react: SkillVerificationRequest({
        requesterName,
        requesterHandle,
        skillName,
        verifyUrl,
        declineUrl,
        message,
      }),
    });
  } catch (error) {
    recordLegacyEmailFailure('verification', error);
    throw new Error('Failed to send skill verification request');
  }
}

export async function sendMatchNotification(
  recipientEmail: string,
  recipientName: string,
  matchData: {
    matchType: 'individual' | 'organization';
    proofFitLabel?: string;
    roleTitle?: string;
    organizationName?: string;
    topSkillMatches?: string[];
    matchId: string;
  }
): Promise<void> {
  try {
    const viewMatchUrl = buildCanonicalEmailUrl(
      `/app/i/matching?matchId=${encodeURIComponent(matchData.matchId)}`
    );
    await sendLegacyResendEmail({
      from: fromEmail,
      to: recipientEmail,
      subject: 'Proof review ready - Proofound',
      react: NewMatchNotification({
        recipientName,
        matchType: matchData.matchType,
        proofFitLabel: matchData.proofFitLabel,
        roleTitle: matchData.roleTitle,
        organizationName: matchData.organizationName,
        topSkillMatches: matchData.topSkillMatches,
        viewMatchUrl,
      }),
    });
  } catch (error) {
    recordLegacyEmailFailure('match', error);
    throw new Error('Failed to send match notification');
  }
}

export async function sendInterviewScheduledEmail(
  recipientEmail: string,
  recipientName: string,
  role: 'candidate' | 'organization',
  interviewData: {
    roleTitle?: string;
    organizationName?: string;
    candidateName?: string;
    scheduledAt: string;
    duration: number;
    platform: 'manual' | 'google_meet';
    meetingUrl: string;
    timezone?: string;
    interviewId: string;
  },
  privacy?: WorkflowEmailPrivacyOptions
): Promise<void> {
  const maskedStage = privacy?.stage === 'masked';
  const emailPrivacy = applyWorkflowEmailPrivacy(
    {
      subject: 'Interview Confirmed - Proofound',
      organizationName: interviewData.organizationName,
      candidateName: interviewData.candidateName,
    },
    {
      neutralSubject: 'Proofound workflow update',
      identityVisible: false,
      organizationVisible: false,
      ...privacy,
    }
  );

  try {
    const viewInterviewUrl = buildCanonicalEmailUrl(
      `/app/i/communications?section=interviews&interview=${encodeURIComponent(
        interviewData.interviewId
      )}`
    );
    await sendLegacyResendEmail({
      from: fromEmail,
      to: recipientEmail,
      subject: emailPrivacy.subject,
      react: InterviewScheduled({
        recipientName,
        role,
        roleTitle: maskedStage ? undefined : interviewData.roleTitle,
        organizationName: emailPrivacy.organizationName ?? undefined,
        candidateName: emailPrivacy.candidateName ?? undefined,
        scheduledAt: interviewData.scheduledAt,
        duration: interviewData.duration,
        platform: interviewData.platform,
        meetingUrl: interviewData.meetingUrl,
        timezone: interviewData.timezone,
        viewInterviewUrl,
      }),
    });
  } catch (error) {
    recordLegacyEmailFailure('interview', error);
    throw new Error('Failed to send interview scheduled email');
  }
}

export async function sendIdentityRevealedEmail(
  recipientEmail: string,
  recipientName: string,
  role: 'candidate' | 'organization',
  identityData: {
    revealedName: string;
    roleTitle?: string;
    organizationName?: string;
    orgSlug?: string;
    conversationId: string;
    profileId: string;
  },
  privacy?: WorkflowEmailPrivacyOptions
): Promise<void> {
  const emailPrivacy = applyWorkflowEmailPrivacy(
    {
      subject: 'Identities Revealed - Proofound',
      organizationName: identityData.organizationName,
      revealedName: identityData.revealedName,
    },
    {
      neutralSubject: 'Proofound workflow update',
      identityVisible: false,
      organizationVisible: false,
      ...privacy,
    }
  );

  try {
    const viewConversationUrl = buildRevealConversationUrl({
      baseUrl: resolveCanonicalSiteUrl(),
      conversationId: identityData.conversationId,
      role,
      orgSlug: identityData.orgSlug,
    });
    if (!viewConversationUrl) {
      throw new Error('canonical_site_url_missing');
    }
    await sendLegacyResendEmail({
      from: fromEmail,
      to: recipientEmail,
      subject: emailPrivacy.subject,
      react: IdentityRevealed({
        recipientName,
        role,
        revealedName: emailPrivacy.revealedName ?? 'your match',
        roleTitle: identityData.roleTitle,
        organizationName: emailPrivacy.organizationName ?? undefined,
        viewConversationUrl,
      }),
    });
  } catch (error) {
    recordLegacyEmailFailure('reveal_approved', error);
    throw new Error('Failed to send identity revealed email');
  }
}

export async function sendFeedbackRequestEmail(params: {
  to: string;
  direction: 'candidate_to_org' | 'org_to_candidate';
  token: string;
  expiresAt?: string;
  interviewTime?: string;
}) {
  const { to, direction, token, expiresAt, interviewTime } = params;

  sendDebugIngest({
    sessionId: 'debug-session',
    runId: 'launch-readiness',
    hypothesisId: 'H-email',
    location: 'email.ts:sendFeedbackRequestEmail',
    message: 'Send feedback request email',
    data: {
      direction,
      hasToken: Boolean(token),
      hasExpiresAt: Boolean(expiresAt),
      hasInterviewTime: Boolean(interviewTime),
    },
  });

  try {
    const feedbackUrl = buildCanonicalEmailUrl(`/feedback/${encodeURIComponent(token)}`);
    await sendLegacyResendEmail({
      from: fromEmail,
      to,
      subject:
        direction === 'candidate_to_org'
          ? 'Share your interview experience'
          : 'Share workflow feedback',
      react: FeedbackRequest({ direction, feedbackUrl, expiresAt, interviewTime }),
    });
  } catch (error) {
    recordLegacyEmailFailure('feedback', error);
    throw new Error('Failed to send feedback request email');
  }
}

export async function sendVerificationApprovedEmail(
  recipientEmail: string,
  recipientName: string,
  verificationType: 'linkedin' | 'work-email' | 'veriff',
  profileId: string
): Promise<void> {
  try {
    const viewProfileUrl = buildCanonicalEmailUrl(`/app/profile/${encodeURIComponent(profileId)}`);
    await sendLegacyResendEmail({
      from: fromEmail,
      to: recipientEmail,
      subject: 'Verification Approved - Proofound',
      react: VerificationApproved({
        recipientName,
        verificationType,
        viewProfileUrl,
      }),
    });
  } catch (error) {
    recordLegacyEmailFailure('verification', error);
    throw new Error('Failed to send verification approved email');
  }
}

function parseEmailRecipientList(raw: string | undefined): string[] {
  if (!raw) return [];

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const deduped = new Set<string>();

  for (const candidate of raw.split(',')) {
    const normalized = candidate.trim().toLowerCase();
    if (!normalized || !emailRegex.test(normalized)) continue;
    deduped.add(normalized);
  }

  return [...deduped];
}

function resolveLinkedInVerificationAdminRecipients(): string[] {
  const explicitRecipients = parseEmailRecipientList(
    process.env.LINKEDIN_VERIFICATION_ADMIN_EMAILS
  );
  if (explicitRecipients.length > 0) {
    return explicitRecipients;
  }

  return parseEmailRecipientList(process.env.PLATFORM_ADMIN_EMAILS);
}

export async function sendLinkedInVerificationPendingReviewEmail(params: {
  candidateName: string;
  candidateEmail: string | null;
  candidateProfileId: string;
  confidence: number;
  hasIdentityVerification: boolean;
  hasWorkplaceVerification: boolean;
  linkedinProfileUrl: string | null;
}): Promise<void> {
  const recipients = resolveLinkedInVerificationAdminRecipients();

  if (recipients.length === 0) {
    recordEmailDeliveryFailure({
      workflow: 'admin_verification',
      error: new Error('LinkedIn verification admin recipients are not configured'),
      provider: 'resend',
      recipientCount: 0,
      reason: 'missing_recipient',
    });
    return;
  }

  try {
    const adminQueueUrl = buildCanonicalEmailUrl('/admin/verification');
    await sendLegacyResendEmail({
      from: fromEmail,
      to: recipients,
      subject: `LinkedIn verification pending review: ${params.candidateName}`,
      react: LinkedInVerificationPendingReview({
        candidateName: params.candidateName,
        candidateEmail: params.candidateEmail,
        candidateProfileId: params.candidateProfileId,
        confidence: params.confidence,
        hasIdentityVerification: params.hasIdentityVerification,
        hasWorkplaceVerification: params.hasWorkplaceVerification,
        linkedinProfileUrl: params.linkedinProfileUrl,
        adminQueueUrl,
      }),
    });
  } catch (error) {
    recordLegacyEmailFailure('admin_verification', error);
    throw new Error('Failed to send LinkedIn pending review notification email');
  }
}

export async function sendVerificationRejectedEmail(
  recipientEmail: string,
  recipientName: string,
  verificationType: 'linkedin' | 'work-email' | 'veriff',
  rejectionReason?: string
): Promise<void> {
  try {
    const retryUrl = buildCanonicalEmailUrl('/app/i/settings', { tab: 'verification' });
    await sendLegacyResendEmail({
      from: fromEmail,
      to: recipientEmail,
      subject: 'Verification Not Approved - Proofound',
      react: VerificationRejected({
        recipientName,
        verificationType,
        rejectionReason,
        retryUrl,
      }),
    });
  } catch (error) {
    recordLegacyEmailFailure('verification', error);
    throw new Error('Failed to send verification rejected email');
  }
}
