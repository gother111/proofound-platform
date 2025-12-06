import { Resend } from 'resend';
import { VerifyEmail } from '../../emails/VerifyEmail';
import { VerifyEmailIndividual } from '../../emails/VerifyEmailIndividual';
import { VerifyEmailOrganization } from '../../emails/VerifyEmailOrganization';
import { ResetPassword } from '../../emails/ResetPassword';
import { OrgInvite } from '../../emails/OrgInvite';
import { DeletionScheduled } from '../../emails/DeletionScheduled';
import { DeletionReminder } from '../../emails/DeletionReminder';
import { DeletionComplete } from '../../emails/DeletionComplete';
import WorkEmailVerification from '../../emails/WorkEmailVerification';
import SkillVerificationRequest from '../../emails/SkillVerificationRequest';
import NewMatchNotification from '../../emails/NewMatchNotification';
import ContractSigned from '../../emails/ContractSigned';
import InterviewScheduled from '../../emails/InterviewScheduled';
import IdentityRevealed from '../../emails/IdentityRevealed';
import VerificationApproved from '../../emails/VerificationApproved';
import VerificationRejected from '../../emails/VerificationRejected';
import SmartAlertEmail from '../../emails/SmartAlertEmail';

// Allow build to succeed without RESEND_API_KEY
const resend = new Resend(process.env.RESEND_API_KEY || 'placeholder_key');
const fromEmail = process.env.EMAIL_FROM || 'Proofound <no-reply@proofound.com>';

export async function sendVerificationEmail(email: string, token: string, persona?: string) {
  const verifyUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/verify-email?token=${token}`;

  try {
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

    await resend.emails.send({
      from: fromEmail,
      to: email,
      subject,
      react: template,
    });
  } catch (error) {
    console.error('Failed to send verification email:', error);
    throw new Error('Failed to send verification email');
  }
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const resetUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password?token=${token}`;

  try {
    await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: 'Reset your password - Proofound',
      react: ResetPassword({ resetUrl }),
    });
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    throw new Error('Failed to send password reset email');
  }
}

export async function sendOrgInviteEmail(
  email: string,
  orgName: string,
  role: string,
  token: string
) {
  const inviteUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/accept-invite?token=${token}`;

  try {
    await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: `You've been invited to join ${orgName} on Proofound`,
      react: OrgInvite({ orgName, role, inviteUrl }),
    });
  } catch (error) {
    console.error('Failed to send org invite email:', error);
    throw new Error('Failed to send org invite email');
  }
}

export async function sendDeletionScheduledEmail(
  email: string,
  userId: string,
  scheduledDate: Date
): Promise<void> {
  const cancellationUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/settings?tab=privacy`;

  try {
    await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: 'Account Deletion Scheduled - Proofound',
      react: DeletionScheduled({ scheduledDate, cancellationUrl }),
    });
  } catch (error) {
    console.error('Failed to send deletion scheduled email:', error);
    throw new Error('Failed to send deletion scheduled email');
  }
}

export async function sendDeletionReminderEmail(
  email: string,
  userId: string,
  scheduledDate: Date,
  daysRemaining: number
): Promise<void> {
  const cancellationUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/settings?tab=privacy`;

  try {
    await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: `${daysRemaining} Days Until Your Proofound Account is Deleted`,
      react: DeletionReminder({ scheduledDate, daysRemaining, cancellationUrl }),
    });
  } catch (error) {
    console.error('Failed to send deletion reminder email:', error);
    throw new Error('Failed to send deletion reminder email');
  }
}

export async function sendDeletionCompleteEmail(email: string, userId: string): Promise<void> {
  try {
    await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: 'Your Proofound Account Has Been Deleted',
      react: DeletionComplete({ userId }),
    });
  } catch (error) {
    console.error('Failed to send deletion complete email:', error);
    throw new Error('Failed to send deletion complete email');
  }
}

export async function sendWorkEmailVerification(
  email: string,
  token: string,
  userName: string
): Promise<void> {
  const verifyUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/verify-work-email?token=${token}`;

  try {
    await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: 'Verify your work email - Proofound',
      react: WorkEmailVerification({ verifyUrl, userName }),
    });
  } catch (error) {
    console.error('Failed to send work email verification:', error);
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
  const verifyUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/verify-skill?token=${token}&action=approve`;
  const declineUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/verify-skill?token=${token}&action=decline`;

  try {
    await resend.emails.send({
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
    console.error('Failed to send skill verification request:', error);
    throw new Error('Failed to send skill verification request');
  }
}

export async function sendMatchNotification(
  recipientEmail: string,
  recipientName: string,
  matchData: {
    matchType: 'individual' | 'organization';
    matchScore: number;
    roleTitle?: string;
    organizationName?: string;
    topSkillMatches?: string[];
    matchId: string;
  }
): Promise<void> {
  const viewMatchUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/app/i/matches/${matchData.matchId}`;

  try {
    await resend.emails.send({
      from: fromEmail,
      to: recipientEmail,
      subject: 'You have a new match! - Proofound',
      react: NewMatchNotification({
        recipientName,
        matchType: matchData.matchType,
        matchScore: matchData.matchScore,
        roleTitle: matchData.roleTitle,
        organizationName: matchData.organizationName,
        topSkillMatches: matchData.topSkillMatches,
        viewMatchUrl,
      }),
    });
  } catch (error) {
    console.error('Failed to send match notification:', error);
    throw new Error('Failed to send match notification');
  }
}

