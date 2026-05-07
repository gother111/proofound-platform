import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  findFirst: vi.fn(),
  findMany: vi.fn(),
  update: vi.fn(),
  insert: vi.fn(),
}));

vi.mock('@/db', () => ({
  db: {
    query: {
      internalOpsQueueItems: {
        findFirst: mocks.findFirst,
        findMany: mocks.findMany,
      },
    },
    update: mocks.update,
    insert: mocks.insert,
  },
}));

vi.mock('@/db/schema', () => ({
  canonicalInternalOpsQueueEntityTypes: [
    'verification_request',
    'verification_bundle',
    'conversation',
    'decision',
    'engagement_verification',
    'match',
    'organization',
    'uploaded_file',
  ],
  canonicalInternalOpsQueuePriorities: ['low', 'normal', 'high', 'urgent'],
  canonicalInternalOpsQueueStatuses: ['open', 'in_progress', 'resolved', 'cancelled'],
  canonicalInternalOpsQueueTypes: [
    'verification',
    'privacy_reveal_exception',
    'correction_revocation',
    'pilot_ops',
  ],
  canonicalWorkflowActorTypes: [
    'candidate',
    'organization_member',
    'platform_admin',
    'system',
    'service_account',
  ],
  internalOpsQueueItems: {
    id: Symbol('internal_ops_queue_items.id'),
    queueType: Symbol('internal_ops_queue_items.queue_type'),
    status: Symbol('internal_ops_queue_items.status'),
    priority: Symbol('internal_ops_queue_items.priority'),
    linkedEntityType: Symbol('internal_ops_queue_items.linked_entity_type'),
    linkedEntityId: Symbol('internal_ops_queue_items.linked_entity_id'),
    summary: Symbol('internal_ops_queue_items.summary'),
    metadata: Symbol('internal_ops_queue_items.metadata'),
    createdAt: Symbol('internal_ops_queue_items.created_at'),
    updatedAt: Symbol('internal_ops_queue_items.updated_at'),
    resolvedAt: Symbol('internal_ops_queue_items.resolved_at'),
  },
}));

import {
  ensureInternalOpsQueueItem,
  listInternalOpsQueueItems,
  transitionInternalOpsQueueItem,
} from '@/lib/internal-ops/queue';

