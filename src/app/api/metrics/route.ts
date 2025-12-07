import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/db';
import { organizationMembers } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import {
  calculateTTSC,
  calculateTTFQI,
  calculateTTV,
  calculatePACLift,
  getAllMetrics,
} from '@/lib/analytics/metrics';
import { log } from '@/lib/log';
import { checkRateLimit, getRateLimitHeaders, RATE_LIMITS } from '@/lib/rate-limit/index';

export const dynamic = 'force-dynamic';

/**
 * GET /api/metrics
 *
 * Returns platform metrics (admin/org-level access required)
 * Includes: TTSC, TTFQI, TTV, PAC lift
 *
 * Query params:
 * - metric: specific metric to fetch (ttsc, ttfqi, ttv, pac, all)
 * - startDate: ISO date string
 * - endDate: ISO date string
 * - cohort: optional cohort filter
 */
export async function GET(request: NextRequest) {
  // Apply rate limiting
  const { allowed, result } = await checkRateLimit(request, RATE_LIMITS.api);
  if (!allowed) {
    return NextResponse.json(
      {
        error: 'Too many requests',
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter: Math.ceil((result.reset - Date.now()) / 1000),
      },
      {
        status: 429,
        headers: {
          ...getRateLimitHeaders(result),
          'Retry-After': Math.ceil((result.reset - Date.now()) / 1000).toString(),
        },
      }
    );
  }

  try {
    const user = await requireAuth();

    // Check if user is admin or org owner
    // For now, we'll allow any authenticated user to view metrics
    // TODO: Implement proper admin/org-level authorization
    const isOrgMember = await db.query.organizationMembers.findFirst({
      where: and(
        eq(organizationMembers.userId, user.id),
        eq(organizationMembers.status, 'active')
      ),
    });

    if (!isOrgMember) {
      log.warn('metrics.unauthorized', {
        userId: user.id,
      });
      return NextResponse.json(
        {
          error: 'Unauthorized',
          message: 'Metrics access requires organization membership',
        },
        { status: 403 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const metric = searchParams.get('metric') || 'all';
    const startDate = searchParams.get('startDate')
      ? new Date(searchParams.get('startDate')!)
      : undefined;
    const endDate = searchParams.get('endDate')
      ? new Date(searchParams.get('endDate')!)
      : undefined;
    const cohort = searchParams.get('cohort') || undefined;

    let metrics: any;

    switch (metric) {
      case 'ttsc':
        metrics = { ttsc: await calculateTTSC(cohort, startDate, endDate) };
        break;
      case 'ttfqi':
        metrics = { ttfqi: await calculateTTFQI(cohort, startDate, endDate) };
        break;
      case 'ttv':
        metrics = { ttv: await calculateTTV(cohort, startDate, endDate) };
        break;
      case 'pac':
        metrics = { pac: await calculatePACLift(startDate, endDate) };
        break;
      case 'all':
      default:
        metrics = await getAllMetrics();
        break;
    }

    log.info('metrics.fetched', {
      userId: user.id,
      metric,
      hasData: Object.values(metrics).some((m) => m !== null),
    });

    return NextResponse.json(
      {
        metrics,
        meta: {
          startDate: startDate?.toISOString(),
          endDate: endDate?.toISOString(),
          cohort,
          timestamp: new Date().toISOString(),
        },
      },
      {
        headers: getRateLimitHeaders(result),
      }
    );
  } catch (error) {
    log.error('metrics.fetch.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json(
      {
        error: 'Failed to fetch metrics',
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
      },
      { status: 500 }
    );
  }
}
