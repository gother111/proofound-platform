import { NextRequest, NextResponse } from 'next/server';

import { requireApiAuthContext } from '@/lib/auth';
import { listZenMilestones, requireZenOptIn } from '@/lib/zen/service';

export async function GET(request: NextRequest) {
  try {
    const authContext = await requireApiAuthContext();
    if (!authContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { user } = authContext;
    if (!(await requireZenOptIn(user.id))) {
      return NextResponse.json({ error: 'Zen Hub is disabled' }, { status: 403 });
    }

    const days = Number.parseInt(request.nextUrl.searchParams.get('days') || '14', 10) || 14;
    const milestones = await listZenMilestones(user.id, days);

    return NextResponse.json({
      milestones: milestones.map((milestone) => ({
        type: milestone.type,
        occurredAt: milestone.occurredAt.toISOString(),
        sourceEvent: milestone.sourceEvent,
      })),
    });
  } catch (error) {
    console.error('wellbeing.milestones.failed', error);
    return NextResponse.json({ error: 'Failed to fetch milestone prompts' }, { status: 500 });
  }
}
