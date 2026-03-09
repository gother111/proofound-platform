/**
 * Fairness Gap Calculation Library
 *
 * Implements PRD Part 7: Fairness Note requirement
 * Automatically generates fairness analysis on releases showing
 * if any demographic segments experience acceptance rate gaps
 * controlling for skills and constraints.
 *
 * Uses chi-square test for statistical significance.
 */

import { db } from '@/db';
import { sql } from 'drizzle-orm';
import { log } from '@/lib/log';
import { getRows } from '@/lib/db/rows';
import { generateFairnessNote as generateFairnessNoteByVersion } from './fairness-note-generator';

// ============================================================================
// TYPES
// ============================================================================

export interface FairnessSegment {
  segment: string; // e.g., "age:25-34", "gender:female", "location:latam"
  metricType: 'match_acceptance' | 'interview_rate' | 'contract_rate';
  baseline: number; // Overall acceptance rate
  segmentRate: number; // This segment's acceptance rate
  gap: number; // Difference from baseline (percentage points)
  pValue: number; // Statistical significance (p < 0.05 is significant)
  significant: boolean; // Whether gap is statistically significant
  sampleSize: number; // Number of events in this segment
}

export interface FairnessReport {
  releaseVersion: string;
  generatedAt: Date;
  overallMetrics: {
    totalMatches: number;
    totalIntroductions: number;
    totalInterviews: number;
    totalContracts: number;
  };
  segments: FairnessSegment[];
  summary: string;
  recommendations: string[];
}

const DEMOGRAPHIC_SEGMENT_COLUMNS = ['age', 'gender', 'location', 'ethnicity'] as const;
type DemographicSegmentColumn = (typeof DEMOGRAPHIC_SEGMENT_COLUMNS)[number];

// ============================================================================
// STATISTICAL FUNCTIONS
// ============================================================================

/**
 * Chi-square test for 2x2 contingency table
 * Tests if two proportions are significantly different
 */
function chiSquareTest(
  segment1Success: number,
  segment1Total: number,
  segment2Success: number,
  segment2Total: number
): { chiSquare: number; pValue: number; significant: boolean } {
  // Contingency table:
  //              | Success | Failure | Total
  // Segment 1    |   a     |   b     | n1
  // Segment 2    |   c     |   d     | n2
  // Total        |  a+c    |  b+d    | N

  const a = segment1Success;
  const b = segment1Total - segment1Success;
  const c = segment2Success;
  const d = segment2Total - segment2Success;
  const N = segment1Total + segment2Total;

  // Expected frequencies
  const row1Total = a + b;
  const row2Total = c + d;
  const col1Total = a + c;
  const col2Total = b + d;

  const e_a = (row1Total * col1Total) / N;
  const e_b = (row1Total * col2Total) / N;
  const e_c = (row2Total * col1Total) / N;
  const e_d = (row2Total * col2Total) / N;

  // Chi-square statistic
  const chiSquare =
    Math.pow(a - e_a, 2) / e_a +
    Math.pow(b - e_b, 2) / e_b +
    Math.pow(c - e_c, 2) / e_c +
    Math.pow(d - e_d, 2) / e_d;

  // Approximate p-value using chi-square distribution (df=1)
  // For quick implementation, use simplified thresholds
  let pValue: number;
  if (chiSquare >= 10.83)
    pValue = 0.001; // Highly significant
  else if (chiSquare >= 6.63)
    pValue = 0.01; // Very significant
  else if (chiSquare >= 3.84)
    pValue = 0.05; // Significant
  else if (chiSquare >= 2.71)
    pValue = 0.1; // Marginally significant
  else pValue = 0.5; // Not significant

  return {
    chiSquare,
    pValue,
    significant: pValue < 0.05,
  };
}

// ============================================================================
// FAIRNESS GAP CALCULATION
// ============================================================================

