/**
 * Fairness Note Generator
 *
 * Automatically generates fairness notes per release, analyzing
 * introduction and contract rates across demographic cohorts with
 * statistical significance testing.
 *
 * PRD Reference: Part 2 (line 92), Part 5 F4
 */

import { db } from '@/db';
import { fairnessNotes, demographicOptIns, matches, analyticsEvents } from '@/db/schema';
import type { InsertFairnessNote } from '@/db/schema';
import { eq, and, gte, lte, sql } from 'drizzle-orm';
import { calculateFairnessGap, type FairnessGapResult } from './metrics';

type DemographicOptInRow = typeof demographicOptIns.$inferSelect;
type MatchRow = typeof matches.$inferSelect;
type AnalyticsEventRow = typeof analyticsEvents.$inferSelect;

export interface CohortAnalysis {
  cohortName: string;
  sampleSize: number;
  introductionRate: number;
  contractRate: number;
  comparedTo?: string; // Reference cohort for comparison
  gap?: number; // Percentage point difference
  pValue?: number; // Statistical significance
  isSignificant?: boolean;
}

export interface Finding {
  type: 'gap' | 'no_gap' | 'insufficient_data';
  severity: 'critical' | 'moderate' | 'low' | 'none';
  cohorts: string[]; // Cohorts involved in the finding
  metric: 'introduction_rate' | 'contract_rate';
  description: string;
  gapPercentage?: number;
  pValue?: number;
  isSignificant?: boolean;
}

export interface Recommendation {
  priority: 'high' | 'medium' | 'low';
  action: string;
  rationale: string;
  targetCohorts: string[];
}

export interface FairnessNoteData {
  releaseVersion: string;
  cohortAnalyses: CohortAnalysis[];
  findings: Finding[];
  recommendations: Recommendation[];
  hasSignificantGaps: boolean;
  generatedAt: Date;
  minSampleSize: number;
  pValueThreshold: number;
}

/**
 * Main function to generate a fairness note for a release
 */
export async function generateFairnessNote(
  releaseVersion: string,
  createdBy?: string
): Promise<string> {
  const startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000); // Last 90 days
  const endDate = new Date();

  // Get all available cohorts from demographic opt-ins
  const cohorts = await getAvailableCohorts();

  if (cohorts.length < 2) {
    throw new Error('Insufficient cohort data. Need at least 2 cohorts for fairness analysis.');
  }

  // Analyze each cohort pair
  const cohortAnalyses: CohortAnalysis[] = [];
  const fairnessGapResults: FairnessGapResult[] = [];

  for (let i = 0; i < cohorts.length; i++) {
    for (let j = i + 1; j < cohorts.length; j++) {
      const cohortA = cohorts[i];
      const cohortB = cohorts[j];

      const gapResult = await calculateFairnessGap(startDate, endDate);

      if (gapResult && gapResult.cohortA && gapResult.cohortB) {
        fairnessGapResults.push(gapResult);

        // Add cohort A analysis
        if (!cohortAnalyses.find((c) => c.cohortName === cohortA)) {
          cohortAnalyses.push({
            cohortName: cohortA,
            sampleSize: gapResult.cohortA.sampleSize,
            introductionRate: gapResult.cohortA.introductionRate,
            contractRate: gapResult.cohortA.contractRate,
          });
        }

        // Add cohort B analysis
        if (!cohortAnalyses.find((c) => c.cohortName === cohortB)) {
          cohortAnalyses.push({
            cohortName: cohortB,
            sampleSize: gapResult.cohortB.sampleSize,
            introductionRate: gapResult.cohortB.introductionRate,
            contractRate: gapResult.cohortB.contractRate,
          });
        }
      }
    }
  }

  // Detect significant gaps and generate findings
  const findings = detectSignificantGaps(fairnessGapResults);

  // Generate recommendations based on findings
  const recommendations = generateRecommendations(findings, cohortAnalyses);

  // Determine if there are significant gaps
  const hasSignificantGaps = findings.some((f) => f.type === 'gap' && f.isSignificant);

  // Create the fairness note
  const noteData: FairnessNoteData = {
    releaseVersion,
    cohortAnalyses,
    findings,
    recommendations,
    hasSignificantGaps,
    generatedAt: new Date(),
    minSampleSize: 40,
    pValueThreshold: 0.05,
  };

  // Save to database
  const insertData: InsertFairnessNote = {
    releaseVersion,
    generatedAt: new Date(),
    cohortData: cohortAnalyses as any,
    findings: findings as any,
    recommendations: recommendations as any,
    status: 'draft',
    minSampleSize: 40,
    hasSignificantGaps,
    pValue: '0.05',
    createdBy: createdBy || null,
  };

  const [note] = await db.insert(fairnessNotes).values(insertData).returning();

  return note.id;
}

