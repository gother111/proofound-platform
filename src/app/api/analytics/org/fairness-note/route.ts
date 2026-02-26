/**
 * Fairness Note API
 *
 * Returns the latest fairness note with real-time fallback calculation.
 * PRD Reference: Part 2 - Fairness Gap Metric
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuthContext } from '@/lib/auth';
import { db } from '@/db';
import { fairnessNotes, analyticsEvents } from '@/db/schema';
import { desc, eq, sql } from 'drizzle-orm';
import { log } from '@/lib/log';

export async function GET(request: NextRequest) {
  try {
    const authContext = await requireApiAuthContext();
    if (!authContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { user } = authContext;
    const { searchParams } = new URL(request.url);
    const orgSlug = searchParams.get('orgSlug');

    if (!orgSlug) {
      return NextResponse.json({ error: 'Organization slug is required' }, { status: 400 });
    }

    // TODO: Verify user has access to this organization

    // Fetch latest published fairness note
    const latestNote = await db.query.fairnessNotes.findFirst({
      where: eq(fairnessNotes.status, 'published'),
      orderBy: [desc(fairnessNotes.generatedAt)],
    });

    // Check if note is stale (>24 hours old)
    const isStale = latestNote
      ? Date.now() - new Date(latestNote.generatedAt).getTime() > 24 * 60 * 60 * 1000
      : true;

    // If no note or stale, calculate on-the-fly
    if (isStale) {
      log.info('fairness-note.calculating-realtime', { orgSlug });

      // Quick real-time calculation (simplified)
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);

      const cohortData = await db.execute(sql`
        WITH contract_events AS (
          SELECT 
            e1.user_id,
            EXTRACT(EPOCH FROM (e2.timestamp - e1.timestamp)) / 86400 AS days_to_contract,
            e1.properties->>'cohort_role' AS role_family
          FROM ${analyticsEvents} e1
          JOIN ${analyticsEvents} e2 
            ON e1.user_id = e2.user_id
            AND e1.event_type = 'profile_activated'
            AND e2.event_type = 'contract_signed'
            AND e2.timestamp > e1.timestamp
          WHERE e2.timestamp >= ${startDate}
            AND e2.timestamp <= ${endDate}
        )
        SELECT 
          role_family,
          COUNT(*) AS sample_size,
          PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY days_to_contract) AS median_ttsc
        FROM contract_events
        GROUP BY role_family
        HAVING COUNT(*) >= 3
      `);

      const cohorts = cohortData as unknown as any[];

      if (cohorts.length < 2) {
        return NextResponse.json({
          hasData: false,
          message: 'Insufficient data for fairness analysis',
          lastGenerated: latestNote?.generatedAt || null,
          isRealtime: true,
        });
      }

      // Calculate global median and check for gaps
      const globalMedian =
        cohorts.reduce((sum, c) => sum + parseFloat(c.median_ttsc), 0) / cohorts.length;
      const hasSignificantGaps = cohorts.some((c) => {
        const deviation = ((parseFloat(c.median_ttsc) - globalMedian) / globalMedian) * 100;
        return Math.abs(deviation) > 20;
      });

      return NextResponse.json({
        hasData: true,
        hasSignificantGaps,
        cohortCount: cohorts.length,
        message: hasSignificantGaps
          ? 'Significant fairness gaps detected - review recommended'
          : 'No significant fairness gaps detected',
        lastGenerated: latestNote?.generatedAt || null,
        isRealtime: true,
        cohortsAnalyzed: cohorts.length,
      });
    }

    if (!latestNote) {
      return NextResponse.json({
        hasData: false,
        message: 'No fairness note available',
        lastGenerated: null,
        isRealtime: false,
      });
    }

    // Return stored note
    return NextResponse.json({
      hasData: true,
      hasSignificantGaps: latestNote.hasSignificantGaps,
      findings: latestNote.findings,
      recommendations: latestNote.recommendations,
      cohortCount: (latestNote.cohortData as any[]).length,
      message: latestNote.hasSignificantGaps
        ? 'Significant fairness gaps detected - review recommended'
        : 'No significant fairness gaps detected',
      lastGenerated: latestNote.generatedAt,
      isRealtime: false,
    });
  } catch (error) {
    log.error('fairness-note.fetch.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json({ error: 'Failed to fetch fairness note' }, { status: 500 });
  }
}
