import { db } from '@/db';
import { createClient } from '@/lib/supabase/server';
import { eq, and, desc, sql, count } from 'drizzle-orm';
import {
  growthPlans,
  profiles,
  skills,
  experiences,
  individualProfiles,
  matchingProfiles,
  interviews,
} from '@/db/schema';
import { toCanonicalGoal, toLegacyGoal } from '@/lib/goals/canonical';
import { computeSkillGaps } from '@/lib/skills/gap-service';
import { getProofReadinessChecklist, getExpertiseStats } from '@/app/actions/dashboard';
import { getMomentumSummaryCached } from '@/lib/momentum/summary';
import { getIndividualReadinessState } from '@/lib/readiness/individual-state';
import { toProofReadinessChecklistPresentation } from '@/lib/readiness/presentation';

export async function getIndGoalsData(userId: string) {
  try {
    const userGoals = await db
      .select({
        id: growthPlans.id,
        title: growthPlans.title,
        goal: growthPlans.goal,
        targetLevel: growthPlans.targetLevel,
        targetDate: growthPlans.targetDate,
        status: growthPlans.status,
        milestones: growthPlans.milestones,
        supportNeeds: growthPlans.supportNeeds,
        capabilityId: growthPlans.capabilityId,
        createdAt: growthPlans.createdAt,
        updatedAt: growthPlans.updatedAt,
      })
      .from(growthPlans)
      .where(eq(growthPlans.profileId, userId))
      .orderBy(desc(growthPlans.updatedAt))
      .limit(5);

    const activeGoals = userGoals.filter((g) => g.status !== 'archived');
    const goalsWithProgress = activeGoals.slice(0, 3).map((goal) => {
      const canonicalGoal = toCanonicalGoal(goal as any);
      return {
        ...canonicalGoal,
        legacy: toLegacyGoal(canonicalGoal),
      };
    });

    const allGoals = await db
      .select({
        status: growthPlans.status,
        count: sql<number>`count(*)::int`,
      })
      .from(growthPlans)
      .where(eq(growthPlans.profileId, userId))
      .groupBy(growthPlans.status);

    const stats = {
      total: allGoals.reduce((sum, g) => sum + (g.count || 0), 0),
      planned: allGoals.find((g) => g.status === 'planned')?.count || 0,
      inProgress: allGoals.find((g) => g.status === 'in_progress')?.count || 0,
      completed: allGoals.find((g) => g.status === 'completed')?.count || 0,
      blocked: allGoals.find((g) => g.status === 'blocked')?.count || 0,
    };

    return { goals: goalsWithProgress, stats };
  } catch (error) {
    console.error('Error in getIndGoalsData:', error);
    return { goals: [], stats: { total: 0, planned: 0, inProgress: 0, completed: 0, blocked: 0 } };
  }
}

export async function getIndSkillGapsData(userId: string) {
  try {
    // Default timeframe = 180 days
    const result = await computeSkillGaps({
      profileId: userId,
      timeframeDays: 180,
    });

    return {
      gaps: result.gaps,
      assignments: result.assignments,
      matrix: result.matrix,
      coverage: result.coverage,
    };
  } catch (error) {
    console.error('Error in getIndSkillGapsData:', error);
    return { gaps: [] };
  }
}

export async function getIndProofReadinessData(userId: string) {
  try {
    const readiness = await getIndividualReadinessState(userId);
    return toProofReadinessChecklistPresentation(readiness);
  } catch (error) {
    console.error('Error in getIndProofReadinessData:', error);
    return { missing: [], actions: [] };
  }
}

export async function getIndInterviewsData(userId: string) {
  try {
    const supabase = await createClient();
    const { data: interviews, error } = await supabase
      .from('interviews')
      .select('*')
      .or(`host_user_id.eq.${userId},participant_user_ids.cs.{${userId}}`)
      .neq('status', 'cancelled')
      .order('scheduled_at', { ascending: false });

    if (error) throw error;

    return { interviews: interviews || [] };
  } catch (error) {
    console.error('Error in getIndInterviewsData:', error);
    return { interviews: [] };
  }
}

export async function getIndProfileActivationData() {
  try {
    const [readinessChecklistJson, statsJson] = await Promise.all([
      getProofReadinessChecklist(),
      getExpertiseStats(),
    ]);
    return { readinessChecklistJson, statsJson };
  } catch (error) {
    console.error('Error in getIndProfileActivationData:', error);
    return null;
  }
}

export async function getIndMomentumData(userId: string) {
  try {
    return await getMomentumSummaryCached(userId, 'individual');
  } catch (error) {
    console.error('Error fetching individual momentum summary:', error);
    return null;
  }
}
