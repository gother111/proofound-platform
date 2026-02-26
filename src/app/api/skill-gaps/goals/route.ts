/**
 * Learning Goals API (Compatibility Adapter)
 *
 * Canonical contract lives in /api/goals.
 * This route remains for skill-gap UI compatibility and returns both
 * canonical and legacy payload shapes.
 */

import { NextRequest, NextResponse } from 'next/server';
import { and, desc, eq } from 'drizzle-orm';

import { requireApiAuthContext } from '@/lib/auth';
import { db } from '@/db';
import { growthPlans } from '@/db/schema';
import { toCanonicalGoal, toLegacyGoal } from '@/lib/goals/canonical';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const authContext = await requireApiAuthContext();
    if (!authContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { user } = authContext;

    const rows = await db
      .select()
      .from(growthPlans)
      .where(eq(growthPlans.profileId, user.id))
      .orderBy(desc(growthPlans.createdAt));

    const goals = rows.map((row) => {
      const canonicalGoal = toCanonicalGoal(row);
      return {
        ...toLegacyGoal(canonicalGoal),
        canonical: canonicalGoal,
      };
    });

    return NextResponse.json({
      goals,
      contractVersion: 'v2-canonical-adapter',
      canonicalRoute: '/api/goals',
    });
  } catch (error) {
    console.error('Failed to load goals', error);
    return NextResponse.json(
      {
        error: 'Failed to load goals',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authContext = await requireApiAuthContext();
    if (!authContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { user } = authContext;
    const body = await request.json();

    const skillCode: string | undefined = body.skillCode;
    const targetLevel: number | undefined = body.targetLevel;
    const targetDate: string | undefined = body.targetDate;

    if (!skillCode) {
      return NextResponse.json({ error: 'skillCode is required' }, { status: 400 });
    }

    const [inserted] = await db
      .insert(growthPlans)
      .values({
        profileId: user.id,
        title: body.title ?? `Learn ${skillCode}`,
        goal: skillCode,
        targetLevel: targetLevel ?? 3,
        targetDate: targetDate ?? null,
        status: 'planned',
      })
      .returning();

    const canonicalGoal = toCanonicalGoal(inserted);

    return NextResponse.json({
      goal: canonicalGoal,
      legacyGoal: toLegacyGoal(canonicalGoal),
      contractVersion: 'v2-canonical-adapter',
      canonicalRoute: '/api/goals',
    });
  } catch (error) {
    console.error('Failed to create goal', error);
    return NextResponse.json(
      {
        error: 'Failed to create goal',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const authContext = await requireApiAuthContext();
    if (!authContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { user } = authContext;
    const body = await request.json();

    const id: string | undefined = body.id;
    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const updates: Partial<typeof growthPlans.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (body.status) updates.status = body.status;
    if (body.targetDate) updates.targetDate = body.targetDate;

    const [updated] = await db
      .update(growthPlans)
      .set(updates)
      .where(and(eq(growthPlans.id, id), eq(growthPlans.profileId, user.id)))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    const canonicalGoal = toCanonicalGoal(updated);

    return NextResponse.json({
      goal: canonicalGoal,
      legacyGoal: toLegacyGoal(canonicalGoal),
      contractVersion: 'v2-canonical-adapter',
      canonicalRoute: '/api/goals',
    });
  } catch (error) {
    console.error('Failed to update goal', error);
    return NextResponse.json(
      {
        error: 'Failed to update goal',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
