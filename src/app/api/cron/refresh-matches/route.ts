import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { log } from '@/lib/log';
import { getInternalApiSecret } from '@/lib/api/auth';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes

/**
 * Cron job to refresh matches for all active users.
 * Vercel Cron: 0 2 * * * (daily at 2am UTC)
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      log.error('cron.refresh-matches.unauthorized');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    log.info('cron.refresh-matches.started');

    const internalApiSecret = getInternalApiSecret();
    if (!internalApiSecret) {
      log.error('cron.refresh-matches.missing_internal_secret');
      return NextResponse.json(
        { error: 'Missing INTERNAL_API_SECRET/CRON_SECRET configuration' },
        { status: 500 }
      );
    }

    const profilesToRefresh = await db.query.matchingProfiles.findMany({
      limit: 100,
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

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL;
    if (!baseUrl) {
      return NextResponse.json(
        { error: 'NEXT_PUBLIC_SITE_URL is not configured' },
        { status: 500 }
      );
    }

    for (const profile of profilesToRefresh) {
      try {
        const response = await fetch(`${baseUrl}/api/core/matching/profile`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-internal-api-key': internalApiSecret,
          },
          body: JSON.stringify({
            userId: profile.profileId,
            k: 20,
          }),
        });

        if (response.ok) {
          const matchData = await response.json();
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
      successCount,
      errorCount,
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