/**
 * Get available demographic cohorts from opt-in data
 */
async function getAvailableCohorts(): Promise<string[]> {
  const optIns = await db
    .select()
    .from(demographicOptIns)
    .where(eq(demographicOptIns.optedIn, true));

  const cohortSet = new Set<string>();

  optIns.forEach((opt: DemographicOptInRow) => {
    if (opt.gender) cohortSet.add(opt.gender);
    if (opt.ethnicity) cohortSet.add(opt.ethnicity);
    if (opt.ageRange) cohortSet.add(opt.ageRange);
    // Note: Not including disability and veteran status for privacy
  });

  return Array.from(cohortSet).filter((c) => c.length > 0);
}

/**
 * Analyze introduction fairness across cohorts
 */
export async function analyzeIntroductionFairness(
  startDate: Date,
  endDate: Date
): Promise<CohortAnalysis[]> {
  const cohorts = await getAvailableCohorts();
  const analyses: CohortAnalysis[] = [];

  for (const cohort of cohorts) {
    const analysis = await analyzeCohortIntroductions(cohort, startDate, endDate);
    if (analysis) {
      analyses.push(analysis);
    }
  }

  return analyses;
}

/**
 * Analyze contract fairness across cohorts
 */
export async function analyzeContractFairness(
  startDate: Date,
  endDate: Date
): Promise<CohortAnalysis[]> {
  const cohorts = await getAvailableCohorts();
  const analyses: CohortAnalysis[] = [];

  for (const cohort of cohorts) {
    const analysis = await analyzeCohortContracts(cohort, startDate, endDate);
    if (analysis) {
      analyses.push(analysis);
    }
  }

  return analyses;
}

/**
 * Analyze introduction rate for a specific cohort
 */
async function analyzeCohortIntroductions(
  cohortName: string,
  startDate: Date,
  endDate: Date
): Promise<CohortAnalysis | null> {
  // Get users in this cohort
  const optIns = await db
    .select()
    .from(demographicOptIns)
    .where(eq(demographicOptIns.optedIn, true));

  const cohortUsers = optIns
    .filter((opt: DemographicOptInRow) => {
      const cohortData = [opt.gender, opt.ethnicity, opt.ageRange];
      return cohortData.some((data) => data?.toLowerCase() === cohortName.toLowerCase());
    })
    .map((opt: DemographicOptInRow) => opt.profileId);

  if (cohortUsers.length === 0) return null;

  // Get matches for these users
  const cohortMatches: MatchRow[] = await db
    .select()
    .from(matches)
    .where(
      and(
        gte(matches.createdAt, startDate),
        lte(matches.createdAt, endDate),
        sql`${matches.profileId} IN (${sql.join(
          cohortUsers.map((u: string) => sql`${u}`),
          sql`, `
        )})`
      )
    );

  if (cohortMatches.length < 40) return null; // Insufficient sample size

  // Get introduction events
  const introEvents: { matchId: string | null }[] = await db
    .select({
      matchId: analyticsEvents.entityId,
    })
    .from(analyticsEvents)
    .where(
      and(eq(analyticsEvents.eventType, 'match_actioned'), sql`properties->>'action' = 'introduce'`)
    );

  const introMatchIds = new Set(
    introEvents.map((e) => e.matchId).filter((id): id is string => Boolean(id))
  );
  const introductions = cohortMatches.filter((m: MatchRow) => introMatchIds.has(m.id)).length;
  const introductionRate = (introductions / cohortMatches.length) * 100;

  // Get contract rate (simplified for cohort level)
  const contractEvents: { assignmentId: string | null }[] = await db
    .select({
      assignmentId: analyticsEvents.entityId,
    })
    .from(analyticsEvents)
    .where(eq(analyticsEvents.eventType, 'contract_signed'));

  const contractedAssignments = new Set(
    contractEvents.map((e) => e.assignmentId).filter((id): id is string => Boolean(id))
  );
  const contracts = cohortMatches.filter((m: MatchRow) =>
    contractedAssignments.has(m.assignmentId)
  ).length;
  const contractRate = (contracts / cohortMatches.length) * 100;

  return {
    cohortName,
    sampleSize: cohortMatches.length,
    introductionRate,
    contractRate,
  };
}