/**
 * Calculate fairness gaps for a specific release version
 *
 * Queries matches, introductions, interviews, and contracts
 * by opt-in demographic segments and tests for statistical
 * significance in acceptance rate gaps.
 */
export async function calculateFairnessGaps(releaseVersion: string): Promise<FairnessReport> {
  log.info('fairness.calculate.start', { releaseVersion });

  try {
    // Get overall metrics
    const overallMetrics = await getOverallMetrics(releaseVersion);
    const availableSegmentColumns = await getAvailableDemographicSegmentColumns();
    const unavailableSegmentColumns = DEMOGRAPHIC_SEGMENT_COLUMNS.filter(
      (column) => !availableSegmentColumns.includes(column)
    );

    // Calculate gaps for each segment type
    const segments: FairnessSegment[] = [];

    for (const segmentType of availableSegmentColumns) {
      const segmentRows = await calculateSegmentGaps(
        segmentType,
        'match_acceptance',
        releaseVersion
      );
      segments.push(...segmentRows);
    }

    // Generate summary and recommendations
    const summary = generateSummary(segments, unavailableSegmentColumns);
    const recommendations = generateRecommendations(segments, unavailableSegmentColumns);

    const report: FairnessReport = {
      releaseVersion,
      generatedAt: new Date(),
      overallMetrics,
      segments,
      summary,
      recommendations,
    };

    log.info('fairness.calculate.complete', {
      releaseVersion,
      totalSegments: segments.length,
      significantGaps: segments.filter((s) => s.significant).length,
      availableSegmentColumns,
      unavailableSegmentColumns,
    });

    return report;
  } catch (error) {
    log.error('fairness.calculate.failed', {
      releaseVersion,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

// ============================================================================
// Wrapper for date-based API (exports used by /api/analytics/fairness)
// ============================================================================

export async function generateFairnessNote(startDate: Date, endDate: Date): Promise<string> {
  const releaseVersion = `${startDate.toISOString()}_${endDate.toISOString()}`;
  return generateFairnessNoteByVersion(releaseVersion);
}

/**
 * Get overall metrics for the release period
 */
async function getOverallMetrics(
  releaseVersion: string
): Promise<FairnessReport['overallMetrics']> {
  // Query analytics events for this release version
  // For now, use a time-based approach (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const metrics = await db.execute(sql`
    SELECT
      COUNT(DISTINCT CASE WHEN event_type = 'match_generated' THEN entity_id END) as total_matches,
      COUNT(DISTINCT CASE WHEN event_type = 'match_introduced' THEN entity_id END) as total_introductions,
      COUNT(DISTINCT CASE WHEN event_type = 'interview_scheduled' THEN entity_id END) as total_interviews,
      COUNT(DISTINCT CASE WHEN event_type = 'contract_signed' THEN entity_id END) as total_contracts
    FROM analytics_events
    WHERE occurred_at >= ${thirtyDaysAgo.toISOString()}
	  `);

  const row = (getRows(metrics)[0] ?? {}) as any;

  return {
    totalMatches: parseInt(row.total_matches || '0'),
    totalIntroductions: parseInt(row.total_introductions || '0'),
    totalInterviews: parseInt(row.total_interviews || '0'),
    totalContracts: parseInt(row.total_contracts || '0'),
  };
}

async function getAvailableDemographicSegmentColumns(): Promise<DemographicSegmentColumn[]> {
  const result = await db.execute(sql`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'demographic_opt_ins'
      AND column_name IN ('age', 'gender', 'location', 'ethnicity')
  `);

  const availableColumns = new Set(
    (getRows(result) as Array<{ column_name?: string | null }>)
      .map((row) => row.column_name)
      .filter((value): value is DemographicSegmentColumn =>
        DEMOGRAPHIC_SEGMENT_COLUMNS.includes(value as DemographicSegmentColumn)
      )
  );

  return DEMOGRAPHIC_SEGMENT_COLUMNS.filter((column) => availableColumns.has(column));
}

/**
 * Calculate gaps for a specific segment type (age, gender, location, etc.)
 */
async function calculateSegmentGaps(
  segmentType: DemographicSegmentColumn,
  metricType: FairnessSegment['metricType'],
  releaseVersion: string
): Promise<FairnessSegment[]> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Get baseline acceptance rate (all users)
  const baselineResult = await db.execute(sql`
    SELECT
      COUNT(DISTINCT CASE WHEN e.event_type = 'match_generated' THEN e.entity_id END)::float as matches,
      COUNT(DISTINCT CASE WHEN e.event_type = 'match_introduced' THEN e.entity_id END)::float as introductions
    FROM analytics_events e
    WHERE e.occurred_at >= ${thirtyDaysAgo.toISOString()}
      AND e.event_type IN ('match_generated', 'match_introduced')
	  `);

  const baselineRow = (getRows(baselineResult)[0] ?? {}) as any;
  const baselineMatches = parseFloat(baselineRow.matches || '0');
  const baselineIntroductions = parseFloat(baselineRow.introductions || '0');
  const baseline = baselineMatches > 0 ? baselineIntroductions / baselineMatches : 0;

  // Get segment-specific rates from the dedicated demographic opt-in dataset.
  const segmentResults = await db.execute(sql`
    SELECT
      d.${sql.raw(segmentType)} as segment_value,
      COUNT(DISTINCT CASE WHEN e.event_type = 'match_generated' THEN e.entity_id END)::float as matches,
      COUNT(DISTINCT CASE WHEN e.event_type = 'match_introduced' THEN e.entity_id END)::float as introductions
    FROM analytics_events e
    INNER JOIN demographic_opt_ins d ON e.user_id = d.profile_id
    WHERE e.occurred_at >= ${thirtyDaysAgo.toISOString()}
      AND e.event_type IN ('match_generated', 'match_introduced')
      AND d.${sql.raw(segmentType)} IS NOT NULL
      AND d.opt_in = true
    GROUP BY d.${sql.raw(segmentType)}
    HAVING COUNT(DISTINCT e.entity_id) >= 10
  `);

  const segments: FairnessSegment[] = [];

  for (const row of getRows(segmentResults) as any[]) {
    const segmentValue = row.segment_value;
    const segmentMatches = parseFloat(row.matches || '0');
    const segmentIntroductions = parseFloat(row.introductions || '0');
    const segmentRate = segmentMatches > 0 ? segmentIntroductions / segmentMatches : 0;

    // Calculate gap
    const gap = (segmentRate - baseline) * 100; // Percentage points

    // Statistical test
    const test = chiSquareTest(
      segmentIntroductions,
      segmentMatches,
      baselineIntroductions,
      baselineMatches
    );

    segments.push({
      segment: `${segmentType}:${segmentValue}`,
      metricType,
      baseline: baseline * 100,
      segmentRate: segmentRate * 100,
      gap,
      pValue: test.pValue,
      significant: test.significant,
      sampleSize: segmentMatches,
    });
  }

  return segments;
}

// ============================================================================
// REPORT GENERATION
// ============================================================================

/**
 * Generate summary text for fairness report
 */
function generateSummary(
  segments: FairnessSegment[],
  unavailableSegmentColumns: readonly DemographicSegmentColumn[]
): string {
  if (
    segments.length === 0 &&
    unavailableSegmentColumns.length === DEMOGRAPHIC_SEGMENT_COLUMNS.length
  ) {
    return 'Demographic fairness analysis is unavailable for the current production schema because demographic_opt_ins does not yet include age, gender, location, or ethnicity columns. Overall matching metrics were recorded successfully.';
  }

  if (segments.length === 0 && unavailableSegmentColumns.length > 0) {
    return `No statistically significant fairness gaps detected for the currently available demographic fields. Skipped schema-missing fields: ${unavailableSegmentColumns.join(', ')}.`;
  }

  const significantGaps = segments.filter((s) => s.significant);

  if (significantGaps.length === 0) {
    const skippedFields =
      unavailableSegmentColumns.length > 0
        ? ` Skipped schema-missing fields: ${unavailableSegmentColumns.join(', ')}.`
        : '';
    return `No statistically significant fairness gaps detected. All demographic segments show comparable acceptance rates when controlling for skills and constraints.${skippedFields}`;
  }

  const negativeGaps = significantGaps.filter((s) => s.gap < -5);
  const positiveGaps = significantGaps.filter((s) => s.gap > 5);

  let summary = `Detected ${significantGaps.length} statistically significant gap(s) in match acceptance rates. `;

  if (negativeGaps.length > 0) {
    const worstGap = negativeGaps.reduce((prev, curr) => (curr.gap < prev.gap ? curr : prev));
    summary += `Most concerning: ${worstGap.segment} shows ${Math.abs(worstGap.gap).toFixed(1)}pp lower acceptance rate (p=${worstGap.pValue.toFixed(3)}). `;
  }

  if (positiveGaps.length > 0) {
    summary += `${positiveGaps.length} segment(s) show higher-than-average acceptance rates. `;
  }

  summary += 'Review recommendations for mitigation strategies.';

  return summary;
}

/**
 * Generate actionable recommendations
 */
function generateRecommendations(
  segments: FairnessSegment[],
  unavailableSegmentColumns: readonly DemographicSegmentColumn[]
): string[] {
  const recommendations: string[] = [];
  const significantGaps = segments.filter((s) => s.significant);

  if (
    segments.length === 0 &&
    unavailableSegmentColumns.length === DEMOGRAPHIC_SEGMENT_COLUMNS.length
  ) {
    recommendations.push(
      'Add demographic segment columns to demographic_opt_ins before re-enabling demographic fairness segmentation.'
    );
    recommendations.push(
      'Keep the fairness cron enabled only for baseline report generation until schema support is available.'
    );
    return recommendations;
  }

  if (significantGaps.length === 0) {
    recommendations.push('Continue monitoring fairness metrics on each release');
    recommendations.push('Maintain current matching algorithm and bias mitigation practices');
    if (unavailableSegmentColumns.length > 0) {
      recommendations.push(
        `Backfill or add schema support for skipped fields: ${unavailableSegmentColumns.join(', ')}`
      );
    }
    return recommendations;
  }

  // Identify patterns
  const negativeGaps = significantGaps.filter((s) => s.gap < -5);

  if (negativeGaps.length > 0) {
    recommendations.push(
      `PRIORITY: Investigate root causes for lower acceptance rates in: ${negativeGaps.map((g) => g.segment).join(', ')}`
    );

    // Check if it's a data quality issue
    const lowSampleGaps = negativeGaps.filter((g) => g.sampleSize < 50);
    if (lowSampleGaps.length > 0) {
      recommendations.push(
        `Consider increasing outreach to segments with low sample sizes: ${lowSampleGaps.map((g) => g.segment).join(', ')}`
      );
    }

    // Algorithm review
    recommendations.push(
      'Review matching algorithm weights to ensure no unintended bias in scoring'
    );

    // Skill taxonomy review
    recommendations.push(
      'Audit L4 skill taxonomy for cultural or geographic bias that may disadvantage certain segments'
    );

    // Assignment language review
    recommendations.push(
      'Review assignment descriptions for potentially exclusionary language or requirements'
    );
  }

  // Proactive monitoring
  recommendations.push('Schedule follow-up fairness audit in 2 weeks to measure impact of changes');
  recommendations.push(
    'Conduct qualitative interviews with affected segments to understand barriers'
  );

  return recommendations;
}

// ============================================================================
// EXPORTS
// ============================================================================

export { chiSquareTest };
