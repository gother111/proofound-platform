import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { profiles, analyticsEvents } from '@/db/schema';
import { sql, and, gte, lte, eq } from 'drizzle-orm';
import { log } from '@/lib/log';
import { sendDeletionReminderEmail, sendDeletionCompleteEmail } from '@/lib/email';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * Vercel Cron Job: Account Deletion Workflow (Combined)
 * 
 * Schedule: Daily at 2:00 AM UTC
 * 
 * This job performs two tasks in sequence:
 * 1. Send 7-day deletion reminder emails
 * 2. Process accounts past their grace period (anonymize and delete)
 * 
 * Combined to optimize Vercel cron job usage (2 cron limit on current plan)
 * 
 * Vercel cron config (vercel.json):
 * {
 *   "crons": [{
 *     "path": "/api/cron/account-deletion-workflow",
 *     "schedule": "0 2 * * *"
 *   }]
 * }
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret (security - only Vercel cron can call this)
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      log.warn('cron.account_deletion_workflow.unauthorized', {
        ip: request.headers.get('x-forwarded-for') || 'unknown',
      });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const supabase = await createClient();

    log.info('cron.account_deletion_workflow.started', {
      timestamp: now.toISOString(),
    });

    // ========================================
    // STEP 1: Send 7-day deletion reminders
    // ========================================
    
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const lowerBound = new Date(sevenDaysFromNow.getTime() - 12 * 60 * 60 * 1000); // 6.5 days
    const upperBound = new Date(sevenDaysFromNow.getTime() + 12 * 60 * 60 * 1000); // 7.5 days

    log.info('cron.account_deletion_workflow.reminders_started', {
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

    log.info('cron.account_deletion_workflow.reminder_accounts_found', {
      count: accountsToRemind.length,
    });

    const reminderResults = [];

    // Process reminder emails
    for (const account of accountsToRemind) {
      try {
        // Check if reminder already sent
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
          log.info('cron.account_deletion_workflow.reminder_already_sent', {
            userId: account.id,
          });
          reminderResults.push({
            userId: account.id,
            status: 'skipped',
            reason: 'Reminder already sent',
          });
          continue;
        }

        // Get user email
        const { data: authData } = await supabase.auth.admin.getUserById(account.id);
        
        if (!authData.user?.email) {
          log.warn('cron.account_deletion_workflow.reminder_no_email', {
            userId: account.id,
          });
          reminderResults.push({
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
          ipHash: null,
          userAgentHash: null,
          sessionId: null,
        });

        reminderResults.push({
          userId: account.id,
          status: 'success',
          daysRemaining,
        });

        log.info('cron.account_deletion_workflow.reminder_sent', {
          userId: account.id,
          email: authData.user.email,
          daysRemaining,
        });
      } catch (error) {
        reminderResults.push({
          userId: account.id,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
        });

        log.error('cron.account_deletion_workflow.reminder_failed', {
          userId: account.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    log.info('cron.account_deletion_workflow.reminders_completed', {
      total: accountsToRemind.length,
      successful: reminderResults.filter((r) => r.status === 'success').length,
      failed: reminderResults.filter((r) => r.status === 'error').length,
      skipped: reminderResults.filter((r) => r.status === 'skipped').length,
    });

    // ========================================
    // STEP 2: Process pending deletions
    // ========================================
    
    log.info('cron.account_deletion_workflow.deletions_started');

    // Find accounts scheduled for deletion (grace period expired)
    const accountsToDelete = await db
      .select({
        id: profiles.id,
        deletionScheduledFor: profiles.deletionScheduledFor,
      })
      .from(profiles)
      .where(
        and(
          lte(profiles.deletionScheduledFor, now),
          eq(profiles.deleted, false)
        )
      );

    log.info('cron.account_deletion_workflow.deletion_accounts_found', {
      count: accountsToDelete.length,
    });

    const deletionResults = [];

    // Process each account
    for (const account of accountsToDelete) {
      try {
        // Get user email BEFORE deletion (needed for confirmation email)
        const { data: authData } = await supabase.auth.admin.getUserById(account.id);
        const userEmail = authData.user?.email;

        if (!userEmail) {
          log.warn('cron.account_deletion_workflow.deletion_no_email', {
            userId: account.id,
          });
        }

        // Call the anonymize function (defined in migration)
        // This anonymizes profile data and related records
        await db.execute(sql`SELECT anonymize_user_account(${account.id}::uuid)`);

        // Send deletion complete email (if we have an email)
        if (userEmail) {
          try {
            await sendDeletionCompleteEmail(userEmail, account.id);
            log.info('cron.account_deletion_workflow.deletion_email_sent', {
              userId: account.id,
              email: userEmail,
            });
          } catch (emailError) {
            // Log email failure but don't fail the deletion
            log.error('cron.account_deletion_workflow.deletion_email_failed', {
              userId: account.id,
              error: emailError instanceof Error ? emailError.message : 'Unknown error',
            });
          }
        }

        deletionResults.push({
          userId: account.id,
          status: 'success',
          deletedAt: now.toISOString(),
        });

        log.info('cron.account_deletion_workflow.account_deleted', {
          userId: account.id,
          scheduledFor: account.deletionScheduledFor?.toISOString(),
        });
      } catch (error) {
        deletionResults.push({
          userId: account.id,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
        });

        log.error('cron.account_deletion_workflow.deletion_failed', {
          userId: account.id,
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
        });
      }
    }

    log.info('cron.account_deletion_workflow.deletions_completed', {
      total: accountsToDelete.length,
      successful: deletionResults.filter((r) => r.status === 'success').length,
      failed: deletionResults.filter((r) => r.status === 'error').length,
    });

    // ========================================
    // Final Summary
    // ========================================
    
    log.info('cron.account_deletion_workflow.completed', {
      reminders: {
        total: accountsToRemind.length,
        successful: reminderResults.filter((r) => r.status === 'success').length,
        failed: reminderResults.filter((r) => r.status === 'error').length,
        skipped: reminderResults.filter((r) => r.status === 'skipped').length,
      },
      deletions: {
        total: accountsToDelete.length,
        successful: deletionResults.filter((r) => r.status === 'success').length,
        failed: deletionResults.filter((r) => r.status === 'error').length,
      },
    });

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      reminders: {
        processed: accountsToRemind.length,
        results: reminderResults,
      },
      deletions: {
        processed: accountsToDelete.length,
        results: deletionResults,
      },
    });
  } catch (error) {
    log.error('cron.account_deletion_workflow.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      {
        error: 'Account deletion workflow failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

