/**
 * Legacy manual fairness-note trigger with alert fan-out.
 *
 * This route remains available for manual triggering, but scheduled fairness-note
 * generation is owned by /api/cron/fairness-note.
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateFairnessNoteResult } from '@/lib/analytics/fairness-note-generator';
import { db } from '@/db';
import { fairnessNotes } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { EMAIL_CONFIG } from '@/lib/email/config';
import { INTERNAL_OPS_HREF } from '@/lib/launch/surface-policy';

export async function GET(request: NextRequest) {
  // Verify cron secret for security
  const authHeader = request.headers.get('authorization');
  const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;

  if (!process.env.CRON_SECRET || authHeader !== expectedAuth) {
    console.error('Unauthorized cron job attempt');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Generate note with auto-generated version based on current date
    const today = new Date();
    const version = `auto-${today.toISOString().split('T')[0]}`;

    console.log(`[Cron] Generating fairness note for version: ${version}`);

    const result = await generateFairnessNoteResult({
      releaseVersion: version,
      publicationStatus: 'published',
    });
    const noteId = result.noteId;

    // Fetch the generated note to check for significant gaps
    const [note] = await db
      .select()
      .from(fairnessNotes)
      .where(eq(fairnessNotes.id, noteId))
      .limit(1);

    if (!note) {
      throw new Error('Failed to retrieve generated fairness note');
    }

    // Send email notification if gaps detected
    if (note.hasSignificantGaps) {
      await sendFairnessAlertEmail(note);
    }

    console.log(`[Cron] Fairness note generated successfully: ${noteId}`);
    console.log(`[Cron] Significant gaps detected: ${note.hasSignificantGaps ? 'YES' : 'NO'}`);

    return NextResponse.json({
      success: true,
      noteId,
      version,
      status: result.status,
      hasSignificantGaps: note.hasSignificantGaps,
      message: note.hasSignificantGaps
        ? 'Fairness note generated with SIGNIFICANT GAPS - Alert sent'
        : result.status === 'insufficient_data'
          ? 'Fairness note generated with insufficient data'
          : 'Fairness note generated - No significant gaps',
    });
  } catch (error) {
    console.error('[Cron] Fairness note generation failed:', error);

    // Send error notification
    await sendErrorNotification(error);

    return NextResponse.json(
      {
        error: 'Generation failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Send email alert when significant fairness gaps are detected
 */
async function sendFairnessAlertEmail(note: any): Promise<void> {
  try {
    // Extract critical and moderate findings
    const findings = note.findings || [];
    const actionableFindings = findings.filter((f: any) => f.type !== 'insufficient_data');
    const criticalFindings = actionableFindings.filter(
      (f: any) => f.severity === 'critical' || Math.abs(Number(f.deviationPercent || 0)) >= 40
    );
    const moderateFindings = actionableFindings.filter((f: any) => !criticalFindings.includes(f));
    const renderFinding = (finding: any) =>
      finding.description ||
      `${finding.cohort?.role || 'Unknown role'} / ${finding.cohort?.seniority || 'All'} / ${
        finding.cohort?.geography || 'Global'
      } changed ${finding.deviationPercent || 0}% versus baseline.`;

    const emailContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .header { background: #dc2626; color: white; padding: 20px; }
          .content { padding: 20px; }
          .finding { margin: 15px 0; padding: 15px; border-left: 4px solid #dc2626; background: #fef2f2; }
          .finding.moderate { border-left-color: #f59e0b; background: #fffbeb; }
          .recommendation { margin: 10px 0; padding: 10px; background: #f3f4f6; }
          .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>⚠️ Fairness Alert: Significant Gaps Detected</h1>
          <p>Release Version: ${note.releaseVersion}</p>
          <p>Generated: ${new Date(note.generatedAt).toLocaleString()}</p>
        </div>
        
        <div class="content">
          <h2>Summary</h2>
          <p><strong>Critical Findings:</strong> ${criticalFindings.length}</p>
          <p><strong>Moderate Findings:</strong> ${moderateFindings.length}</p>
          <p><strong>Cohorts Analyzed:</strong> ${note.cohortData.length}</p>
          
          ${
            criticalFindings.length > 0
              ? `
            <h2>Critical Findings (Immediate Action Required)</h2>
            ${criticalFindings.map((f: any) => `<div class="finding">${renderFinding(f)}</div>`).join('')}
          `
              : ''
          }
          
          ${
            moderateFindings.length > 0
              ? `
            <h2>Moderate Findings (Review Recommended)</h2>
            ${moderateFindings
              .map((f: any) => `<div class="finding moderate">${renderFinding(f)}</div>`)
              .join('')}
          `
              : ''
          }
          
          <h2>Recommendations</h2>
          ${note.recommendations
            .slice(0, 3)
            .map(
              (r: any) =>
                `<div class="recommendation">
              <strong>${r.priority.toUpperCase()}:</strong> ${r.action}
              <br><small>${r.rationale}</small>
            </div>`
            )
            .join('')}
          
          <p style="margin-top: 30px;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}${INTERNAL_OPS_HREF}"
               style="background: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
              Open Internal Ops
            </a>
          </p>
        </div>
        
        <div class="footer">
          <p>This is an automated alert from the Proofound Fairness Monitoring System</p>
          <p>Do not reply to this email</p>
        </div>
      </body>
      </html>
    `;

    // Send email via Resend or configured email service
    if (process.env.RESEND_API_KEY) {
      const { Resend } = await import('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);

      await resend.emails.send({
        from: EMAIL_CONFIG.from,
        to: process.env.FAIRNESS_ALERT_EMAILS?.split(',') || ['admin@proofound.app'],
        subject: `⚠️ Fairness Alert: ${note.releaseVersion} - Significant Gaps Detected`,
        html: emailContent,
      });

      console.log('[Cron] Fairness alert email sent successfully');
    } else {
      console.warn('[Cron] RESEND_API_KEY not configured - skipping email notification');
      // Optionally log to a monitoring service or Slack webhook
    }

    // Optional: Send Slack notification
    if (process.env.SLACK_FAIRNESS_WEBHOOK_URL) {
      await fetch(process.env.SLACK_FAIRNESS_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `⚠️ *Fairness Alert*: Significant gaps detected in ${note.releaseVersion}`,
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `*Fairness Alert for ${note.releaseVersion}*\n\n• Critical Findings: ${criticalFindings.length}\n• Moderate Findings: ${moderateFindings.length}\n• <${process.env.NEXT_PUBLIC_APP_URL}${INTERNAL_OPS_HREF}|Open Internal Ops>`,
              },
            },
          ],
        }),
      });
    }
  } catch (error) {
    console.error('[Cron] Failed to send fairness alert email:', error);
    // Don't throw - email failure shouldn't fail the cron job
  }
}

/**
 * Send error notification if fairness note generation fails
 */
async function sendErrorNotification(error: unknown): Promise<void> {
  try {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Optional: Send to monitoring service or Slack
    if (process.env.SLACK_ERRORS_WEBHOOK_URL) {
      await fetch(process.env.SLACK_ERRORS_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `❌ Fairness Note Cron Job Failed: ${errorMessage}`,
        }),
      });
    }
  } catch (notificationError) {
    console.error('[Cron] Failed to send error notification:', notificationError);
  }
}
