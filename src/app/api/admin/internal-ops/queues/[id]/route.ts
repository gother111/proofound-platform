import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { jsonError, requirePlatformAdminJson } from '@/lib/api/route-helpers';
import {
  InternalOpsQueueMutationError,
  transitionInternalOpsQueueItem,
} from '@/lib/internal-ops/queue';
import { logAdminAction } from '@/lib/audit/admin-logger';

const paramsSchema = z.object({
  id: z.string().uuid(),
});

const patchBodySchema = z.object({
  status: z.enum(['open', 'in_progress', 'resolved', 'cancelled']),
  note: z.string().trim().max(2000).optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminUser = await requirePlatformAdminJson();
    if (adminUser instanceof NextResponse) {
      return adminUser;
    }

    const parsedParams = paramsSchema.safeParse(await params);
    if (!parsedParams.success) {
      return jsonError('Invalid queue id', 400, parsedParams.error.flatten());
    }

    const payload = patchBodySchema.safeParse(await request.json());
    if (!payload.success) {
      return jsonError('Invalid queue update payload', 400, payload.error.flatten());
    }

    const transition = await transitionInternalOpsQueueItem({
      id: parsedParams.data.id,
      nextStatus: payload.data.status,
      note: payload.data.note,
      actorId: adminUser.userId,
    });

    await logAdminAction({
      adminId: adminUser.userId,
      action: 'internal_ops_queue_status_changed',
      targetType: 'internal_ops_queue_item',
      targetId: transition.current.id,
      changes: {
        fromStatus: transition.previous.status,
        toStatus: transition.current.status,
      },
      reason: transition.note ?? undefined,
      metadata: {
        queueType: transition.current.queueType,
        linkedEntityType: transition.current.linkedEntityType,
        linkedEntityId: transition.current.linkedEntityId,
        summary: transition.current.summary,
      },
    });

    return NextResponse.json({
      success: true,
      item: transition.current,
    });
  } catch (error) {
    if (error instanceof InternalOpsQueueMutationError) {
      const status =
        error.code === 'not_found'
          ? 404
          : error.code === 'compatibility_fallback_unavailable'
            ? 503
            : error.code === 'invalid_transition'
              ? 409
              : 400;

      return jsonError(error.message, status);
    }

    console.error('Error updating internal ops queue item:', error);
    return jsonError(
      'Failed to update internal ops queue item',
      500,
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}
