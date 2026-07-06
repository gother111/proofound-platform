import crypto from 'crypto';
import path from 'path';
import { sql } from 'drizzle-orm';

import { db } from '@/db';
import { getRows } from '@/lib/db/rows';
import { ensureInternalOpsQueueItem } from '@/lib/internal-ops/queue';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  assessEvidenceUploadPrivacy,
  collectUploadMetadataFlags,
  isUploadHeldForPrivacyReview,
  parseUploadPrivacyReviewReasons,
  resolveArtifactDisplayName,
  resolveArtifactDisplayNameForSurface,
  sanitizeUploadFilename,
} from '@/lib/uploads/privacy';
import { scanAndPrepareUpload } from '@/lib/uploads/security-adapter';

export const UPLOAD_BUCKETS = {
  QUARANTINE: 'user-uploads-quarantine',
  PRIVATE: 'user-uploads-private',
  PUBLIC: 'user-uploads',
} as const;

export const UPLOAD_KINDS = {
  AVATAR: 'avatar',
  COVER: 'cover',
  PROOF: 'proof',
  CERTIFICATE: 'certificate',
  ARTIFACT: 'artifact',
  DOCUMENT: 'document',
} as const;

type UploadKind = (typeof UPLOAD_KINDS)[keyof typeof UPLOAD_KINDS];

type UploadOwner = {
  ownerType: string;
  ownerId: string;
  sourceSurface: string;
  uploadKind: UploadKind;
  attachedSubjectType?: string | null;
  attachedSubjectId?: string | null;
};

type UploadedFileRow = {
  id: string;
  owner_type: string;
  upload_kind: string;
  lifecycle_state: string;
  safety_status: string;
  safety_reason: string | null;
  original_filename?: string;
  original_filename_sensitive?: boolean;
  sanitized_filename?: string;
  detected_mime?: string | null;
  metadata_status: string;
  safe_for_public?: boolean;
  attach_status: string;
  public_bucket: string | null;
  public_path: string | null;
  quarantine_bucket: string | null;
  quarantine_path: string | null;
  durable_bucket: string | null;
  durable_path: string | null;
  owner_id: string;
  size_bytes?: number;
  proof_pack_id?: string | null;
  metadata?: Record<string, unknown> | null;
};

export type { UploadedFileRow };

type UploadLifecycleResult = {
  uploadedFileId: string;
  status: 'ready' | 'manual_review' | 'rejected';
  url: string | null;
  storagePath: string | null;
  safetyReason: string | null;
  detectedMime: string | null;
  artifactDisplayName: string;
};

const MAX_SIZE_BYTES_BY_KIND: Record<UploadKind, number> = {
  avatar: 5 * 1024 * 1024,
  cover: 10 * 1024 * 1024,
  proof: 25 * 1024 * 1024,
  certificate: 25 * 1024 * 1024,
  artifact: 25 * 1024 * 1024,
  document: 25 * 1024 * 1024,
};

const PUBLIC_IMAGE_MIMES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const PRIVATE_ALLOWED_MIMES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'text/plain',
  'text/markdown',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);
const OFFICE_DOCUMENT_MIMES = new Set([
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);
const EVIDENCE_UPLOAD_KINDS = new Set<UploadKind>([
  UPLOAD_KINDS.PROOF,
  UPLOAD_KINDS.CERTIFICATE,
  UPLOAD_KINDS.ARTIFACT,
  UPLOAD_KINDS.DOCUMENT,
]);
export const MAX_PROOF_PACK_FILES = 10;
export const MAX_PROOF_PACK_AGGREGATE_BYTES = 100 * 1024 * 1024;

function resolveUploadQueueActor(context: UploadOwner) {
  if (context.ownerType === 'individual_profile') {
    return {
      actorType: 'candidate' as const,
      actorId: context.ownerId,
    };
  }

  if (context.ownerType === 'organization') {
    return {
      actorType: 'organization_member' as const,
      actorId: null,
    };
  }

  return {
    actorType: 'system' as const,
    actorId: null,
  };
}

function sha256Buffer(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

function detectMimeFromBuffer(buffer: Buffer, declaredMime: string | null): string | null {
  if (buffer.length >= 5 && buffer.subarray(0, 5).toString('utf8') === '%PDF-') {
    return 'application/pdf';
  }

  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return 'image/png';
  }

  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }

  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buffer.subarray(8, 12).toString('ascii') === 'WEBP'
  ) {
    return 'image/webp';
  }

  if (
    buffer.length >= 4 &&
    buffer[0] === 0x50 &&
    buffer[1] === 0x4b &&
    buffer[2] === 0x03 &&
    buffer[3] === 0x04 &&
    declaredMime &&
    OFFICE_DOCUMENT_MIMES.has(declaredMime)
  ) {
    return declaredMime;
  }

  if (looksLikeTextBuffer(buffer)) {
    return 'text/plain';
  }

  return null;
}

