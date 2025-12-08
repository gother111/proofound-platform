/**
 * Fairness Report Cron Job
 *
 * Automatically generates fairness reports on deployments
 * Triggered by Vercel Cron or deployment webhooks
 *
 * PRD Requirement: Automated fairness note generation per release
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { fairnessReports } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { calculateFairnessGaps } from '@/lib/analytics/fairness';
import { generateFairnessMarkdown, generateFairnessSummary } from '@/lib/reports/fairness-note';
import { log } from '@/lib/log';

function isAuthorized(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const secrets = [
    process.env.CRON_SECRET,
    process.env.CRON_SECRET_PREVIEW,
    process.env.NEXT_PUBLIC_CRON_SECRET,
  ].filter(Boolean) as string[];

  if (!secrets.length) return false;
  return secrets.some(secret => authHeader === `Bearer ${secret}`);
}

/**
 * Generate fairness report on deployment
 *
 * Usage:
 * - Can be triggered by Vercel Cron (e.g., weekly)
 * - Can be triggered by deployment webhook
 * - Requires CRON_SECRET env var for authentication
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret (allow preview/fallback)
    if (!isAuthorized(request)) {
      log.warn('fairness.cron.unauthorized', {
        hasAuth: !!request.headers.get('authorization'),
        hasSecret: !!process.env.CRON_SECRET,
      });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get release version from environment or git tag
    const releaseVersion =
      process.env.VERCEL_GIT_COMMIT_REF ||
      process.env.VERCEL_DEPLOYMENT_ID ||
      `auto-${new Date().toISOString().split('T')[0]}`;

    log.info('fairness.cron.start', { releaseVersion });

    // Check if report already exists
    const existing = await db.query.fairnessReports.findFirst({
      where: eq(fairnessReports.releaseVersion, releaseVersion),
    });

    if (existing) {
      log.info('fairness.cron.skip', { releaseVersion, reason: 'report_exists' });
      return NextResponse.json({
        message: 'Report already exists',
        releaseVersion,
        reportId: existing.id,
      });
    }

    // Generate fairness analysis
    let report;
    try {
      report = await calculateFairnessGaps(releaseVersion);
    } catch (error) {
      log.error('fairness.calculate.failed', {
        releaseVersion,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return NextResponse.json(
        {
          success: false,
          error: 'Fairness calculation failed',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      );
    }

    // Generate markdown
    const reportMarkdown = generateFairnessMarkdown(report);

    // Store in database
    const [savedReport] = await db
      .insert(fairnessReports)
      .values({
        releaseVersion: report.releaseVersion,
        reportMarkdown,
        metricsJson: report as any,
      })
      .returning();

    // Send email notification if gaps detected
    const significantGaps = report.segments.filter((s) => s.significant);
    if (significantGaps.length > 0) {
      log.warn('fairness.gaps.detected', {
        releaseVersion,
        gapCount: significantGaps.length,
      });

      // TODO: Send email to admins
      // await sendEmail({
      //   to: 'admins@proofound.com',
      //   subject: `⚠️ Fairness Gaps Detected - ${releaseVersion}`,
      //   text: generateFairnessSummary(report),
      // });
    }

    log.info('fairness.cron.complete', {
      releaseVersion,
      reportId: savedReport.id,
      significantGaps: significantGaps.length,
    });

    return NextResponse.json({
      success: true,
      releaseVersion,
      reportId: savedReport.id,
      significantGaps: significantGaps.length,
      summary: report.summary,
    });
  } catch (error) {
    log.error('fairness.cron.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json({ error: 'Failed to generate fairness report' }, { status: 500 });
  }
}

/**
 * POST endpoint for manual triggering (with auth check)
 */
export async function POST(request: NextRequest) {
  return GET(request);
}
