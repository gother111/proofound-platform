/**
 * Compatibility-safe fairness note generation shared by cron and admin flows.
 *
 * The current production schema does not guarantee rich demographic cohort data,
 * so insufficient data must be treated as a degraded success rather than an error.
 */

import { sql } from 'drizzle-orm';

import { db } from '@/db';
import { analyticsEvents, fairnessNotes } from '@/db/schema';
import type { InsertFairnessNote } from '@/db/schema';
import { getRows } from '@/lib/db/rows';

const FAIRNESS_WINDOW_DAYS = 7;
const MIN_SAMPLE_SIZE = 40;
const P_VALUE_THRESHOLD = '0.05';

type PublicationStatus = 'draft' | 'published';
type CohortRow = {
  role_family: string | null;
  seniority: string | null;
  geography: string | null;
  sample_size: string | number;
  median_ttsc: string | number;
};

export type FairnessNoteGenerationStatus = 'success' | 'insufficient_data';

export interface FairnessNoteGenerationResult {
  noteId: string;
  status: FairnessNoteGenerationStatus;
  releaseVersion: string;
  cohortsAnalyzed: number;
  findingsCount: number;
  hasSignificantGaps: boolean;
  message?: string;
}

type GenerationOptions = {
  releaseVersion: string;
  createdBy?: string;
  publicationStatus?: PublicationStatus;
};

function buildInsertPayload(
  options: GenerationOptions,
  cohortData: unknown[],
  findings: unknown[],
  recommendations: unknown[],
  hasSignificantGaps: boolean
): InsertFairnessNote {
  const publicationStatus = options.publicationStatus ?? 'draft';
  const now = new Date();

  return {
    releaseVersion: options.releaseVersion,
    generatedAt: now,
    cohortData,
    findings,
    recommendations,
    status: publicationStatus,
    minSampleSize: MIN_SAMPLE_SIZE,
    hasSignificantGaps,
    pValue: hasSignificantGaps || findings.length > 0 ? P_VALUE_THRESHOLD : null,
    createdBy: options.createdBy ?? null,
    publishedAt: publicationStatus === 'published' ? now : null,
  };
}

async function saveFairnessNote(
  options: GenerationOptions,
  cohortData: unknown[],
  findings: unknown[],
  recommendations: unknown[],
  hasSignificantGaps: boolean
): Promise<string> {
  const [note] = await db
    .insert(fairnessNotes)
    .values(buildInsertPayload(options, cohortData, findings, recommendations, hasSignificantGaps))
    .returning();

  return note.id;
}

export async function generateFairnessNoteResult(
  options: GenerationOptions
): Promise<FairnessNoteGenerationResult> {
  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - FAIRNESS_WINDOW_DAYS * 24 * 60 * 60 * 1000);

  const result = await db.execute(sql`
    WITH contract_events AS (
      SELECT
        e1.user_id,
        e1.occurred_at AS activation_time,
        e2.occurred_at AS contract_time,
        EXTRACT(EPOCH FROM (e2.occurred_at - e1.occurred_at)) / 86400 AS days_to_contract,
        e1.properties->>'cohort_role' AS role_family,
        e1.properties->>'cohort_seniority' AS seniority,
        e1.properties->>'cohort_geography' AS geography
      FROM ${analyticsEvents} e1
      JOIN ${analyticsEvents} e2
        ON e1.user_id = e2.user_id
        AND e1.event_type = 'profile_activated'
        AND e2.event_type = 'contract_signed'
        AND e2.occurred_at > e1.occurred_at
      WHERE e2.occurred_at >= ${startDate}
        AND e2.occurred_at <= ${endDate}
    )
    SELECT
      role_family,
      seniority,
      geography,
      COUNT(*) AS sample_size,
      PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY days_to_contract) AS median_ttsc
    FROM contract_events
    GROUP BY role_family, seniority, geography
    HAVING COUNT(*) >= 5
    ORDER BY median_ttsc DESC
  `);

  const cohorts = getRows(result) as CohortRow[];

  if (cohorts.length < 2) {
    const noteId = await saveFairnessNote(
      options,
      [],
      [
        {
          type: 'insufficient_data',
          message: 'Not enough data to perform fairness analysis',
          sampleSize: cohorts.length,
        },
      ],
      [],
      false
    );

    return {
      noteId,
      status: 'insufficient_data',
      releaseVersion: options.releaseVersion,
      cohortsAnalyzed: cohorts.length,
      findingsCount: 1,
      hasSignificantGaps: false,
      message: 'Insufficient data for analysis',
    };
  }

  const globalMedian =
    cohorts.reduce((sum, cohort) => sum + parseFloat(String(cohort.median_ttsc)), 0) /
    cohorts.length;

  const findings: Array<Record<string, unknown>> = [];
  const recommendations: Array<Record<string, unknown>> = [];
  let hasSignificantGaps = false;

  for (const cohort of cohorts) {
    const medianTTSC = parseFloat(String(cohort.median_ttsc));
    const deviation = ((medianTTSC - globalMedian) / globalMedian) * 100;

    if (Math.abs(deviation) <= 20) {
      continue;
    }

    hasSignificantGaps = true;
    const severity = Math.abs(deviation) >= 40 ? 'critical' : 'moderate';
    findings.push({
      type: deviation > 0 ? 'negative_gap' : 'positive_gap',
      severity,
      cohort: {
        role: cohort.role_family,
        seniority: cohort.seniority,
        geography: cohort.geography,
      },
      medianTTSC: Math.round(medianTTSC),
      globalMedian: Math.round(globalMedian),
      deviationPercent: Math.round(deviation),
      sampleSize: Number(cohort.sample_size),
      description: `TTSC for ${cohort.role_family || 'unknown role'} / ${cohort.seniority || 'all seniorities'} / ${cohort.geography || 'global'} is ${Math.abs(Math.round(deviation))}% ${deviation > 0 ? 'slower' : 'faster'} than the global median.`,
    });

    if (deviation > 0) {
      recommendations.push({
        priority: severity === 'critical' ? 'high' : 'medium',
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

  const noteId = await saveFairnessNote(
    options,
    cohorts,
    findings,
    recommendations,
    hasSignificantGaps
  );

  return {
    noteId,
    status: 'success',
    releaseVersion: options.releaseVersion,
    cohortsAnalyzed: cohorts.length,
    findingsCount: findings.length,
    hasSignificantGaps,
  };
}

/**
 * Legacy wrapper kept for callers that only need the note ID.
 *
 * Default remains draft to avoid silently changing the admin/manual workflow.
 */
export async function generateFairnessNote(
  releaseVersion: string,
  createdBy?: string
): Promise<string> {
  const result = await generateFairnessNoteResult({
    releaseVersion,
    createdBy,
    publicationStatus: 'draft',
  });

  return result.noteId;
}