function looksLikeTextBuffer(buffer: Buffer): boolean {
  if (buffer.length === 0) {
    return true;
  }

  let controlBytes = 0;
  for (const byte of buffer.subarray(0, Math.min(buffer.length, 4096))) {
    const allowedControl = byte === 0x09 || byte === 0x0a || byte === 0x0d;
    if (byte === 0x00) {
      return false;
    }
    if (byte < 0x20 && !allowedControl) {
      controlBytes += 1;
      if (controlBytes > 4) {
        return false;
      }
    }
  }

  return true;
}

function normalizeDetectedMime(declaredMime: string | null, detectedMime: string | null) {
  if (detectedMime !== 'text/plain') {
    return detectedMime;
  }

  return declaredMime === 'text/markdown' ? 'text/markdown' : detectedMime;
}

function validateMimeForKind(
  uploadKind: UploadKind,
  declaredMime: string | null,
  detectedMime: string | null
): { ok: boolean; safetyReason: string | null; promotePublic: boolean } {
  if (!detectedMime) {
    return { ok: false, safetyReason: 'unknown_file_signature', promotePublic: false };
  }

  const normalizedDeclared = declaredMime?.trim().toLowerCase() ?? null;

  if (normalizedDeclared && normalizedDeclared !== detectedMime) {
    return { ok: false, safetyReason: 'mime_signature_mismatch', promotePublic: false };
  }

  if (uploadKind === UPLOAD_KINDS.AVATAR || uploadKind === UPLOAD_KINDS.COVER) {
    if (!PUBLIC_IMAGE_MIMES.has(detectedMime)) {
      return { ok: false, safetyReason: 'public_image_type_required', promotePublic: false };
    }
    return { ok: true, safetyReason: null, promotePublic: true };
  }

  if (!PRIVATE_ALLOWED_MIMES.has(detectedMime)) {
    return { ok: false, safetyReason: 'unsupported_private_file_type', promotePublic: false };
  }

  return { ok: true, safetyReason: null, promotePublic: false };
}

export async function recordUploadEvent(
  uploadedFileId: string,
  eventType: string,
  metadata?: Record<string, unknown>,
  executor: { execute: typeof db.execute } = db
) {
  const allowedEventType =
    eventType === 'scan_passed'
      ? 'scan_clean'
      : eventType === 'metadata_extracted' ||
          eventType === 'sensitivity_classified' ||
          eventType === 'attachable' ||
          eventType === 'attached'
        ? 'validated'
        : eventType === 'privacy_review_required'
          ? 'attach_blocked'
          : eventType;
  const normalizedMetadata =
    allowedEventType === eventType
      ? (metadata ?? {})
      : { ...(metadata ?? {}), originalEventType: eventType };

  await executor.execute(sql`
    INSERT INTO uploaded_file_events (uploaded_file_id, event_type, metadata)
    VALUES (${uploadedFileId}, ${allowedEventType}, ${JSON.stringify(normalizedMetadata)}::jsonb)
  `);
}

