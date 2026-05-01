/**
 * Email Sender Utility
 *
 * Handles sending transactional emails via Resend
 */

import { Resend } from 'resend';
import { EMAIL_CONFIG, isEmailConfigured } from './config';
import {
  recordEmailDeliveryFailure,
  type TransactionalEmailWorkflow,
} from './delivery-observability';

// Initialize Resend client
const resend = EMAIL_CONFIG.apiKey ? new Resend(EMAIL_CONFIG.apiKey) : null;

export interface SendEmailParams {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  cc?: string[];
  bcc?: string[];
  workflow?: TransactionalEmailWorkflow;
}

/**
 * Send an email via Resend
 */
export async function sendEmail(
  params: SendEmailParams
): Promise<{ success: boolean; id?: string; error?: string }> {
  // Check if email is configured
  if (!isEmailConfigured() || !resend) {
    recordEmailDeliveryFailure({
      workflow: params.workflow ?? 'unknown',
      error: new Error('Email service not configured'),
      provider: 'resend',
      recipientCount: Array.isArray(params.to) ? params.to.length : 1,
      reason: 'missing_provider_config',
    });

    // In development, log the email instead of sending
    if (process.env.NODE_ENV === 'development') {
      return { success: true, id: 'dev-mock-id' };
    }

    return { success: false, error: 'Email service not configured' };
  }

  try {
    const result = await resend.emails.send({
      from: EMAIL_CONFIG.from,
      to: Array.isArray(params.to) ? params.to : [params.to],
      subject: params.subject,
      html: params.html,
      text: params.text,
      reply_to: params.replyTo || EMAIL_CONFIG.replyTo,
      cc: params.cc,
      bcc: params.bcc,
    });

    if (result.error) {
      recordEmailDeliveryFailure({
        workflow: params.workflow ?? 'unknown',
        error: result.error,
        provider: 'resend',
        recipientCount: Array.isArray(params.to) ? params.to.length : 1,
        reason: 'provider_error',
      });
      return { success: false, error: result.error.message };
    }

    return { success: true, id: result.data?.id };
  } catch (error) {
    recordEmailDeliveryFailure({
      workflow: params.workflow ?? 'unknown',
      error,
      provider: 'resend',
      recipientCount: Array.isArray(params.to) ? params.to.length : 1,
      reason: 'exception',
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send multiple emails in batch
 */
export async function sendBatchEmails(
  emails: SendEmailParams[]
): Promise<{ success: boolean; results: any[] }> {
  if (!isEmailConfigured() || !resend) {
    recordEmailDeliveryFailure({
      workflow: 'batch',
      error: new Error('Email service not configured'),
      provider: 'resend',
      recipientCount: emails.length,
      reason: 'missing_provider_config',
    });
    return { success: false, results: [] };
  }

  try {
    const results = await Promise.allSettled(emails.map((email) => sendEmail(email)));

    const successful = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;

    return {
      success: failed === 0,
      results: results.map((r) =>
        r.status === 'fulfilled' ? r.value : { success: false, error: 'Promise rejected' }
      ),
    };
  } catch (error) {
    recordEmailDeliveryFailure({
      workflow: 'batch',
      error,
      provider: 'resend',
      recipientCount: emails.length,
      reason: 'exception',
    });
    return { success: false, results: [] };
  }
}
