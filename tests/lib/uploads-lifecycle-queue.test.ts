import { beforeEach, describe, expect, it, vi } from 'vitest';

const executeMock = vi.fn();
const uploadMock = vi.fn();
const removeMock = vi.fn();
const downloadMock = vi.fn();
const ensureInternalOpsQueueItemMock = vi.fn();

vi.mock('@/db', () => ({
  db: {
    execute: (...args: any[]) => executeMock(...args),
  },
}));

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    storage: {
      from: () => ({
        upload: (...args: any[]) => uploadMock(...args),
        remove: (...args: any[]) => removeMock(...args),
        download: (...args: any[]) => downloadMock(...args),
      }),
    },
  }),
}));

vi.mock('@/lib/internal-ops/queue', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/internal-ops/queue')>();

  return {
    ...actual,
    ensureInternalOpsQueueItem: (...args: any[]) => ensureInternalOpsQueueItemMock(...args),
  };
});

import {
  attachUploadedFile,
  deleteUploadedFile,
  deleteUploadedFileByOwnedStoragePath,
  ingestUploadedFile,
  UPLOAD_KINDS,
} from '@/lib/uploads/lifecycle';
import { reviewUploadedFileQueueItem } from '@/lib/uploads/review';

function renderSql(statement: any) {
  return (
    statement?.queryChunks
      ?.map((chunk: any) => {
        if (Array.isArray(chunk?.value)) return chunk.value.join('');
        if (typeof chunk === 'string') return chunk;
        return String(chunk);
      })
      .join('') ?? String(statement)
  );
}