describe('internal ops queue compatibility fallback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns a synthetic queue item when the runtime queue table is unavailable', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    mocks.findFirst.mockRejectedValue({
      code: '42P01',
      message: 'relation "internal_ops_queue_items" does not exist',
    });

    const result = await ensureInternalOpsQueueItem({
      queueType: 'pilot_ops',
      linkedEntityType: 'engagement_verification',
      linkedEntityId: 'engagement-1',
      summary: 'Pilot follow-through is still pending.',
      metadata: { decisionId: 'decision-1' },
      actorType: 'organization_member',
      actorId: 'owner-1',
    });

    expect(result).toEqual(
      expect.objectContaining({
        id: 'compat-fallback:pilot_ops:engagement-1',
        queueType: 'pilot_ops',
        linkedEntityType: 'engagement_verification',
        linkedEntityId: 'engagement-1',
        summary: 'Pilot follow-through is still pending.',
        status: 'open',
        priority: 'normal',
        resolvedAt: null,
        metadata: expect.objectContaining({
          decisionId: 'decision-1',
          schemaCompatibilityFallback: true,
          fallbackSurface: 'internal_ops_queue_items',
        }),
      })
    );
    expect(mocks.insert).not.toHaveBeenCalled();
    expect(mocks.update).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalledWith(
      'internal_ops_queue.ensure.compatibility_fallback',
      expect.objectContaining({
        code: '42P01',
      })
    );
    warnSpy.mockRestore();
  });

  it('returns empty queue groups when the runtime queue table is unavailable', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    mocks.findMany.mockRejectedValue({
      code: '42P01',
      message: 'relation "internal_ops_queue_items" does not exist',
    });

    const result = await listInternalOpsQueueItems();

    expect(result).toEqual([
      expect.objectContaining({ id: 'verification', items: [], openCount: 0 }),
      expect.objectContaining({ id: 'privacy_reveal_exception', items: [], openCount: 0 }),
      expect.objectContaining({ id: 'correction_revocation', items: [], openCount: 0 }),
      expect.objectContaining({ id: 'pilot_ops', items: [], openCount: 0 }),
    ]);
    expect(warnSpy).toHaveBeenCalledWith(
      'internal_ops_queue.list.compatibility_fallback',
      expect.objectContaining({
        code: '42P01',
      })
    );
    warnSpy.mockRestore();
  });

  it('projects only privacy-safe metadata and operator detail for listed queue items', async () => {
    mocks.findMany.mockResolvedValue([
      {
        id: 'queue-upload-1',
        queueType: 'correction_revocation',
        status: 'in_progress',
        priority: 'high',
        linkedEntityType: 'uploaded_file',
        linkedEntityId: '11111111-1111-4111-8111-111111111111',
        summary: 'Risky evidence upload held for privacy-safe review.',
        metadata: {
          reviewReasons: ['metadata_exif'],
          filenameReviewLabel: 'Uploaded PDF document',
          sanitizedFilename: 'Jane_Doe_Resume.pdf',
          uploadKind: 'proof_evidence',
          sourceSurface: 'proof_pack_upload',
          safetyReason: 'privacy_review_required:metadata_exif',
          originalFilename: 'Jane Doe Resume.pdf',
          privatePath: 'user-uploads-private/candidate-1/Jane Doe Resume.pdf',
          quarantinePath: 'user-uploads-quarantine/candidate-1/Jane Doe Resume.pdf',
          candidateEmail: 'jane@example.com',
        },
        createdAt: new Date('2026-03-21T10:00:00.000Z'),
        updatedAt: new Date('2026-03-21T11:00:00.000Z'),
        resolvedAt: null,
      },
    ]);

    const result = await listInternalOpsQueueItems();
    const uploadItem = result
      .find((queue) => queue.id === 'correction_revocation')
      ?.items.find((item) => item.id === 'queue-upload-1');

    expect(uploadItem).toEqual(
      expect.objectContaining({
        linkedEntityType: 'uploaded_file',
        metadata: expect.objectContaining({
          reviewReasons: ['metadata_exif'],
          filenameReviewLabel: 'Uploaded PDF document',
          uploadKind: 'proof_evidence',
          sourceSurface: 'proof_pack_upload',
          safetyReason: 'privacy_review_required:metadata_exif',
        }),
        detail: expect.objectContaining({
          privacyScope: 'admin_minimum_necessary',
          operatorSummary: expect.stringContaining('raw filenames'),
          flags: ['metadata_exif'],
        }),
      })
    );
    expect(uploadItem?.detail.fields).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: 'Filename review label',
          value: 'Uploaded PDF document',
        }),
        expect.objectContaining({
          label: 'Safety status',
          value: 'privacy_review_required:metadata_exif',
        }),
      ])
    );
    expect(JSON.stringify(uploadItem)).not.toContain('Jane Doe Resume.pdf');
    expect(JSON.stringify(uploadItem)).not.toContain('Jane_Doe_Resume.pdf');
    expect(JSON.stringify(uploadItem)).not.toContain('user-uploads-private');
    expect(JSON.stringify(uploadItem)).not.toContain('user-uploads-quarantine');
    expect(JSON.stringify(uploadItem)).not.toContain('jane@example.com');
  });

  it('falls back cleanly when uploaded_file is rejected by a pre-migration DB constraint', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    mocks.findFirst.mockResolvedValue(null);

    const returning = vi.fn().mockRejectedValue({
      code: '23514',
      message:
        'new row for relation "internal_ops_queue_items" violates check constraint "internal_ops_queue_items_linked_entity_type_check"',
    });
    const values = vi.fn().mockReturnValue({ returning });
    mocks.insert.mockReturnValue({ values });

    const result = await ensureInternalOpsQueueItem({
      queueType: 'correction_revocation',
      linkedEntityType: 'uploaded_file',
      linkedEntityId: 'upload-1',
      summary: 'Risky evidence upload held for privacy-safe review.',
      metadata: {
        filenameReviewLabel: 'Uploaded PDF document',
        sanitizedFilename: 'Jane_Doe_Resume.pdf',
      },
      actorType: 'candidate',
      actorId: 'candidate-1',
    });

    expect(result).toEqual(
      expect.objectContaining({
        id: 'compat-fallback:correction_revocation:upload-1',
        linkedEntityType: 'uploaded_file',
        metadata: expect.objectContaining({
          filenameReviewLabel: 'Uploaded PDF document',
          schemaCompatibilityFallback: true,
        }),
      })
    );
    expect(JSON.stringify(result)).not.toContain('Jane_Doe_Resume.pdf');
    expect(warnSpy).toHaveBeenCalledWith(
      'internal_ops_queue.ensure.compatibility_fallback',
      expect.objectContaining({
        code: '23514',
      })
    );
    warnSpy.mockRestore();
  });

  it('updates queue item status, resolution fields, and latest operator note', async () => {
    mocks.findFirst.mockResolvedValue({
      id: 'queue-1',
      queueType: 'correction_revocation',
      status: 'in_progress',
      priority: 'high',
      linkedEntityType: 'verification_request',
      linkedEntityId: '11111111-1111-4111-8111-111111111111',
      summary: 'Verification request needs manual review.',
      metadata: { reviewReasons: ['metadata_exif'] },
      createdAt: new Date('2026-03-21T10:00:00.000Z'),
      updatedAt: new Date('2026-03-21T11:00:00.000Z'),
      resolvedAt: null,
    });

    const returning = vi.fn().mockResolvedValue([
      {
        id: 'queue-1',
        queueType: 'correction_revocation',
        status: 'resolved',
        priority: 'high',
        linkedEntityType: 'verification_request',
        linkedEntityId: '11111111-1111-4111-8111-111111111111',
        summary: 'Verification request needs manual review.',
        metadata: {
          reviewReasons: ['metadata_exif'],
          latestOperatorAction: 'resolved',
          latestOperatorNote: 'Safe after review.',
          latestOperatorActorId: 'admin-1',
        },
        createdAt: new Date('2026-03-21T10:00:00.000Z'),
        updatedAt: new Date('2026-03-21T12:00:00.000Z'),
        resolvedAt: new Date('2026-03-21T12:00:00.000Z'),
      },
    ]);
    const where = vi.fn().mockReturnValue({ returning });
    const set = vi.fn().mockReturnValue({ where });
    mocks.update.mockReturnValue({ set });

    const result = await transitionInternalOpsQueueItem({
      id: 'queue-1',
      nextStatus: 'resolved',
      actorId: 'admin-1',
      note: 'Safe after review.',
    });

    expect(set).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'resolved',
        resolvedByActorId: 'admin-1',
        metadata: expect.objectContaining({
          latestOperatorAction: 'resolved',
          latestOperatorNote: 'Safe after review.',
          latestOperatorActorId: 'admin-1',
        }),
      })
    );
    expect(result.current.status).toBe('resolved');
    expect(result.current.resolvedAt).toBe('2026-03-21T12:00:00.000Z');
    expect(result.note).toBe('Safe after review.');
  });

  it('rejects generic resolution for uploaded file queue items', async () => {
    mocks.findFirst.mockResolvedValue({
      id: 'queue-1',
      queueType: 'correction_revocation',
      status: 'in_progress',
      priority: 'high',
      linkedEntityType: 'uploaded_file',
      linkedEntityId: '11111111-1111-4111-8111-111111111111',
      summary: 'Risky evidence upload held for privacy-safe review.',
      metadata: { reviewReasons: ['malware_scanner_unavailable'] },
      createdAt: new Date('2026-03-21T10:00:00.000Z'),
      updatedAt: new Date('2026-03-21T11:00:00.000Z'),
      resolvedAt: null,
    });

    await expect(
      transitionInternalOpsQueueItem({
        id: 'queue-1',
        nextStatus: 'resolved',
        actorId: 'admin-1',
        note: 'Safe after review.',
      })
    ).rejects.toMatchObject({
      code: 'invalid_transition',
      message: expect.stringContaining('upload review action'),
    });

    expect(mocks.update).not.toHaveBeenCalled();
  });
});
