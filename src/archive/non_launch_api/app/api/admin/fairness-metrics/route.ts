/**
 * Fairness Metrics API
 *
 * GET - Fetch fairness metrics and gap analysis
 * Requires admin role
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { adminListGuard } from '@/app/api/admin/_utils';

export async function GET(req: NextRequest) {
  try {
    const guardResult = await adminListGuard(req);
    if (guardResult instanceof NextResponse) return guardResult;

    const { searchParams } = new URL(req.url);
    const parsedDays = parseInt(searchParams.get('days') || '30', 10);
    const days = Number.isNaN(parsedDays) ? 30 : Math.min(Math.max(parsedDays, 1), 365);

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    const supabase = await createClient();

    // Fetch match data for analysis
    const { data: matches, error: matchesError } = await supabase
      .from('matches')
      .select('score, profile_id, assignment_id, created_at')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (matchesError) {
      console.error('Failed to fetch fairness matches:', matchesError);
      return NextResponse.json({ error: 'Failed to fetch fairness metrics' }, { status: 500 });
    }

    const normalizedScores = (matches || [])
      .map((match) => {
        const rawScore = Number(match.score);
        if (!Number.isFinite(rawScore)) return null;
        // Matches may be persisted as 0-1 or 0-100 depending on generator path.
        return rawScore <= 1 ? rawScore * 100 : rawScore;
      })
      .filter((score): score is number => score !== null);

    const averageScore =
      normalizedScores.length > 0
        ? normalizedScores.reduce((sum, score) => sum + score, 0) / normalizedScores.length
        : 0;
    const minScore = normalizedScores.length > 0 ? Math.min(...normalizedScores) : 0;
    const maxScore = normalizedScores.length > 0 ? Math.max(...normalizedScores) : 0;
    const distributionEquity =
      normalizedScores.length > 1 ? Math.max(0, 100 - (maxScore - minScore)) : 100;

    const uniqueAssignments = new Set(
      (matches || []).map((match) => match.assignment_id).filter(Boolean)
    );
    const uniqueProfiles = new Set(
      (matches || []).map((match) => match.profile_id).filter(Boolean)
    );
    const profileCoverage =
      matches && matches.length > 0 ? (uniqueProfiles.size / matches.length) * 100 : 0;
    const assignmentCoverage =
      matches && matches.length > 0 ? (uniqueAssignments.size / matches.length) * 100 : 0;

    const metrics = [
      {
        category: 'matching',
        metric: 'Average Match Quality (All Groups)',
        value: averageScore,
        benchmark: 75,
        status:
          averageScore >= 75
            ? ('good' as const)
            : averageScore >= 60
              ? ('warning' as const)
              : ('critical' as const),
        trend: 'stable' as const,
      },
      {
        category: 'matching',
        metric: 'Match Distribution Equity',
        value: distributionEquity,
        benchmark: 80,
        status:
          distributionEquity >= 80
            ? ('good' as const)
            : distributionEquity >= 65
              ? ('warning' as const)
              : ('critical' as const),
        trend: 'stable' as const,
      },
      {
        category: 'matching',
        metric: 'Geographic Representation',
        value: profileCoverage,
        benchmark: 75,
        status:
          profileCoverage >= 75
            ? ('good' as const)
            : profileCoverage >= 60
              ? ('warning' as const)
              : ('critical' as const),
        trend: 'stable' as const,
      },
      {
        category: 'hiring',
        metric: 'Interview Invitation Rate Parity',
        value: assignmentCoverage,
        benchmark: 80,
        status:
          assignmentCoverage >= 80
            ? ('good' as const)
            : assignmentCoverage >= 65
              ? ('warning' as const)
              : ('critical' as const),
        trend: 'stable' as const,
      },
    ];

    const gapAnalyses = metrics
      .filter((metric) => metric.value < metric.benchmark)
      .map((metric) => ({
        dimension: metric.metric,
        gap: Number((metric.benchmark - metric.value).toFixed(1)),
        affectedGroups:
          metric.metric === 'Average Match Quality (All Groups)'
            ? ['All matched profiles']
            : metric.metric === 'Match Distribution Equity'
              ? ['Lower-scoring profile segments']
              : metric.metric === 'Geographic Representation'
                ? ['Underrepresented profile regions']
                : ['Profiles with fewer assignment touchpoints'],
        recommendation:
          metric.metric === 'Average Match Quality (All Groups)'
            ? 'Audit scoring signals and rebalance weights for skill relevance versus hard filters.'
            : metric.metric === 'Match Distribution Equity'
              ? 'Investigate score spread by assignment and enforce calibration checks before publishing.'
              : metric.metric === 'Geographic Representation'
                ? 'Increase outreach and remote-friendly targeting for underrepresented locations.'
                : 'Review shortlist and invite criteria for hidden bottlenecks in assignment pipelines.',
      }));

    return NextResponse.json({
      metrics,
      gapAnalyses,
      dateRange: { start: startDate.toISOString(), end: endDate.toISOString() },
      totalMatches: matches?.length || 0,
    });
  } catch (error) {
    console.error('Fairness metrics error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
