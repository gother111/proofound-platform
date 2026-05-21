import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { jsonError, requirePlatformAdminJson } from '@/lib/api/route-helpers';
import { adminListGuard } from '@/app/api/admin/_utils';
import {
  getInternalOpsQueueItem,
  InternalOpsQueueMutationError,
  transitionInternalOpsQueueItem,
} from '@/lib/internal-ops/queue';
import { logAdminAction } from '@/lib/audit/admin-logger';
import { log } from '@/lib/log';
import { reviewUploadedFileQueueItem, UploadReviewError } from '@/lib/uploads/review';

const paramsSchema = z.object({
  id: z.string().uuid(),
});

const patchBodySchema = z
  .object({
    status: z.enum(['open', 'in_progress', 'resolved', 'cancelled']),
    note: z.string().trim().max(2000).optional(),
    uploadReviewAction: z.enum(['approve', 'reject']).optional(),
  })
  .refine((body) => !body.uploadReviewAction || body.status === 'resolved', {
    message: 'Upload review actions must resolve the queue item.',
    path: ['uploadReviewAction'],
  });

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const guardResult = await adminListGuard(request);
    if (guardResult instanceof NextResponse) {
      return guardResult;
    }

    const parsedParams = paramsSchema.safeParse(await params);
    if (!parsedParams.success) {
      return jsonError('Invalid queue id', 400, parsedParams.error.flatten());
    }

    const item = await getInternalOpsQueueItem(parsedParams.data.id);
    if (!item) {
      return jsonError('Queue item not found', 404);
    }

    return NextResponse.json({
      success: true,
      item,
    });
  } catch (error) {
    if (
      error instanceof InternalOpsQueueMutationError &&
      error.code === 'compatibility_fallback_unavailable'
    ) {
      return jsonError(error.message, 503);
    }

    log.error('admin.internal_ops_queue_item.get_failed', {
      errorName: error instanceof Error ? error.name : typeof error,
    });
    return jsonError('Failed to fetch operations queue item', 500);
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const adminUser = await requirePlatformAdminJson();
    if (adminUser instanceof NextResponse) {
      return adminUser;
    }

    const parsedParams = paramsSchema.safeParse(await params);
    if (!parsedParams.success) {
      return jsonError('Invalid queue id', 400, parsedParams.error.flatten());
    }

    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      return jsonError('Invalid JSON body', 400);
    }
    const payload = patchBodySchema.safeParse(rawBody);
    if (!payload.success) {
      return jsonError('Invalid queue update payload', 400, payload.error.flatten());
    }

    if (payload.data.uploadReviewAction && adminUser.adminLevel !== 'super_admin') {
      return jsonError('Upload review requires super admin access', 403);
    }

    const transition = payload.data.uploadReviewAction
      ? await reviewUploadedFileQueueItem({
          queueItemId: parsedParams.data.id,
          action: payload.data.uploadReviewAction,
          note: payload.data.note,
          actorId: adminUser.userId,
        })
      : await transitionInternalOpsQueueItem({
          id: parsedParams.data.id,
          nextStatus: payload.data.status,
          note: payload.data.note,
          actorId: adminUser.userId,
        });

    await logAdminAction({
      adminId: adminUser.userId,
      action: payload.data.uploadReviewAction
        ? 'internal_ops_queue_upload_reviewed'
        : 'internal_ops_queue_status_changed',
      targetType: 'internal_ops_queue_item',
      targetId: transition.current.id,
      changes: {
        fromStatus: transition.previous.status,
        toStatus: transition.current.status,
        ...(payload.data.uploadReviewAction
          ? { uploadReviewAction: payload.data.uploadReviewAction }
          : {}),
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

    if (error instanceof UploadReviewError) {
      const status =
        error.code === 'not_found'
          ? 404
          : error.code === 'invalid_transition' || error.code === 'invalid_upload_state'
            ? 409
            : error.code === 'storage_copy_failed' || error.code === 'storage_cleanup_failed'
              ? 502
              : 400;

      return jsonError(error.message, status);
    }

    log.error('admin.internal_ops_queue_item.update_failed', {
      errorName: error instanceof Error ? error.name : typeof error,
    });
    return jsonError('Failed to update operations queue item', 500);
  }
}
