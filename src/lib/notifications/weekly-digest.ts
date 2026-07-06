import { eq } from 'drizzle-orm';

import { db } from '@/db';
import { notificationPreferences, notifications, profiles } from '@/db/schema';
import { sendEmail } from '@/lib/email/sender';
import { getMomentumSummary } from '@/lib/momentum/summary';
import type { WeeklyDigestPayload } from '@/lib/momentum/types';
import { createAdminClient } from '@/lib/supabase/admin';

const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const WEEKLY_DIGEST_DISABLED_REASON =
  'Weekly digest delivery is disabled by WEEKLY_DIGEST_ENABLED=false.';

function buildDigestSubject(persona: 'individual' | 'organization'): string {
  const dateLabel = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return persona === 'organization'
    ? `Proofound org weekly digest • ${dateLabel}`
    : `Proofound weekly digest • ${dateLabel}`;
}

function getNoMatchDigestCopy(payload: WeeklyDigestPayload): string | null {
  if (payload.persona !== 'individual') {
    return null;
  }

  const totalMatches = payload.metrics.totalMatches ?? 0;
  if (totalMatches > 0) {
    return null;
  }

  return 'No matches yet. Use this week to add one fresh proof, request one verification, and tighten your role preferences so your portfolio is ready when matching volume grows.';
}

export function buildWeeklyDigestEmail(payload: WeeklyDigestPayload): {
  html: string;
  text: string;
} {
  const noMatchCopy = getNoMatchDigestCopy(payload);
  const actionItemsHtml = payload.topActions
    .map(
      (action) =>
        `<li style="margin-bottom:10px;"><strong>${action.title}</strong><br/><span>${action.description}</span></li>`
    )
    .join('');

  const updateItemsHtml = payload.updates
    .slice(0, 4)
    .map((update) => `<li style="margin-bottom:8px;">${update.text}</li>`)
    .join('');

  const metricRowsHtml = Object.entries(payload.metrics)
    .map(
      ([key, value]) =>
        `<tr><td style="padding:4px 8px;border-bottom:1px solid #E8E6DD;">${key}</td><td style="padding:4px 8px;border-bottom:1px solid #E8E6DD;text-align:right;"><strong>${value}</strong></td></tr>`
    )
    .join('');

  const html = `
<!doctype html>
<html>
  <body style="font-family: Inter, Arial, sans-serif; background:#F7F6F1; color:#2D3330; padding:24px;">
    <div style="max-width:640px; margin:0 auto; background:#fff; border:1px solid #E8E6DD; border-radius:12px; overflow:hidden;">
      <div style="background:#1C4D3A; color:#fff; padding:20px;">
        <h1 style="margin:0; font-size:22px;">Your Weekly Momentum Digest</h1>
        <p style="margin:8px 0 0 0; opacity:0.92;">${payload.summary}</p>
      </div>
      <div style="padding:20px;">
        ${noMatchCopy ? `<p style="margin:0 0 18px 0;">${noMatchCopy}</p>` : ''}
        <h2 style="font-size:16px; margin:0 0 8px 0;">Top actions</h2>
        <ul style="padding-left:18px; margin:0 0 18px 0;">${actionItemsHtml || '<li>No actions this week.</li>'}</ul>

        <h2 style="font-size:16px; margin:0 0 8px 0;">Recent updates</h2>
        <ul style="padding-left:18px; margin:0 0 18px 0;">${updateItemsHtml || '<li>No major updates yet.</li>'}</ul>

        <h2 style="font-size:16px; margin:0 0 8px 0;">Metrics snapshot</h2>
        <table style="width:100%; border-collapse:collapse; margin-bottom:18px;">${metricRowsHtml}</table>

        <p style="font-size:12px; color:#6B6760; margin:0;">You can change digest settings in Notification Settings.</p>
      </div>
    </div>
  </body>
</html>
  `.trim();

  const actionItemsText = payload.topActions
    .map((action) => `- ${action.title}: ${action.description}`)
    .join('\n');
  const updatesText = payload.updates
    .slice(0, 4)
    .map((update) => `- ${update.text}`)
    .join('\n');
  const metricsText = Object.entries(payload.metrics)
    .map(([key, value]) => `- ${key}: ${value}`)
    .join('\n');

  const text = [
    'Your Weekly Momentum Digest',
    '',
    payload.summary,
    '',
    ...(noMatchCopy ? [noMatchCopy, ''] : []),
    'Top actions:',
    actionItemsText || '- No actions this week.',
    '',
    'Recent updates:',
    updatesText || '- No major updates yet.',
    '',
    'Metrics snapshot:',
    metricsText,
    '',
    'Update notification preferences in your settings anytime.',
  ].join('\n');

  return { html, text };
}

