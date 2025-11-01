import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { matches, assignments, skills, skillsTaxonomy, profiles } from '@/db/schema';
import { eq, and, sql, desc } from 'drizzle-orm';

/**
 * POST /api/feedback/why-not-shortlisted
 *
 * PRD I-22 + Persona #2 (Mateo - Career Switcher)
 * Provides actionable feedback when candidates are not shortlisted
 *
 * Returns:
 * - Reason for not being shortlisted (skill gap, verification, availability, etc.)
 * - Specific actions to improve match score
 * - Link to L4 skill gaps
 * - Estimated score improvement from each action
 *
 * Algorithm:
 * 1. Get the assignment and candidate's match record (if exists)
 * 2. Calculate what's missing or below threshold
 * 3. Prioritize feedback by impact on match score
 * 4. Return actionable insights
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { assignmentId } = await request.json();

    if (!assignmentId) {
      return NextResponse.json({
        error: 'Missing assignmentId',
      }, { status: 400 });
    }

    // 1. Get assignment details
    const assignment = await db.query.assignments.findFirst({
      where: eq(assignments.id, assignmentId),
    });

    if (!assignment) {
      return NextResponse.json({
        error: 'Assignment not found',
      }, { status: 404 });
    }

    // 2. Get candidate's match record (if exists)
    const matchRecord = await db.query.matches.findFirst({
      where: and(
        eq(matches.assignmentId, assignmentId),
        eq(matches.profileId, user.id)
      ),
    });

    // 3. Get candidate's current skills
    const userSkills = await db.query.skills.findMany({
      where: eq(skills.profileId, user.id),
    });

    const userSkillsMap = new Map(
      userSkills.map(s => [s.skillCode || s.skillId, s])
    );

    // 4. Analyze gaps and generate feedback
    interface FeedbackItem {
      category: 'skills' | 'verification' | 'availability' | 'location' | 'compensation';
      priority: 'critical' | 'high' | 'medium' | 'low';
      issue: string;
      action: string;
      estimatedImpact: number; // 0-100 points
      details?: any;
    }

    const feedback: FeedbackItem[] = [];

    // Check skill requirements
    const mustHaveSkills = (assignment.mustHaveSkills as any[]) || [];
    const missingSkills: any[] = [];
    const underLevelSkills: any[] = [];

    for (const required of mustHaveSkills) {
      const userSkill = userSkillsMap.get(required.id || required.skillCode);

      if (!userSkill) {
        // Skill completely missing
        const skillDetails = await db.query.skillsTaxonomy.findFirst({
          where: eq(skillsTaxonomy.code, required.id || required.skillCode),
        });

        missingSkills.push({
          skillCode: required.id || required.skillCode,
          skillName: skillDetails
            ? (typeof skillDetails.nameI18n === 'object' && skillDetails.nameI18n !== null
                ? (skillDetails.nameI18n as any).en
                : required.id)
            : required.id,
          requiredLevel: required.level || 3,
        });
      } else if (userSkill.level < (required.level || 3)) {
        // Skill below required level
        const skillDetails = await db.query.skillsTaxonomy.findFirst({
          where: eq(skillsTaxonomy.code, required.id || required.skillCode),
        });

        underLevelSkills.push({
          skillCode: required.id || required.skillCode,
          skillName: skillDetails
            ? (typeof skillDetails.nameI18n === 'object' && skillDetails.nameI18n !== null
                ? (skillDetails.nameI18n as any).en
                : required.id)
            : required.id,
          currentLevel: userSkill.level,
          requiredLevel: required.level || 3,
          gap: (required.level || 3) - userSkill.level,
        });
      }
    }

    // Add feedback for missing skills (highest priority)
    if (missingSkills.length > 0) {
      const topMissing = missingSkills.slice(0, 3);
      feedback.push({
        category: 'skills',
        priority: 'critical',
        issue: `You're missing ${missingSkills.length} required skill${missingSkills.length > 1 ? 's' : ''}`,
        action: `Add these skills to your profile: ${topMissing.map(s => s.skillName).join(', ')}${missingSkills.length > 3 ? ` and ${missingSkills.length - 3} more` : ''}`,
        estimatedImpact: Math.min(missingSkills.length * 15, 60),
        details: {
          missingSkills,
          link: '/profile/skills?action=add',
        },
      });
    }

    // Add feedback for under-level skills
    if (underLevelSkills.length > 0) {
      const topUnderLevel = underLevelSkills.slice(0, 3);
      feedback.push({
        category: 'skills',
        priority: 'high',
        issue: `${underLevelSkills.length} skill${underLevelSkills.length > 1 ? 's are' : ' is'} below the required level`,
        action: `Increase your proficiency in: ${topUnderLevel.map(s => `${s.skillName} (L${s.currentLevel} → L${s.requiredLevel})`).join(', ')}`,
        estimatedImpact: Math.min(underLevelSkills.reduce((sum, s) => sum + s.gap * 5, 0), 40),
        details: {
          underLevelSkills,
          link: '/profile/skills',
        },
      });
    }

    // Check verification gates
    const requiredGates = assignment.verificationGates || [];
    if (requiredGates.length > 0) {
      // Get user's verifications (simplified for MVP)
      // TODO: Check actual verification records
      feedback.push({
        category: 'verification',
        priority: 'high',
        issue: `This role requires ${requiredGates.length} verification${requiredGates.length > 1 ? 's' : ''}`,
        action: `Complete verification: ${requiredGates.join(', ')}`,
        estimatedImpact: 25,
        details: {
          requiredGates,
          link: '/verifications',
        },
      });
    }

    // Check availability match
    // TODO: Compare availability bitmaps
    // For now, add generic availability feedback if assignment has requirements
    if (assignment.requiredAvailabilityBitmap) {
      feedback.push({
        category: 'availability',
        priority: 'medium',
        issue: 'Your availability may not match the role requirements',
        action: 'Update your availability calendar to show when you\'re free',
        estimatedImpact: 15,
        details: {
          link: '/profile/availability',
        },
      });
    }

    // Check location/remote preferences
    if (assignment.locationMode === 'onsite' && assignment.city) {
      // TODO: Check if user's location matches
      feedback.push({
        category: 'location',
        priority: 'low',
        issue: `This role requires on-site presence in ${assignment.city}`,
        action: 'Update your location preferences if you\'re willing to relocate or work on-site',
        estimatedImpact: 10,
        details: {
          link: '/profile/preferences',
        },
      });
    }

    // Sort by priority and estimated impact
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    feedback.sort((a, b) => {
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return b.estimatedImpact - a.estimatedImpact;
    });

    // 5. Calculate potential score improvement
    const totalPotentialImprovement = feedback.reduce((sum, item) => sum + item.estimatedImpact, 0);
    const currentScore = matchRecord ? Number(matchRecord.score) : 0;
    const potentialScore = Math.min(currentScore + totalPotentialImprovement, 100);

    // 6. Generate summary message
    let summary = '';
    if (feedback.length === 0) {
      summary = 'Your profile matches most requirements. You may not have been shortlisted due to a high volume of qualified candidates.';
    } else if (feedback[0].priority === 'critical') {
      summary = `You weren't shortlisted because you're missing critical requirements. Focus on the actions below to significantly improve your chances.`;
    } else {
      summary = `You're close! Addressing these gaps could improve your match score by up to ${totalPotentialImprovement} points.`;
    }

    return NextResponse.json({
      success: true,
      assignmentTitle: assignment.title,
      currentMatchScore: currentScore,
      potentialMatchScore: potentialScore,
      potentialImprovement: totalPotentialImprovement,
      summary,
      feedback,
      nextBestActions: feedback.slice(0, 3),
      gapMapAvailable: missingSkills.length > 0 || underLevelSkills.length > 0,
      metadata: {
        analyzedAt: new Date().toISOString(),
        totalFeedbackItems: feedback.length,
      },
    });

  } catch (error) {
    console.error('Feedback generation error:', error);
    return NextResponse.json({
      error: 'Failed to generate feedback',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

/**
 * GET /api/feedback/why-not-shortlisted?assignmentId=xxx
 *
 * Convenience GET endpoint
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const assignmentId = searchParams.get('assignmentId');

  if (!assignmentId) {
    return NextResponse.json({
      error: 'Missing assignmentId parameter',
    }, { status: 400 });
  }

  // Reuse POST logic
  return POST(
    new NextRequest(request.url, {
      method: 'POST',
      headers: request.headers,
      body: JSON.stringify({ assignmentId }),
    })
  );
}
