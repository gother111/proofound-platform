import path from 'path';
import { sql } from 'drizzle-orm';

import { db } from '@/db';
import { getRows } from '@/lib/db/rows';
import {
  recordUploadEvent,
  recordUploadReviewAudit,
  UPLOAD_BUCKETS,
  type UploadedFileRow,
} from '@/lib/uploads/lifecycle';
import { createAdminClient } from '@/lib/supabase/admin';
import type { InternalOpsQueueStatus, InternalOpsQueueSummary } from '@/lib/internal-ops/queue';

export type UploadReviewAction = 'approve' | 'reject';

type InternalOpsQueueRow = {
  id: string;
  queue_type: string;
  status: InternalOpsQueueStatus;
  priority: string;
  linked_entity_type: string;
  linked_entity_id: string;
  summary: string;
  metadata: Record<string, unknown> | null;
  created_at: Date;
  updated_at: Date;
  resolved_at: Date | null;
};

export class UploadReviewError extends Error {
  constructor(
    readonly code:
      | 'not_found'
      | 'invalid_queue_link'
      | 'invalid_transition'
      | 'note_required'
      | 'invalid_upload_state'
      | 'storage_copy_failed'
      | 'storage_cleanup_failed',
    message: string
  ) {
    super(message);
    this.name = 'UploadReviewError';
  }
}

const UPLOAD_REVIEW_QUEUE_ALLOWED_STATUSES = new Set<InternalOpsQueueStatus>([
  'open',
  'in_progress',
]);

