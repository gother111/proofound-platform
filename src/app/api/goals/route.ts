/**
 * Goals API
 * GET/POST /api/goals
 *
 * Manages user's growth plans / career goals
 * Used by GoalsCard dashboard widget
 *
 * PRD References:
 * - Part 5: F2 - Customizable Dashboard
 * - Part 7: Dashboard tile data
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/db';
import { growthPlans } from '@/db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { z } from 'zod';
import { toCanonicalGoal, toLegacyGoal } from '@/lib/goals/canonical';

export const dynamic = 'force-dynamic';

// Schema for creating a new goal
const CreateGoalSchema = z.object({
  title: z.string().min(1).max(200),
  goal: z.string().max(500).optional(),
  targetLevel: z.number().int().min(1).max(5).optional(),
  targetDate: z.string().optional(), // ISO date string
  capabilityId: z.string().uuid().optional(),
  milestones: z
    .array(
      z.object({
        title: z.string(),
        completed: z.boolean().default(false),
        dueDate: z.string().optional(),
      })
    )
    .optional(),
  supportNeeds: z.string().max(500).optional(),
});

// Schema for updating a goal
const UpdateGoalSchema = CreateGoalSchema.partial().extend({
  id: z.string().uuid(),
  status: z.enum(['planned', 'in_progress', 'blocked', 'completed', 'archived']).optional(),
});

/**
 * GET: Fetch user's goals
 *
 * Query params:
 * - status: Filter by status (planned, in_progress, blocked, completed, archived)
 * - limit: Max number to return (default: 10)
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();

    const searchParams = request.nextUrl.searchParams;
    const statusFilter = searchParams.get('status');
    const limit = Math.min(parseInt(searchParams.get('limit') || '10', 10), 50);

    // Build query with optional status filter
    let whereClause = eq(growthPlans.profileId, user.id);

    if (
      statusFilter &&
      ['planned', 'in_progress', 'blocked', 'completed', 'archived'].includes(statusFilter)
    ) {
      whereClause = and(
        eq(growthPlans.profileId, user.id),
        eq(growthPlans.status, statusFilter as any)
      )!;
    }

    // Fetch goals and normalize to canonical + backward-compatible shapes.
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
      .where(whereClause)
      .orderBy(desc(growthPlans.updatedAt))
      .limit(limit);

    const goalsWithProgress = userGoals.map((goal) => {
      const canonicalGoal = toCanonicalGoal(goal);
      return {
        ...canonicalGoal,
        legacy: toLegacyGoal(canonicalGoal),
      };
    });

    // Get summary stats
    const allGoals = await db
      .select({
        status: growthPlans.status,
        count: sql<number>`count(*)::int`,
      })
      .from(growthPlans)
      .where(eq(growthPlans.profileId, user.id))
      .groupBy(growthPlans.status);

    const stats = {
      total: allGoals.reduce((sum, g) => sum + (g.count || 0), 0),
      planned: allGoals.find((g) => g.status === 'planned')?.count || 0,
      inProgress: allGoals.find((g) => g.status === 'in_progress')?.count || 0,
      completed: allGoals.find((g) => g.status === 'completed')?.count || 0,
      blocked: allGoals.find((g) => g.status === 'blocked')?.count || 0,
    };

    return NextResponse.json({
      goals: goalsWithProgress,
      stats,
      contractVersion: 'v2-canonical',
    });
  } catch (error) {
    console.error('Failed to fetch goals:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch goals',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST: Create a new goal
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();

    // Validate input
    const validatedData = CreateGoalSchema.parse(body);

    // Create the goal
    const [newGoal] = await db
      .insert(growthPlans)
      .values({
        profileId: user.id,
        title: validatedData.title,
        goal: validatedData.goal,
        targetLevel: validatedData.targetLevel,
        targetDate: validatedData.targetDate,
        capabilityId: validatedData.capabilityId,
        milestones: validatedData.milestones || [],
        supportNeeds: validatedData.supportNeeds,
        status: 'planned',
      })
      .returning();

    const canonicalGoal = toCanonicalGoal(newGoal);

    return NextResponse.json({
      success: true,
      goal: canonicalGoal,
      legacyGoal: toLegacyGoal(canonicalGoal),
      contractVersion: 'v2-canonical',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid goal data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Failed to create goal:', error);
    return NextResponse.json(
      {
        error: 'Failed to create goal',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH: Update an existing goal
 */
export async function PATCH(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();

    // Validate input
    const validatedData = UpdateGoalSchema.parse(body);

    // Verify ownership
    const existingGoal = await db
      .select()
      .from(growthPlans)
      .where(and(eq(growthPlans.id, validatedData.id), eq(growthPlans.profileId, user.id)))
      .limit(1);

    if (existingGoal.length === 0) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    // Build update object
    const updateData: Record<string, any> = {
      updatedAt: new Date(),
    };

    if (validatedData.title !== undefined) updateData.title = validatedData.title;
    if (validatedData.goal !== undefined) updateData.goal = validatedData.goal;
    if (validatedData.targetLevel !== undefined) updateData.targetLevel = validatedData.targetLevel;
    if (validatedData.targetDate !== undefined) updateData.targetDate = validatedData.targetDate;
    if (validatedData.status !== undefined) updateData.status = validatedData.status;
    if (validatedData.milestones !== undefined) updateData.milestones = validatedData.milestones;
    if (validatedData.supportNeeds !== undefined)
      updateData.supportNeeds = validatedData.supportNeeds;
    if (validatedData.capabilityId !== undefined)
      updateData.capabilityId = validatedData.capabilityId;

    // Update the goal
    const [updatedGoal] = await db
      .update(growthPlans)
      .set(updateData)
      .where(eq(growthPlans.id, validatedData.id))
      .returning();

    const canonicalGoal = toCanonicalGoal(updatedGoal);

    return NextResponse.json({
      success: true,
      goal: canonicalGoal,
      legacyGoal: toLegacyGoal(canonicalGoal),
      contractVersion: 'v2-canonical',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid goal data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Failed to update goal:', error);
    return NextResponse.json(
      {
        error: 'Failed to update goal',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE: Delete a goal
 */
export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAuth();
    const searchParams = request.nextUrl.searchParams;
    const goalId = searchParams.get('id');

    if (!goalId) {
      return NextResponse.json({ error: 'Goal ID is required' }, { status: 400 });
    }

    // Verify ownership and delete
    const deleted = await db
      .delete(growthPlans)
      .where(and(eq(growthPlans.id, goalId), eq(growthPlans.profileId, user.id)))
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete goal:', error);
    return NextResponse.json(
      {
        error: 'Failed to delete goal',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
