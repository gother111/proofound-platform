import { and, asc, eq, inArray } from 'drizzle-orm';
import { NextRequest } from 'next/server';

import { db } from '@/db';
import { contentReports, profiles } from '@/db/schema';
import { requireMobileAuth, requireMobilePlatformAdmin } from '@/lib/api/mobile/auth';
import { mobileError, mobileSuccess } from '@/lib/api/mobile/response';

export const dynamic = 'force-dynamic';

function mapStatusFilter(status: string | null) {
  if (!status || status === 'all') {
    return null;
  }
  if (status === 'in_review') {
    return 'reviewing';
  }
  if (status === 'resolved') {
    return 'actioned';
  }
  return status;
}

function getPriority(category: string) {
  switch (category) {
    case 'harassment':
      return 'critical';
    case 'misinformation':
    case 'inappropriate':
      return 'high';
    case 'spam':
      return 'medium';
    default:
      return 'low';
  }
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireMobileAuth(request);
    if ('status' in auth) {
      return auth;
    }

    const adminGuard = requireMobilePlatformAdmin(auth);
    if (adminGuard) {
      return adminGuard;
    }

    const statusFilter = mapStatusFilter(request.nextUrl.searchParams.get('status'));
    const limit = Math.min(Number(request.nextUrl.searchParams.get('limit') || '50'), 100);
    const offset = Math.max(Number(request.nextUrl.searchParams.get('offset') || '0'), 0);

    const where = statusFilter ? and(eq(contentReports.status, statusFilter as any)) : undefined;

    const reports = await db
      .select()
      .from(contentReports)
      .where(where)
      .orderBy(asc(contentReports.createdAt))
      .limit(limit)
      .offset(offset);

    const reporterIds = Array.from(new Set(reports.map((report) => report.reporterId)));
    const reporterRows =
      reporterIds.length > 0
        ? await db
            .select({
              id: profiles.id,
              displayName: profiles.displayName,
              handle: profiles.handle,
              avatarUrl: profiles.avatarUrl,
            })
            .from(profiles)
            .where(inArray(profiles.id, reporterIds))
        : [];

    const reporterMap = new Map(reporterRows.map((reporter) => [reporter.id, reporter]));

    const items = reports.map((report) => ({
      ...report,
      reporter: reporterMap.get(report.reporterId) ?? null,
      priority: getPriority(report.category),
    }));

    const stats = items.reduce(
      (acc, report) => {
        acc[report.status] = (acc[report.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return mobileSuccess({
      items,
      stats,
      meta: {
        total: items.length,
        offset,
        limit,
      },
    });
  } catch (error) {
    console.error('[mobile.admin.moderation.queue.get] failed', error);
    return mobileError('internal_error', 'Failed to fetch moderation queue', 500);
  }
}