function toIso(value: Date | string | null | undefined) {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function toQueueSummary(row: InternalOpsQueueRow): InternalOpsQueueSummary {
  return {
    id: row.id,
    queueType: row.queue_type as InternalOpsQueueSummary['queueType'],
    status: row.status,
    priority: row.priority as InternalOpsQueueSummary['priority'],
    linkedEntityType: row.linked_entity_type as InternalOpsQueueSummary['linkedEntityType'],
    linkedEntityId: row.linked_entity_id,
    summary: row.summary,
    metadata: row.metadata ?? {},
    createdAt: toIso(row.created_at) ?? new Date(0).toISOString(),
    updatedAt: toIso(row.updated_at) ?? new Date(0).toISOString(),
    resolvedAt: toIso(row.resolved_at),
  };
}

function extensionForPrivateCopy(row: UploadedFileRow) {
  const ext = path.extname(row.sanitized_filename ?? '').toLowerCase();
  return /^[.][a-z0-9]{1,10}$/.test(ext) ? ext : '';
}

function privatePathForApprovedUpload(row: UploadedFileRow) {
  return `${row.owner_type}/${row.owner_id}/${row.upload_kind}/${row.id}${extensionForPrivateCopy(
    row
  )}`;
}

async function loadUploadForReview(uploadedFileId: string) {
  const result = await db.execute(sql`
    SELECT
      id,
      owner_type,
      upload_kind,
      size_bytes,
      lifecycle_state,
      safety_status,
      safety_reason,
      original_filename,
      original_filename_sensitive,
      sanitized_filename,
      detected_mime,
      metadata_status,
      safe_for_public,
      attach_status,
      public_bucket,
      public_path,
      quarantine_bucket,
      quarantine_path,
      durable_bucket,
      durable_path,
      owner_id,
      proof_pack_id,
      metadata
    FROM uploaded_files
    WHERE id = ${uploadedFileId}::uuid
      AND deleted_at IS NULL
    LIMIT 1
  `);

  const [row] = getRows<UploadedFileRow>(result as any);
  return row ?? null;
}

async function copyQuarantinedObjectToPrivate(row: UploadedFileRow, destinationPath: string) {
  if (!row.quarantine_bucket || !row.quarantine_path) {
    throw new UploadReviewError(
      'invalid_upload_state',
      'Uploaded file does not have a quarantined object to approve.'
    );
  }

  const admin = createAdminClient();
  const source = admin.storage.from(row.quarantine_bucket);
  const downloadResult = await source.download(row.quarantine_path);

  if (downloadResult.error || !downloadResult.data) {
    throw new UploadReviewError(
      'storage_copy_failed',
      'Unable to read quarantined upload for review approval.'
    );
  }

  const downloadedData = downloadResult.data as unknown;
  const bytes =
    downloadedData instanceof Buffer
      ? downloadedData
      : downloadedData instanceof ArrayBuffer
        ? Buffer.from(downloadedData)
        : ArrayBuffer.isView(downloadedData)
          ? Buffer.from(downloadedData.buffer, downloadedData.byteOffset, downloadedData.byteLength)
          : typeof (downloadedData as { arrayBuffer?: unknown }).arrayBuffer === 'function'
            ? Buffer.from(await (downloadedData as Blob).arrayBuffer())
            : null;

  if (!bytes) {
    throw new UploadReviewError(
      'storage_copy_failed',
      'Unable to read quarantined upload bytes for review approval.'
    );
  }
  const uploadResult = await admin.storage
    .from(UPLOAD_BUCKETS.PRIVATE)
    .upload(destinationPath, bytes, {
      contentType: row.detected_mime ?? 'application/octet-stream',
      upsert: false,
      cacheControl: '0',
    });

  if (uploadResult.error) {
    throw new UploadReviewError(
      'storage_copy_failed',
      'Unable to copy approved upload into private storage.'
    );
  }
}

async function cleanupQuarantineCopy(row: UploadedFileRow) {
  if (!row.quarantine_bucket || !row.quarantine_path) {
    return;
  }

  const removeResult = await createAdminClient()
    .storage.from(row.quarantine_bucket)
    .remove([row.quarantine_path]);

  if (removeResult.error) {
    await recordUploadEvent(row.id, 'cleanup_failed', {
      stage: 'manual_review_quarantine_cleanup',
      reason: 'storage_remove_failed',
    });
    return;
  }

  await db.execute(sql`
    UPDATE uploaded_files
    SET
      quarantine_bucket = NULL,
      quarantine_path = NULL,
      updated_at = NOW()
    WHERE id = ${row.id}::uuid
      AND lifecycle_state = 'ready_private'
      AND durable_bucket = ${UPLOAD_BUCKETS.PRIVATE}
  `);
}

async function runDbTransaction<T>(
  callback: (executor: { execute: typeof db.execute }) => Promise<T>
) {
  const transactionalDb = db as typeof db & {
    transaction?: <Result>(
      callback: (tx: { execute: typeof db.execute }) => Promise<Result>
    ) => Promise<Result>;
  };

  if (typeof transactionalDb.transaction === 'function') {
    return transactionalDb.transaction(callback);
  }

  return callback(db);
}

export async function reviewUploadedFileQueueItem(params: {
  queueItemId: string;
  action: UploadReviewAction;
  actorId: string;
  note?: string | null;
}) {
  const note = params.note?.trim() ?? null;
  if (!note) {
    throw new UploadReviewError(
      'note_required',
      'An operator note is required for upload approval or rejection.'
    );
  }

  const preflightQueue = await db.execute(sql`
    SELECT linked_entity_type, linked_entity_id
    FROM internal_ops_queue_items
    WHERE id = ${params.queueItemId}::uuid
    LIMIT 1
  `);
  const [preflightQueueRow] = getRows<{
    linked_entity_type: string;
    linked_entity_id: string;
  }>(preflightQueue as any);

  if (!preflightQueueRow) {
    throw new UploadReviewError('not_found', 'Queue item not found.');
  }

  if (preflightQueueRow.linked_entity_type !== 'uploaded_file') {
    throw new UploadReviewError(
      'invalid_queue_link',
      'Upload review actions can only be applied to uploaded file queue items.'
    );
  }

  const uploadedFileId = preflightQueueRow.linked_entity_id;
  const uploadRow = await loadUploadForReview(uploadedFileId);
  if (!uploadRow) {
    throw new UploadReviewError('not_found', 'Uploaded file not found.');
  }

  const destinationPath =
    params.action === 'approve' ? privatePathForApprovedUpload(uploadRow) : null;

  if (params.action === 'approve') {
    if (
      uploadRow.lifecycle_state !== 'quarantined' ||
      uploadRow.safety_status !== 'manual_review' ||
      uploadRow.attach_status !== 'pending'
    ) {
      throw new UploadReviewError(
        'invalid_upload_state',
        'Only quarantined uploads pending manual review can be approved.'
      );
    }

    await copyQuarantinedObjectToPrivate(uploadRow, destinationPath as string);
  }

  let transition: {
    previous: InternalOpsQueueSummary;
    current: InternalOpsQueueSummary;
    note: string;
    uploadReviewAction: UploadReviewAction;
  } | null = null;

  try {
    transition = await runDbTransaction(async (tx) => {
      const queueResult = await tx.execute(sql`
      SELECT
        id,
        queue_type,
        status,
        priority,
        linked_entity_type,
        linked_entity_id,
        summary,
        metadata,
        created_at,
        updated_at,
        resolved_at
      FROM internal_ops_queue_items
      WHERE id = ${params.queueItemId}::uuid
      FOR UPDATE
    `);
      const [queueRow] = getRows<InternalOpsQueueRow>(queueResult as any);

      if (!queueRow) {
        throw new UploadReviewError('not_found', 'Queue item not found.');
      }

      if (queueRow.linked_entity_type !== 'uploaded_file') {
        throw new UploadReviewError(
          'invalid_queue_link',
          'Upload review actions can only be applied to uploaded file queue items.'
        );
      }

      if (!UPLOAD_REVIEW_QUEUE_ALLOWED_STATUSES.has(queueRow.status)) {
        throw new UploadReviewError(
          'invalid_transition',
          `Cannot review upload queue item from ${queueRow.status}.`
        );
      }

      const fileResult = await tx.execute(sql`
      SELECT
        id,
        owner_type,
        upload_kind,
        size_bytes,
        lifecycle_state,
        safety_status,
        safety_reason,
        original_filename,
        original_filename_sensitive,
        sanitized_filename,
        detected_mime,
        metadata_status,
        safe_for_public,
        attach_status,
        public_bucket,
        public_path,
        quarantine_bucket,
        quarantine_path,
        durable_bucket,
        durable_path,
        owner_id,
        proof_pack_id,
        metadata
      FROM uploaded_files
      WHERE id = ${queueRow.linked_entity_id}::uuid
        AND deleted_at IS NULL
      FOR UPDATE
    `);
      const [lockedUploadRow] = getRows<UploadedFileRow>(fileResult as any);

      if (!lockedUploadRow) {
        throw new UploadReviewError('not_found', 'Uploaded file not found.');
      }

      if (
        lockedUploadRow.lifecycle_state !== 'quarantined' ||
        lockedUploadRow.safety_status !== 'manual_review' ||
        lockedUploadRow.attach_status !== 'pending'
      ) {
        throw new UploadReviewError(
          'invalid_upload_state',
          'Only quarantined uploads pending manual review can be reviewed.'
        );
      }

      const reviewedAt = new Date().toISOString();
      const priorState = lockedUploadRow.lifecycle_state;
      const priorSafetyStatus = lockedUploadRow.safety_status;
      const reviewMetadata = {
        manualReview: {
          action: params.action === 'approve' ? 'approved' : 'rejected',
          actorId: params.actorId,
          reviewedAt,
          note,
          priorState,
          priorSafetyStatus,
          priorSafetyReason: lockedUploadRow.safety_reason,
        },
      };

      if (params.action === 'approve') {
        await tx.execute(sql`
        UPDATE uploaded_files
        SET
          durable_bucket = ${UPLOAD_BUCKETS.PRIVATE},
          durable_path = ${destinationPath},
          public_bucket = NULL,
          public_path = NULL,
          lifecycle_state = 'ready_private',
          safety_status = 'approved_after_manual_review',
          safety_reason = NULL,
          attach_status = 'attachable',
          safe_for_public = FALSE,
          original_filename_sensitive = TRUE,
          promoted_at = NOW(),
          metadata = COALESCE(metadata, '{}'::jsonb) || ${JSON.stringify(reviewMetadata)}::jsonb,
          updated_at = NOW()
        WHERE id = ${lockedUploadRow.id}::uuid
      `);
        await recordUploadEvent(
          lockedUploadRow.id,
          'manual_review_approved',
          {
            queueItemId: queueRow.id,
            priorState,
            nextState: 'ready_private',
            safeForPublic: false,
          },
          tx
        );
        await recordUploadReviewAudit(
          {
            actorId: params.actorId,
            targetId: lockedUploadRow.id,
            outcome: 'approved',
            reason: note,
            row: lockedUploadRow,
            queueItemId: queueRow.id,
            priorState,
            nextState: 'ready_private',
          },
          tx
        );
      } else {
        await tx.execute(sql`
        UPDATE uploaded_files
        SET
          lifecycle_state = 'rejected',
          safety_status = 'rejected',
          safety_reason = 'manual_review_rejected',
          attach_status = 'rejected',
          safe_for_public = FALSE,
          original_filename_sensitive = TRUE,
          metadata = COALESCE(metadata, '{}'::jsonb) || ${JSON.stringify(reviewMetadata)}::jsonb,
          updated_at = NOW()
        WHERE id = ${lockedUploadRow.id}::uuid
      `);
        await recordUploadEvent(
          lockedUploadRow.id,
          'manual_review_rejected',
          {
            queueItemId: queueRow.id,
            priorState,
            nextState: 'rejected',
          },
          tx
        );
        await recordUploadReviewAudit(
          {
            actorId: params.actorId,
            targetId: lockedUploadRow.id,
            outcome: 'rejected',
            reason: note,
            row: lockedUploadRow,
            queueItemId: queueRow.id,
            priorState,
            nextState: 'rejected',
          },
          tx
        );
      }

      const queueMetadata = {
        ...(queueRow.metadata ?? {}),
        latestOperatorAction: 'resolved',
        latestOperatorActionAt: reviewedAt,
        latestOperatorActorId: params.actorId,
        latestOperatorNote: note,
        uploadReviewAction: params.action === 'approve' ? 'approved' : 'rejected',
        uploadedFileLifecycleState: params.action === 'approve' ? 'ready_private' : 'rejected',
        uploadedFileAttachStatus: params.action === 'approve' ? 'attachable' : 'rejected',
      };

      await tx.execute(sql`
      UPDATE internal_ops_queue_items
      SET
        status = 'resolved',
        metadata = ${JSON.stringify(queueMetadata)}::jsonb,
        resolved_at = NOW(),
        resolved_by_actor_id = ${params.actorId}::uuid,
        updated_at = NOW()
      WHERE id = ${queueRow.id}::uuid
    `);

      const updatedQueueResult = await tx.execute(sql`
      SELECT
        id,
        queue_type,
        status,
        priority,
        linked_entity_type,
        linked_entity_id,
        summary,
        metadata,
        created_at,
        updated_at,
        resolved_at
      FROM internal_ops_queue_items
      WHERE id = ${queueRow.id}::uuid
      LIMIT 1
    `);
      const [updatedQueue] = getRows<InternalOpsQueueRow>(updatedQueueResult as any);

      return {
        previous: toQueueSummary(queueRow),
        current: toQueueSummary(updatedQueue ?? queueRow),
        note,
        uploadReviewAction: params.action,
      };
    });
  } catch (error) {
    if (params.action === 'approve' && destinationPath) {
      await createAdminClient().storage.from(UPLOAD_BUCKETS.PRIVATE).remove([destinationPath]);
    }
    throw error;
  }

  if (!transition) {
    throw new UploadReviewError('invalid_transition', 'Upload review transition did not complete.');
  }

  if (params.action === 'approve') {
    await cleanupQuarantineCopy({
      ...uploadRow,
      durable_bucket: UPLOAD_BUCKETS.PRIVATE,
      durable_path: destinationPath,
      lifecycle_state: 'ready_private',
    });
  }

  return transition;
}