export type WeeklyDigestResult = {
  processed: number;
  emailed: number;
  createdInApp: number;
  skipped: number;
  errors: Array<{ userId: string; reason: string }>;
};

export function getWeeklyDigestAvailability(): { enabled: boolean; reason: string | null } {
  const disabled = process.env.WEEKLY_DIGEST_ENABLED?.trim().toLowerCase() === 'false';

  return {
    enabled: !disabled,
    reason: disabled ? WEEKLY_DIGEST_DISABLED_REASON : null,
  };
}

function shouldSendDigest(lastDigestSentAt: Date | null | undefined): boolean {
  if (!lastDigestSentAt) return true;
  return Date.now() - lastDigestSentAt.getTime() >= ONE_WEEK_MS;
}

function normalizePersona(rawPersona: string | null): 'individual' | 'organization' {
  return rawPersona === 'org_member' ? 'organization' : 'individual';
}

export async function processWeeklyDigests(force = false): Promise<WeeklyDigestResult> {
  const availability = getWeeklyDigestAvailability();
  if (!availability.enabled) {
    return {
      processed: 0,
      emailed: 0,
      createdInApp: 0,
      skipped: 0,
      errors: [],
    };
  }

  const adminClient = createAdminClient();

  const users = await db
    .select({
      userId: profiles.id,
      persona: profiles.persona,
      emailWeeklyDigest: notificationPreferences.emailWeeklyDigest,
      digestFrequency: notificationPreferences.digestFrequency,
      lastDigestSentAt: notificationPreferences.lastDigestSentAt,
    })
    .from(profiles)
    .leftJoin(notificationPreferences, eq(notificationPreferences.userId, profiles.id))
    .where(eq(profiles.deleted, false));

  const result: WeeklyDigestResult = {
    processed: 0,
    emailed: 0,
    createdInApp: 0,
    skipped: 0,
    errors: [],
  };

  for (const row of users) {
    const digestEnabled = row.emailWeeklyDigest ?? true;
    const digestFrequency = row.digestFrequency ?? 'weekly';

    if (!digestEnabled || digestFrequency === 'disabled') {
      result.skipped += 1;
      continue;
    }

    if (!force && !shouldSendDigest(row.lastDigestSentAt ?? null)) {
      result.skipped += 1;
      continue;
    }

    result.processed += 1;

    try {
      const persona = normalizePersona(row.persona);
      const summary = await getMomentumSummary(row.userId, persona);
      const payload: WeeklyDigestPayload = {
        userId: row.userId,
        persona,
        subject: buildDigestSubject(persona),
        summary: summary.summary,
        topActions: summary.topActions,
        updates: summary.updates,
        metrics: summary.metrics,
        generatedAt: summary.generatedAt,
      };

      const { data: authData, error: authError } = await adminClient.auth.admin.getUserById(
        row.userId
      );
      const recipient = authData?.user?.email;

      if (authError || !recipient) {
        result.errors.push({
          userId: row.userId,
          reason: authError?.message || 'No email found for user',
        });
        continue;
      }

      const emailBody = buildWeeklyDigestEmail(payload);
      const sendResult = await sendEmail({
        to: recipient,
        subject: payload.subject,
        html: emailBody.html,
        text: emailBody.text,
      });

      if (!sendResult.success) {
        result.errors.push({
          userId: row.userId,
          reason: sendResult.error || 'Unknown email delivery error',
        });
        continue;
      }

      result.emailed += 1;

      await db
        .insert(notifications)
        .values({
          userId: row.userId,
          type: 'weekly_digest',
          title: 'Your weekly digest is ready',
          message: summary.summary,
          actionUrl: persona === 'organization' ? '/app/o' : '/app/i/home',
          metadata: {
            generatedAt: payload.generatedAt,
            metrics: payload.metrics,
          },
        })
        .returning({ id: notifications.id });

      result.createdInApp += 1;

      await db
        .insert(notificationPreferences)
        .values({
          userId: row.userId,
          emailWeeklyDigest: true,
          digestFrequency: 'weekly',
          lastDigestSentAt: new Date(),
        })
        .onConflictDoUpdate({
          target: notificationPreferences.userId,
          set: {
            lastDigestSentAt: new Date(),
            updatedAt: new Date(),
          },
        });
    } catch (error) {
      result.errors.push({
        userId: row.userId,
        reason: error instanceof Error ? error.message : 'Unknown processing error',
      });
    }
  }

  return result;
}
