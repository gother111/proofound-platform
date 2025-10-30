import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { profiles, analyticsEvents } from '@/db/schema';
import { sql, and, gte, lte, eq } from 'drizzle-orm';
import { log } from '@/lib/log';
import { sendDeletionReminderEmail } from '@/lib/email';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * Vercel Cron Job: Send 7-day deletion reminder emails
 * 
 * Schedule: Daily at 1:00 AM UTC
 * 
 * This job finds accounts scheduled for deletion in 7 days and sends
 * reminder emails. It checks analytics_events to prevent duplicate reminders.
 * 
 * Vercel cron config (vercel.json):
 * {
 *   "crons": [{
 *     "path": "/api/cron/send-deletion-reminders",
 *     "schedule": "0 1 * * *"
 *   }]
 * }
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret (security - only Vercel cron can call this)
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      log.warn('cron.send_deletion_reminders.unauthorized', {
        ip: request.headers.get('x-forwarded-for') || 'unknown',
      });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Calculate date range for 7 days from now (6.5 to 7.5 days to account for timing)
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const lowerBound = new Date(sevenDaysFromNow.getTime() - 12 * 60 * 60 * 1000); // 6.5 days
    const upperBound = new Date(sevenDaysFromNow.getTime() + 12 * 60 * 60 * 1000); // 7.5 days

    log.info('cron.send_deletion_reminders.started', {
      lowerBound: lowerBound.toISOString(),
      upperBound: upperBound.toISOString(),
    });

    // Find accounts scheduled for deletion in ~7 days
    const accountsToRemind = await db
      .select({
        id: profiles.id,
        deletionScheduledFor: profiles.deletionScheduledFor,
      })
      .from(profiles)
      .where(
        and(
          gte(profiles.deletionScheduledFor, lowerBound),
          lte(profiles.deletionScheduledFor, upperBound),
          eq(profiles.deleted, false)
        )
      );

    log.info('cron.send_deletion_reminders.accounts_found', {
      count: accountsToRemind.length,
    });

    const results = [];
    const supabase = await createClient();

    // Process each account
    for (const account of accountsToRemind) {
      try {
        // Check if reminder already sent (look for analytics event)
        const existingReminder = await db
          .select()
          .from(analyticsEvents)
          .where(
            and(
              eq(analyticsEvents.userId, account.id),
              eq(analyticsEvents.eventType, 'account_deletion_reminder_sent')
            )
          )
          .limit(1);

        if (existingReminder.length > 0) {
          log.info('cron.send_deletion_reminders.already_sent', {
            userId: account.id,
          });
          results.push({
            userId: account.id,
            status: 'skipped',
            reason: 'Reminder already sent',
          });
          continue;
        }

        // Get user email from Supabase auth
        const { data: authData } = await supabase.auth.admin.getUserById(account.id);
        
        if (!authData.user?.email) {
          log.warn('cron.send_deletion_reminders.no_email', {
            userId: account.id,
          });
          results.push({
            userId: account.id,
            status: 'error',
            error: 'No email found',
          });
          continue;
        }

        // Calculate days remaining
        const daysRemaining = Math.ceil(
          (account.deletionScheduledFor!.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)
        );

        // Send reminder email
        await sendDeletionReminderEmail(
          authData.user.email,
          account.id,
          account.deletionScheduledFor!,
          daysRemaining
        );

        // Log analytics event to prevent duplicate reminders
        await db.insert(analyticsEvents).values({
          eventType: 'account_deletion_reminder_sent',
          userId: account.id,
          properties: {
            scheduledFor: account.deletionScheduledFor!.toISOString(),
            daysRemaining,
          },
          ipHash: null, // System event, no IP
          userAgentHash: null,
          sessionId: null,
        });

        results.push({
          userId: account.id,
          status: 'success',
          daysRemaining,
        });

        log.info('cron.send_deletion_reminders.email_sent', {
          userId: account.id,
          email: authData.user.email,
          daysRemaining,
        });
      } catch (error) {
        results.push({
          userId: account.id,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
        });

        log.error('cron.send_deletion_reminders.account_failed', {
          userId: account.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    log.info('cron.send_deletion_reminders.completed', {
      total: accountsToRemind.length,
      successful: results.filter((r) => r.status === 'success').length,
      failed: results.filter((r) => r.status === 'error').length,
      skipped: results.filter((r) => r.status === 'skipped').length,
    });

    return NextResponse.json({
      success: true,
      processed: accountsToRemind.length,
      results,
    });
  } catch (error) {
    log.error('cron.send_deletion_reminders.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      {
        error: 'Failed to send deletion reminders',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

