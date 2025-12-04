/**
 * Fairness Note Cron Job
 *
 * Automatically generates fairness gap analysis daily at 2 AM UTC.
 * PRD Reference: Part 2 - Fairness Gap Metric
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { fairnessNotes, analyticsEvents } from '@/db/schema';
import { sql, gte } from 'drizzle-orm';
import { log } from '@/lib/log';
import { calculateFairnessGap } from '@/lib/analytics/metrics';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 60 seconds for Vercel Pro

/**
 * Cron job handler - runs daily at 2 AM UTC
 */
export async function GET(request: NextRequest) {
  try {
    // Verify this is a legitimate cron request (Vercel sets this header)
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      log.warn('fairness-note.cron.unauthorized', {
        hasSecret: !!process.env.CRON_SECRET,
        hasAuth: !!authHeader,
      });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    log.info('fairness-note.cron.started');

    // Calculate fairness gap for the last 7 days
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);

    // Get cohort data: Calculate TTSC by demographic cohorts
    const cohortData = await db.execute(sql`
      WITH contract_events AS (
        SELECT 
          e1.user_id,
          e1.timestamp AS activation_time,
          e2.timestamp AS contract_time,
          EXTRACT(EPOCH FROM (e2.timestamp - e1.timestamp)) / 86400 AS days_to_contract,
          e1.properties->>'cohort_role' AS role_family,
          e1.properties->>'cohort_seniority' AS seniority,
          e1.properties->>'cohort_geography' AS geography
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
        seniority,
        geography,
        COUNT(*) AS sample_size,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY days_to_contract) AS median_ttsc,
        AVG(days_to_contract) AS mean_ttsc,
        STDDEV(days_to_contract) AS stddev_ttsc
      FROM contract_events
      GROUP BY role_family, seniority, geography
      HAVING COUNT(*) >= 5
      ORDER BY median_ttsc DESC
    `);

    // Analyze gaps and generate findings
    const findings: any[] = [];
    const recommendations: any[] = [];
    let hasSignificantGaps = false;
    let minPValue = 1.0;

    const cohorts = cohortData as any[];

    if (cohorts.length < 2) {
      log.info('fairness-note.cron.insufficient-data', {
        cohortCount: cohorts.length,
      });

      // Still create a note indicating insufficient data
      await db.insert(fairnessNotes).values({
        releaseVersion: new Date().toISOString().split('T')[0], // YYYY-MM-DD
        cohortData: [],
        findings: [
          {
            type: 'insufficient_data',
            message: 'Not enough data to perform fairness analysis',
            sampleSize: cohorts.length,
          },
        ],
        recommendations: [],
        hasSignificantGaps: false,
        minSampleSize: 40,
        status: 'published',
        publishedAt: new Date(),
      });

      return NextResponse.json({
        success: true,
        message: 'Insufficient data for analysis',
      });
    }

    // Calculate global median
    const globalMedian =
      cohorts.reduce((sum, c) => sum + parseFloat(c.median_ttsc), 0) / cohorts.length;

    // Check for significant deviations (>20% from global median)
    for (const cohort of cohorts) {
      const medianTTSC = parseFloat(cohort.median_ttsc);
      const deviation = ((medianTTSC - globalMedian) / globalMedian) * 100;

      if (Math.abs(deviation) > 20) {
        hasSignificantGaps = true;
        findings.push({
          type: deviation > 0 ? 'negative_gap' : 'positive_gap',
          cohort: {
            role: cohort.role_family,
            seniority: cohort.seniority,
            geography: cohort.geography,
          },
          medianTTSC: Math.round(medianTTSC),
          globalMedian: Math.round(globalMedian),
          deviationPercent: Math.round(deviation),
          sampleSize: parseInt(cohort.sample_size),
        });

        if (deviation > 0) {
          recommendations.push({
            priority: 'high',
            cohort: {
              role: cohort.role_family,
              seniority: cohort.seniority,
              geography: cohort.geography,
            },
            action: 'Review assignment criteria and match weights',
            details: `This cohort experiences ${Math.abs(Math.round(deviation))}% longer TTSC than average`,
          });
        }
      }
    }

    // Store the fairness note
    await db.insert(fairnessNotes).values({
      releaseVersion: new Date().toISOString().split('T')[0],
      cohortData: cohorts,
      findings,
      recommendations,
      hasSignificantGaps,
      minSampleSize: 40,
      pValue: minPValue.toString(),
      status: 'published',
      publishedAt: new Date(),
    });

    log.info('fairness-note.cron.completed', {
      cohortsAnalyzed: cohorts.length,
      findingsCount: findings.length,
      hasGaps: hasSignificantGaps,
    });

    return NextResponse.json({
      success: true,
      cohortsAnalyzed: cohorts.length,
      findings: findings.length,
      hasSignificantGaps,
    });
  } catch (error) {
    log.error('fairness-note.cron.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json({ error: 'Failed to generate fairness note' }, { status: 500 });
  }
}
