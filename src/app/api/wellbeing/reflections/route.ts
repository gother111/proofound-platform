import { desc, eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { db } from '@/db';
import { wellbeingReflections } from '@/db/schema';
import { createClient } from '@/lib/supabase/server';
import { recordZenAuditEvent, requireZenOptIn, ZEN_MILESTONE_TYPES } from '@/lib/zen/service';

const ReflectionSchema = z.object({
  reflectionText: z.string().trim().min(1).max(5000),
  milestoneType: z.enum(ZEN_MILESTONE_TYPES).nullable().optional(),
  linkedCheckinId: z.string().uuid().nullable().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!(await requireZenOptIn(user.id))) {
      return NextResponse.json(
        { error: 'Zen Hub is disabled. Opt in before saving reflections.' },
        { status: 403 }
      );
    }

    const validated = ReflectionSchema.parse(await req.json());
    const [reflection] = await db
      .insert(wellbeingReflections)
      .values({
        userId: user.id,
        reflectionText: validated.reflectionText,
        milestoneType: validated.milestoneType ?? null,
        linkedCheckinId: validated.linkedCheckinId ?? null,
      })
      .returning();

    await recordZenAuditEvent({
      userId: user.id,
      eventType: 'zen_reflection_written',
      routeSource: '/api/wellbeing/reflections',
      metadata: {
        reflection_id: reflection.id,
        milestone_type: validated.milestoneType ?? null,
        linked_checkin_id: validated.linkedCheckinId ?? null,
      },
    });

    return NextResponse.json({
      success: true,
      reflection: {
        id: reflection.id,
        milestoneType: reflection.milestoneType,
        linkedCheckinId: reflection.linkedCheckinId,
        createdAt: reflection.createdAt.toISOString(),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid Zen reflection payload', details: error.flatten() },
        { status: 400 }
      );
    }

    console.error('wellbeing.reflections.post.failed', error);
    return NextResponse.json({ error: 'Failed to save reflection' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!(await requireZenOptIn(user.id))) {
      return NextResponse.json({ error: 'Zen Hub is disabled' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const limit = Math.min(Number.parseInt(searchParams.get('limit') || '20', 10) || 20, 100);
    const reflections = await db.query.wellbeingReflections.findMany({
      where: eq(wellbeingReflections.userId, user.id),
      orderBy: [desc(wellbeingReflections.createdAt)],
      limit,
    });

    return NextResponse.json({
      reflections: reflections.map((reflection) => ({
        id: reflection.id,
        reflectionText: reflection.reflectionText,
        milestoneType: reflection.milestoneType,
        linkedCheckinId: reflection.linkedCheckinId,
        createdAt: reflection.createdAt.toISOString(),
      })),
      count: reflections.length,
    });
  } catch (error) {
    console.error('wellbeing.reflections.get.failed', error);
    return NextResponse.json({ error: 'Failed to retrieve reflections' }, { status: 500 });
  }
}
