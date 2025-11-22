/**
 * Email Sender Utility
 *
 * Handles sending transactional emails via Resend
 */

import { Resend } from 'resend';
import { EMAIL_CONFIG, isEmailConfigured } from './config';

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
}

/**
 * Send an email via Resend
 */
export async function sendEmail(
  params: SendEmailParams
): Promise<{ success: boolean; id?: string; error?: string }> {
  // Check if email is configured
  if (!isEmailConfigured() || !resend) {
    console.warn('[Email] Email service not configured. Set RESEND_API_KEY environment variable.');
    console.warn('[Email] Would have sent email to:', params.to);
    console.warn('[Email] Subject:', params.subject);

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
      console.error('[Email] Failed to send email:', result.error);
      return { success: false, error: result.error.message };
    }

    console.log('[Email] Email sent successfully:', result.data?.id);
    return { success: true, id: result.data?.id };
  } catch (error) {
    console.error('[Email] Error sending email:', error);
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
    console.warn('[Email] Email service not configured. Batch send skipped.');
    return { success: false, results: [] };
  }

  try {
    const results = await Promise.allSettled(emails.map((email) => sendEmail(email)));

    const successful = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;

    console.log(`[Email] Batch send complete: ${successful} successful, ${failed} failed`);

    return {
      success: failed === 0,
      results: results.map((r) =>
        r.status === 'fulfilled' ? r.value : { success: false, error: 'Promise rejected' }
      ),
    };
  } catch (error) {
    console.error('[Email] Error sending batch emails:', error);
    return { success: false, results: [] };
  }
}