async function recordUploadDeletionAudit(input: {
  actorId: string | null;
  targetId: string;
  targetType?: string;
  outcome: 'requested' | 'denied' | 'failed' | 'succeeded';
  reason?: string;
  row?: UploadedFileRow | null;
  requestedVia: 'uploaded_file_id' | 'storage_path' | 'system_cleanup';
}) {
  const row = input.row;
  const metadata = {
    outcome: input.outcome,
    reason: input.reason ?? null,
    requestedVia: input.requestedVia,
    uploadKind: row?.upload_kind ?? null,
    lifecycleState: row?.lifecycle_state ?? null,
    safetyStatus: row?.safety_status ?? null,
    attachStatus: row?.attach_status ?? null,
    ownerType: row?.owner_type ?? null,
    sensitiveFile:
      row?.original_filename_sensitive === true ||
      row?.safety_status === 'manual_review' ||
      Boolean(row?.safety_reason?.startsWith('privacy_review_required')) ||
      Boolean((row?.metadata as any)?.sensitivity?.sensitiveDocument),
  };

  await db.execute(sql`
    INSERT INTO audit_logs (actor_id, action, target_type, target_id, meta)
    VALUES (
      ${input.actorId ?? null}::uuid,
      ${`uploaded_file.delete_${input.outcome}`},
      ${input.targetType ?? 'uploaded_file'},
      ${input.targetId},
      ${JSON.stringify(metadata)}::jsonb
    )
  `);
}

async function loadUploadedFile(uploadedFileId: string): Promise<UploadedFileRow | null> {
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
    WHERE id = ${uploadedFileId}
    LIMIT 1
  `);

  const [row] = getRows<UploadedFileRow>(result as any);
  return row ?? null;
}

export async function recordUploadReviewAudit(
  input: {
    actorId: string;
    targetId: string;
    outcome: 'approved' | 'rejected' | 'denied' | 'failed';
    reason?: string | null;
    row?: UploadedFileRow | null;
    queueItemId?: string | null;
    priorState?: string | null;
    nextState?: string | null;
  },
  executor: { execute: typeof db.execute } = db
) {
  const row = input.row;
  const metadata = {
    outcome: input.outcome,
    reason: input.reason ?? null,
    queueItemId: input.queueItemId ?? null,
    priorState: input.priorState ?? row?.lifecycle_state ?? null,
    nextState: input.nextState ?? null,
    uploadKind: row?.upload_kind ?? null,
    lifecycleState: row?.lifecycle_state ?? null,
    safetyStatus: row?.safety_status ?? null,
    attachStatus: row?.attach_status ?? null,
    ownerType: row?.owner_type ?? null,
    safeForPublic: row?.safe_for_public ?? false,
    originalFilenameOwnerExportOnly: row?.original_filename_sensitive !== false,
  };

  await executor.execute(sql`
    INSERT INTO audit_logs (actor_id, action, target_type, target_id, meta)
    VALUES (
      ${input.actorId}::uuid,
      ${`uploaded_file.review_${input.outcome}`},
      'uploaded_file',
      ${input.targetId},
      ${JSON.stringify(metadata)}::jsonb
    )
  `);
}

async function loadUploadedFileByStoragePath(storagePath: string): Promise<UploadedFileRow | null> {
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
    WHERE deleted_at IS NULL
      AND (
        quarantine_path = ${storagePath}
        OR durable_path = ${storagePath}
        OR public_path = ${storagePath}
      )
    LIMIT 1
  `);

  const [row] = getRows<UploadedFileRow>(result as any);
  return row ?? null;
}

export async function getAttachableUploadedFile(uploadedFileId: string, ownerId: string) {
  const row = await loadUploadedFile(uploadedFileId);
  if (!row || row.owner_id !== ownerId) {
    return null;
  }

  const hasAttachableLifecycle = ['validated', 'ready_private', 'ready_public'].includes(
    row.lifecycle_state
  );

  if (
    !hasAttachableLifecycle ||
    !['clean', 'approved_after_manual_review'].includes(row.safety_status) ||
    row.metadata_status !== 'extracted' ||
    row.attach_status !== 'attachable'
  ) {
    return null;
  }

  return row;
}