export async function sendContractSignedEmail(
  recipientEmail: string,
  recipientName: string,
  role: 'candidate' | 'organization',
  contractData: {
    roleTitle?: string;
    organizationName?: string;
    candidateName?: string;
    contractType: string;
    startDate?: string;
    compensationAmount?: number;
    compensationCurrency?: string;
    compensationPeriod?: string;
    contractId: string;
  }
): Promise<void> {
  const viewContractUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/app/contracts/${contractData.contractId}`;

  try {
    await resend.emails.send({
      from: fromEmail,
      to: recipientEmail,
      subject: 'Contract Successfully Signed - Proofound',
      react: ContractSigned({
        recipientName,
        role,
        roleTitle: contractData.roleTitle,
        organizationName: contractData.organizationName,
        candidateName: contractData.candidateName,
        contractType: contractData.contractType,
        startDate: contractData.startDate,
        compensationAmount: contractData.compensationAmount,
        compensationCurrency: contractData.compensationCurrency,
        compensationPeriod: contractData.compensationPeriod,
        viewContractUrl,
      }),
    });
  } catch (error) {
    console.error('Failed to send contract signed email:', error);
    throw new Error('Failed to send contract signed email');
  }
}

export async function sendSmartAlertEmail(params: {
  to: string;
  recipientName?: string | null;
  title: string;
  summary: string;
  ctaUrl: string;
  ctaLabel?: string;
  contextTag?: string;
  subject?: string;
}) {
  try {
    await resend.emails.send({
      from: fromEmail,
      to: params.to,
      subject: params.subject || params.title,
      react: SmartAlertEmail({
        recipientName: params.recipientName,
        title: params.title,
        summary: params.summary,
        ctaUrl: params.ctaUrl,
        ctaLabel: params.ctaLabel,
        contextTag: params.contextTag,
      }),
    });
  } catch (error) {
    console.error('Failed to send smart alert email:', error);
    throw new Error('Failed to send smart alert email');
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
    platform: 'zoom' | 'google-meet';
    meetingUrl: string;
    timezone?: string;
    interviewId: string;
  }
): Promise<void> {
  const viewInterviewUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/app/i/interviews/${interviewData.interviewId}`;

  try {
    await resend.emails.send({
      from: fromEmail,
      to: recipientEmail,
      subject: 'Interview Confirmed - Proofound',
      react: InterviewScheduled({
        recipientName,
        role,
        roleTitle: interviewData.roleTitle,
        organizationName: interviewData.organizationName,
        candidateName: interviewData.candidateName,
        scheduledAt: interviewData.scheduledAt,
        duration: interviewData.duration,
        platform: interviewData.platform,
        meetingUrl: interviewData.meetingUrl,
        timezone: interviewData.timezone,
        viewInterviewUrl,
      }),
    });
  } catch (error) {
    console.error('Failed to send interview scheduled email:', error);
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
    conversationId: string;
    profileId: string;
  }
): Promise<void> {
  const viewConversationUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/app/i/messages/${identityData.conversationId}`;
  const viewProfileUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/app/profile/${identityData.profileId}`;

  try {
    await resend.emails.send({
      from: fromEmail,
      to: recipientEmail,
      subject: 'Identities Revealed - Proofound',
      react: IdentityRevealed({
        recipientName,
        role,
        revealedName: identityData.revealedName,
        roleTitle: identityData.roleTitle,
        organizationName: identityData.organizationName,
        viewConversationUrl,
        viewProfileUrl,
      }),
    });
  } catch (error) {
    console.error('Failed to send identity revealed email:', error);
    throw new Error('Failed to send identity revealed email');
  }
}

export async function sendVerificationApprovedEmail(
  recipientEmail: string,
  recipientName: string,
  verificationType: 'linkedin' | 'work-email' | 'veriff',
  profileId: string
): Promise<void> {
  const viewProfileUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/app/profile/${profileId}`;

  try {
    await resend.emails.send({
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
    console.error('Failed to send verification approved email:', error);
    throw new Error('Failed to send verification approved email');
  }
}

export async function sendVerificationRejectedEmail(
  recipientEmail: string,
  recipientName: string,
  verificationType: 'linkedin' | 'work-email' | 'veriff',
  rejectionReason?: string
): Promise<void> {
  const retryUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/app/i/settings?tab=verification`;

  try {
    await resend.emails.send({
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
    console.error('Failed to send verification rejected email:', error);
    throw new Error('Failed to send verification rejected email');
  }
}