/**
 * Analyze contract rate for a specific cohort
 */
async function analyzeCohortContracts(
  cohortName: string,
  startDate: Date,
  endDate: Date
): Promise<CohortAnalysis | null> {
  return analyzeCohortIntroductions(cohortName, startDate, endDate); // Same analysis includes contracts
}

/**
 * Detect significant gaps from fairness gap results
 */
export function detectSignificantGaps(gapResults: FairnessGapResult[]): Finding[] {
  const findings: Finding[] = [];

  gapResults.forEach((result) => {
    const cohortA = result.cohortA;
    const cohortB = result.cohortB;
    const introP = result.pValueIntroduction ?? 1;
    const contractP = result.pValueContract ?? 1;

    if (!cohortA || !cohortB) {
      return;
    }

    // Check introduction rate gap
    if (introP < 0.05) {
      const severity = determineSeverity(Math.abs(result.introductionGap ?? 0));
      findings.push({
        type: 'gap',
        severity,
        cohorts: [cohortA.name ?? 'cohortA', cohortB.name ?? 'cohortB'],
        metric: 'introduction_rate',
        description: `Significant gap detected in introduction rates between ${cohortA.name} (${cohortA.introductionRate.toFixed(1)}%) and ${cohortB.name} (${cohortB.introductionRate.toFixed(1)}%). Gap: ${Math.abs(result.introductionGap ?? 0).toFixed(1)} percentage points.`,
        gapPercentage: Math.abs(result.introductionGap ?? 0),
        pValue: introP,
      });
    }

    // Check contract rate gap
    if (contractP < 0.05) {
      const severity = determineSeverity(Math.abs(result.contractGap ?? 0));
      findings.push({
        type: 'gap',
        severity,
        cohorts: [cohortA.name ?? 'cohortA', cohortB.name ?? 'cohortB'],
        metric: 'contract_rate',
        description: `Significant gap detected in contract rates between ${cohortA.name} (${cohortA.contractRate.toFixed(1)}%) and ${cohortB.name} (${cohortB.contractRate.toFixed(1)}%). Gap: ${Math.abs(result.contractGap ?? 0).toFixed(1)} percentage points.`,
        gapPercentage: Math.abs(result.contractGap ?? 0),
        pValue: contractP,
      });
    }

    // If no significant gaps found for this pair
    if (introP >= 0.05 && contractP >= 0.05) {
      findings.push({
        type: 'no_gap',
        severity: 'none',
        cohorts: [cohortA.name ?? 'cohortA', cohortB.name ?? 'cohortB'],
        metric: 'introduction_rate',
        description: `No significant gaps detected between ${cohortA.name} and ${cohortB.name}. Introduction rates: ${cohortA.introductionRate.toFixed(1)}% vs ${cohortB.introductionRate.toFixed(1)}%. Contract rates: ${cohortA.contractRate.toFixed(1)}% vs ${cohortB.contractRate.toFixed(1)}%.`,
      });
    }
  });

  // Check for insufficient data
  if (findings.length === 0) {
    findings.push({
      type: 'insufficient_data',
      severity: 'low',
      cohorts: [],
      metric: 'introduction_rate',
      description:
        'Insufficient data to perform fairness analysis. Need at least 40 matches per cohort.',
    });
  }

  return findings;
}

/**
 * Determine severity of a gap based on percentage point difference
 */
function determineSeverity(gapPercentage: number): 'critical' | 'moderate' | 'low' {
  if (gapPercentage >= 15) return 'critical'; // 15+ percentage points
  if (gapPercentage >= 10) return 'moderate'; // 10-15 percentage points
  return 'low'; // 5-10 percentage points
}

/**
 * Generate actionable recommendations based on findings
 */
