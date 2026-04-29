import { beforeEach, describe, expect, it, vi } from 'vitest';

const executeMock = vi.fn();
const uploadMock = vi.fn();
const removeMock = vi.fn();
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
      }),
    },
  }),
}));

vi.mock('@/lib/internal-ops/queue', () => ({
  ensureInternalOpsQueueItem: (...args: any[]) => ensureInternalOpsQueueItemMock(...args),
}));

import {
  attachUploadedFile,
  deleteUploadedFile,
  deleteUploadedFileByOwnedStoragePath,
  ingestUploadedFile,
  UPLOAD_KINDS,
} from '@/lib/uploads/lifecycle';

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
          sanitizedFilename: 'risk_.pdf',
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
