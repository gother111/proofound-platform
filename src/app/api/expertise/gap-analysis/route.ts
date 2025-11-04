import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/expertise/gap-analysis
 *
 * Analyzes skill gaps based on:
 * - User's current skills and levels
 * - Common market requirements
 * - User's matching profile preferences
 *
 * Returns top skill gaps sorted by importance
 */
export async function GET() {
  try {
    const user = await requireAuth();
    const supabase = await createClient();

    // Fetch user's current skills
    const { data: userSkills } = await supabase
      .from('skills')
      .select('skill_code, self_assessment, months_experience')
      .eq('profile_id', user.id);

    if (!userSkills || userSkills.length === 0) {
      return NextResponse.json({
        gaps: [],
        message: 'No skills added yet. Add skills to get personalized gap analysis.',
      });
    }

    // Create a map of current skill levels
    const currentSkillsMap: Record<string, number> = {};
    userSkills.forEach((skill) => {
      if (skill.skill_code) {
        currentSkillsMap[skill.skill_code] = skill.self_assessment || 0;
      }
    });

    // Fetch taxonomy data for skill names
    const skillCodes = userSkills
      .map((s) => s.skill_code)
      .filter((code): code is string => Boolean(code));

    const { data: taxonomyData } = await supabase
      .from('skills_taxonomy')
      .select('code, name_i18n, cat_id, subcat_id')
      .in('code', skillCodes);

    const taxonomyMap: Record<string, any> = {};
    taxonomyData?.forEach((tax) => {
      taxonomyMap[tax.code] = tax;
    });

    // Get L1 category names
    const catIds = Array.from(new Set(taxonomyData?.map((t) => t.cat_id).filter(Boolean)));
    const { data: categories } = await supabase
      .from('skills_l1_categories')
      .select('id, name')
      .in('id', catIds);

    const categoryMap: Record<string, string> = {};
    categories?.forEach((cat) => {
      categoryMap[cat.id] = cat.name;
    });

    // Fetch matching profile to understand user's goals
    const { data: matchingProfile } = await supabase
      .from('matching_profiles')
      .select('preferred_roles, target_industries')
      .eq('profile_id', user.id)
      .single();

    // Analyze gaps based on market requirements
    // This is a simplified version - in production, this would query actual job requirements
    const gaps = await analyzeSkillGaps(
      currentSkillsMap,
      taxonomyMap,
      categoryMap,
      matchingProfile
    );

    return NextResponse.json({
      gaps: gaps.slice(0, 10), // Return top 10 gaps
      totalSkills: userSkills.length,
      analyzedRoles: matchingProfile?.preferred_roles || [],
    });
  } catch (error) {
    console.error('Error analyzing skill gaps:', error);
    return NextResponse.json({ error: 'Failed to analyze skill gaps' }, { status: 500 });
  }
}

/**
 * Analyze skill gaps based on current skills and market requirements
 */
async function analyzeSkillGaps(
  currentSkills: Record<string, number>,
  taxonomyMap: Record<string, any>,
  categoryMap: Record<string, string>,
  matchingProfile: any
): Promise<
  Array<{
    skillCode: string;
    skillName: string;
    l1: string;
    currentLevel: number;
    targetLevel: number;
    gap: number;
    importance: number;
  }>
> {
  const gaps: Array<{
    skillCode: string;
    skillName: string;
    l1: string;
    currentLevel: number;
    targetLevel: number;
    gap: number;
    importance: number;
  }> = [];

  // Common skill requirements for typical roles (simplified)
  // In production, this would be data-driven from job market analysis
  const commonRequirements: Record<string, number> = {
    // Example: common skills and their typical required levels (0-5)
    // This would be expanded based on role analysis
  };

  // Identify gaps in existing skills that need improvement
  Object.entries(currentSkills).forEach(([skillCode, currentLevel]) => {
    const taxonomy = taxonomyMap[skillCode];
    if (!taxonomy) return;

    const l1Name = categoryMap[taxonomy.cat_id] || 'Other';

    // Determine target level (simplified logic)
    // In production: analyze market data for this skill
    const targetLevel = determineTargetLevel(skillCode, currentLevel, matchingProfile);

    if (targetLevel > currentLevel) {
      const gap = targetLevel - currentLevel;
      const importance = calculateImportance(skillCode, gap, currentLevel, matchingProfile);

      gaps.push({
        skillCode,
        skillName: taxonomy.name_i18n?.en || 'Unknown Skill',
        l1: l1Name,
        currentLevel,
        targetLevel,
        gap,
        importance,
      });
    }
  });

  // Sort by importance (higher is more important)
  gaps.sort((a, b) => b.importance - a.importance);

  return gaps;
}

/**
 * Determine target level for a skill based on user's goals
 */
function determineTargetLevel(
  skillCode: string,
  currentLevel: number,
  matchingProfile: any
): number {
  // Simplified logic: suggest one level above current for improvement
  // In production: analyze job requirements for user's target roles
  const baseTarget = Math.min(currentLevel + 1, 5);

  // If user has intermediate skill (2-3), suggest reaching expert level (4-5)
  if (currentLevel >= 2 && currentLevel < 4) {
    return 4;
  }

  return baseTarget;
}

/**
 * Calculate importance score for a skill gap
 */
function calculateImportance(
  skillCode: string,
  gap: number,
  currentLevel: number,
  matchingProfile: any
): number {
  let importance = 0;

  // Factor 1: Gap size (larger gaps are more important)
  importance += gap * 20;

  // Factor 2: Current level (mid-level skills are more important to improve)
  if (currentLevel >= 2 && currentLevel <= 3) {
    importance += 30; // Sweet spot for improvement
  } else if (currentLevel === 1) {
    importance += 20; // Beginner needs improvement
  }

  // Factor 3: Market demand (simplified - in production, use real market data)
  // Assume all skills have baseline demand
  importance += 10;

  // Factor 4: Alignment with user goals
  // If skill aligns with target roles, boost importance
  if (matchingProfile?.preferred_roles) {
    importance += 20;
  }

  return importance;
}
