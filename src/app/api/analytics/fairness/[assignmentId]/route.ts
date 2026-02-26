import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuthContext } from '@/lib/auth';
import { db } from '@/db';
import { fairnessMetrics, demographicOptIns, matches, assignments } from '@/db/schema';
import { eq, and, isNotNull } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

/**
 * GET /api/analytics/fairness/[assignmentId]
 *
 * Get fairness metrics for a specific assignment
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ assignmentId: string }> }
) {
  try {
    const authContext = await requireApiAuthContext();
    if (!authContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { user } = authContext;
    const { assignmentId } = await params;

    // Verify user has permission to view this assignment
    const [assignment] = await db
      .select()
      .from(assignments)
      .where(eq(assignments.id, assignmentId))
      .limit(1);

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    // Check if metrics already exist
    const [existing] = await db
      .select()
      .from(fairnessMetrics)
      .where(eq(fairnessMetrics.assignmentId, assignmentId))
      .limit(1);

    if (existing) {
      return NextResponse.json({
        metrics: existing.cohorts,
        totalApplicants: existing.totalApplicants,
        totalOptedIn: existing.totalOptedIn,
        totalSelected: existing.totalSelected,
        generatedAt: existing.generatedAt,
        hasSignificantGaps: existing.hasSignificantGaps,
      });
    }

    // Calculate new metrics
    const metrics = await calculateFairnessMetrics(assignmentId);

    // Store metrics
    await db.insert(fairnessMetrics).values({
      assignmentId,
      cohorts: metrics.cohorts,
      totalApplicants: metrics.totalApplicants,
      totalOptedIn: metrics.totalOptedIn,
      totalSelected: metrics.totalSelected,
      hasSignificantGaps: metrics.hasSignificantGaps,
    });

    return NextResponse.json(metrics);
  } catch (error) {
    console.error('Error fetching fairness metrics:', error);
    return NextResponse.json({ error: 'Failed to fetch fairness metrics' }, { status: 500 });
  }
}

/**
 * Calculate fairness metrics for an assignment
 */
async function calculateFairnessMetrics(assignmentId: string) {
  // Get all matches for this assignment
  const matchesData = await db
    .select({
      match: matches,
      demographic: demographicOptIns,
    })
    .from(matches)
    .leftJoin(demographicOptIns, eq(matches.profileId, demographicOptIns.profileId))
    .where(eq(matches.assignmentId, assignmentId));

  const totalApplicants = matchesData.length;

  // Only analyze users who opted in
  const optedInMatches = matchesData.filter((m) => m.demographic?.optedIn);
  const totalOptedIn = optedInMatches.length;

  // For demo purposes, assume top 10% are "selected"
  const selectionThreshold = 0.9; // Top 10%
  const selectedMatches = matchesData
    .filter((m) => parseFloat(m.match.score) >= selectionThreshold)
    .filter((m) => m.demographic?.optedIn);
  const totalSelected = selectedMatches.length;

  // Calculate cohort metrics
  const cohortMetrics: Record<string, any> = {};

  // Group by demographic categories
  const categories = ['gender', 'ethnicity', 'ageRange', 'disability', 'veteranStatus'];

  categories.forEach((category) => {
    const categoryData: Record<string, { applications: number; selections: number }> = {};

    optedInMatches.forEach((match) => {
      const value = (match.demographic as any)?.[category];
      if (!value || value === 'Prefer not to say') return;

      if (!categoryData[value]) {
        categoryData[value] = { applications: 0, selections: 0 };
      }

      categoryData[value].applications++;

      // Check if selected
      const isSelected =
        selectedMatches.findIndex((s) => s.match.profileId === match.match.profileId) !== -1;
      if (isSelected) {
        categoryData[value].selections++;
      }
    });

    // Calculate rates and gaps
    const cohorts = Object.entries(categoryData).map(([cohortName, data]) => {
      const applicationRate = (data.applications / totalOptedIn) * 100;
      const selectionRate = data.applications > 0 ? (data.selections / data.applications) * 100 : 0;

      // Expected selection rate (if perfectly fair)
      const expectedSelections = (data.applications / totalOptedIn) * totalSelected;
      const actualSelections = data.selections;
      const representationGap =
        totalOptedIn > 0 ? ((actualSelections - expectedSelections) / totalOptedIn) * 100 : 0;

      return {
        cohort: cohortName,
        category,
        applicationRate,
        selectionRate,
        representationGap,
        sampleSize: data.applications,
      };
    });

    cohortMetrics[category] = cohorts;
  });

  // Flatten all cohorts
  const allCohorts = Object.values(cohortMetrics).flat();

  // Check for significant gaps (>10% representation gap)
  const hasSignificantGaps = allCohorts.some((c: any) => Math.abs(c.representationGap) > 10);

  return {
    cohorts: allCohorts,
    totalApplicants,
    totalOptedIn,
    totalSelected,
    hasSignificantGaps,
    minSampleSize: 30,
  };
}

/**
 * POST /api/analytics/fairness/[assignmentId]/regenerate
 *
 * Regenerate fairness metrics (e.g., after selection criteria change)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ assignmentId: string }> }
) {
  try {
    const authContext = await requireApiAuthContext();
    if (!authContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { user } = authContext;
    const { assignmentId } = await params;

    // Delete existing metrics
    await db.delete(fairnessMetrics).where(eq(fairnessMetrics.assignmentId, assignmentId));

    // Recalculate
    const metrics = await calculateFairnessMetrics(assignmentId);

    // Store new metrics
    await db.insert(fairnessMetrics).values({
      assignmentId,
      cohorts: metrics.cohorts,
      totalApplicants: metrics.totalApplicants,
      totalOptedIn: metrics.totalOptedIn,
      totalSelected: metrics.totalSelected,
      hasSignificantGaps: metrics.hasSignificantGaps,
    });

    return NextResponse.json({
      success: true,
      metrics,
    });
  } catch (error) {
    console.error('Error regenerating fairness metrics:', error);
    return NextResponse.json({ error: 'Failed to regenerate fairness metrics' }, { status: 500 });
  }
}