describe('upload lifecycle internal ops queue handoff', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    executeMock.mockReset();
    uploadMock.mockResolvedValue({ error: null });
    removeMock.mockResolvedValue({ error: null });
    downloadMock.mockResolvedValue({
      data: Buffer.from('%PDF- approved proof'),
      error: null,
    });
    ensureInternalOpsQueueItemMock.mockResolvedValue({
      id: 'queue-1',
    });
    executeMock.mockImplementationOnce(async () => [{ id: 'upload-1' }]).mockResolvedValue({});
  });

  it('creates a correction queue item when an evidence upload is held for privacy review', async () => {
    const buffer = Buffer.from('%PDF- Exif GPS /Author xmp:meta');
    const file = {
      name: '../risk?.pdf',
      type: 'application/pdf',
      size: buffer.length,
      arrayBuffer: async () => buffer,
    } as File;

    const result = await ingestUploadedFile(file, {
      ownerType: 'individual_profile',
      ownerId: '11111111-1111-1111-1111-111111111111',
      sourceSurface: 'document_upload',
      uploadKind: UPLOAD_KINDS.DOCUMENT,
    });

    expect(result.status).toBe('manual_review');
    expect(result.uploadedFileId).toBe('upload-1');
    expect(ensureInternalOpsQueueItemMock).toHaveBeenCalledWith(
      expect.objectContaining({
        queueType: 'correction_revocation',
        linkedEntityType: 'uploaded_file',
        linkedEntityId: 'upload-1',
        actorType: 'candidate',
        actorId: '11111111-1111-1111-1111-111111111111',
        metadata: expect.objectContaining({
          filenameReviewLabel: 'Uploaded PDF document',
          uploadKind: 'document',
          safetyReason: expect.stringContaining('privacy_review_required:'),
          reviewReasons: expect.arrayContaining([
            'filename_sanitized',
            'metadata_exif',
            'malware_scanner_unavailable',
            'metadata_stripping_unavailable',
          ]),
        }),
      })
    );
    const queueMetadata = ensureInternalOpsQueueItemMock.mock.calls[0]?.[0]?.metadata;
    expect(queueMetadata).not.toHaveProperty('artifactDisplayName');
    expect(queueMetadata).not.toHaveProperty('sanitizedFilename');
  });

  it('rejects public image uploads when metadata cannot be stripped', async () => {
    const buffer = Buffer.from([0xff, 0xd8, 0xff, ...Buffer.from('Exif GPSLatitude')]);
    const file = {
      name: 'profile.jpg',
      type: 'image/jpeg',
      size: buffer.length,
      arrayBuffer: async () => buffer,
    } as File;

    const result = await ingestUploadedFile(file, {
      ownerType: 'individual_profile',
      ownerId: '11111111-1111-1111-1111-111111111111',
      sourceSurface: 'avatar_upload',
      uploadKind: UPLOAD_KINDS.AVATAR,
    });

    expect(result.status).toBe('rejected');
    expect(result.url).toBeNull();
    expect(result.storagePath).toBeNull();
    expect(result.safetyReason).toContain('metadata_exif');
    expect(result.safetyReason).toContain('metadata_stripping_unavailable');
    expect(removeMock).toHaveBeenCalledWith(
      expect.arrayContaining([expect.stringContaining('profile.jpg')])
    );
    expect(ensureInternalOpsQueueItemMock).not.toHaveBeenCalled();

    const joined = executeMock.mock.calls.map(([statement]) => renderSql(statement)).join('\n');
    expect(joined).toContain("lifecycle_state = 'rejected'");
    expect(joined).toContain('safe_for_public = false');
    expect(joined).not.toContain('promoted_public');
  });

  it('rejects public image uploads with metadata beyond the first 64 KiB', async () => {
    const buffer = Buffer.concat([
      Buffer.from([0xff, 0xd8, 0xff]),
      Buffer.alloc(70 * 1024, 0x20),
      Buffer.from('GPSLatitude'),
    ]);
    const file = {
      name: 'cover.jpg',
      type: 'image/jpeg',
      size: buffer.length,
      arrayBuffer: async () => buffer,
    } as File;

    const result = await ingestUploadedFile(file, {
      ownerType: 'individual_profile',
      ownerId: '11111111-1111-1111-1111-111111111111',
      sourceSurface: 'cover_upload',
      uploadKind: UPLOAD_KINDS.COVER,
    });

    expect(result.status).toBe('rejected');
    expect(result.url).toBeNull();
    expect(result.safetyReason).toContain('metadata_gps');
    expect(result.safetyReason).toContain('metadata_stripping_unavailable');
    expect(removeMock).toHaveBeenCalledWith(
      expect.arrayContaining([expect.stringContaining('cover.jpg')])
    );
  });

  it('rejects unsafe MIME mismatches and removes the quarantined object', async () => {
    const buffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const file = {
      name: 'claimed.pdf',
      type: 'application/pdf',
      size: buffer.length,
      arrayBuffer: async () => buffer,
    } as File;

    const result = await ingestUploadedFile(file, {
      ownerType: 'individual_profile',
      ownerId: '11111111-1111-1111-1111-111111111111',
      sourceSurface: 'document_upload',
      uploadKind: UPLOAD_KINDS.PROOF,
    });

    expect(result.status).toBe('rejected');
    expect(result.safetyReason).toBe('mime_signature_mismatch');
    expect(removeMock).toHaveBeenCalled();
    expect(ensureInternalOpsQueueItemMock).not.toHaveBeenCalled();
  });

  it('keeps otherwise clean evidence quarantined when the malware scanner is unavailable', async () => {
    const buffer = Buffer.from('%PDF- clean generated proof');
    const file = {
      name: 'clean-proof.pdf',
      type: 'application/pdf',
      size: buffer.length,
      arrayBuffer: async () => buffer,
    } as File;

    const result = await ingestUploadedFile(file, {
      ownerType: 'individual_profile',
      ownerId: '11111111-1111-1111-1111-111111111111',
      sourceSurface: 'document_upload',
      uploadKind: UPLOAD_KINDS.PROOF,
    });

    expect(result.status).toBe('manual_review');
    expect(result.storagePath).toBeNull();
    expect(result.safetyReason).toContain('malware_scanner_unavailable');

    const renderedStatements = executeMock.mock.calls.map(([statement]) => renderSql(statement));
    expect(renderedStatements.join('\n')).toContain("lifecycle_state = 'validated'");
    expect(renderedStatements.join('\n')).toContain("lifecycle_state = 'quarantined'");
    expect(renderedStatements.join('\n')).not.toContain("lifecycle_state = 'scan_passed'");
    expect(renderedStatements.join('\n')).not.toContain("lifecycle_state = 'attachable'");

    const uploadEventTypes = executeMock.mock.calls
      .filter(([statement]) => renderSql(statement).includes('INSERT INTO uploaded_file_events'))
      .map(([statement]) => renderSql(statement));
    expect(uploadEventTypes).toHaveLength(4);
    expect(uploadEventTypes[0]).toContain('received');
    expect(uploadEventTypes[1]).toContain('scan_clean');
    expect(uploadEventTypes[2]).toContain('validated');
    expect(uploadEventTypes[3]).toContain('attach_blocked');
  });

  it('attaches clean evidence without writing lifecycle states outside the database contract', async () => {
    executeMock.mockReset();
    executeMock
      .mockImplementationOnce(async () => [
        {
          id: 'upload-1',
          owner_id: '11111111-1111-1111-1111-111111111111',
          lifecycle_state: 'ready_private',
          safety_status: 'clean',
          metadata_status: 'extracted',
          attach_status: 'attachable',
          size_bytes: 123,
          public_path: null,
          durable_path: null,
          quarantine_path: 'individual_profile/user/proof/clean-proof.pdf',
        },
      ])
      .mockResolvedValue({});

    const row = await attachUploadedFile(
      'upload-1',
      '11111111-1111-1111-1111-111111111111',
      'skill_proof',
      '22222222-2222-2222-2222-222222222222'
    );

    expect(row).toEqual(
      expect.objectContaining({
        id: 'upload-1',
        lifecycle_state: 'ready_private',
      })
    );

    const renderedStatements = executeMock.mock.calls.map(([statement]) => renderSql(statement));
    expect(renderedStatements.join('\n')).toContain("ELSE 'ready_private'");
    expect(renderedStatements.join('\n')).toContain("attach_status = 'attached'");
    expect(renderedStatements.join('\n')).not.toContain("lifecycle_state = 'attached'");

    const uploadEventTypes = executeMock.mock.calls
      .filter(([statement]) => renderSql(statement).includes('INSERT INTO uploaded_file_events'))
      .map(([statement]) => renderSql(statement));
    expect(uploadEventTypes).toHaveLength(1);
    expect(uploadEventTypes[0]).toContain('validated');
  });

  it('approves a quarantined uploaded-file queue item into private attachable evidence', async () => {
    executeMock.mockReset();
    const queueId = '33333333-3333-4333-8333-333333333333';
    const uploadId = '44444444-4444-4444-8444-444444444444';
    const uploadRow = {
      id: uploadId,
      owner_type: 'individual_profile',
      upload_kind: 'proof',
      owner_id: '11111111-1111-1111-1111-111111111111',
      lifecycle_state: 'quarantined',
      safety_status: 'manual_review',
      safety_reason: 'privacy_review_required:malware_scanner_unavailable',
      metadata_status: 'extracted',
      attach_status: 'pending',
      original_filename: 'Jane Doe Resume.pdf',
      original_filename_sensitive: true,
      sanitized_filename: 'Jane_Doe_Resume.pdf',
      detected_mime: 'application/pdf',
      safe_for_public: false,
      quarantine_bucket: 'user-uploads-quarantine',
      quarantine_path: 'individual_profile/user/proof/Jane_Doe_Resume.pdf',
      public_bucket: null,
      public_path: null,
      durable_bucket: null,
      durable_path: null,
      metadata: {},
    };
    const queueRow = {
      id: queueId,
      queue_type: 'correction_revocation',
      status: 'in_progress',
      priority: 'high',
      linked_entity_type: 'uploaded_file',
      linked_entity_id: uploadId,
      summary: 'Risky evidence upload held for privacy-safe review.',
      metadata: { filenameReviewLabel: 'Uploaded PDF document' },
      created_at: new Date('2026-03-21T10:00:00.000Z'),
      updated_at: new Date('2026-03-21T11:00:00.000Z'),
      resolved_at: null,
    };

    executeMock.mockImplementation(async (statement: any) => {
      const rendered = renderSql(statement);
      if (rendered.includes('SELECT linked_entity_type, linked_entity_id')) {
        return [{ linked_entity_type: 'uploaded_file', linked_entity_id: uploadId }];
      }
      if (rendered.includes('FROM uploaded_files') && rendered.includes('LIMIT 1')) {
        return [uploadRow];
      }
      if (rendered.includes('FROM internal_ops_queue_items') && rendered.includes('FOR UPDATE')) {
        return [queueRow];
      }
      if (rendered.includes('FROM uploaded_files') && rendered.includes('FOR UPDATE')) {
        return [uploadRow];
      }
      if (rendered.includes('FROM internal_ops_queue_items') && rendered.includes('LIMIT 1')) {
        return [
          {
            ...queueRow,
            status: 'resolved',
            metadata: {
              ...queueRow.metadata,
              uploadReviewAction: 'approved',
              uploadedFileLifecycleState: 'ready_private',
              uploadedFileAttachStatus: 'attachable',
            },
            resolved_at: new Date('2026-03-21T12:00:00.000Z'),
          },
        ];
      }
      return {};
    });

    const result = await reviewUploadedFileQueueItem({
      queueItemId: queueId,
      action: 'approve',
      actorId: '99999999-9999-4999-8999-999999999999',
      note: 'Audited internally and safe for private evidence attachment.',
    });

    expect(result.current.status).toBe('resolved');
    expect(uploadMock).toHaveBeenCalledWith(
      expect.stringContaining(`${uploadId}.pdf`),
      expect.any(Buffer),
      expect.objectContaining({
        contentType: 'application/pdf',
        upsert: false,
      })
    );
    expect(removeMock).toHaveBeenCalledWith(['individual_profile/user/proof/Jane_Doe_Resume.pdf']);

    const renderedStatements = executeMock.mock.calls.map(([statement]) => renderSql(statement));
    const joined = renderedStatements.join('\n');
    expect(joined).toContain("lifecycle_state = 'ready_private'");
    expect(joined).toContain("safety_status = 'approved_after_manual_review'");
    expect(joined).toContain("attach_status = 'attachable'");
    expect(joined).toContain('safe_for_public = FALSE');
    expect(joined).toContain('original_filename_sensitive = TRUE');
    expect(joined).toContain('manual_review_approved');
    expect(joined).toContain('uploaded_file.review_approved');
    expect(joined).toContain('UPDATE internal_ops_queue_items');
  });

  it('rejects a quarantined uploaded-file queue item and prevents attachment', async () => {
    executeMock.mockReset();
    const queueId = '33333333-3333-4333-8333-333333333333';
    const uploadId = '44444444-4444-4444-8444-444444444444';
    const uploadRow = {
      id: uploadId,
      owner_type: 'individual_profile',
      upload_kind: 'proof',
      owner_id: '11111111-1111-1111-1111-111111111111',
      lifecycle_state: 'quarantined',
      safety_status: 'manual_review',
      safety_reason: 'privacy_review_required:malware_scanner_unavailable',
      metadata_status: 'extracted',
      attach_status: 'pending',
      original_filename_sensitive: true,
      sanitized_filename: 'proof.pdf',
      detected_mime: 'application/pdf',
      safe_for_public: false,
      quarantine_bucket: 'user-uploads-quarantine',
      quarantine_path: 'individual_profile/user/proof/proof.pdf',
      public_bucket: null,
      public_path: null,
      durable_bucket: null,
      durable_path: null,
      metadata: {},
    };
    const queueRow = {
      id: queueId,
      queue_type: 'correction_revocation',
      status: 'in_progress',
      priority: 'high',
      linked_entity_type: 'uploaded_file',
      linked_entity_id: uploadId,
      summary: 'Risky evidence upload held for privacy-safe review.',
      metadata: {},
      created_at: new Date('2026-03-21T10:00:00.000Z'),
      updated_at: new Date('2026-03-21T11:00:00.000Z'),
      resolved_at: null,
    };

    executeMock.mockImplementation(async (statement: any) => {
      const rendered = renderSql(statement);
      if (rendered.includes('SELECT linked_entity_type, linked_entity_id')) {
        return [{ linked_entity_type: 'uploaded_file', linked_entity_id: uploadId }];
      }
      if (rendered.includes('FROM uploaded_files') && rendered.includes('LIMIT 1')) {
        return [uploadRow];
      }
      if (rendered.includes('FROM internal_ops_queue_items') && rendered.includes('FOR UPDATE')) {
        return [queueRow];
      }
      if (rendered.includes('FROM uploaded_files') && rendered.includes('FOR UPDATE')) {
        return [uploadRow];
      }
      if (rendered.includes('FROM internal_ops_queue_items') && rendered.includes('LIMIT 1')) {
        return [
          {
            ...queueRow,
            status: 'resolved',
            metadata: {
              uploadReviewAction: 'rejected',
              uploadedFileLifecycleState: 'rejected',
              uploadedFileAttachStatus: 'rejected',
            },
            resolved_at: new Date('2026-03-21T12:00:00.000Z'),
          },
        ];
      }
      return {};
    });

    const result = await reviewUploadedFileQueueItem({
      queueItemId: queueId,
      action: 'reject',
      actorId: '99999999-9999-4999-8999-999999999999',
      note: 'Not safe for the Proof Pack corridor.',
    });

    expect(result.current.status).toBe('resolved');
    expect(uploadMock).not.toHaveBeenCalled();
    expect(removeMock).not.toHaveBeenCalled();

    const renderedStatements = executeMock.mock.calls.map(([statement]) => renderSql(statement));
    const joined = renderedStatements.join('\n');
    expect(joined).toContain("lifecycle_state = 'rejected'");
    expect(joined).toContain("attach_status = 'rejected'");
    expect(joined).toContain('manual_review_rejected');
    expect(joined).toContain('uploaded_file.review_rejected');

    executeMock.mockReset();
    executeMock.mockImplementationOnce(async () => [
      {
        ...uploadRow,
        lifecycle_state: 'rejected',
        safety_status: 'rejected',
        attach_status: 'rejected',
      },
    ]);

    await expect(
      attachUploadedFile(
        uploadId,
        '11111111-1111-1111-1111-111111111111',
        'proof_pack',
        '22222222-2222-2222-8222-222222222222'
      )
    ).resolves.toBeNull();
  });

  it('allows approved-after-manual-review uploads to attach to a Proof Pack', async () => {
    executeMock.mockReset();
    executeMock
      .mockImplementationOnce(async () => [
        {
          id: 'upload-1',
          owner_id: '11111111-1111-1111-1111-111111111111',
          lifecycle_state: 'ready_private',
          safety_status: 'approved_after_manual_review',
          metadata_status: 'extracted',
          attach_status: 'attachable',
          size_bytes: 123,
          public_path: null,
          durable_path: 'individual_profile/user/proof/upload-1.pdf',
          quarantine_path: null,
        },
      ])
      .mockImplementationOnce(async () => [{ file_count: 0, total_size_bytes: 0 }])
      .mockResolvedValue({});

    const row = await attachUploadedFile(
      'upload-1',
      '11111111-1111-1111-1111-111111111111',
      'proof_pack',
      '22222222-2222-2222-8222-222222222222'
    );

    expect(row).toEqual(
      expect.objectContaining({
        id: 'upload-1',
        safety_status: 'approved_after_manual_review',
      })
    );
    const renderedStatements = executeMock.mock.calls.map(([statement]) => renderSql(statement));
    expect(renderedStatements.join('\n')).toContain("attach_status = 'attached'");
  });

  it('deletes storage objects and hard-deletes the uploaded file through owner check', async () => {
    executeMock.mockReset();
    executeMock
      .mockImplementationOnce(async () => [
        {
          id: 'upload-1',
          owner_type: 'individual_profile',
          owner_id: '11111111-1111-1111-1111-111111111111',
          upload_kind: 'proof',
          lifecycle_state: 'ready_private',
          safety_status: 'clean',
          safety_reason: null,
          metadata_status: 'extracted',
          attach_status: 'attached',
          original_filename_sensitive: true,
          quarantine_bucket: 'user-uploads-quarantine',
          quarantine_path: 'individual_profile/user/proof/quarantine.pdf',
          public_bucket: null,
          public_path: null,
          durable_bucket: 'user-uploads-private',
          durable_path: 'individual_profile/user/proof/private.pdf',
          metadata: {},
        },
      ])
      .mockResolvedValue({});

    await expect(
      deleteUploadedFile('upload-1', '11111111-1111-1111-1111-111111111111')
    ).resolves.toBe(true);

    expect(removeMock).toHaveBeenCalledWith(['individual_profile/user/proof/quarantine.pdf']);
    expect(removeMock).toHaveBeenCalledWith(['individual_profile/user/proof/private.pdf']);
    const renderedStatements = executeMock.mock.calls.map(([statement]) => renderSql(statement));
    expect(renderedStatements.join('\n')).toContain('INSERT INTO audit_logs');
    expect(renderedStatements.join('\n')).toContain('uploaded_file.delete_requested');
    expect(renderedStatements.join('\n')).toContain('uploaded_file.delete_succeeded');
    expect(renderedStatements.join('\n')).toContain('DELETE FROM uploaded_files');
    expect(renderedStatements.join('\n')).toContain('owner_id =');
  });

  it('refuses delete when the uploaded file owner does not match', async () => {
    executeMock.mockReset();
    executeMock.mockImplementationOnce(async () => [
      {
        id: 'upload-1',
        owner_type: 'individual_profile',
        upload_kind: 'proof',
        owner_id: '22222222-2222-2222-2222-222222222222',
        lifecycle_state: 'ready_private',
        safety_status: 'clean',
        safety_reason: null,
        attach_status: 'attached',
        original_filename_sensitive: true,
        metadata: {},
      },
    ]);

    await expect(
      deleteUploadedFile('upload-1', '11111111-1111-1111-1111-111111111111')
    ).resolves.toBe(false);

    expect(removeMock).not.toHaveBeenCalled();
    const renderedStatements = executeMock.mock.calls.map(([statement]) => renderSql(statement));
    expect(renderedStatements.join('\n')).toContain('INSERT INTO audit_logs');
    expect(renderedStatements.join('\n')).toContain('uploaded_file.delete_denied');
    expect(executeMock).toHaveBeenCalledTimes(2);
  });

  it('denies forged storage paths even when the path contains the attacker id', async () => {
    executeMock.mockReset();
    executeMock
      .mockImplementationOnce(async () => [
        {
          id: 'upload-1',
          owner_type: 'individual_profile',
          upload_kind: 'proof',
          owner_id: '22222222-2222-2222-2222-222222222222',
          lifecycle_state: 'ready_private',
          safety_status: 'clean',
          safety_reason: null,
          metadata_status: 'extracted',
          attach_status: 'attached',
          original_filename_sensitive: true,
          quarantine_bucket: null,
          quarantine_path: null,
          public_bucket: null,
          public_path: null,
          durable_bucket: 'user-uploads-private',
          durable_path: 'individual_profile/11111111-1111-1111-1111-111111111111/proof/forged.pdf',
          metadata: {},
        },
      ])
      .mockImplementationOnce(async () => [
        {
          id: 'upload-1',
          owner_type: 'individual_profile',
          upload_kind: 'proof',
          owner_id: '22222222-2222-2222-2222-222222222222',
          lifecycle_state: 'ready_private',
          safety_status: 'clean',
          safety_reason: null,
          attach_status: 'attached',
          original_filename_sensitive: true,
          metadata: {},
        },
      ])
      .mockResolvedValue({});

    await expect(
      deleteUploadedFileByOwnedStoragePath(
        'individual_profile/11111111-1111-1111-1111-111111111111/proof/forged.pdf',
        '11111111-1111-1111-1111-111111111111'
      )
    ).resolves.toBe(false);

    expect(removeMock).not.toHaveBeenCalled();
    const renderedStatements = executeMock.mock.calls.map(([statement]) => renderSql(statement));
    expect(renderedStatements.join('\n')).toContain('uploaded_file.delete_denied');
    expect(renderedStatements.join('\n')).not.toContain('DELETE FROM uploaded_files');
  });

  it('denies deletion when the uploaded file row is missing', async () => {
    executeMock.mockReset();
    executeMock.mockImplementationOnce(async () => []).mockResolvedValue({});

    await expect(
      deleteUploadedFile('missing-upload', '11111111-1111-1111-1111-111111111111')
    ).resolves.toBe(false);

    expect(removeMock).not.toHaveBeenCalled();
    const renderedStatements = executeMock.mock.calls.map(([statement]) => renderSql(statement));
    expect(renderedStatements.join('\n')).toContain('uploaded_file.delete_denied');
    expect(renderedStatements.join('\n')).not.toContain('DELETE FROM uploaded_files');
  });
});
