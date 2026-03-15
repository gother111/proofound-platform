import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { db } from '@/db';
import { fairnessEvaluations, fairnessRemediationEvents } from '@/db/schema';
import { requirePlatformAdmin } from '@/lib/auth/admin';

export const dynamic = 'force-dynamic';

const MutationSchema = z.object({
  action: z.enum(['acknowledged', 'resolved', 'recheck_requested']),
  note: z.string().max(1000).optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ evaluationId: string }> }
) {
  try {
    const adminUser = await requirePlatformAdmin();
    const { evaluationId } = await params;
    const parsed = MutationSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid payload', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const evaluation = await db.query.fairnessEvaluations.findFirst({
      where: eq(fairnessEvaluations.id, evaluationId),
    });

    if (!evaluation) {
      return NextResponse.json({ error: 'Fairness evaluation not found' }, { status: 404 });
    }

    const [event] = await db
      .insert(fairnessRemediationEvents)
      .values({
        fairnessEvaluationId: evaluation.id,
        assignmentId: evaluation.assignmentId,
        actorId: adminUser.userId,
        actorType: 'platform_admin',
        actionType: parsed.data.action,
        detailsJson: {
          note: parsed.data.note?.trim() || null,
          adminLevel: adminUser.adminLevel,
        },
      })
      .returning();

    return NextResponse.json({
      success: true,
      eventId: event.id,
      fairnessEvaluationId: evaluation.id,
      assignmentId: evaluation.assignmentId,
      action: event.actionType,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update fairness remediation state' },
      { status: 500 }
    );
  }
}
