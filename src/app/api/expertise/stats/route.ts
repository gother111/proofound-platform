import { requireApiAuthContext } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { getIndividualReadinessState } from '@/lib/readiness/individual-state';
import { toExpertiseStatsPresentation } from '@/lib/readiness/presentation';

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
    const readiness = await getIndividualReadinessState(user.id);

    // Fetch user's skills
    const { data: userSkills, error: skillsError } = await supabase
      .from('skills')
      .select('id,last_used_at')
      .eq('profile_id', user.id);

    if (skillsError) {
      console.error('Error fetching user skills:', skillsError);
      return NextResponse.json({ error: 'Failed to fetch skills' }, { status: 500 });
    }

    // Fetch proof counts
    const { data: proofs, error: proofsError } = await supabase
      .from('skill_proofs')
      .select('skill_id')
      .eq('profile_id', user.id);

    if (proofsError) {
      console.error('Error fetching skill proofs:', proofsError);
    }

    const proofCountMap: Record<string, number> = {};
    proofs?.forEach(({ skill_id }) => {
      proofCountMap[skill_id] = (proofCountMap[skill_id] || 0) + 1;
    });

    // Fetch verification counts (only accepted)
    const { data: verifications, error: verificationsError } = await supabase
      .from('skill_verification_requests')
      .select('skill_id')
      .eq('requester_profile_id', user.id)
      .eq('status', 'accepted')
      .eq('integrity_status', 'clear');

    if (verificationsError) {
      console.error('Error fetching skill verifications:', verificationsError);
    }

    const verificationCountMap: Record<string, number> = {};
    verifications?.forEach(({ skill_id }) => {
      verificationCountMap[skill_id] = (verificationCountMap[skill_id] || 0) + 1;
    });

    const skillsWithProofs = Object.keys(proofCountMap).length;
    const skillsWithVerifications = Object.keys(verificationCountMap).length;
    return NextResponse.json(
      toExpertiseStatsPresentation(readiness, skillsWithProofs, skillsWithVerifications)
    );
  } catch (error) {
    console.error('Expertise stats API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
