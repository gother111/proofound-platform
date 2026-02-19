/**
 * Skill Gap Analysis page (individual dashboard)
 * - Computes gaps vs target assignments
 * - Shows an interactive map and learning recommendations
 */

import { requireAuth } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { computeSkillGaps } from '@/lib/skills/gap-service';
import { courseraProvider } from '@/lib/learning/coursera';
import { SkillGapsClient } from '@/components/skill-gaps/SkillGapsClient';

export const dynamic = 'force-dynamic';

export default async function SkillGapsPage() {
  const user = await requireAuth();
  const supabase = await createClient();

  const analysis = await computeSkillGaps({ profileId: user.id, supabase });

  // Fetch learning resources for the top 5 gaps
  const topSkillNames = analysis.gaps.slice(0, 5).map((gap) => gap.skillName || gap.skillCode);
  const learning = await courseraProvider.getCoursesForSkills(topSkillNames);

  // Load saved goals
  const { data: goalsData } = await supabase
    .from('growth_plans')
    .select('id, title, goal, target_level, target_date, status')
    .eq('profile_id', user.id)
    .order('created_at', { ascending: false });

  const normalizedGoals = (goalsData ?? []).map((goal) => ({
    id: goal.id,
    title: goal.title,
    goal: goal.goal,
    targetLevel: goal.target_level,
    targetDate: goal.target_date,
    status: goal.status,
    progress: 0,
    nextStep: 'Define your first milestone',
  }));

  return (
    <div className="space-y-6">
      <SkillGapsClient
        initialGaps={analysis.gaps}
        assignments={analysis.assignments}
        matrix={analysis.matrix}
        coverage={analysis.coverage}
        learning={learning}
        goals={normalizedGoals}
      />
    </div>
  );
}
