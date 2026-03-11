import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/lib/api/auth';
import { db } from '@/db';
import { organizationMembers, profiles } from '@/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import {
  calculateTTSC,
  calculateTTFQI,
  calculateTTV,
  calculatePACLift,
  getAllMetrics,
} from '@/lib/analytics/metrics';
import { parseOptionalDate } from '@/lib/datetime/parse-optional-date';
import { log } from '@/lib/log';
import { checkRateLimit, getRateLimitHeaders, RATE_LIMITS } from '@/lib/rate-limit/index';

export const dynamic = 'force-dynamic';

const ALLOWED_METRICS = new Set(['ttsc', 'ttfqi', 'ttv', 'pac', 'all']);

/**
 * GET /api/metrics
 *
 * Returns platform metrics (platform admin/super admin, or active org owner/admin)
 * Includes: TTSC, TTFQI, TTV, PAC lift
 *
 * Query params:
 * - metric: specific metric to fetch (ttsc, ttfqi, ttv, pac, all)
 * - startDate: ISO date string
 * - endDate: ISO date string
 * - cohort: optional cohort filter
 */
export async function GET(request: NextRequest) {
  const { allowed, result } = await checkRateLimit(request, RATE_LIMITS.api);
  const rateLimitHeaders = getRateLimitHeaders(result);

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
          ...rateLimitHeaders,
          'Retry-After': Math.ceil((result.reset - Date.now()) / 1000).toString(),
        },
      }
    );
  }

  try {
    const authResult = await requireApiAuth();
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { user } = authResult;
    const searchParams = request.nextUrl.searchParams;
    const metric = (searchParams.get('metric') || 'all').toLowerCase();
    const startDateRaw = searchParams.get('startDate');
    const endDateRaw = searchParams.get('endDate');
    const cohortRaw = searchParams.get('cohort');

    if (!ALLOWED_METRICS.has(metric)) {
      return NextResponse.json(
        {
          error: 'Invalid metric parameter',
          message: `metric must be one of: ${Array.from(ALLOWED_METRICS).join(', ')}`,
        },
        { status: 400, headers: rateLimitHeaders }
      );
    }

    const startDate = parseOptionalDate(startDateRaw);
    const endDate = parseOptionalDate(endDateRaw);

    if (startDateRaw && !startDate) {
      return NextResponse.json(
        {
          error: 'Invalid startDate parameter',
          message: 'startDate must be a valid ISO date string',
        },
        { status: 400, headers: rateLimitHeaders }
      );
    }

    if (endDateRaw && !endDate) {
      return NextResponse.json(
        {
          error: 'Invalid endDate parameter',
          message: 'endDate must be a valid ISO date string',
        },
        { status: 400, headers: rateLimitHeaders }
      );
    }

    if (startDate && endDate && startDate > endDate) {
      return NextResponse.json(
        {
          error: 'Invalid date range',
          message: 'startDate must be earlier than or equal to endDate',
        },
        { status: 400, headers: rateLimitHeaders }
      );
    }

    if (cohortRaw && !/^[a-zA-Z0-9:_-]{1,64}$/.test(cohortRaw)) {
      return NextResponse.json(
        {
          error: 'Invalid cohort parameter',
          message:
            'cohort must be 1-64 characters and only contain letters, numbers, colon, underscore, or hyphen',
        },
        { status: 400, headers: rateLimitHeaders }
      );
    }

    const cohort = cohortRaw || undefined;
    const profile = await db.query.profiles.findFirst({
      where: eq(profiles.id, user.id),
      columns: { platformRole: true },
    });

    const isPlatformAdmin =
      profile?.platformRole === 'platform_admin' || profile?.platformRole === 'super_admin';

    if (!isPlatformAdmin) {
      const hasOrgMetricsAccess = await db.query.organizationMembers.findFirst({
        where: and(
          eq(organizationMembers.userId, user.id),
          eq(organizationMembers.status, 'active'),
          inArray(organizationMembers.role, ['owner', 'admin'])
        ),
        columns: { orgId: true, role: true },
      });

      if (!hasOrgMetricsAccess) {
        log.warn('metrics.unauthorized', { userId: user.id });
        return NextResponse.json(
          {
            error: 'Forbidden',
            message:
              'Metrics access requires platform admin or active organization owner/admin role',
          },
          { status: 403, headers: rateLimitHeaders }
        );
      }
    }

    let metrics: Record<string, unknown>;

    switch (metric) {
      case 'ttsc':
        metrics = {
          ttsc: await calculateTTSC(cohort, startDate ?? undefined, endDate ?? undefined),
        };
        break;
      case 'ttfqi':
        metrics = {
          ttfqi: await calculateTTFQI(cohort, startDate ?? undefined, endDate ?? undefined),
        };
        break;
      case 'ttv':
        metrics = { ttv: await calculateTTV(cohort, startDate ?? undefined, endDate ?? undefined) };
        break;
      case 'pac':
        metrics = { pac: await calculatePACLift(startDate ?? undefined, endDate ?? undefined) };
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
        headers: rateLimitHeaders,
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
      { status: 500, headers: rateLimitHeaders }
    );
  }
}
