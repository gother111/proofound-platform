/**
 * Email Notification Helpers
 *
 * High-level functions for sending specific notification emails
 */

import { sendEmail } from './sender';
import { applyWorkflowEmailPrivacy, type WorkflowEmailPrivacyOptions } from './privacy';
import {
  AssignmentInvitationEmail,
  AssignmentInvitationEmailText,
} from './templates/assignment-invitation';
import {
  InterviewScheduledEmail,
  InterviewScheduledEmailText,
} from './templates/interview-scheduled';

/**
 * Send assignment invitation email to stakeholder
 */
export async function sendAssignmentInvitationEmail(params: {
  to: string;
  stakeholderName?: string;
  organizationName: string;
  assignedSections: string[];
  message?: string;
  invitationUrl: string;
  expiryDate: Date;
}) {
  const expiryDateFormatted = params.expiryDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const html = AssignmentInvitationEmail({
    ...params,
    expiryDate: expiryDateFormatted,
  });

  const text = AssignmentInvitationEmailText({
    ...params,
    expiryDate: expiryDateFormatted,
  });

  return await sendEmail({
    to: params.to,
    subject: `${params.organizationName} invited you to contribute to their profile`,
    html,
    text,
    workflow: 'assignment_invitation',
  });
}

/**
 * Send interview scheduled email to candidate
 */
export async function sendInterviewScheduledEmail(params: {
  to: string;
  candidateName: string;
  organizationName: string;
  interviewDate: Date;
  duration: number;
  meetingLink?: string;
  calendarInvite?: string;
  assignmentTitle?: string;
  privacy?: WorkflowEmailPrivacyOptions;
}) {
  const emailPrivacy = applyWorkflowEmailPrivacy(
    {
      subject: `Interview scheduled with ${params.organizationName}`,
      organizationName: params.organizationName,
      candidateName: params.candidateName,
    },
    {
      neutralSubject: 'Proofound workflow update',
      identityVisible: false,
      organizationVisible: false,
      ...params.privacy,
    }
  );
  const interviewDateFormatted = params.interviewDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const interviewTimeFormatted = params.interviewDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  });

  const html = InterviewScheduledEmail({
    candidateName: emailPrivacy.candidateName ?? 'your match',
    organizationName: emailPrivacy.organizationName ?? 'the organization',
    interviewDate: interviewDateFormatted,
    interviewTime: interviewTimeFormatted,
    duration: params.duration.toString(),
    meetingLink: params.meetingLink,
    calendarInvite: params.calendarInvite,
    assignmentTitle: params.assignmentTitle,
  });

  const text = InterviewScheduledEmailText({
    candidateName: emailPrivacy.candidateName ?? 'your match',
    organizationName: emailPrivacy.organizationName ?? 'the organization',
    interviewDate: interviewDateFormatted,
    interviewTime: interviewTimeFormatted,
    duration: params.duration.toString(),
    meetingLink: params.meetingLink,
    assignmentTitle: params.assignmentTitle,
  });

  return await sendEmail({
    to: params.to,
    subject: emailPrivacy.subject,
    html,
    text,
    workflow: 'interview',
  });
}

/**
 * Send contract signed notification
 */
