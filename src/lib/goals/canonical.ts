export type GoalStatus = 'planned' | 'in_progress' | 'blocked' | 'completed' | 'archived';

export type CanonicalGoal = {
  id: string;
  title: string;
  goal: string | null;
  status: GoalStatus;
  targetLevel: number | null;
  targetDate: string | null;
  progress: number;
  completedMilestones: number;
  totalMilestones: number;
  nextStep: string;
  createdAt: string;
  updatedAt: string;
};

type GoalRow = {
  id: string;
  title: string;
  goal: string | null;
  status: GoalStatus;
  targetLevel: number | null;
  targetDate: string | null;
  milestones: unknown;
  createdAt: Date;
  updatedAt: Date;
};

type GoalMilestone = {
  title?: string;
  completed?: boolean;
};

function normalizeMilestones(raw: unknown): GoalMilestone[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((item) => typeof item === 'object' && item !== null) as GoalMilestone[];
}

export function getGoalProgress(milestonesRaw: unknown): {
  progress: number;
  completedMilestones: number;
  totalMilestones: number;
  nextStep: string;
} {
  const milestones = normalizeMilestones(milestonesRaw);
  const totalMilestones = milestones.length;

  if (totalMilestones === 0) {
    return {
      progress: 0,
      completedMilestones: 0,
      totalMilestones: 0,
      nextStep: 'Define your first milestone',
    };
  }

  const completedMilestones = milestones.filter((milestone) => milestone.completed).length;
  const progress = Math.round((completedMilestones / totalMilestones) * 100);
  const nextMilestone = milestones.find((milestone) => !milestone.completed);

  return {
    progress,
    completedMilestones,
    totalMilestones,
    nextStep:
      nextMilestone?.title?.trim() ||
      (progress >= 100 ? 'Goal completed' : 'Continue milestone progress'),
  };
}

export function toCanonicalGoal(goal: GoalRow): CanonicalGoal {
  const progress = getGoalProgress(goal.milestones);

  return {
    id: goal.id,
    title: goal.title,
    goal: goal.goal,
    status: goal.status,
    targetLevel: goal.targetLevel,
    targetDate: goal.targetDate ? String(goal.targetDate) : null,
    progress: progress.progress,
    completedMilestones: progress.completedMilestones,
    totalMilestones: progress.totalMilestones,
    nextStep: progress.nextStep,
    createdAt: goal.createdAt.toISOString(),
    updatedAt: goal.updatedAt.toISOString(),
  };
}

export function toLegacyGoal(goal: CanonicalGoal) {
  return {
    id: goal.id,
    title: goal.title,
    goal: goal.goal,
    target_level: goal.targetLevel,
    target_date: goal.targetDate,
    status: goal.status,
    created_at: goal.createdAt,
    updated_at: goal.updatedAt,
  };
}
