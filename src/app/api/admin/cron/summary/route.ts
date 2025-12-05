import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { fairnessNotes, fairnessReports } from '@/db/schema';
import { requirePlatformAdminJson } from '@/lib/api/route-helpers';
import { desc } from 'drizzle-orm';

type HealthCheckResult = {
  status: string;
  statusCode: number;
  durationMs?: number;
  warningCount?: number;
  unhealthyCount?: number;
  error?: string;
};

export async function GET(_request: NextRequest) {
  const adminUser = await requirePlatformAdminJson();
  if (adminUser instanceof NextResponse) return adminUser;

  // Latest fairness note
  const [latestNote] = await db
    .select()
    .from(fairnessNotes)
    .orderBy(desc(fairnessNotes.generatedAt))
    .limit(1);

  // Latest fairness report
  const [latestReport] = await db
    .select()
    .from(fairnessReports)
    .orderBy(desc(fairnessReports.createdAt))
    .limit(1);

  // Live health-check ping
  const healthResult: HealthCheckResult = { status: 'unknown', statusCode: 0 };
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL?.startsWith('http')
      ? process.env.VERCEL_URL
      : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : undefined;

  if (baseUrl) {
    try {
      const res = await fetch(`${baseUrl}/api/cron/health-check`, { next: { revalidate: 0 } });
      healthResult.statusCode = res.status;
      const body = await res.json().catch(() => null);
      healthResult.status = body?.status || (res.ok ? 'healthy' : 'unhealthy');
      healthResult.durationMs = body?.durationMs;
      healthResult.warningCount = body?.warningCount;
      healthResult.unhealthyCount = body?.unhealthyCount;
    } catch (error) {
      healthResult.status = 'error';
      healthResult.error = error instanceof Error ? error.message : 'Health check failed';
    }
  } else {
    healthResult.status = 'skipped';
    healthResult.error = 'No base URL configured (set NEXT_PUBLIC_SITE_URL or VERCEL_URL)';
  }

  return NextResponse.json({
    success: true,
    data: {
      fairnessNote: latestNote
        ? {
          id: latestNote.id,
          releaseVersion: latestNote.releaseVersion,
          generatedAt: latestNote.generatedAt,
          hasSignificantGaps: latestNote.hasSignificantGaps,
          findings: Array.isArray(latestNote.findings) ? latestNote.findings.length : 0,
        }
        : null,
      fairnessReport: latestReport
        ? {
          id: latestReport.id,
          releaseVersion: latestReport.releaseVersion,
          createdAt: latestReport.createdAt,
        }
        : null,
      health: healthResult,
    },
  });
}

