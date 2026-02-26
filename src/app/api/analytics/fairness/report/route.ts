/**
 * Fairness Report Generation API
 *
 * POST /api/analytics/fairness/report
 * Generates a comprehensive fairness analysis report
 *
 * Implements PRD Part 7: Automated Fairness Note requirement
 * - Calculate acceptance rate gaps by demographic segments
 * - Test for statistical significance
 * - Generate recommendations
 * - Store report in database
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { fairnessReports } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { requireApiAuthContext } from '@/lib/auth';
import { calculateFairnessGaps, type FairnessReport } from '@/lib/analytics/fairness';
import { log } from '@/lib/log';

/**
 * Generate a new fairness report
 */
export async function POST(request: NextRequest) {
  try {
    const authContext = await requireApiAuthContext();
    if (!authContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { user } = authContext;

    // Only platform admins can generate fairness reports
    const profile = await db.query.profiles.findFirst({
      where: (profiles, { eq }) => eq(profiles.id, user.id),
    });

    if (!profile || profile.platformRole !== 'platform_admin') {
      return NextResponse.json({ error: 'Unauthorized - Admin only' }, { status: 403 });
    }

    const body = await request.json();
    const { releaseVersion } = body;

    if (!releaseVersion) {
      return NextResponse.json({ error: 'releaseVersion required' }, { status: 400 });
    }

    log.info('fairness.report.generate.start', { releaseVersion, admin: user.id });

    // Check if report already exists for this version
    const existing = await db.query.fairnessReports.findFirst({
      where: eq(fairnessReports.releaseVersion, releaseVersion),
    });

    if (existing) {
      log.info('fairness.report.exists', { releaseVersion, reportId: existing.id });
      return NextResponse.json({
        report: existing,
        message: 'Report already exists for this version',
      });
    }

    // Generate fairness analysis
    const report = await calculateFairnessGaps(releaseVersion);

    // Generate markdown and store in database
    const { generateFairnessMarkdown } = await import('@/lib/reports/fairness-note');
    const reportMarkdown = generateFairnessMarkdown(report);

    const [savedReport] = await db
      .insert(fairnessReports)
      .values({
        releaseVersion: report.releaseVersion,
        reportMarkdown,
        metricsJson: report as any, // JSONB field
      })
      .returning();

    log.info('fairness.report.generated', {
      releaseVersion,
      reportId: savedReport.id,
      significantGaps: report.segments.filter((s) => s.significant).length,
    });

    return NextResponse.json({
      report: savedReport,
      analysis: report,
    });
  } catch (error) {
    log.error('fairness.report.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json({ error: 'Failed to generate fairness report' }, { status: 500 });
  }
}

/**
 * Get fairness reports
 */
export async function GET(request: NextRequest) {
  try {
    const authContext = await requireApiAuthContext();
    if (!authContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { user } = authContext;

    // Only platform admins can view fairness reports
    const profile = await db.query.profiles.findFirst({
      where: (profiles, { eq }) => eq(profiles.id, user.id),
    });

    if (!profile || profile.platformRole !== 'platform_admin') {
      return NextResponse.json({ error: 'Unauthorized - Admin only' }, { status: 403 });
    }

    const url = new URL(request.url);
    const releaseVersion = url.searchParams.get('releaseVersion');
    const limit = parseInt(url.searchParams.get('limit') || '10');

    if (releaseVersion) {
      // Get specific report
      const report = await db.query.fairnessReports.findFirst({
        where: eq(fairnessReports.releaseVersion, releaseVersion),
      });

      if (!report) {
        return NextResponse.json({ error: 'Report not found' }, { status: 404 });
      }

      return NextResponse.json({ report });
    }

    // Get recent reports
    const reports = await db.query.fairnessReports.findMany({
      orderBy: [desc(fairnessReports.createdAt)],
      limit,
    });

    return NextResponse.json({ reports });
  } catch (error) {
    log.error('fairness.report.fetch.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json({ error: 'Failed to fetch fairness reports' }, { status: 500 });
  }
}
