/**
 * Email Notification Helpers
 *
 * High-level functions for sending specific notification emails
 */

import { sendEmail } from './sender';
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
}) {
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
    candidateName: params.candidateName,
    organizationName: params.organizationName,
    interviewDate: interviewDateFormatted,
    interviewTime: interviewTimeFormatted,
    duration: params.duration.toString(),
    meetingLink: params.meetingLink,
    calendarInvite: params.calendarInvite,
    assignmentTitle: params.assignmentTitle,
  });

  const text = InterviewScheduledEmailText({
    candidateName: params.candidateName,
    organizationName: params.organizationName,
    interviewDate: interviewDateFormatted,
    interviewTime: interviewTimeFormatted,
    duration: params.duration.toString(),
    meetingLink: params.meetingLink,
    assignmentTitle: params.assignmentTitle,
  });

  return await sendEmail({
    to: params.to,
    subject: `Interview scheduled with ${params.organizationName}`,
    html,
    text,
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
}) {
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
    <p style="font-size: 18px; margin-bottom: 20px;">Hi ${params.candidateName},</p>

    <p>Congratulations! The ${params.contractType} contract with <strong>${params.organizationName}</strong> has been signed${params.assignmentTitle ? ` for the <strong>${params.assignmentTitle}</strong> opportunity` : ''}.</p>

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

Hi ${params.candidateName},

Congratulations! The ${params.contractType} contract with ${params.organizationName} has been signed${params.assignmentTitle ? ` for the ${params.assignmentTitle} opportunity` : ''}.

What's Next?
${params.nextSteps || 'You will receive further details from the organization shortly.'}

You can view your contract details in your Proofound dashboard.
  `.trim();

  return await sendEmail({
    to: params.to,
    subject: `Contract signed with ${params.organizationName}!`,
    html,
    text,
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
}) {
  const isAccepted = params.decision === 'accepted';

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
    <p style="font-size: 18px; margin-bottom: 20px;">Hi ${params.candidateName},</p>

    <p>Thank you for your interest in ${params.assignmentTitle ? `the <strong>${params.assignmentTitle}</strong> opportunity with` : ''} <strong>${params.organizationName}</strong>.</p>

    ${params.feedback ? `
    <div style="background-color: #F7F6F1; border-left: 4px solid #4A5943; border-radius: 6px; padding: 16px; margin: 24px 0;">
      <h3 style="margin: 0 0 12px 0; color: #1C4D3A;">Feedback from ${params.organizationName}:</h3>
      <p style="margin: 0;">${params.feedback}</p>
    </div>
    ` : ''}

    <p style="font-size: 14px; color: #6B6760; margin-top: 30px;">
      ${isAccepted ? 'You will receive next steps shortly.' : 'We encourage you to continue exploring opportunities on Proofound.'}
    </p>
  </div>
</body>
</html>
  `;

  const text = `
Application Update

Hi ${params.candidateName},

Thank you for your interest in ${params.assignmentTitle ? `the ${params.assignmentTitle} opportunity with` : ''} ${params.organizationName}.

${params.feedback ? `Feedback from ${params.organizationName}:\n${params.feedback}\n\n` : ''}

${isAccepted ? 'You will receive next steps shortly.' : 'We encourage you to continue exploring opportunities on Proofound.'}
  `.trim();

  return await sendEmail({
    to: params.to,
    subject: `Application update from ${params.organizationName}`,
    html,
    text,
  });
}
