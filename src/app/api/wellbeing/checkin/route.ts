import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { wellbeingCheckins, auditLogs } from '@/db/schema';
import { eq, desc, gte } from 'drizzle-orm';

/**
 * POST /api/wellbeing/checkin
 *
 * PRD Part 5 (F5 - Zen Hub)
 * Records a well-being check-in (stress level, control level)
 * Non-diagnostic, never used in ranking
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { stressLevel, controlLevel, milestoneTriggerId } = await request.json();

    // Validate inputs (1-5 Likert scale)
    if (!stressLevel || !controlLevel) {
      return NextResponse.json(
        {
          error: 'Missing required fields',
          message: 'stressLevel and controlLevel are required',
        },
        { status: 400 }
      );
    }

    if (stressLevel < 1 || stressLevel > 5 || controlLevel < 1 || controlLevel > 5) {
      return NextResponse.json(
        {
          error: 'Invalid values',
          message: 'Levels must be between 1 and 5',
        },
        { status: 400 }
      );
    }

    // Insert check-in
    const [checkin] = await db
      .insert(wellbeingCheckins)
      .values({
        userId: user.id,
        stressLevel,
        controlLevel,
        milestoneTriggerId: milestoneTriggerId || null,
      })
      .returning();

    // Audit log
    await db.insert(auditLogs).values({
      actorId: user.id,
      action: 'wellbeing_checkin',
      meta: {
        checkinId: checkin.id,
        stressLevel,
        controlLevel,
      },
    });

    return NextResponse.json({
      success: true,
      checkin: {
        id: checkin.id,
        stressLevel: checkin.stressLevel,
        controlLevel: checkin.controlLevel,
        createdAt: checkin.createdAt,
      },
    });
  } catch (error) {
    console.error('Well-being check-in error:', error);
    return NextResponse.json(
      {
        error: 'Failed to record check-in',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/wellbeing/checkin
 *
 * Retrieves user's check-in history
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');
    const limit = parseInt(searchParams.get('limit') || '50');

    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const checkins = await db.query.wellbeingCheckins.findMany({
      where: eq(wellbeingCheckins.userId, user.id),
      orderBy: [desc(wellbeingCheckins.createdAt)],
      limit,
    });

    // Filter by date
    const filtered = checkins.filter((c) => c.createdAt >= cutoffDate);

    // Calculate trend
    let trend: 'improving' | 'stable' | 'declining' | null = null;
    if (filtered.length >= 2) {
      const recent = filtered.slice(0, Math.min(3, filtered.length));
      const older = filtered.slice(Math.max(0, filtered.length - 3));

      const recentScore =
        recent.reduce((sum, c) => sum + (5 - c.stressLevel + c.controlLevel), 0) / recent.length;
      const olderScore =
        older.reduce((sum, c) => sum + (5 - c.stressLevel + c.controlLevel), 0) / older.length;

      if (recentScore > olderScore + 1) trend = 'improving';
      else if (recentScore < olderScore - 1) trend = 'declining';
      else trend = 'stable';
    }

    return NextResponse.json({
      success: true,
      checkins: filtered.map((c) => ({
        id: c.id,
        stressLevel: c.stressLevel,
        controlLevel: c.controlLevel,
        createdAt: c.createdAt,
        milestoneTriggerId: c.milestoneTriggerId,
      })),
      trend,
      metadata: {
        total: filtered.length,
        days,
      },
    });
  } catch (error) {
    console.error('Get check-ins error:', error);
    return NextResponse.json(
      {
        error: 'Failed to retrieve check-ins',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
