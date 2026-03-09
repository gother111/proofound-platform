import { desc, eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { db } from '@/db';
import { wellbeingCheckins } from '@/db/schema';
import { checkRateLimit, getRateLimitHeaders, RATE_LIMITS } from '@/lib/rate-limit/index';
import { createClient } from '@/lib/supabase/server';
import { recordZenAuditEvent, requireZenOptIn, ZEN_MILESTONE_TYPES } from '@/lib/zen/service';

const CheckInSchema = z.object({
  stressLevel: z.number().int().min(1).max(5),
  controlLevel: z.number().int().min(1).max(5),
  milestoneTriggerId: z.enum(ZEN_MILESTONE_TYPES).nullable().optional(),
});

export async function POST(request: NextRequest) {
  const { allowed, result } = await checkRateLimit(request, RATE_LIMITS.wellbeing);
  if (!allowed) {
    return NextResponse.json(
      {
        error: 'Too many requests',
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter: Math.ceil((result.reset - Date.now()) / 1000),
      },
      {
        status: 429,
        headers: {
          ...getRateLimitHeaders(result),
          'Retry-After': Math.ceil((result.reset - Date.now()) / 1000).toString(),
        },
      }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!(await requireZenOptIn(user.id))) {
    return NextResponse.json(
      { error: 'Zen Hub is disabled. Opt in before recording a check-in.' },
      { status: 403 }
    );
  }

  try {
    const validated = CheckInSchema.parse(await request.json());
    const [checkin] = await db
      .insert(wellbeingCheckins)
      .values({
        userId: user.id,
        stressLevel: validated.stressLevel,
        controlLevel: validated.controlLevel,
        milestoneTriggerId: validated.milestoneTriggerId ?? null,
      })
      .returning();

    await recordZenAuditEvent({
      userId: user.id,
      eventType: 'zen_checkin_written',
      routeSource: '/api/wellbeing/checkin',
      metadata: {
        checkin_id: checkin.id,
        milestone_type: validated.milestoneTriggerId ?? null,
      },
    });

    return NextResponse.json({
      success: true,
      checkin: {
        id: checkin.id,
        stressLevel: checkin.stressLevel,
        controlLevel: checkin.controlLevel,
        milestoneType: checkin.milestoneTriggerId,
        createdAt: checkin.createdAt.toISOString(),
      },
      aggregates: {
        entryCount: 1,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid Zen check-in payload', details: error.flatten() },
        { status: 400 }
      );
    }

    console.error('wellbeing.checkin.post.failed', error);
    return NextResponse.json({ error: 'Failed to record check-in' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!(await requireZenOptIn(user.id))) {
    return NextResponse.json({ error: 'Zen Hub is disabled' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(Number.parseInt(searchParams.get('limit') || '30', 10) || 30, 100);

    const checkins = await db.query.wellbeingCheckins.findMany({
      where: eq(wellbeingCheckins.userId, user.id),
      orderBy: [desc(wellbeingCheckins.createdAt)],
      limit,
    });

    return NextResponse.json({
      checkins: checkins.map((checkin) => ({
        id: checkin.id,
        stressLevel: checkin.stressLevel,
        controlLevel: checkin.controlLevel,
        milestoneType: checkin.milestoneTriggerId,
        createdAt: checkin.createdAt.toISOString(),
      })),
      aggregates: {
        total: checkins.length,
        milestoneTagged: checkins.filter((item) => Boolean(item.milestoneTriggerId)).length,
      },
    });
  } catch (error) {
    console.error('wellbeing.checkin.get.failed', error);
    return NextResponse.json({ error: 'Failed to retrieve check-ins' }, { status: 500 });
  }
}
