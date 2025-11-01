import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { skills, skillsTaxonomy, skillsCategories, skillsSubcategories, skillsL3, assignments } from '@/db/schema';
import { eq, and, sql, inArray, not } from 'drizzle-orm';

/**
 * POST /api/expertise/gap-analysis
 *
 * PRD Persona #2 (Mateo - Career Switcher)
 * Analyzes skill gaps between user's current skills and target role requirements
 *
 * Algorithm:
 * 1. Get user's current skills with levels
 * 2. Get skills required for target roles (from assignments or role templates)
 * 3. Calculate gaps: required skills not present or below required level
 * 4. Rank by importance (frequency across roles × required level)
 * 5. Return top gaps with actionable insights
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { targetRole, userId } = await request.json();
    const profileId = userId || user.id;

    // 1. Get user's current skills
    const userSkills = await db.query.skills.findMany({
      where: eq(skills.profileId, profileId),
      with: {
        taxonomy: {
          with: {
            category: true,
            subcategory: true,
            l3: true,
          },
        },
      },
    });

    // Create a map of user skills for quick lookup
    const userSkillsMap = new Map(
      userSkills.map(s => [s.skillCode || s.skillId, s.level])
    );

    // 2. Get required skills for target roles
    // For MVP: Analyze recent assignments matching the target role
    let targetSkills: any[] = [];

    if (targetRole) {
      // Find assignments with similar titles (simplified matching for MVP)
      targetSkills = await db
        .select({
          skillCode: sql<string>`DISTINCT ${skills.skillCode}`,
          requiredLevel: sql<number>`MAX(${skills.level})`,
          frequency: sql<number>`COUNT(*)`,
          roleName: assignments.title,
        })
        .from(assignments)
        .innerJoin(skills, eq(assignments.orgId, skills.profileId)) // Simplified join for MVP
        .where(
          sql`LOWER(${assignments.title}) LIKE ${'%' + targetRole.toLowerCase() + '%'}`
        )
        .groupBy(skills.skillCode, assignments.title);
    } else {
      // If no target role specified, find most common skills in active assignments
      targetSkills = await db
        .select({
          skillCode: sql<string>`DISTINCT ${skills.skillCode}`,
          requiredLevel: sql<number>`MAX(${skills.level})`,
          frequency: sql<number>`COUNT(*)`,
          roleName: sql<string>`'General roles'`,
        })
        .from(assignments)
        .innerJoin(skills, eq(assignments.orgId, skills.profileId))
        .where(eq(assignments.status, 'published'))
        .groupBy(skills.skillCode)
        .having(sql`COUNT(*) >= 3`) // Only skills appearing in 3+ roles
        .limit(50);
    }

    // 3. Calculate gaps
    interface SkillGap {
      skillCode: string;
      skillName: string;
      l1: string;
      l2: string;
      l3: string;
      importance: number;
      currentLevel: number;
      targetLevel: number;
      gap: number;
      relatedRoles: string[];
    }

    const gaps: SkillGap[] = [];

    for (const targetSkill of targetSkills) {
      if (!targetSkill.skillCode) continue;

      const currentLevel = userSkillsMap.get(targetSkill.skillCode) || 0;
      const targetLevel = Number(targetSkill.requiredLevel) || 3;
      const gap = targetLevel - currentLevel;

      // Only include if there's a gap (user doesn't have skill or is below required level)
      if (gap > 0) {
        // Get skill details from taxonomy
        const skillDetails = await db.query.skillsTaxonomy.findFirst({
          where: eq(skillsTaxonomy.code, targetSkill.skillCode),
          with: {
            category: true,
            subcategory: true,
            l3: true,
          },
        });

        if (skillDetails) {
          // Calculate importance (0-100)
          // Based on: frequency of appearance × required level
          const maxFrequency = Math.max(...targetSkills.map(s => Number(s.frequency)));
          const frequencyScore = (Number(targetSkill.frequency) / maxFrequency) * 50;
          const levelScore = (targetLevel / 5) * 50;
          const importance = Math.round(frequencyScore + levelScore);

          gaps.push({
            skillCode: targetSkill.skillCode,
            skillName: typeof skillDetails.nameI18n === 'object' && skillDetails.nameI18n !== null
              ? (skillDetails.nameI18n as any).en || targetSkill.skillCode
              : targetSkill.skillCode,
            l1: typeof skillDetails.category?.nameI18n === 'object' && skillDetails.category?.nameI18n !== null
              ? (skillDetails.category.nameI18n as any).en || 'Category'
              : 'Category',
            l2: typeof skillDetails.subcategory?.nameI18n === 'object' && skillDetails.subcategory?.nameI18n !== null
              ? (skillDetails.subcategory.nameI18n as any).en || 'Subcategory'
              : 'Subcategory',
            l3: typeof skillDetails.l3?.nameI18n === 'object' && skillDetails.l3?.nameI18n !== null
              ? (skillDetails.l3.nameI18n as any).en || 'L3'
              : 'L3',
            importance,
            currentLevel,
            targetLevel,
            gap,
            relatedRoles: [targetSkill.roleName],
          });
        }
      }
    }

    // 4. Rank by importance (descending)
    gaps.sort((a, b) => b.importance - a.importance);

    // 5. Return results
    return NextResponse.json({
      success: true,
      gaps,
      summary: {
        totalGaps: gaps.length,
        criticalGaps: gaps.filter(g => g.importance >= 80).length,
        highPriorityGaps: gaps.filter(g => g.importance >= 60 && g.importance < 80).length,
        mediumPriorityGaps: gaps.filter(g => g.importance < 60).length,
        targetRole: targetRole || 'General roles',
      },
      metadata: {
        analyzedAt: new Date().toISOString(),
        userSkillCount: userSkills.length,
        targetRoleCount: targetSkills.length,
      },
    });

  } catch (error) {
    console.error('Gap analysis error:', error);
    return NextResponse.json({
      error: 'Failed to analyze skill gaps',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

/**
 * GET /api/expertise/gap-analysis
 *
 * Returns gap analysis for current user (no request body needed)
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get target role from query params
  const { searchParams } = new URL(request.url);
  const targetRole = searchParams.get('targetRole') || undefined;

  // Reuse POST logic
  return POST(
    new NextRequest(request.url, {
      method: 'POST',
      headers: request.headers,
      body: JSON.stringify({ targetRole, userId: user.id }),
    })
  );
}
