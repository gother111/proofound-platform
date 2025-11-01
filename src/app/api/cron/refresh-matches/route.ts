import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { matchingProfiles, assignments, matches } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import { log } from '@/lib/log';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes

/**
 * Cron job to refresh matches for all active users
 * Run daily to ensure fresh matches
 *
 * Vercel Cron: 0 2 * * * (daily at 2am UTC)
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Verify cron secret for Vercel Cron
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      log.error('cron.refresh-matches.unauthorized');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    log.info('cron.refresh-matches.started');

    // Get all active matching profiles that haven't been refreshed in 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const profilesToRefresh = await db.query.matchingProfiles.findMany({
      where: sql`(${matchingProfiles.lastRefreshed} IS NULL OR ${matchingProfiles.lastRefreshed} < ${oneDayAgo})`,
      limit: 100, // Process in batches
    });

    log.info('cron.refresh-matches.profiles-found', {
      count: profilesToRefresh.length,
    });

    if (profilesToRefresh.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No profiles need refreshing',
        processed: 0,
      });
    }

    let successCount = 0;
    let errorCount = 0;

    // Process each profile
    for (const profile of profilesToRefresh) {
      try {
        // Call the matching endpoint for this user
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_SITE_URL}/api/core/matching/profile`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              // Use service role to bypass auth
              Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
            },
            body: JSON.stringify({
              userId: profile.profileId,
              k: 20, // Top 20 matches
            }),
          }
        );

        if (response.ok) {
          const matchData = await response.json();

          // Update last refreshed timestamp
          await db
            .update(matchingProfiles)
            .set({ lastRefreshed: new Date() })
            .where(eq(matchingProfiles.profileId, profile.profileId));

          // Optionally: Cache match results
          // This would involve storing top matches in the matches table

          successCount++;

          log.info('cron.refresh-matches.profile-refreshed', {
            profileId: profile.profileId,
            matchCount: matchData.items?.length || 0,
          });
        } else {
          errorCount++;
          log.error('cron.refresh-matches.profile-failed', {
            profileId: profile.profileId,
            status: response.status,
          });
        }
      } catch (error) {
        errorCount++;
        log.error('cron.refresh-matches.profile-error', {
          profileId: profile.profileId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    const duration = Date.now() - startTime;

    log.info('cron.refresh-matches.completed', {
      processed: profilesToRefresh.length,
      success: successCount,
      errors: errorCount,
      durationMs: duration,
    });

    return NextResponse.json({
      success: true,
      processed: profilesToRefresh.length,
      success: successCount,
      errors: errorCount,
      durationMs: duration,
    });
  } catch (error) {
    const duration = Date.now() - startTime;

    log.error('cron.refresh-matches.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      durationMs: duration,
    });

    return NextResponse.json(
      {
        error: 'Refresh matches failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