export async function attachUploadedFile(
  uploadedFileId: string,
  ownerId: string,
  attachedSubjectType: string,
  attachedSubjectId: string
) {
  const row = await getAttachableUploadedFile(uploadedFileId, ownerId);
  if (!row) {
    return null;
  }

  if (attachedSubjectType === 'proof_pack') {
    const result = await db.execute(sql`
      SELECT
        COUNT(*)::int AS file_count,
        COALESCE(SUM(size_bytes), 0)::bigint AS total_size_bytes
      FROM uploaded_files
      WHERE proof_pack_id = ${attachedSubjectId}::uuid
        AND id <> ${uploadedFileId}::uuid
        AND deleted_at IS NULL
        AND attach_status IN ('attachable', 'attached')
    `);

    const [usage] = getRows<{ file_count: number; total_size_bytes: number }>(result as any);
    const nextFileCount = (usage?.file_count ?? 0) + 1;
    const nextAggregateBytes = (usage?.total_size_bytes ?? 0) + (row.size_bytes ?? 0);

    if (nextFileCount > MAX_PROOF_PACK_FILES) {
      throw new Error(`Proof record upload limit exceeds ${MAX_PROOF_PACK_FILES} files`);
    }

    if (nextAggregateBytes > MAX_PROOF_PACK_AGGREGATE_BYTES) {
      throw new Error('Proof record upload aggregate exceeds 100MB limit');
    }
  }

  await db.execute(sql`
    UPDATE uploaded_files
    SET
      attached_subject_type = ${attachedSubjectType},
      attached_subject_id = ${attachedSubjectId}::uuid,
      proof_pack_id = CASE
        WHEN ${attachedSubjectType} = 'proof_pack' THEN ${attachedSubjectId}::uuid
        ELSE proof_pack_id
      END,
      lifecycle_state = CASE
        WHEN public_path IS NOT NULL THEN 'ready_public'
        ELSE 'ready_private'
      END,
      attach_status = 'attached',
      attached_at = NOW(),
      updated_at = NOW()
    WHERE id = ${uploadedFileId}
  `);
  await recordUploadEvent(uploadedFileId, 'attached', {
    attachedSubjectType,
    attachedSubjectId,
  });

  return row;
}

