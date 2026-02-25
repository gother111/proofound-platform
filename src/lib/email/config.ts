/**
 * Email Service Configuration
 *
 * Using Resend for transactional emails
 * https://resend.com/docs
 */

const normalizeProofoundAddress = (value: string | undefined, fallback: string): string => {
  if (!value || !value.trim()) {
    return fallback;
  }

  const trimmed = value.trim();
  const withNameMatch = trimmed.match(/^(?<name>.*?)\s*<\s*(?<email>[^>]+)\s*>$/);
  const emailPart =
    withNameMatch?.groups?.email?.trim() ?? trimmed.match(/\S+@\S+\.\S+/)?.[0]?.trim() ?? trimmed;

  const normalizedEmail = emailPart.toLowerCase().replace('proofound.com', 'proofound.io');

  const isAllowedProofoundAddress = ['no-reply@proofound.io', 'hello@proofound.io'].includes(
    normalizedEmail
  );

  if (!isAllowedProofoundAddress) {
    return fallback;
  }

  if (!withNameMatch) {
    return `Proofound <${normalizedEmail}>`;
  }

  const name = withNameMatch.groups?.name?.trim();
  return name ? `${name} <${normalizedEmail}>` : `Proofound <${normalizedEmail}>`;
};

const DEFAULT_FROM = 'Proofound <no-reply@proofound.io>';
const DEFAULT_REPLY_TO = 'hello@proofound.io';

export const EMAIL_CONFIG = {
  from: normalizeProofoundAddress(process.env.EMAIL_FROM, DEFAULT_FROM),
  replyTo: normalizeProofoundAddress(process.env.EMAIL_REPLY_TO, DEFAULT_REPLY_TO),
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
