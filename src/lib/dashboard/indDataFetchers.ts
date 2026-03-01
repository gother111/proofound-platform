import { db } from '@/db';
import { createClient } from '@/lib/supabase/server';
import { eq, and, desc, sql, count } from 'drizzle-orm';
import {
  growthPlans,
  profiles,
  skills,
  skillProofs,
  skillVerificationRequests,
  experiences,
  individualProfiles,
  matchingProfiles,
  interviews,
} from '@/db/schema';
import { toCanonicalGoal, toLegacyGoal } from '@/lib/goals/canonical';
import { computeSkillGaps } from '@/lib/skills/gap-service';
import { getProfileCompleteness, getExpertiseStats } from '@/app/actions/dashboard';
import { getMomentumSummaryCached } from '@/lib/momentum/summary';

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

export async function getIndProfileCompletenessData(userId: string) {
  try {
    const supabase = await createClient();
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).single();

    const { data: individualProfile } = await supabase
      .from('individual_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    const { data: matchingProfile } = await supabase
      .from('matching_profiles')
      .select('*')
      .eq('profile_id', userId)
      .single();

    const [skillCount] = await db
      .select({ count: count() })
      .from(skills)
      .where(eq(skills.profileId, userId));

    const [proofCount] = await db
      .select({ count: count() })
      .from(skillProofs)
      .where(eq(skillProofs.profileId, userId));

    const [verificationCount] = await db
      .select({ count: count() })
      .from(skillVerificationRequests)
      .where(
        and(
          eq(skillVerificationRequests.requesterProfileId, userId),
          eq(skillVerificationRequests.status, 'accepted')
        )
      );

    const [experienceCount] = await db
      .select({ count: count() })
      .from(experiences)
      .where(eq(experiences.userId, userId));

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

    const actions: any[] = [];
    // Replicating basic structure from api/profile/completeness/route.ts
    if (!checks.hasDisplayName)
      actions.push({
        id: 'add-name',
        title: 'Add your display name',
        description: 'Let others know who you are',
        priority: 'high',
        category: 'profile',
        actionUrl: '/app/i/settings',
        completed: false,
      });
    if (!checks.hasAvatar)
      actions.push({
        id: 'upload-photo',
        title: 'Upload a profile photo',
        description: 'Profiles with photos get 40% more views',
        priority: 'high',
        category: 'profile',
        actionUrl: '/app/i/settings',
        completed: false,
      });
    if (!checks.hasHeadline)
      actions.push({
        id: 'add-headline',
        title: 'Write a professional headline',
        description: 'Describe what you do in one sentence',
        priority: 'high',
        category: 'profile',
        actionUrl: '/app/i/profile',
        completed: false,
      });
    if (!checks.hasMission)
      actions.push({
        id: 'define-mission',
        title: 'Define your personal mission',
        description: 'Help us find purpose-aligned opportunities',
        priority: 'medium',
        category: 'profile',
        actionUrl: '/app/i/profile',
        completed: false,
      });
    if (!checks.hasSkills)
      actions.push({
        id: 'add-skills',
        title: 'Add at least 5 skills',
        description: 'Build your Expertise Atlas to get matched',
        priority: 'high',
        category: 'expertise',
        actionUrl: '/app/i/expertise',
        completed: false,
      });
    if (checks.hasSkills && !checks.hasProofs)
      actions.push({
        id: 'upload-proofs',
        title: 'Upload proof of your skills',
        description: 'Add artifacts, certifications, or project links',
        priority: 'medium',
        category: 'expertise',
        actionUrl: '/app/i/expertise',
        completed: false,
      });
    if (checks.hasProofs && !checks.hasVerifications)
      actions.push({
        id: 'request-verification',
        title: 'Request skill verifications',
        description: 'Ask peers or managers to verify your skills',
        priority: 'medium',
        category: 'verification',
        actionUrl: '/app/i/expertise',
        completed: false,
      });
    if (!checks.hasExperiences)
      actions.push({
        id: 'add-experience',
        title: 'Add your work experience',
        description: 'Help employers understand your background',
        priority: 'medium',
        category: 'profile',
        actionUrl: '/app/i/profile',
        completed: false,
      });
    if (!checks.hasLocation)
      actions.push({
        id: 'set-location',
        title: 'Set your location preferences',
        description: 'Get matched with opportunities near you',
        priority: 'medium',
        category: 'matching',
        actionUrl: '/app/i/matching',
        completed: false,
      });
    if (!checks.hasBio)
      actions.push({
        id: 'write-bio',
        title: 'Write your bio',
        description: 'Tell your story and what drives you',
        priority: 'low',
        category: 'profile',
        actionUrl: '/app/i/profile',
        completed: false,
      });

    const priorityOrder = { high: 1, medium: 2, low: 3 } as Record<string, number>;
    actions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    return {
      percentage,
      missing: Object.entries(checks)
        .filter(([_, value]) => !value)
        .map(([key]) => key),
      actions,
    };
  } catch (error) {
    console.error('Error in getIndProfileCompletenessData:', error);
    return { percentage: 0, missing: [], actions: [] };
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
    const [completenessJson, statsJson] = await Promise.all([
      getProfileCompleteness(),
      getExpertiseStats(),
    ]);
    return { completenessJson, statsJson };
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
