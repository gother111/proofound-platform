import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { FEATURE_FLAG_KEYS } from '@/lib/featureFlags';
import { isFeatureEnabled } from '@/lib/feature-flags/server';
import { evaluateIndividualMatchability } from '@/lib/matching/eligibility';
import {
  MATCHABILITY_LITE_SKILLS_WITH_RECENCY,
  MATCHABILITY_MIN_PROOFS,
  MATCHABILITY_STRONG_SKILLS_WITH_RECENCY,
} from '@/lib/matching/thresholds';

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
 * - progressPercentage: Backward-compatible strong-tier progress
 * - activationThresholds + progressByTier: lite/strong tier metadata
 */
export async function GET() {
  try {
    const user = await requireAuth();
    const supabase = await createClient();
    const activationTieringEnabled = await isFeatureEnabled(
      FEATURE_FLAG_KEYS.ACTIVATION_TIERING,
      { userId: user.id },
      true
    );
    const eligibility = await evaluateIndividualMatchability(user.id);

    // Fetch user's skills
    const { data: userSkills, error: skillsError } = await supabase
      .from('skills')
      .select('id,last_used_at')
      .eq('profile_id', user.id);

    if (skillsError) {
      console.error('Error fetching user skills:', skillsError);
      return NextResponse.json({ error: 'Failed to fetch skills' }, { status: 500 });
    }

    const totalL4Skills = userSkills?.length || 0;
    const skillsWithRecency =
      userSkills?.filter((skill) => Boolean(skill.last_used_at)).length || 0;

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

    // Backward-compatible strong progress
    const progressPercentage = Math.min(
      Math.round((skillsWithRecency / MATCHABILITY_STRONG_SKILLS_WITH_RECENCY) * 100),
      100
    );

    const liteThreshold = activationTieringEnabled
      ? MATCHABILITY_LITE_SKILLS_WITH_RECENCY
      : MATCHABILITY_STRONG_SKILLS_WITH_RECENCY;
    const liteProgressSkills = Math.min(Math.round((skillsWithRecency / liteThreshold) * 100), 100);
    const strongProgressSkills = Math.min(
      Math.round((skillsWithRecency / MATCHABILITY_STRONG_SKILLS_WITH_RECENCY) * 100),
      100
    );
    const proofProgress = Math.min(
      Math.round((skillsWithProofs / MATCHABILITY_MIN_PROOFS) * 100),
      100
    );

    return NextResponse.json({
      totalL4Skills,
      skillsWithRecency,
      skillsWithProofs,
      skillsWithVerifications,
      progressPercentage,
      activationThreshold: MATCHABILITY_STRONG_SKILLS_WITH_RECENCY,
      activationThresholds: {
        lite: {
          skillsWithRecency: liteThreshold,
          proofCount: MATCHABILITY_MIN_PROOFS,
        },
        strong: {
          skillsWithRecency: MATCHABILITY_STRONG_SKILLS_WITH_RECENCY,
          proofCount: MATCHABILITY_MIN_PROOFS,
        },
      },
      progressByTier: {
        lite: {
          skillsWithRecencyProgress: liteProgressSkills,
          proofProgress,
        },
        strong: {
          skillsWithRecencyProgress: strongProgressSkills,
          proofProgress,
        },
      },
      eligibility: {
        tier: eligibility.tier,
        nextTierTarget: eligibility.nextTierTarget,
      },
      featureFlags: {
        activationTiering: activationTieringEnabled,
      },
    });
  } catch (error) {
    console.error('Expertise stats API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
