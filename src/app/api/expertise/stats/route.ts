import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth';
import { NextResponse } from 'next/server';

/**
 * GET /api/expertise/stats
 *
 * Returns real-time expertise statistics for the current user.
 * Used by the dashboard expertise-depth tile.
 *
 * Returns:
 * - totalL4Skills: Total number of L4 skills
 * - skillsWithProofs: Number of skills with at least one proof
 * - skillsWithVerifications: Number of skills with at least one accepted verification
 * - progressPercentage: Progress towards activation threshold (10 skills = 100%)
 */
export async function GET() {
  try {
    const user = await requireAuth();
    const supabase = await createClient();

    // Fetch user's skills
    const { data: userSkills, error: skillsError } = await supabase
      .from('skills')
      .select('id')
      .eq('profile_id', user.id);

    if (skillsError) {
      console.error('Error fetching user skills:', skillsError);
      return NextResponse.json({ error: 'Failed to fetch skills' }, { status: 500 });
    }

    const totalL4Skills = userSkills?.length || 0;

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
      .eq('status', 'accepted');

    if (verificationsError) {
      console.error('Error fetching skill verifications:', verificationsError);
    }

    const verificationCountMap: Record<string, number> = {};
    verifications?.forEach(({ skill_id }) => {
      verificationCountMap[skill_id] = (verificationCountMap[skill_id] || 0) + 1;
    });

    // Calculate statistics
    const skillsWithProofs = Object.keys(proofCountMap).length;
    const skillsWithVerifications = Object.keys(verificationCountMap).length;

    // Calculate progress percentage based on activation threshold (10 skills = 100%)
    // PRD Part 5, F3: Activation threshold is ≥10 L4 skills
    const ACTIVATION_THRESHOLD = 10;
    const progressPercentage = Math.min(
      Math.round((totalL4Skills / ACTIVATION_THRESHOLD) * 100),
      100
    );

    return NextResponse.json({
      totalL4Skills,
      skillsWithProofs,
      skillsWithVerifications,
      progressPercentage,
      activationThreshold: ACTIVATION_THRESHOLD,
    });
  } catch (error) {
    console.error('Expertise stats API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

