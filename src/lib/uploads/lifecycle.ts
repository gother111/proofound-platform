import crypto from 'crypto';
import path from 'path';
import { sql } from 'drizzle-orm';

import { db } from '@/db';
import { getRows } from '@/lib/db/rows';
import { createAdminClient } from '@/lib/supabase/admin';

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
  lifecycle_state: string;
  safety_status: string;
  safety_reason: string | null;
  public_bucket: string | null;
  public_path: string | null;
  durable_bucket: string | null;
  durable_path: string | null;
  owner_id: string;
};

type UploadLifecycleResult = {
  uploadedFileId: string;
  status: 'ready' | 'rejected';
  url: string | null;
  storagePath: string | null;
  safetyReason: string | null;
  detectedMime: string | null;
};

const MAX_SIZE_BYTES_BY_KIND: Record<UploadKind, number> = {
  avatar: 5 * 1024 * 1024,
  cover: 10 * 1024 * 1024,
  proof: 10 * 1024 * 1024,
  certificate: 10 * 1024 * 1024,
  artifact: 10 * 1024 * 1024,
  document: 10 * 1024 * 1024,
};

const PUBLIC_IMAGE_MIMES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const PRIVATE_ALLOWED_MIMES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heif',
  'image/heic',
  'application/msword',
]);

function sanitizeFilename(fileName: string): string {
  const ext = path.extname(fileName).toLowerCase();
  const base =
    path
      .basename(fileName, ext)
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 80) || 'file';
  return `${base}${ext.slice(0, 10)}`;
}

function sha256Buffer(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

function detectMimeFromBuffer(buffer: Buffer): string | null {
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

  if (buffer.length >= 12 && buffer.subarray(4, 8).toString('ascii') === 'ftyp') {
    const brand = buffer.subarray(8, 12).toString('ascii').toLowerCase();
    if (['heic', 'heix', 'hevc', 'hevx'].includes(brand)) {
      return 'image/heic';
    }
    if (['mif1', 'msf1', 'heif'].includes(brand)) {
      return 'image/heif';
    }
  }

  if (
    buffer.length >= 8 &&
    buffer[0] === 0xd0 &&
    buffer[1] === 0xcf &&
    buffer[2] === 0x11 &&
    buffer[3] === 0xe0 &&
    buffer[4] === 0xa1 &&
    buffer[5] === 0xb1 &&
    buffer[6] === 0x1a &&
    buffer[7] === 0xe1
  ) {
    return 'application/msword';
  }

  return null;
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

async function recordUploadEvent(
  uploadedFileId: string,
  eventType: string,
  metadata?: Record<string, unknown>
) {
  await db.execute(sql`
    INSERT INTO uploaded_file_events (uploaded_file_id, event_type, metadata)
    VALUES (${uploadedFileId}, ${eventType}, ${JSON.stringify(metadata ?? {})}::jsonb)
  `);
}

async function loadUploadedFile(uploadedFileId: string): Promise<UploadedFileRow | null> {
  const result = await db.execute(sql`
    SELECT id, lifecycle_state, safety_status, safety_reason, public_bucket, public_path, durable_bucket, durable_path, owner_id
    FROM uploaded_files
    WHERE id = ${uploadedFileId}
    LIMIT 1
  `);

  const [row] = getRows<UploadedFileRow>(result as any);
  return row ?? null;
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
  const detectedMime = detectMimeFromBuffer(buffer);
  const validation = validateMimeForKind(context.uploadKind, declaredMime, detectedMime);
  const sanitizedFilename = sanitizeFilename(file.name);
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
    };
  }

  await recordUploadEvent(inserted.id, 'validated', {
    detectedMime,
    promotePublic: validation.promotePublic,
  });

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
  await recordUploadEvent(inserted.id, 'scan_clean', { detectedMime });
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
  };
}

export async function deleteUploadedFile(uploadedFileId: string) {
  const row = await loadUploadedFile(uploadedFileId);
  if (!row) {
    return false;
  }

  const admin = createAdminClient();
  const paths: Array<{ bucket: string | null; path: string | null }> = [
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
    await admin.storage.from(candidate.bucket).remove([candidate.path]);
  }

  await db.execute(sql`
    UPDATE uploaded_files
    SET
      lifecycle_state = 'deleted',
      deleted_at = NOW(),
      updated_at = NOW()
    WHERE id = ${uploadedFileId}
  `);
  await recordUploadEvent(uploadedFileId, 'deleted');

  return true;
}

export async function getUploadedFileStatus(uploadedFileId: string, ownerId: string) {
  const row = await loadUploadedFile(uploadedFileId);
  if (!row || row.owner_id !== ownerId) {
    return null;
  }

  return {
    id: row.id,
    status: row.lifecycle_state,
    safetyStatus: row.safety_status,
    safetyReason: row.safety_reason,
  };
}
