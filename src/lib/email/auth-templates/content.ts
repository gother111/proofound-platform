import { renderAuthEmailHtml, renderAuthEmailText } from './layout';

export type AuthEmailTemplateKind =
  | 'confirmation'
  | 'recovery'
  | 'magic_link'
  | 'invite'
  | 'email_change'
  | 'reauthentication';

export interface AuthEmailTemplateRenderOptions {
  actionUrl?: string;
  siteUrl?: string;
  token?: string;
  email?: string;
  newEmail?: string;
}

export interface AuthEmailTemplate {
  subject: string;
  html: string;
  text: string;
}

interface AuthEmailTemplateCopy {
  subject: string;
  previewText: string;
  heading: string;
  intro: string;
  actionLabel?: string;
  actionFallbackLabel?: string;
  secondaryText?: string;
  details?: Array<{ label: string; value: string }>;
  footerText: string;
}

const DEFAULT_SITE_URL = '{{ .SiteURL }}';
const DEFAULT_CONFIRMATION_URL = '{{ .ConfirmationURL }}';
const DEFAULT_TOKEN = '{{ .Token }}';
const DEFAULT_EMAIL = '{{ .Email }}';
const DEFAULT_NEW_EMAIL = '{{ .NewEmail }}';

function resolveActionUrl(kind: AuthEmailTemplateKind, actionUrl?: string): string | undefined {
  if (actionUrl) {
    return actionUrl;
  }

  if (kind === 'reauthentication') {
    return undefined;
  }

  return DEFAULT_CONFIRMATION_URL;
}

function buildCopy(
  kind: AuthEmailTemplateKind,
  options: AuthEmailTemplateRenderOptions
): AuthEmailTemplateCopy {
  const token = options.token ?? DEFAULT_TOKEN;
  const siteUrl = options.siteUrl ?? DEFAULT_SITE_URL;
  const email = options.email ?? DEFAULT_EMAIL;
  const newEmail = options.newEmail ?? DEFAULT_NEW_EMAIL;

  switch (kind) {
    case 'confirmation':
      return {
        subject: 'Verify your email - Proofound',
        previewText: 'Verify your email address to activate your Proofound account.',
        heading: 'Verify your email',
        intro:
          'Welcome to Proofound. Confirm your email address to activate your account and continue your onboarding.',
        actionLabel: 'Verify email',
        actionFallbackLabel: 'Verify with this secure link',
        secondaryText: 'If you did not create an account, you can ignore this email.',
        footerText: `This message was sent to ${email}.`,
      };
    case 'recovery':
      return {
        subject: 'Reset your password - Proofound',
        previewText: 'Use this secure link to reset your Proofound password.',
        heading: 'Reset your password',
        intro: 'We received a request to reset the password for your Proofound account.',
        actionLabel: 'Reset password',
        actionFallbackLabel: 'Reset using this secure link',
        secondaryText:
          'For your security, this link expires automatically. If you did not request this, no action is needed.',
        footerText: `This message was sent to ${email}.`,
      };
    case 'magic_link':
      return {
        subject: 'Your secure sign in link - Proofound',
        previewText: 'Use this magic link to sign in to Proofound.',
        heading: 'Sign in to Proofound',
        intro: 'Use the secure link below to continue signing in to your account.',
        actionLabel: 'Sign in securely',
        actionFallbackLabel: 'Sign in with this secure link',
        secondaryText: 'If you did not request this link, you can safely ignore this message.',
        footerText: `This message was sent to ${email}.`,
      };
    case 'invite':
      return {
        subject: 'You are invited to Proofound',
        previewText: 'Accept your Proofound invitation to join your organization.',
        heading: 'Accept your invitation',
        intro: 'You have been invited to join Proofound. Continue with the secure link below.',
        actionLabel: 'Accept invitation',
        actionFallbackLabel: 'Accept with this secure link',
        secondaryText: `You can also continue directly from ${siteUrl} after accepting the invite.`,
        footerText: `This invitation was sent to ${email}.`,
      };
    case 'email_change':
      return {
        subject: 'Confirm your new email - Proofound',
        previewText: 'Confirm your new email address for your Proofound account.',
        heading: 'Confirm your new email',
        intro: 'A request was made to change your account email address.',
        actionLabel: 'Confirm email change',
        actionFallbackLabel: 'Confirm using this secure link',
        details: [{ label: 'New email', value: newEmail }],
        secondaryText:
          'If you did not request this change, please secure your account by resetting your password.',
        footerText: `Email change request for ${email}.`,
      };
    case 'reauthentication':
      return {
        subject: 'Your verification code - Proofound',
        previewText: 'Enter this security code to continue.',
        heading: 'Security verification required',
        intro: 'Enter the one-time code below to continue your secure action.',
        details: [{ label: 'Verification code', value: token }],
        secondaryText: 'This code expires shortly. Never share it with anyone.',
        footerText: `Requested for ${email}.`,
      };
    default:
      return {
        subject: 'Proofound security message',
        previewText: 'Action required for your account.',
        heading: 'Action required',
        intro: 'Complete this action to continue using Proofound.',
        actionLabel: 'Continue',
        actionFallbackLabel: 'Continue with this secure link',
        footerText: `This message was sent to ${email}.`,
      };
  }
}

export function renderAuthEmailTemplate(
  kind: AuthEmailTemplateKind,
  options: AuthEmailTemplateRenderOptions = {}
): AuthEmailTemplate {
  const copy = buildCopy(kind, options);
  const actionUrl = resolveActionUrl(kind, options.actionUrl);

  const html = renderAuthEmailHtml({
    previewText: copy.previewText,
    heading: copy.heading,
    intro: copy.intro,
    actionLabel: copy.actionLabel,
    actionUrl,
    actionFallbackLabel: copy.actionFallbackLabel,
    secondaryText: copy.secondaryText,
    details: copy.details,
    footerText: copy.footerText,
  });

  const text = renderAuthEmailText({
    previewText: copy.previewText,
    heading: copy.heading,
    intro: copy.intro,
    actionLabel: copy.actionLabel,
    actionUrl,
    actionFallbackLabel: copy.actionFallbackLabel,
    secondaryText: copy.secondaryText,
    details: copy.details,
    footerText: copy.footerText,
  });

  return {
    subject: copy.subject,
    html,
    text,
  };
}

export function getSupportedAuthTemplateKinds(): AuthEmailTemplateKind[] {
  return ['confirmation', 'recovery', 'magic_link', 'invite', 'email_change', 'reauthentication'];
}
