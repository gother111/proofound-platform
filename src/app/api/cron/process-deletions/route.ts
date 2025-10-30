import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { profiles } from '@/db/schema';
import { sql, and, lte, eq } from 'drizzle-orm';
import { log } from '@/lib/log';
import { sendDeletionCompleteEmail } from '@/lib/email';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * Vercel Cron Job: Process pending account deletions
 * 
 * Schedule: Daily at 2:00 AM UTC
 * 
 * This job finds accounts past their grace period and anonymizes them
 * using the database function. It sends a confirmation email before deletion.
 * 
 * Vercel cron config (vercel.json):
 * {
 *   "crons": [{
 *     "path": "/api/cron/process-deletions",
 *     "schedule": "0 2 * * *"
 *   }]
 * }
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret (security - only Vercel cron can call this)
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      log.warn('cron.process_deletions.unauthorized', {
        ip: request.headers.get('x-forwarded-for') || 'unknown',
      });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find accounts scheduled for deletion (grace period expired)
    const now = new Date();
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

    log.info('cron.process_deletions.started', {
      count: accountsToDelete.length,
      timestamp: now.toISOString(),
    });

    const results = [];
    const supabase = await createClient();

    // Process each account
    for (const account of accountsToDelete) {
      try {
        // Get user email from Supabase auth BEFORE deletion
        // (we need this to send the confirmation email)
        const { data: authData } = await supabase.auth.admin.getUserById(account.id);
        const userEmail = authData.user?.email;

        if (!userEmail) {
          log.warn('cron.process_deletions.no_email', {
            userId: account.id,
          });
        }

        // Call the anonymize function (defined in 20250130_privacy_dashboard.sql migration)
        // This function:
        // - Anonymizes profile data
        // - Anonymizes related records (messages, etc.)
        // - Sets deleted = true
        // - Keeps some metadata for 90 days for legal compliance
        await db.execute(sql`SELECT anonymize_user_account(${account.id}::uuid)`);

        // Send deletion complete email (if we have an email)
        if (userEmail) {
          try {
            await sendDeletionCompleteEmail(userEmail, account.id);
            log.info('cron.process_deletions.email_sent', {
              userId: account.id,
              email: userEmail,
            });
          } catch (emailError) {
            // Log email failure but don't fail the deletion
            log.error('cron.process_deletions.email_failed', {
              userId: account.id,
              error: emailError instanceof Error ? emailError.message : 'Unknown error',
            });
          }
        }

        results.push({
          userId: account.id,
          status: 'success',
          deletedAt: now.toISOString(),
        });

        log.info('cron.process_deletions.account_deleted', {
          userId: account.id,
          scheduledFor: account.deletionScheduledFor?.toISOString(),
        });
      } catch (error) {
        results.push({
          userId: account.id,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
        });

        log.error('cron.process_deletions.account_failed', {
          userId: account.id,
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
        });
      }
    }

    log.info('cron.process_deletions.completed', {
      total: accountsToDelete.length,
      successful: results.filter((r) => r.status === 'success').length,
      failed: results.filter((r) => r.status === 'error').length,
    });

    return NextResponse.json({
      success: true,
      processed: accountsToDelete.length,
      results,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    log.error('cron.process_deletions.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      {
        error: 'Failed to process deletions',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

