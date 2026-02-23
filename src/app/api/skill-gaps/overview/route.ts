import { NextResponse } from 'next/server';

import { requireAuth } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { computeSkillGaps } from '@/lib/skills/gap-service';
import { courseraProvider } from '@/lib/learning/coursera';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await requireAuth();
    const supabase = await createClient();

    const analysis = await computeSkillGaps({ profileId: user.id, supabase });

    const topSkillNames = analysis.gaps.slice(0, 5).map((gap) => gap.skillName || gap.skillCode);
    const learning = await courseraProvider.getCoursesForSkills(topSkillNames);

    const { data: goalsData } = await supabase
      .from('growth_plans')
      .select('id, title, goal, target_level, target_date, status')
      .eq('profile_id', user.id)
      .order('created_at', { ascending: false });

    const goals = (goalsData ?? []).map((goal) => ({
      id: goal.id,
      title: goal.title,
      goal: goal.goal,
      targetLevel: goal.target_level,
      targetDate: goal.target_date,
      status: goal.status,
      progress: 0,
      nextStep: 'Define your first milestone',
    }));

    return NextResponse.json({
      gaps: analysis.gaps,
      assignments: analysis.assignments,
      matrix: analysis.matrix,
      coverage: analysis.coverage,
      learning,
      goals,
    });
  } catch (error) {
    console.error('Skill gap overview failed', error);
    return NextResponse.json(
      {
        error: 'Failed to load skill gap overview',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