export async function sendContractSignedEmail(params: {
  to: string;
  candidateName: string;
  organizationName: string;
  contractType: string;
  assignmentTitle?: string;
  nextSteps?: string;
  privacy?: WorkflowEmailPrivacyOptions;
}) {
  const emailPrivacy = applyWorkflowEmailPrivacy(
    {
      subject: `Contract signed with ${params.organizationName}!`,
      organizationName: params.organizationName,
      candidateName: params.candidateName,
    },
    {
      neutralSubject: 'Proofound workflow update',
      identityVisible: false,
      organizationVisible: false,
      ...params.privacy,
    }
  );
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Contract Signed</title>
</head>
<body style="font-family: sans-serif; line-height: 1.6; color: #2D3330; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #1C4D3A 0%, #2D5F4A 100%); color: white; padding: 40px 30px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="margin: 0; font-size: 28px;">🎉 Contract Signed!</h1>
  </div>

  <div style="padding: 40px 30px; background-color: white; border-radius: 0 0 8px 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <p style="font-size: 18px; margin-bottom: 20px;">Hi ${emailPrivacy.candidateName || 'there'},</p>

    <p>Congratulations! The ${params.contractType} contract with <strong>${emailPrivacy.organizationName || 'the organization'}</strong> has been signed${params.assignmentTitle ? ` for the <strong>${params.assignmentTitle}</strong> opportunity` : ''}.</p>

    <div style="background-color: #F7F6F1; border-radius: 8px; padding: 24px; margin: 24px 0;">
      <h3 style="margin: 0 0 12px 0; color: #1C4D3A;">What's Next?</h3>
      <p style="margin: 0;">${params.nextSteps || 'You will receive further details from the organization shortly.'}</p>
    </div>

    <p style="font-size: 14px; color: #6B6760; margin-top: 30px;">
      You can view your contract details in your Proofound dashboard.
    </p>
  </div>
</body>
</html>
  `;

  const text = `
Contract Signed!

Hi ${emailPrivacy.candidateName || 'there'},

Congratulations! The ${params.contractType} contract with ${emailPrivacy.organizationName || 'the organization'} has been signed${params.assignmentTitle ? ` for the ${params.assignmentTitle} opportunity` : ''}.

What's Next?
${params.nextSteps || 'You will receive further details from the organization shortly.'}

You can view your contract details in your Proofound dashboard.
  `.trim();

  return await sendEmail({
    to: params.to,
    subject: emailPrivacy.subject,
    html,
    text,
    workflow: 'contract',
  });
}

/**
 * Send decision feedback email to candidate
 */
export async function sendDecisionFeedbackEmail(params: {
  to: string;
  candidateName: string;
  organizationName: string;
  decision: 'accepted' | 'rejected';
  feedback?: string;
  assignmentTitle?: string;
  privacy?: WorkflowEmailPrivacyOptions;
}) {
  const isAccepted = params.decision === 'accepted';
  const maskedStage = params.privacy?.stage === 'masked';
  const safeAssignmentTitle = maskedStage ? undefined : params.assignmentTitle;
  const safeFeedback = maskedStage ? undefined : params.feedback;
  const emailPrivacy = applyWorkflowEmailPrivacy(
    {
      subject: `Application update from ${params.organizationName}`,
      organizationName: params.organizationName,
      candidateName: params.candidateName,
    },
    {
      neutralSubject: 'Proofound workflow update',
      identityVisible: false,
      organizationVisible: false,
      ...params.privacy,
    }
  );

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Application Update</title>
</head>
<body style="font-family: sans-serif; line-height: 1.6; color: #2D3330; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: ${isAccepted ? 'linear-gradient(135deg, #1C4D3A 0%, #2D5F4A 100%)' : 'linear-gradient(135deg, #6B6760 0%, #8B8680 100%)'}; color: white; padding: 40px 30px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="margin: 0; font-size: 28px;">${isAccepted ? '🎉' : '📧'} Application Update</h1>
  </div>

  <div style="padding: 40px 30px; background-color: white; border-radius: 0 0 8px 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <p style="font-size: 18px; margin-bottom: 20px;">Hi ${emailPrivacy.candidateName || 'there'},</p>

    <p>Thank you for your interest in ${safeAssignmentTitle ? `the <strong>${safeAssignmentTitle}</strong> opportunity with` : ''} <strong>${emailPrivacy.organizationName || 'the organization'}</strong>.</p>

    ${
      safeFeedback
        ? `
    <div style="background-color: #F7F6F1; border-left: 4px solid #1C4D3A; border-radius: 6px; padding: 16px; margin: 24px 0;">
      <h3 style="margin: 0 0 12px 0; color: #1C4D3A;">Feedback from ${emailPrivacy.organizationName || 'the organization'}:</h3>
      <p style="margin: 0;">${safeFeedback}</p>
    </div>
    `
        : ''
    }

    <p style="font-size: 14px; color: #6B6760; margin-top: 30px;">
      ${isAccepted ? 'You will receive next steps shortly.' : 'We encourage you to continue exploring opportunities on Proofound.'}
    </p>
  </div>
</body>
</html>
  `;

  const text = `
Application Update

Hi ${emailPrivacy.candidateName || 'there'},

Thank you for your interest in ${safeAssignmentTitle ? `the ${safeAssignmentTitle} opportunity with` : ''} ${emailPrivacy.organizationName || 'the organization'}.

${safeFeedback ? `Feedback from ${emailPrivacy.organizationName || 'the organization'}:\n${safeFeedback}\n\n` : ''}

${isAccepted ? 'You will receive next steps shortly.' : 'We encourage you to continue exploring opportunities on Proofound.'}
  `.trim();

  return await sendEmail({
    to: params.to,
    subject: emailPrivacy.subject,
    html,
    text,
    workflow: 'decision',
  });
}
