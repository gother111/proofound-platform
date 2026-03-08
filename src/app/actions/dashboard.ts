'use server';

import { requireAuth } from '@/lib/auth';
import { db } from '@/db';
import { profiles, skills, skillProofs, skillVerificationRequests, experiences } from '@/db/schema';
import { eq, and, count } from 'drizzle-orm';
import { createClient } from '@/lib/supabase/server';
import { getIndividualReadinessState } from '@/lib/readiness/individual-state';
import {
  toExpertiseStatsPresentation,
  toProfileCompletenessPresentation,
} from '@/lib/readiness/presentation';

export interface NextBestAction {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  category: 'profile' | 'expertise' | 'verification' | 'matching' | 'assignment' | 'process';
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
  const readiness = await getIndividualReadinessState(user.id);
  return toProfileCompletenessPresentation(readiness);
}

export async function getExpertiseStats(): Promise<ExpertiseStatsData> {
  const user = await requireAuth();
  const supabase = await createClient();
  const readiness = await getIndividualReadinessState(user.id);

  // Fetch user's skills
  const { data: userSkills, error: skillsError } = await supabase
    .from('skills')
    .select('id,last_used_at')
    .eq('profile_id', user.id);

  if (skillsError) {
    throw new Error('Failed to fetch skills');
  }

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

  const skillsWithProofs = Object.keys(proofCountMap).length;
  const skillsWithVerifications = Object.keys(verificationCountMap).length;
  return toExpertiseStatsPresentation(readiness, skillsWithProofs, skillsWithVerifications);
}