export async function ingestUploadedFile(
  file: File,
  context: UploadOwner
): Promise<UploadLifecycleResult> {
  const declaredMime = file.type?.trim().toLowerCase() || null;
  const maxSize = MAX_SIZE_BYTES_BY_KIND[context.uploadKind];

  if (file.size > maxSize) {
    throw new Error(`File size exceeds ${(maxSize / (1024 * 1024)).toFixed(0)}MB limit`);
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const detectedMime = normalizeDetectedMime(
    declaredMime,
    detectMimeFromBuffer(buffer, declaredMime)
  );
  const validation = validateMimeForKind(context.uploadKind, declaredMime, detectedMime);
  const isEvidenceUpload = EVIDENCE_UPLOAD_KINDS.has(context.uploadKind);
  const sanitizedFilename = sanitizeUploadFilename(file.name);
  const artifactDisplayName = resolveArtifactDisplayName({
    sanitizedFilename,
    originalFilename: file.name,
    detectedMime,
    uploadKind: context.uploadKind,
  });
  const artifactReviewLabel = resolveArtifactDisplayNameForSurface(
    {
      sanitizedFilename,
      originalFilename: file.name,
      detectedMime,
      uploadKind: context.uploadKind,
    },
    'review'
  );
  const fileHash = sha256Buffer(buffer);
  const now = Date.now();
  const quarantinePath = `${context.ownerType}/${context.ownerId}/${context.uploadKind}/${now}-${sanitizedFilename}`;
  const admin = createAdminClient();

  const insertResult = await db.execute(sql`
    INSERT INTO uploaded_files (
      owner_type,
      owner_id,
      source_surface,
      upload_kind,
      original_filename,
      original_filename_sensitive,
      sanitized_filename,
      declared_mime,
      detected_mime,
      size_bytes,
      sha256,
      quarantine_bucket,
      quarantine_path,
      lifecycle_state,
      safety_status,
      attached_subject_type,
      attached_subject_id,
      metadata
    ) VALUES (
      ${context.ownerType},
      ${context.ownerId}::uuid,
      ${context.sourceSurface},
      ${context.uploadKind},
      ${file.name},
      true,
      ${sanitizedFilename},
      ${declaredMime},
      ${detectedMime},
      ${file.size},
      ${fileHash},
      ${UPLOAD_BUCKETS.QUARANTINE},
      ${quarantinePath},
      'received',
      'pending',
      ${context.attachedSubjectType ?? null},
      ${context.attachedSubjectId ?? null},
      ${JSON.stringify({ originalExtension: path.extname(file.name).toLowerCase() })}::jsonb
    )
    RETURNING id
  `);
  const [inserted] = getRows<{ id: string }>(insertResult as any);

  await recordUploadEvent(inserted.id, 'received', {
    uploadKind: context.uploadKind,
    declaredMime,
    detectedMime,
  });

  const uploadResult = await admin.storage
    .from(UPLOAD_BUCKETS.QUARANTINE)
    .upload(quarantinePath, buffer, {
      contentType: detectedMime ?? declaredMime ?? 'application/octet-stream',
      upsert: false,
      cacheControl: '0',
    });

  if (uploadResult.error) {
    await db.execute(sql`
      UPDATE uploaded_files
      SET
        lifecycle_state = 'rejected',
        safety_status = 'failed',
        safety_reason = ${uploadResult.error.message},
        metadata_status = 'failed',
        attach_status = 'rejected',
        updated_at = NOW()
      WHERE id = ${inserted.id}
    `);
    await recordUploadEvent(inserted.id, 'cleanup_failed', {
      stage: 'quarantine_upload',
      error: uploadResult.error.message,
    });
    throw new Error(uploadResult.error.message);
  }

  await db.execute(sql`
    UPDATE uploaded_files
    SET lifecycle_state = 'quarantined', updated_at = NOW()
    WHERE id = ${inserted.id}
  `);

  if (!validation.ok) {
    await admin.storage.from(UPLOAD_BUCKETS.QUARANTINE).remove([quarantinePath]);
    await db.execute(sql`
      UPDATE uploaded_files
      SET
        lifecycle_state = 'rejected',
        safety_status = 'rejected',
        safety_reason = ${validation.safetyReason},
        metadata_status = 'failed',
        attach_status = 'rejected',
        scan_engine = 'signature_v1',
        scan_completed_at = NOW(),
        deleted_at = NOW(),
        updated_at = NOW()
      WHERE id = ${inserted.id}
    `);
    await recordUploadEvent(inserted.id, 'scan_failed', {
      safetyReason: validation.safetyReason,
      detectedMime,
    });
    return {
      uploadedFileId: inserted.id,
      status: 'rejected',
      url: null,
      storagePath: null,
      safetyReason: validation.safetyReason,
      detectedMime,
      artifactDisplayName,
    };
  }

  await db.execute(sql`
    UPDATE uploaded_files
    SET
      lifecycle_state = 'validated',
      safety_status = 'clean',
      scan_engine = 'signature_v1',
      scan_completed_at = NOW(),
      updated_at = NOW()
    WHERE id = ${inserted.id}
  `);
  await recordUploadEvent(inserted.id, 'scan_passed', {
    detectedMime,
    promotePublic: validation.promotePublic,
  });

  const metadataFlags = collectUploadMetadataFlags(buffer, detectedMime);
  const privacyAssessment = assessEvidenceUploadPrivacy({
    originalFilename: file.name,
    metadataFlags,
    uploadKind: context.uploadKind,
  });

  await db.execute(sql`
    UPDATE uploaded_files
    SET
      lifecycle_state = 'validated',
      metadata_status = 'extracted',
      safe_for_public = ${validation.promotePublic && metadataFlags.publicSafeEligible},
      metadata_extracted_at = NOW(),
      metadata = COALESCE(metadata, '{}'::jsonb) || ${JSON.stringify({
        originalFilename: {
          stored: true,
          sensitive: true,
          ownerExportOnly: true,
        },
        metadataFlags,
        filenameAssessment: privacyAssessment.filename,
        privacyReview: {
          required: privacyAssessment.requiresReview,
          reasons: privacyAssessment.reasons,
        },
        surfaceLabels: {
          owner: resolveArtifactDisplayNameForSurface(
            {
              sanitizedFilename,
              originalFilename: file.name,
              detectedMime,
              uploadKind: context.uploadKind,
            },
            'owner'
          ),
          review: resolveArtifactDisplayNameForSurface(
            {
              sanitizedFilename,
              originalFilename: file.name,
              detectedMime,
              uploadKind: context.uploadKind,
            },
            'review'
          ),
          public: resolveArtifactDisplayNameForSurface(
            {
              sanitizedFilename,
              originalFilename: file.name,
              detectedMime,
              uploadKind: context.uploadKind,
            },
            'public'
          ),
        },
        sensitivity: privacyAssessment.sensitivity,
      })}::jsonb,
      updated_at = NOW()
    WHERE id = ${inserted.id}
  `);
  await recordUploadEvent(inserted.id, 'metadata_extracted', {
    metadataFlags,
    filenameAssessment: privacyAssessment.filename,
  });

  if (privacyAssessment.sensitivity.sensitiveDocument) {
    await recordUploadEvent(inserted.id, 'sensitivity_classified', {
      sensitivityReason: privacyAssessment.sensitivity.sensitivityReason,
      recommendedVisibility: privacyAssessment.sensitivity.recommendedVisibility,
      recommendedRevealGate: privacyAssessment.sensitivity.recommendedRevealGate,
    });
  }

  const securityReview = await scanAndPrepareUpload({
    metadataFlags,
    isEvidenceUpload,
    promotePublic: validation.promotePublic,
  });
  const securityReviewReasons = securityReview.reviewReasons.filter(
    (reason) => !privacyAssessment.reasons.includes(reason)
  );
  const combinedReviewReasons = [...privacyAssessment.reasons, ...securityReviewReasons];
  const combinedSafetyReason =
    combinedReviewReasons.length > 0
      ? `privacy_review_required:${combinedReviewReasons.join(',')}`
      : null;

  await db.execute(sql`
    UPDATE uploaded_files
    SET
      scan_engine = ${securityReview.scannerEngine},
      scan_completed_at = CASE
        WHEN ${securityReview.malwareScanStatus} = 'clean' THEN NOW()
        ELSE NULL
      END,
      metadata = COALESCE(metadata, '{}'::jsonb) || ${JSON.stringify({
        securityAdapter: securityReview,
      })}::jsonb,
      updated_at = NOW()
    WHERE id = ${inserted.id}
  `);

  if (isEvidenceUpload && combinedReviewReasons.length > 0) {
    await db.execute(sql`
      UPDATE uploaded_files
      SET
        lifecycle_state = 'quarantined',
        safety_status = 'manual_review',
        safety_reason = ${combinedSafetyReason},
        attach_status = 'pending',
        safe_for_public = false,
        updated_at = NOW()
      WHERE id = ${inserted.id}
    `);
    await recordUploadEvent(inserted.id, 'privacy_review_required', {
      reasons: combinedReviewReasons,
      metadataFlags,
      filenameAssessment: privacyAssessment.filename,
      securityAdapter: securityReview,
    });
    const queueActor = resolveUploadQueueActor(context);

    await ensureInternalOpsQueueItem({
      queueType: 'correction_revocation',
      linkedEntityType: 'uploaded_file',
      linkedEntityId: inserted.id,
      summary:
        'Risky evidence upload held for privacy-safe review before it can enter the proof record flow.',
      priority: 'high',
      actorType: queueActor.actorType,
      actorId: queueActor.actorId,
      metadata: {
        uploadKind: context.uploadKind,
        sourceSurface: context.sourceSurface,
        filenameReviewLabel: artifactReviewLabel,
        reviewReasons: combinedReviewReasons,
        safetyReason: combinedSafetyReason,
        sensitivityReason: privacyAssessment.sensitivity.sensitivityReason,
        recommendedVisibility: privacyAssessment.sensitivity.recommendedVisibility,
        recommendedRevealGate: privacyAssessment.sensitivity.recommendedRevealGate,
      },
    });

    return {
      uploadedFileId: inserted.id,
      status: 'manual_review',
      url: null,
      storagePath: null,
      safetyReason: combinedSafetyReason,
      detectedMime,
      artifactDisplayName,
    };
  }

  if (validation.promotePublic && !securityReview.safeForPublic) {
    await admin.storage.from(UPLOAD_BUCKETS.QUARANTINE).remove([quarantinePath]);
    await db.execute(sql`
      UPDATE uploaded_files
      SET
        lifecycle_state = 'rejected',
        safety_status = 'rejected',
        safety_reason = ${combinedSafetyReason ?? 'metadata_not_public_safe'},
        metadata_status = 'extracted',
        attach_status = 'rejected',
        safe_for_public = false,
        deleted_at = NOW(),
        updated_at = NOW()
      WHERE id = ${inserted.id}
    `);
    await recordUploadEvent(inserted.id, 'privacy_review_required', {
      reasons: combinedReviewReasons,
      metadataFlags,
      securityAdapter: securityReview,
      uploadKind: context.uploadKind,
    });

    return {
      uploadedFileId: inserted.id,
      status: 'rejected',
      url: null,
      storagePath: null,
      safetyReason: combinedSafetyReason ?? 'metadata_not_public_safe',
      detectedMime,
      artifactDisplayName,
    };
  }

  if (isEvidenceUpload) {
    await db.execute(sql`
    UPDATE uploaded_files
    SET
        lifecycle_state = 'ready_private',
        attach_status = 'attachable',
        safe_for_public = false,
        updated_at = NOW()
      WHERE id = ${inserted.id}
    `);
    await recordUploadEvent(inserted.id, 'attachable', {
      safeForPublic: validation.promotePublic && metadataFlags.publicSafeEligible,
    });

    return {
      uploadedFileId: inserted.id,
      status: 'ready',
      url: null,
      storagePath: null,
      safetyReason: null,
      detectedMime,
      artifactDisplayName,
    };
  }

  await recordUploadEvent(inserted.id, 'promotion_started', {
    promotePublic: validation.promotePublic,
  });

  const destinationBucket = validation.promotePublic
    ? UPLOAD_BUCKETS.PUBLIC
    : UPLOAD_BUCKETS.PRIVATE;
  const destinationFolder =
    context.uploadKind === UPLOAD_KINDS.AVATAR || context.uploadKind === UPLOAD_KINDS.COVER
      ? `${context.uploadKind}s`
      : `${context.uploadKind}s`;
  const destinationPath = `${destinationFolder}/${context.ownerId}/${now}-${sanitizedFilename}`;

  const promotionResult = await admin.storage
    .from(destinationBucket)
    .upload(destinationPath, buffer, {
      contentType: detectedMime ?? declaredMime ?? 'application/octet-stream',
      upsert: false,
      cacheControl: validation.promotePublic ? '3600' : '0',
    });

  if (promotionResult.error) {
    await db.execute(sql`
      UPDATE uploaded_files
      SET
        lifecycle_state = 'rejected',
        safety_status = 'failed',
        safety_reason = ${promotionResult.error.message},
        metadata_status = 'failed',
        attach_status = 'rejected',
        updated_at = NOW()
      WHERE id = ${inserted.id}
    `);
    await recordUploadEvent(inserted.id, 'cleanup_failed', {
      stage: 'promotion_upload',
      error: promotionResult.error.message,
    });
    throw new Error(promotionResult.error.message);
  }

  await admin.storage.from(UPLOAD_BUCKETS.QUARANTINE).remove([quarantinePath]);

  await db.execute(sql`
    UPDATE uploaded_files
    SET
      durable_bucket = ${validation.promotePublic ? null : destinationBucket},
      durable_path = ${validation.promotePublic ? null : destinationPath},
      public_bucket = ${validation.promotePublic ? destinationBucket : null},
      public_path = ${validation.promotePublic ? destinationPath : null},
      lifecycle_state = ${validation.promotePublic ? 'ready_public' : 'ready_private'},
      promoted_at = NOW(),
      attach_status = 'attachable',
      safe_for_public = ${securityReview.safeForPublic},
      updated_at = NOW()
    WHERE id = ${inserted.id}
  `);

  await recordUploadEvent(
    inserted.id,
    validation.promotePublic ? 'promoted_public' : 'promoted_private',
    {
      destinationBucket,
      destinationPath,
    }
  );

  const publicUrl = validation.promotePublic
    ? admin.storage.from(destinationBucket).getPublicUrl(destinationPath).data.publicUrl
    : null;

  return {
    uploadedFileId: inserted.id,
    status: 'ready',
    url: publicUrl,
    storagePath: destinationPath,
    safetyReason: null,
    detectedMime,
    artifactDisplayName,
  };
}

export async function deleteUploadedFile(
  uploadedFileId: string,
  ownerId?: string,
  requestedVia: 'uploaded_file_id' | 'storage_path' | 'system_cleanup' = ownerId
    ? 'uploaded_file_id'
    : 'system_cleanup'
) {
  const row = await loadUploadedFile(uploadedFileId);
  if (!row) {
    if (ownerId) {
      await recordUploadDeletionAudit({
        actorId: ownerId,
        targetId: uploadedFileId,
        outcome: 'denied',
        reason: 'missing_uploaded_file_row',
        requestedVia,
      });
    }
    return false;
  }

  if (ownerId && row.owner_id !== ownerId) {
    await recordUploadDeletionAudit({
      actorId: ownerId,
      targetId: row.id,
      outcome: 'denied',
      reason: 'owner_mismatch',
      row,
      requestedVia,
    });
    return false;
  }

  await recordUploadDeletionAudit({
    actorId: ownerId ?? null,
    targetId: row.id,
    outcome: 'requested',
    row,
    requestedVia,
  });

  const admin = createAdminClient();
  const paths: Array<{ bucket: string | null; path: string | null }> = [
    { bucket: row.quarantine_bucket, path: row.quarantine_path },
    { bucket: row.public_bucket, path: row.public_path },
    { bucket: row.durable_bucket, path: row.durable_path },
  ];

  await db.execute(sql`
    UPDATE uploaded_files
    SET
      lifecycle_state = 'delete_pending',
      delete_requested_at = NOW(),
      updated_at = NOW()
    WHERE id = ${uploadedFileId}
  `);

  for (const candidate of paths) {
    if (!candidate.bucket || !candidate.path) {
      continue;
    }
    const removeResult = await admin.storage.from(candidate.bucket).remove([candidate.path]);
    if (removeResult.error) {
      await recordUploadDeletionAudit({
        actorId: ownerId ?? null,
        targetId: row.id,
        outcome: 'failed',
        reason: 'storage_remove_failed',
        row,
        requestedVia,
      });
      await db.execute(sql`
        UPDATE uploaded_files
        SET
          lifecycle_state = 'delete_pending',
          safety_reason = ${removeResult.error.message},
          updated_at = NOW()
        WHERE id = ${uploadedFileId}
      `);
      return false;
    }
  }

  await recordUploadEvent(uploadedFileId, 'deleted');
  await recordUploadDeletionAudit({
    actorId: ownerId ?? null,
    targetId: row.id,
    outcome: 'succeeded',
    row,
    requestedVia,
  });
  await db.execute(sql`
    DELETE FROM uploaded_files
    WHERE id = ${uploadedFileId}
      AND (${ownerId ?? null}::uuid IS NULL OR owner_id = ${ownerId ?? null}::uuid)
  `);

  return true;
}

export async function deleteUploadedFileByOwnedStoragePath(storagePath: string, ownerId: string) {
  const row = await loadUploadedFileByStoragePath(storagePath);
  if (!row) {
    await recordUploadDeletionAudit({
      actorId: ownerId,
      targetType: 'storage_path',
      targetId: crypto.createHash('sha256').update(storagePath).digest('hex'),
      outcome: 'denied',
      reason: 'missing_owned_uploaded_file_row',
      requestedVia: 'storage_path',
    });
    return false;
  }

  return deleteUploadedFile(row.id, ownerId, 'storage_path');
}

export async function getUploadedFileStatus(uploadedFileId: string, ownerId: string) {
  const row = await loadUploadedFile(uploadedFileId);
  if (!row || row.owner_id !== ownerId) {
    return null;
  }

  return {
    artifactDisplayName: resolveArtifactDisplayName({
      sanitizedFilename: row.sanitized_filename ?? null,
      originalFilename: row.original_filename ?? null,
      detectedMime: row.detected_mime ?? null,
      uploadKind: row.upload_kind,
    }),
    id: row.id,
    status: isUploadHeldForPrivacyReview({
      safetyStatus: row.safety_status,
      safetyReason: row.safety_reason,
    })
      ? 'manual_review'
      : row.lifecycle_state,
    lifecycleState: row.lifecycle_state,
    safetyStatus: row.safety_status,
    safetyReason: row.safety_reason,
    metadataStatus: row.metadata_status,
    attachStatus: row.attach_status,
    privacyReviewRequired: isUploadHeldForPrivacyReview({
      safetyStatus: row.safety_status,
      safetyReason: row.safety_reason,
    }),
    privacyReviewReasons: parseUploadPrivacyReviewReasons(row.safety_reason),
  };
}
