import { requireApiAuthContext } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { getIndividualReadinessState } from '@/lib/readiness/individual-state';
import { toExpertiseStatsPresentation } from '@/lib/readiness/presentation';
import { listCanonicalSkillProofSummariesForOwner } from '@/lib/proofs/canonical-pack';

/**
 * GET /api/expertise/stats
 *
 * Returns real-time expertise statistics for the current user.
 * Used by the dashboard expertise-depth tile.
 *
 * Returns:
 * - totalL4Skills: Total number of L4 skills
 * - skillsWithRecency: Number of skills with non-null recency
 * - skillsWithProofs: Number of skills with at least one proof
 * - skillsWithVerifications: Number of skills with at least one accepted verification
 * - readiness: milestone metadata for portfolio, browse, and qualified introductions
 */
export async function GET() {
  try {
    const authContext = await requireApiAuthContext();
    if (!authContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { user, supabase } = authContext;
    const [readiness, proofSummaries] = await Promise.all([
      getIndividualReadinessState(user.id),
      listCanonicalSkillProofSummariesForOwner(user.id),
    ]);

    // Fetch user's skills
    const { error: skillsError } = await supabase
      .from('skills')
      .select('id,last_used_at')
      .eq('profile_id', user.id);

    if (skillsError) {
      console.error('Error fetching user skills:', skillsError);
      return NextResponse.json({ error: 'Failed to fetch skills' }, { status: 500 });
    }

    const skillsWithProofs = proofSummaries.filter((summary) => summary.proofCount > 0).length;
    const skillsWithVerifications = proofSummaries.filter(
      (summary) => summary.verificationCount > 0
    ).length;
    return NextResponse.json(
      toExpertiseStatsPresentation(readiness, skillsWithProofs, skillsWithVerifications)
    );
  } catch (error) {
    console.error('Expertise stats API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
