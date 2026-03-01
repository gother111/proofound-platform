'use server';

import { requireAuth } from '@/lib/auth';
import { db } from '@/db';
import { profiles, skills, skillProofs, skillVerificationRequests, experiences } from '@/db/schema';
import { eq, and, count } from 'drizzle-orm';
import { FEATURE_FLAG_KEYS } from '@/lib/featureFlags';
import { isFeatureEnabled } from '@/lib/feature-flags/server';
import { evaluateIndividualMatchability } from '@/lib/matching/eligibility';
import {
  MATCHABILITY_LITE_SKILLS_WITH_RECENCY,
  MATCHABILITY_MIN_PROOFS,
  MATCHABILITY_STRONG_SKILLS_WITH_RECENCY,
} from '@/lib/matching/thresholds';
import { createClient } from '@/lib/supabase/server';

export interface NextBestAction {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  category: 'profile' | 'expertise' | 'verification' | 'matching';
  actionUrl: string;
  completed: boolean;
}

export type ProfileCompletenessData = {
  percentage: number;
  missing: string[];
  actions: NextBestAction[];
  skillCount?: number;
  proofCount?: number;
  valuesCount?: number;
};

export type ExpertiseStatsData = {
  totalL4Skills: number;
  skillsWithRecency: number;
  skillsWithProofs: number;
  skillsWithVerifications: number;
  progressPercentage: number;
  activationThreshold: number;
  activationThresholds: {
    lite: { skillsWithRecency: number; proofCount: number };
    strong: { skillsWithRecency: number; proofCount: number };
  };
  progressByTier: {
    lite: { skillsWithRecencyProgress: number; proofProgress: number };
    strong: { skillsWithRecencyProgress: number; proofProgress: number };
  };
  eligibility: {
    tier: 'none' | 'lite' | 'strong';
    nextTierTarget: null | {
      tier: 'lite' | 'strong';
      message: string;
      remaining: {
        skillsWithRecency: number;
        proofCount: number;
        purpose: number;
        constraints: number;
      };
    };
  };
  featureFlags: {
    activationTiering: boolean;
  };
};