export function generateRecommendations(
  findings: Finding[],
  cohortAnalyses: CohortAnalysis[]
): Recommendation[] {
  const recommendations: Recommendation[] = [];

  // Group findings by severity
  const criticalGaps = findings.filter((f) => f.severity === 'critical' && f.type === 'gap');
  const moderateGaps = findings.filter((f) => f.severity === 'moderate' && f.type === 'gap');
  const lowGaps = findings.filter((f) => f.severity === 'low' && f.type === 'gap');

  // Generate recommendations for critical gaps
  criticalGaps.forEach((finding) => {
    const lowerRateCohort = getLowerRateCohort(finding, cohortAnalyses);

    recommendations.push({
      priority: 'high',
      action: `Immediate investigation required: Review matching algorithm for ${finding.metric.replace('_', ' ')} bias affecting ${lowerRateCohort}`,
      rationale: `Critical gap of ${finding.gapPercentage?.toFixed(1)}pp detected with high statistical significance (p=${finding.pValue?.toFixed(4)}). This indicates potential systemic bias.`,
      targetCohorts: finding.cohorts,
    });

    recommendations.push({
      priority: 'high',
      action: `Audit recent matches for ${lowerRateCohort} cohort to identify specific failure points`,
      rationale: `Understanding where in the matching pipeline bias occurs is critical for targeted remediation.`,
      targetCohorts: [lowerRateCohort],
    });
  });

  // Generate recommendations for moderate gaps
  moderateGaps.forEach((finding) => {
    const lowerRateCohort = getLowerRateCohort(finding, cohortAnalyses);

    recommendations.push({
      priority: 'medium',
      action: `Investigate potential bias in ${finding.metric.replace('_', ' ')} for ${lowerRateCohort}`,
      rationale: `Moderate gap of ${finding.gapPercentage?.toFixed(1)}pp detected. While not critical, this warrants investigation to prevent escalation.`,
      targetCohorts: finding.cohorts,
    });

    recommendations.push({
      priority: 'medium',
      action: `Consider targeted outreach or support for ${lowerRateCohort} to improve match outcomes`,
      rationale: `Proactive measures can help close gaps before they become critical.`,
      targetCohorts: [lowerRateCohort],
    });
  });

  // Generate recommendations for low gaps
  if (lowGaps.length > 0) {
    recommendations.push({
      priority: 'low',
      action: `Monitor identified low-severity gaps in upcoming releases`,
      rationale: `Small gaps may be statistical noise but should be tracked to ensure they don't grow.`,
      targetCohorts: lowGaps.flatMap((f) => f.cohorts),
    });
  }

  // If no gaps found
  if (criticalGaps.length === 0 && moderateGaps.length === 0 && lowGaps.length === 0) {
    const hasData = findings.some((f) => f.type === 'no_gap');

    if (hasData) {
      recommendations.push({
        priority: 'low',
        action: `Continue monitoring fairness metrics in upcoming releases`,
        rationale: `No significant gaps detected in current period. Maintain vigilance to ensure fairness is sustained.`,
        targetCohorts: [],
      });
    } else {
      recommendations.push({
        priority: 'medium',
        action: `Increase demographic opt-in rates to enable comprehensive fairness analysis`,
        rationale: `Insufficient data prevents thorough fairness assessment. Consider incentivizing opt-ins or improving opt-in UX.`,
        targetCohorts: [],
      });
    }
  }

  return recommendations;
}

/**
 * Helper to identify which cohort has lower rate in a finding
 */
function getLowerRateCohort(finding: Finding, cohortAnalyses: CohortAnalysis[]): string {
  const [cohortA, cohortB] = finding.cohorts;

  const analysisA = cohortAnalyses.find((c) => c.cohortName === cohortA);
  const analysisB = cohortAnalyses.find((c) => c.cohortName === cohortB);

  if (!analysisA || !analysisB) return cohortA;

  const rateA =
    finding.metric === 'introduction_rate' ? analysisA.introductionRate : analysisA.contractRate;
  const rateB =
    finding.metric === 'introduction_rate' ? analysisB.introductionRate : analysisB.contractRate;

  return rateA < rateB ? cohortA : cohortB;
}

/**
 * Publish a draft fairness note
 */
export async function publishFairnessNote(noteId: string): Promise<void> {
  await db
    .update(fairnessNotes)
    .set({
      status: 'published',
      publishedAt: new Date(),
    })
    .where(eq(fairnessNotes.id, noteId));
}

/**
 * Archive an old fairness note
 */
export async function archiveFairnessNote(noteId: string): Promise<void> {
  await db
    .update(fairnessNotes)
    .set({
      status: 'archived',
    })
    .where(eq(fairnessNotes.id, noteId));
}
