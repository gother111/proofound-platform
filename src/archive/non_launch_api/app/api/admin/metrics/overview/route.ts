/**
 * Admin Metrics Overview API
 * GET /api/admin/metrics/overview
 *
 * Returns outcome metrics plus proof, trust, workflow, and publication health
 * for the admin dashboard.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requirePlatformAdminJson } from '@/lib/api/route-helpers';
import {
  calculateTTSC,
  calculateTTFQI,
  calculateTTV,
  calculateSUS,
  calculatePACLift,
} from '@/lib/analytics/metrics';
import { db } from '@/db';
import { interviews, introWorkflows, matchReasonLedger } from '@/db/schema';
import { gte } from 'drizzle-orm';
import { sql } from 'drizzle-orm';
import { getRows } from '@/lib/db/rows';

export const dynamic = 'force-dynamic';

export async function GET(_request: NextRequest) {
  try {
    // Verify admin access (JSON-friendly)
    const adminUser = await requirePlatformAdminJson();
    if (adminUser instanceof NextResponse) return adminUser;

    // Calculate TTSC (North Star Metric)
    const ttscResult = await calculateTTSC();

    // Calculate TTFQI
    const ttfqiResult = await calculateTTFQI();

    // Calculate TTV
    const ttvResult = await calculateTTV();

    // Calculate SUS Score
    const susResult = await calculateSUS();

    // Calculate PAC Lift
    const pacResult = await calculatePACLift();
    const [proofTrustMetrics, workflowMetrics, publicationMetrics] = await Promise.all([
      getProofTrustMetrics(),
      getWorkflowMetrics(),
      getPublicationMetrics(),
    ]);

    const metrics = {
      ttsc: {
        median: ttscResult.value,
        p75: ttscResult.percentile?.p75 || null,
        count: ttscResult.sampleSize,
        targetMet: ttscResult.onTrack,
      },
      ttfqi: {
        median: ttfqiResult.value,
        p75: ttfqiResult.percentile?.p75 || null,
        count: ttfqiResult.sampleSize,
        targetMet: ttfqiResult.onTrack,
      },
      ttv: {
        median: ttvResult.value,
        p75: ttvResult.percentile?.p75 || null,
        count: ttvResult.sampleSize,
        targetMet: ttvResult.onTrack,
      },
      sus: {
        average: susResult.value,
        targetMet: susResult.onTrack,
        responseCount: susResult.responses,
      },
      pac: {
        topDecileLift: pacResult.lift,
        targetMet: pacResult.onTrack,
        sampleSize: pacResult.sampleSize.withPAC + pacResult.sampleSize.withoutPAC,
      },
      proofTrust: proofTrustMetrics,
      workflow: workflowMetrics,
      publication: publicationMetrics,
    };

    return NextResponse.json({
      metrics,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Failed to calculate metrics:', error);
    return NextResponse.json(
      {
        error: 'Failed to calculate metrics',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

function toRoundedNumber(value: unknown, digits = 2) {
  const parsed = Number(value ?? 0);
  if (!Number.isFinite(parsed)) return 0;
  return Number(parsed.toFixed(digits));
}

function toNullableNumber(value: unknown, digits = 2) {
  const parsed = Number(value ?? NaN);
  if (!Number.isFinite(parsed)) return null;
  return Number(parsed.toFixed(digits));
}

function safeRate(numerator: number, denominator: number) {
  if (denominator <= 0) return 0;
  return Number((numerator / denominator).toFixed(4));
}

async function getProofTrustMetrics() {
  const result = await db.execute(sql`
    SELECT
      COUNT(*)::int AS sample_size,
      COALESCE(SUM(proof_backed_skill_count), 0)::int AS proof_backed_skill_count,
      COALESCE(SUM(public_skill_count), 0)::int AS public_skill_count,
      AVG(proof_coverage_ratio::numeric) AS proof_coverage_ratio_avg,
      AVG(verification_coverage_ratio::numeric) AS verification_coverage_ratio_avg,
      AVG(trust_signal_coverage_count::numeric) AS trust_signal_coverage_count_avg,
      AVG(proof_quality_summary::numeric) AS proof_quality_summary_avg,
      AVG(time_to_verified_hours_p50::numeric) AS time_to_verified_hours_p50_avg,
      COALESCE(SUM((proof_freshness_distribution->>'fresh')::int), 0)::int AS fresh_count,
      COALESCE(SUM((proof_freshness_distribution->>'review_soon')::int), 0)::int AS review_soon_count,
      COALESCE(SUM((proof_freshness_distribution->>'stale')::int), 0)::int AS stale_count,
      COALESCE(SUM((proof_freshness_distribution->>'expired')::int), 0)::int AS expired_count
    FROM proof_trust_snapshots
    WHERE subject_type = 'individual_profile'
      AND context = 'portfolio'
  `);

  const row = (getRows(result)[0] ?? {}) as Record<string, unknown>;
  const proofBackedSkillCount = Number(row.proof_backed_skill_count ?? 0);
  const publicSkillCount = Number(row.public_skill_count ?? 0);
  const freshnessDistribution = {
    fresh: Number(row.fresh_count ?? 0),
    reviewSoon: Number(row.review_soon_count ?? 0),
    stale: Number(row.stale_count ?? 0),
    expired: Number(row.expired_count ?? 0),
  };

  return {
    sampleSize: Number(row.sample_size ?? 0),
    proofCoverageRatio: safeRate(proofBackedSkillCount, publicSkillCount),
    proofCoverageRatioAvg: toRoundedNumber(row.proof_coverage_ratio_avg, 4),
    proofBackedSkillCount,
    publicSkillCount,
    verificationCoverageRatioAvg: toRoundedNumber(row.verification_coverage_ratio_avg, 4),
    trustSignalCoverageCountAvg: toRoundedNumber(row.trust_signal_coverage_count_avg, 2),
    proofQualitySummaryAvg: toNullableNumber(row.proof_quality_summary_avg, 2),
    timeToVerifiedHoursP50Avg: toNullableNumber(row.time_to_verified_hours_p50_avg, 2),
    freshnessDistribution,
  };
}

async function getWorkflowMetrics() {
  const since = new Date();
  since.setDate(since.getDate() - 90);

  const eventCountsResult = await db.execute(sql`
    SELECT
      COUNT(*) FILTER (WHERE event_type = 'verification_request_created')::int AS verification_requests,
      COUNT(*) FILTER (WHERE event_type = 'verification_record_completed')::int AS verification_completed,
      COUNT(*) FILTER (WHERE event_type = 'verification_record_failed')::int AS verification_failed,
      COUNT(*) FILTER (WHERE event_type = 'verification_request_expired')::int AS verification_expired,
      COUNT(*) FILTER (WHERE event_type = 'reveal_requested')::int AS reveal_requested,
      COUNT(*) FILTER (WHERE event_type = 'reveal_granted')::int AS reveal_granted,
      COUNT(*) FILTER (WHERE event_type = 'reveal_denied')::int AS reveal_denied,
      COUNT(*) FILTER (WHERE event_type = 'intro_workflow_expired')::int AS intro_expired,
      COUNT(*) FILTER (WHERE event_type = 'intro_workflow_withdrawn')::int AS intro_withdrawn,
      COUNT(*) FILTER (WHERE event_type = 'interview_no_show_recorded')::int AS interview_no_show,
      COUNT(*) FILTER (WHERE event_type = 'review_override_applied')::int AS override_applied
    FROM analytics_events
    WHERE created_at >= ${since}
  `);
  const eventCounts = (getRows(eventCountsResult)[0] ?? {}) as Record<string, unknown>;

  const [introBaseResult, interviewBaseResult, reviewedBaseResult] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(introWorkflows)
      .where(gte(introWorkflows.createdAt, since)),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(interviews)
      .where(gte(interviews.createdAt, since)),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(matchReasonLedger)
      .where(gte(matchReasonLedger.createdAt, since)),
  ]);

  const verificationRequests = Number(eventCounts.verification_requests ?? 0);
  const verificationCompleted = Number(eventCounts.verification_completed ?? 0);
  const verificationFailed = Number(eventCounts.verification_failed ?? 0);
  const verificationExpired = Number(eventCounts.verification_expired ?? 0);
  const revealRequested = Number(eventCounts.reveal_requested ?? 0);
  const revealGranted = Number(eventCounts.reveal_granted ?? 0);
  const revealDenied = Number(eventCounts.reveal_denied ?? 0);
  const introCreated = Number(introBaseResult[0]?.count ?? 0);
  const introExpired = Number(eventCounts.intro_expired ?? 0);
  const introWithdrawn = Number(eventCounts.intro_withdrawn ?? 0);
  const interviewsCreated = Number(interviewBaseResult[0]?.count ?? 0);
  const interviewsNoShow = Number(eventCounts.interview_no_show ?? 0);
  const overridesApplied = Number(eventCounts.override_applied ?? 0);
  const reviewedItems = Number(reviewedBaseResult[0]?.count ?? 0);

  return {
    verification: {
      requests: verificationRequests,
      completed: verificationCompleted,
      failed: verificationFailed,
      expired: verificationExpired,
      conversionRate: safeRate(verificationCompleted, verificationRequests),
      failureRate: safeRate(verificationFailed, verificationRequests),
      expiryRate: safeRate(verificationExpired, verificationRequests),
    },
    reveal: {
      requested: revealRequested,
      granted: revealGranted,
      denied: revealDenied,
      grantRate: safeRate(revealGranted, revealRequested),
      denialRate: safeRate(revealDenied, revealRequested),
    },
    intros: {
      created: introCreated,
      expired: introExpired,
      withdrawn: introWithdrawn,
      expiryRate: safeRate(introExpired, introCreated),
      withdrawalRate: safeRate(introWithdrawn, introCreated),
    },
    interviews: {
      created: interviewsCreated,
      noShow: interviewsNoShow,
      noShowRate: safeRate(interviewsNoShow, interviewsCreated),
    },
    overrides: {
      applied: overridesApplied,
      rate: safeRate(overridesApplied, reviewedItems),
    },
  };
}

async function getPublicationMetrics() {
  const result = await db.execute(sql`
    SELECT
      COUNT(*)::int AS sample_size,
      COUNT(*) FILTER (WHERE effective_state = 'public_indexable')::int AS public_indexable_count,
      COUNT(*) FILTER (WHERE effective_state = 'public_noindex')::int AS public_noindex_count,
      COUNT(*) FILTER (WHERE effective_state = 'public_link_only')::int AS public_link_only_count,
      COUNT(*) FILTER (WHERE effective_state = 'unavailable')::int AS unavailable_count,
      COUNT(*) FILTER (WHERE indexing_state = 'indexable')::int AS indexing_indexable_count,
      COUNT(*) FILTER (WHERE indexing_state = 'noindex')::int AS indexing_noindex_count
    FROM portfolio_publication_states
    WHERE subject_type = 'individual_profile'
  `);

  const row = (getRows(result)[0] ?? {}) as Record<string, unknown>;
  const sampleSize = Number(row.sample_size ?? 0);
  const publicIndexableCount = Number(row.public_indexable_count ?? 0);
  const publicNoindexCount = Number(row.public_noindex_count ?? 0);
  const publicLinkOnlyCount = Number(row.public_link_only_count ?? 0);
  const unavailableCount = Number(row.unavailable_count ?? 0);
  const indexingIndexableCount = Number(row.indexing_indexable_count ?? 0);
  const indexingNoindexCount = Number(row.indexing_noindex_count ?? 0);

  return {
    sampleSize,
    stateCounts: {
      publicIndexable: publicIndexableCount,
      publicNoindex: publicNoindexCount,
      publicLinkOnly: publicLinkOnlyCount,
      unavailable: unavailableCount,
    },
    indexableCoverage: safeRate(indexingIndexableCount, sampleSize),
    noindexCoverage: safeRate(indexingNoindexCount, sampleSize),
  };
}