export async function getProfileCompleteness(): Promise<ProfileCompletenessData> {
  const user = await requireAuth();
  const supabase = await createClient();

  // Fetch profile data
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();

  const { data: individualProfile } = await supabase
    .from('individual_profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  const { data: matchingProfile } = await supabase
    .from('matching_profiles')
    .select('*')
    .eq('profile_id', user.id)
    .single();

  // Count skills, proofs, verifications, experiences
  const [skillCount] = await db
    .select({ count: count() })
    .from(skills)
    .where(eq(skills.profileId, user.id));

  const [proofCount] = await db
    .select({ count: count() })
    .from(skillProofs)
    .where(eq(skillProofs.profileId, user.id));

  const [verificationCount] = await db
    .select({ count: count() })
    .from(skillVerificationRequests)
    .where(
      and(
        eq(skillVerificationRequests.requesterProfileId, user.id),
        eq(skillVerificationRequests.status, 'accepted')
      )
    );

  const [experienceCount] = await db
    .select({ count: count() })
    .from(experiences)
    .where(eq(experiences.userId, user.id));

  // Calculate completeness
  const checks = {
    hasDisplayName: !!profile?.display_name,
    hasAvatar: !!profile?.avatar_url,
    hasHeadline: !!individualProfile?.headline,
    hasBio: !!individualProfile?.bio,
    hasMission: !!individualProfile?.mission,
    hasLocation: !!matchingProfile?.location,
    hasSkills: (skillCount?.count || 0) >= 5,
    hasProofs: (proofCount?.count || 0) > 0,
    hasVerifications: (verificationCount?.count || 0) > 0,
    hasExperiences: (experienceCount?.count || 0) > 0,
  };

  const totalChecks = Object.keys(checks).length;
  const completedChecks = Object.values(checks).filter(Boolean).length;
  const percentage = Math.round((completedChecks / totalChecks) * 100);

  // Generate next best actions
  const actions: NextBestAction[] = [];

  if (!checks.hasDisplayName) {
    actions.push({
      id: 'add-name',
      title: 'Add your display name',
      description: 'Let others know who you are',
      priority: 'high',
      category: 'profile',
      actionUrl: '/app/i/settings',
      completed: false,
    });
  }

  if (!checks.hasAvatar) {
    actions.push({
      id: 'upload-photo',
      title: 'Upload a profile photo',
      description: 'Profiles with photos get 40% more views',
      priority: 'high',
      category: 'profile',
      actionUrl: '/app/i/settings',
      completed: false,
    });
  }

  if (!checks.hasHeadline) {
    actions.push({
      id: 'add-headline',
      title: 'Write a professional headline',
      description: 'Describe what you do in one sentence',
      priority: 'high',
      category: 'profile',
      actionUrl: '/app/i/profile',
      completed: false,
    });
  }

  if (!checks.hasMission) {
    actions.push({
      id: 'define-mission',
      title: 'Define your personal mission',
      description: 'Help us find purpose-aligned opportunities',
      priority: 'medium',
      category: 'profile',
      actionUrl: '/app/i/profile',
      completed: false,
    });
  }

  if (!checks.hasSkills) {
    actions.push({
      id: 'add-skills',
      title: 'Add at least 5 skills',
      description: 'Build your Expertise Atlas to get matched',
      priority: 'high',
      category: 'expertise',
      actionUrl: '/app/i/expertise',
      completed: false,
    });
  }

  if (checks.hasSkills && !checks.hasProofs) {
    actions.push({
      id: 'upload-proofs',
      title: 'Upload proof of your skills',
      description: 'Add artifacts, certifications, or project links',
      priority: 'medium',
      category: 'expertise',
      actionUrl: '/app/i/expertise',
      completed: false,
    });
  }

  if (checks.hasProofs && !checks.hasVerifications) {
    actions.push({
      id: 'request-verification',
      title: 'Request skill verifications',
      description: 'Ask peers or managers to verify your skills',
      priority: 'medium',
      category: 'verification',
      actionUrl: '/app/i/expertise',
      completed: false,
    });
  }

  if (!checks.hasExperiences) {
    actions.push({
      id: 'add-experience',
      title: 'Add your work experience',
      description: 'Help employers understand your background',
      priority: 'medium',
      category: 'profile',
      actionUrl: '/app/i/profile',
      completed: false,
    });
  }

  if (!checks.hasLocation) {
    actions.push({
      id: 'set-location',
      title: 'Set your location preferences',
      description: 'Get matched with opportunities near you',
      priority: 'medium',
      category: 'matching',
      actionUrl: '/app/i/matching',
      completed: false,
    });
  }

  if (!checks.hasBio) {
    actions.push({
      id: 'write-bio',
      title: 'Write your bio',
      description: 'Tell your story and what drives you',
      priority: 'low',
      category: 'profile',
      actionUrl: '/app/i/profile',
      completed: false,
    });
  }

  // Sort by priority: high > medium > low
  const priorityOrder = { high: 1, medium: 2, low: 3 };
  actions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return {
    percentage,
    missing: Object.entries(checks)
      .filter(([_, value]) => !value)
      .map(([key]) => key),
    actions,
    skillCount: skillCount?.count || 0,
    proofCount: proofCount?.count || 0,
    valuesCount: 0, // Placeholder
  };
}

export async function getExpertiseStats(): Promise<ExpertiseStatsData> {
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
    throw new Error('Failed to fetch skills');
  }

  const totalL4Skills = userSkills?.length || 0;
  const skillsWithRecency = userSkills?.filter((skill) => Boolean(skill.last_used_at)).length || 0;

  // Fetch proof counts
  const { data: proofs, error: proofsError } = await supabase
    .from('skill_proofs')
    .select('skill_id')
    .eq('profile_id', user.id);

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

  return {
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
  };
}
