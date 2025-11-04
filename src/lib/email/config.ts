/**
 * Email Service Configuration
 *
 * Using Resend for transactional emails
 * https://resend.com/docs
 */

export const EMAIL_CONFIG = {
  from: process.env.EMAIL_FROM || 'Proofound <noreply@proofound.com>',
  replyTo: process.env.EMAIL_REPLY_TO || 'support@proofound.com',
  apiKey: process.env.RESEND_API_KEY,
};

export const EMAIL_TEMPLATES = {
  ASSIGNMENT_INVITATION: 'assignment-invitation',
  INTERVIEW_SCHEDULED: 'interview-scheduled',
  CONTRACT_SIGNED: 'contract-signed',
  DECISION_FEEDBACK: 'decision-feedback',
  VERIFICATION_REQUEST: 'verification-request',
  MATCH_NOTIFICATION: 'match-notification',
} as const;

/**
 * Check if email service is configured
 */
export function isEmailConfigured(): boolean {
  return !!EMAIL_CONFIG.apiKey;
}

/**
 * Get email configuration status for debugging
 */
export function getEmailStatus() {
  return {
    configured: isEmailConfigured(),
    from: EMAIL_CONFIG.from,
    replyTo: EMAIL_CONFIG.replyTo,
    hasApiKey: !!EMAIL_CONFIG.apiKey,
  };
}
