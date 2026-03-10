import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { fairnessNotes } from '@/db/schema';
import { and, desc, gte, lte } from 'drizzle-orm';
import { requirePlatformAdminJson } from '@/lib/api/route-helpers';

type DashboardFairnessNote = {
  reportDate: string;
  reportPeriod: {
    startDate: string;
    endDate: string;
  };
  cohorts: Array<{
    cohortId: string;
    cohortName: string;
    introAcceptanceRate: number;
    contractSigningRate: number;
    sampleSize: number;
  }>;
  gaps: Array<{
    metric: 'intro_acceptance' | 'contract_signing';
    cohort1: string;
    cohort2: string;
    gap: number;
    isSignificant: boolean;
    pValue: number;
  }>;
  summary: string;
  status: 'passing' | 'warning' | 'failing';
  recommendations: string[];
};

const parseJsonArray = (value: unknown): any[] => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

const toPercent = (value: unknown): number => {
  const num = typeof value === 'number' ? value : Number(value ?? 0);
  if (!Number.isFinite(num)) return 0;
  return num <= 1 ? num * 100 : num;
};

const toNumber = (value: unknown): number => {
  const num = typeof value === 'number' ? value : Number(value ?? 0);
  return Number.isFinite(num) ? num : 0;
};

const buildSummary = (hasSignificantGaps: boolean, gaps: any[], hasInsufficientData: boolean) => {
  if (hasInsufficientData) {
    return 'Not enough data to perform fairness analysis for the selected period.';
  }
  if (!hasSignificantGaps) {
    return 'No statistically significant fairness gaps detected for the selected period.';
  }
  return `Detected ${gaps.length || 1} statistically significant fairness gap(s). Review recommendations for mitigation strategies.`;
};

const buildRecommendations = (recommendations: any[]): string[] => {
  if (!recommendations.length) return [];
  return recommendations.map((rec) => {
    if (typeof rec === 'string') return rec;
    if (rec?.action) return rec.action as string;
    if (rec?.title) return rec.title as string;
    return JSON.stringify(rec);
  });
};

/**
 * GET /api/analytics/fairness
 *
 * PRD Part 2: Fairness/Equity Signal
 * Generates fairness note for specified time period
 * Monitors demographic fairness gaps (opt-in only)
 *
 * Query params:
 * - startDate: ISO date string (default: 90 days ago)
 * - endDate: ISO date string (default: today)
 */
export async function GET(request: NextRequest) {
  const adminUser = await requirePlatformAdminJson();
  if (adminUser instanceof NextResponse) {
    return adminUser;
  }

  try {
    const { searchParams } = new URL(request.url);

    // Parse date parameters
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    const endDate = endDateParam ? new Date(endDateParam) : new Date();
    const startDate = startDateParam
      ? new Date(startDateParam)
      : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000); // 90 days ago

    // Validate dates
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json(
        {
          error: 'Invalid date format',
          message: 'Dates must be valid ISO 8601 strings',
        },
        { status: 400 }
      );
    }

    if (startDate >= endDate) {
      return NextResponse.json(
        {
          error: 'Invalid date range',
          message: 'startDate must be before endDate',
        },
        { status: 400 }
      );
    }

    // Fetch latest fairness note within the requested period
    const [note] = await db
      .select()
      .from(fairnessNotes)
      .where(
        and(gte(fairnessNotes.generatedAt, startDate), lte(fairnessNotes.generatedAt, endDate))
      )
      .orderBy(desc(fairnessNotes.generatedAt))
      .limit(1);

    if (!note) {
      return NextResponse.json({
        success: true,
        fairnessNote: null,
      });
    }

    const cohortData = parseJsonArray(note.cohortData);
    const findings = parseJsonArray(note.findings);
    const recommendations = parseJsonArray(note.recommendations);

    const hasInsufficientData = findings.some((finding) => finding?.type === 'insufficient_data');

    if (cohortData.length === 0 && hasInsufficientData) {
      return NextResponse.json({
        success: true,
        fairnessNote: null,
      });
    }

    const cohorts = cohortData.map((cohort: any, idx: number) => ({
      cohortId: cohort.cohortId ?? cohort.cohortName ?? `cohort-${idx + 1}`,
      cohortName: cohort.cohortName ?? cohort.cohortId ?? `Cohort ${idx + 1}`,
      introAcceptanceRate: toPercent(
        cohort.introAcceptanceRate ?? cohort.introductionRate ?? cohort.intro_rate
      ),
      contractSigningRate: toPercent(
        cohort.contractSigningRate ?? cohort.contractRate ?? cohort.contract_rate
      ),
      sampleSize: toNumber(cohort.sampleSize ?? cohort.size ?? cohort.sample_size),
    }));

    const gaps: DashboardFairnessNote['gaps'] = findings
      .filter((finding) => finding?.type === 'gap')
      .map((gap: any) => {
        const isSignificantFromSeverity =
          gap.severity === 'critical' || gap.severity === 'moderate';

        const metric: DashboardFairnessNote['gaps'][number]['metric'] =
          gap.metric === 'contract_rate' || gap.metric === 'contract_signing'
            ? 'contract_signing'
            : 'intro_acceptance';

        return {
          metric,
          cohort1: String(gap.cohorts?.[0] ?? gap.cohort1 ?? 'Cohort A'),
          cohort2: String(gap.cohorts?.[1] ?? gap.cohort2 ?? 'Cohort B'),
          gap: toNumber(gap.gapPercentage ?? gap.gap ?? 0),
          isSignificant: Boolean(gap.isSignificant ?? gap.significant ?? isSignificantFromSeverity),
          pValue: toNumber(gap.pValue ?? 0),
        };
      });

    let status: DashboardFairnessNote['status'] = note.hasSignificantGaps ? 'warning' : 'passing';
    if (hasInsufficientData) status = 'warning';
    if (findings.some((finding) => finding?.severity === 'critical')) status = 'failing';

    const fairnessNote: DashboardFairnessNote = {
      reportDate: new Date(note.generatedAt).toISOString(),
      reportPeriod: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
      cohorts,
      gaps,
      summary: buildSummary(note.hasSignificantGaps, gaps, hasInsufficientData),
      status,
      recommendations: buildRecommendations(recommendations),
    };

    return NextResponse.json({
      success: true,
      fairnessNote,
    });
  } catch (error) {
    console.error('Fairness note generation error:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate fairness note',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
