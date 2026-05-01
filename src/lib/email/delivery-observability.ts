import * as Sentry from '@sentry/nextjs';

import { log } from '@/lib/log';
import { sanitizeErrorForLog } from '@/lib/privacy/log-redaction';

export type TransactionalEmailWorkflow =
  | 'verification'
  | 'reveal_request'
  | 'reveal_approved'
  | 'interview'
  | 'decision'
  | 'deletion'
  | 'assignment_invitation'
  | 'candidate_invite'
  | 'organization_invite'
  | 'password_reset'
  | 'contract'
  | 'feedback'
  | 'match'
  | 'admin_verification'
  | 'batch'
  | 'unknown';

export type EmailDeliveryFailureInput = {
  workflow: TransactionalEmailWorkflow;
  error: unknown;
  provider?: 'resend' | 'supabase-auth' | 'unknown';
  recipientCount?: number;
  route?: string;
  reason?: 'missing_provider_config' | 'provider_error' | 'exception' | 'missing_recipient';
};

export function buildEmailDeliveryFailureLogPayload(input: EmailDeliveryFailureInput) {
  return {
    workflow: input.workflow,
    provider: input.provider ?? 'resend',
    recipientCount: input.recipientCount ?? 1,
    route: input.route,
    reason: input.reason ?? 'exception',
    alert: true,
    error: sanitizeErrorForLog(input.error),
  };
}

export function recordEmailDeliveryFailure(input: EmailDeliveryFailureInput) {
  const payload = buildEmailDeliveryFailureLogPayload(input);

  log.error('transactional_email.delivery_failed', payload);

  Sentry.captureException(
    input.error instanceof Error ? input.error : new Error('Transactional email delivery failed'),
    {
      tags: {
        area: 'transactional_email',
        workflow: input.workflow,
        provider: input.provider ?? 'resend',
        reason: input.reason ?? 'exception',
      },
      extra: payload,
    }
  );
}
