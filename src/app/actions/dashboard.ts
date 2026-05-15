'use server';

import { requireAuth } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { getIndividualReadinessState } from '@/lib/readiness/individual-state';
import {
  toExpertiseStatsPresentation,
  toProofReadinessChecklistPresentation,
} from '@/lib/readiness/presentation';
import { listCanonicalSkillProofSummariesForOwner } from '@/lib/proofs/canonical-pack';

export interface NextBestAction {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  category: 'profile' | 'expertise' | 'verification' | 'matching' | 'assignment' | 'process';
  actionUrl: string;
  completed: boolean;
}

export type ProofReadinessChecklistData = {
  missing: string[];
  actions: NextBestAction[];
  skillCount?: number;
  proofCount?: number;
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
        intentSignal: number;
        constraints: number;
      };
    };
  };
  featureFlags: {
    activationTiering: boolean;
  };
};

export async function getProofReadinessChecklist(): Promise<ProofReadinessChecklistData> {
  const user = await requireAuth();
  const readiness = await getIndividualReadinessState(user.id);
  return toProofReadinessChecklistPresentation(readiness);
}

export async function getExpertiseStats(): Promise<ExpertiseStatsData> {
  const user = await requireAuth();
  const supabase = await createClient();
  const [readiness, proofSummaries] = await Promise.all([
    getIndividualReadinessState(user.id),
    listCanonicalSkillProofSummariesForOwner(user.id),
  ]);

  const { error: skillsError } = await supabase
    .from('skills')
    .select('id,last_used_at')
    .eq('profile_id', user.id);

  if (skillsError) {
    throw new Error('Failed to fetch skills');
  }

  const skillsWithProofs = proofSummaries.filter((summary) => summary.proofCount > 0).length;
  const skillsWithVerifications = proofSummaries.filter(
    (summary) => summary.verificationCount > 0
  ).length;
  return toExpertiseStatsPresentation(readiness, skillsWithProofs, skillsWithVerifications);
}
