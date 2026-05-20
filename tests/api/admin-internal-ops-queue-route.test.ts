import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

const mocks = vi.hoisted(() => {
  class MockInternalOpsQueueMutationError extends Error {
    constructor(
      readonly code:
        | 'not_found'
        | 'invalid_transition'
        | 'note_required'
        | 'compatibility_fallback_unavailable',
      message: string
    ) {
      super(message);
      this.name = 'InternalOpsQueueMutationError';
    }
  }

  return {
    adminListGuardMock: vi.fn(),
    requirePlatformAdminJsonMock: vi.fn(),
    listInternalOpsQueueItemsMock: vi.fn(),
    getInternalOpsQueueItemMock: vi.fn(),
    transitionInternalOpsQueueItemMock: vi.fn(),
    reviewUploadedFileQueueItemMock: vi.fn(),
    logAdminActionMock: vi.fn(),
    MockInternalOpsQueueMutationError,
  };
});

vi.mock('@/app/api/admin/_utils', () => ({
  adminListGuard: (...args: any[]) => mocks.adminListGuardMock(...args),
}));

vi.mock('@/lib/api/route-helpers', () => ({
  requirePlatformAdminJson: (...args: any[]) => mocks.requirePlatformAdminJsonMock(...args),
  jsonError: (message: string, status = 400, details?: unknown) =>
    NextResponse.json({ error: message, details }, { status }),
}));

vi.mock('@/lib/internal-ops/queue', () => ({
  listInternalOpsQueueItems: (...args: any[]) => mocks.listInternalOpsQueueItemsMock(...args),
  getInternalOpsQueueItem: (...args: any[]) => mocks.getInternalOpsQueueItemMock(...args),
  transitionInternalOpsQueueItem: (...args: any[]) =>
    mocks.transitionInternalOpsQueueItemMock(...args),
  InternalOpsQueueMutationError: mocks.MockInternalOpsQueueMutationError,
}));

vi.mock('@/lib/uploads/review', () => ({
  reviewUploadedFileQueueItem: (...args: any[]) => mocks.reviewUploadedFileQueueItemMock(...args),
  UploadReviewError: class UploadReviewError extends Error {
    constructor(
      readonly code: string,
      message: string
    ) {
      super(message);
      this.name = 'UploadReviewError';
    }
  },
}));

vi.mock('@/lib/audit/admin-logger', () => ({
  logAdminAction: (...args: any[]) => mocks.logAdminActionMock(...args),
}));

import { GET } from '@/app/api/admin/internal-ops/queues/route';
import { GET as GET_ITEM, PATCH } from '@/app/api/admin/internal-ops/queues/[id]/route';

describe('internal ops queue admin routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns the four narrow internal ops queues from the generic GET route', async () => {
    mocks.adminListGuardMock.mockResolvedValue({
      adminUser: { userId: 'admin-1' },
      params: { page: 1, limit: 10, search: '', sortField: 'createdAt', sortDir: 'desc' },
    });
    mocks.listInternalOpsQueueItemsMock.mockResolvedValue([
      {
        id: 'verification',
        label: 'Verification',
        description: 'Manual trust review items.',
        openCount: 1,
        items: [
          {
            id: 'queue-1',
            queueType: 'verification',
            status: 'open',
            priority: 'normal',
            linkedEntityType: 'verification_request',
            linkedEntityId: '11111111-1111-1111-1111-111111111111',
            summary: 'Verifier responded partly.',
            metadata: { verdict: 'partly' },
            createdAt: '2026-03-20T10:00:00.000Z',
            updatedAt: '2026-03-20T10:00:00.000Z',
            resolvedAt: null,
          },
        ],
      },
      {
        id: 'privacy_reveal_exception',
        label: 'Privacy / reveal disputes',
        description: 'Reveal disputes.',
        openCount: 0,
        items: [],
      },
      {
        id: 'correction_revocation',
        label: 'Redaction / risky upload',
        description: 'Risky upload handling.',
        openCount: 1,
        items: [
          {
            id: 'queue-2',
            queueType: 'correction_revocation',
            status: 'in_progress',
            priority: 'high',
            linkedEntityType: 'uploaded_file',
            linkedEntityId: '22222222-2222-2222-2222-222222222222',
            summary: 'Risky evidence upload held for privacy-safe review.',
            metadata: { reviewReasons: ['metadata_exif'] },
            createdAt: '2026-03-21T10:00:00.000Z',
            updatedAt: '2026-03-21T11:00:00.000Z',
            resolvedAt: null,
          },
        ],
      },
      {
        id: 'pilot_ops',
        label: 'Pilot ops',
        description: 'Pilot follow-through.',
        openCount: 0,
        items: [],
      },
    ]);

    const response = await GET(
      new NextRequest('https://proofound.io/api/admin/internal-ops/queues', { method: 'GET' })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.queues).toHaveLength(4);
    expect(body.stats.total).toBe(2);
    expect(body.stats.open).toBe(2);
  });

  it('returns the guard response for non-admin GET access', async () => {
    mocks.adminListGuardMock.mockResolvedValue(
      NextResponse.json({ error: 'Forbidden', details: null }, { status: 403 })
    );

    const response = await GET(
      new NextRequest('https://proofound.io/api/admin/internal-ops/queues', { method: 'GET' })
    );

    expect(response.status).toBe(403);
    expect(mocks.listInternalOpsQueueItemsMock).not.toHaveBeenCalled();
  });

  it('returns a generic GET error without backend details', async () => {
    mocks.adminListGuardMock.mockResolvedValue({
      adminUser: { userId: 'admin-1' },
      params: { page: 1, limit: 10, search: '', sortField: 'createdAt', sortDir: 'desc' },
    });
    mocks.listInternalOpsQueueItemsMock.mockRejectedValue(
      new Error('raw queue storage path user-uploads-private/Jane Doe Resume.pdf')
    );

    const response = await GET(
      new NextRequest('https://proofound.io/api/admin/internal-ops/queues', { method: 'GET' })
    );
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe('Failed to fetch operations queues');
    expect(body).not.toHaveProperty('details');
    expect(JSON.stringify(body)).not.toContain('user-uploads-private');
    expect(JSON.stringify(body)).not.toContain('Jane Doe Resume.pdf');
  });

  it('returns a sanitized queue detail projection for a single internal ops item', async () => {
    mocks.adminListGuardMock.mockResolvedValue({
      adminUser: { userId: 'admin-1' },
      params: { page: 1, limit: 10, search: '', sortField: 'createdAt', sortDir: 'desc' },
    });
    mocks.getInternalOpsQueueItemMock.mockResolvedValue({
      id: '33333333-3333-4333-8333-333333333333',
      queueType: 'correction_revocation',
      status: 'open',
      priority: 'high',
      linkedEntityType: 'uploaded_file',
      linkedEntityId: '22222222-2222-2222-2222-222222222222',
      summary: 'Risky evidence upload held for privacy-safe review.',
      metadata: {
        filenameReviewLabel: 'Identity-bearing filename withheld',
        reviewReasons: ['metadata_exif'],
      },
      detail: {
        privacyScope: 'admin_minimum_necessary',
        recordKind: 'uploaded_file',
        operatorSummary:
          'Review upload risk without exposing raw filenames, storage paths, or hidden document context.',
        fields: [{ label: 'Filename review label', value: 'Identity-bearing filename withheld' }],
        flags: ['metadata_exif'],
        checklist: ['Do not copy raw filename, object path, or document text into notes.'],
      },
      createdAt: '2026-03-21T10:00:00.000Z',
      updatedAt: '2026-03-21T10:00:00.000Z',
      resolvedAt: null,
    });

    const response = await GET_ITEM(
      new NextRequest(
        'https://proofound.io/api/admin/internal-ops/queues/33333333-3333-4333-8333-333333333333',
        { method: 'GET' }
      ),
      { params: Promise.resolve({ id: '33333333-3333-4333-8333-333333333333' }) }
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(mocks.getInternalOpsQueueItemMock).toHaveBeenCalledWith(
      '33333333-3333-4333-8333-333333333333'
    );
    expect(body.item.detail.privacyScope).toBe('admin_minimum_necessary');
    expect(body.item.detail.operatorSummary).toContain('without exposing raw filenames');
    expect(JSON.stringify(body)).not.toContain('user-uploads-private');
    expect(JSON.stringify(body)).not.toContain('Jane Doe Resume.pdf');
  });

  it('returns 404 when a queue detail item is missing', async () => {
    mocks.adminListGuardMock.mockResolvedValue({
      adminUser: { userId: 'admin-1' },
      params: { page: 1, limit: 10, search: '', sortField: 'createdAt', sortDir: 'desc' },
    });
    mocks.getInternalOpsQueueItemMock.mockResolvedValue(null);

    const response = await GET_ITEM(
      new NextRequest(
        'https://proofound.io/api/admin/internal-ops/queues/33333333-3333-4333-8333-333333333333',
        { method: 'GET' }
      ),
      { params: Promise.resolve({ id: '33333333-3333-4333-8333-333333333333' }) }
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      error: 'Queue item not found',
    });
  });

  it('returns a generic queue detail error without backend details', async () => {
    mocks.adminListGuardMock.mockResolvedValue({
      adminUser: { userId: 'admin-1' },
      params: { page: 1, limit: 10, search: '', sortField: 'createdAt', sortDir: 'desc' },
    });
    mocks.getInternalOpsQueueItemMock.mockRejectedValue(
      new Error('raw queue storage path user-uploads-private/Jane Doe Resume.pdf')
    );

    const response = await GET_ITEM(
      new NextRequest(
        'https://proofound.io/api/admin/internal-ops/queues/33333333-3333-4333-8333-333333333333',
        { method: 'GET' }
      ),
      { params: Promise.resolve({ id: '33333333-3333-4333-8333-333333333333' }) }
    );
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe('Failed to fetch operations queue item');
    expect(body.details).toBeUndefined();
    expect(JSON.stringify(body)).not.toContain('user-uploads-private');
    expect(JSON.stringify(body)).not.toContain('Jane Doe Resume.pdf');
  });

  it('updates non-upload queue status through the generic PATCH route and emits an audit event', async () => {
    mocks.requirePlatformAdminJsonMock.mockResolvedValue({
      adminLevel: 'platform_admin',
      userId: 'admin-1',
      email: 'ops@proofound.io',
      platformRole: 'platform_admin',
    });
    mocks.transitionInternalOpsQueueItemMock.mockResolvedValue({
      previous: {
        id: '33333333-3333-4333-8333-333333333333',
        queueType: 'correction_revocation',
        status: 'in_progress',
        priority: 'high',
        linkedEntityType: 'verification_request',
        linkedEntityId: '22222222-2222-2222-2222-222222222222',
        summary: 'Verifier response needs manual follow-up.',
        metadata: {},
        createdAt: '2026-03-21T10:00:00.000Z',
        updatedAt: '2026-03-21T11:00:00.000Z',
        resolvedAt: null,
      },
      current: {
        id: '33333333-3333-4333-8333-333333333333',
        queueType: 'correction_revocation',
        status: 'resolved',
        priority: 'high',
        linkedEntityType: 'verification_request',
        linkedEntityId: '22222222-2222-2222-2222-222222222222',
        summary: 'Verifier response needs manual follow-up.',
        metadata: { latestOperatorNote: 'Safe after review.' },
        createdAt: '2026-03-21T10:00:00.000Z',
        updatedAt: '2026-03-21T12:00:00.000Z',
        resolvedAt: '2026-03-21T12:00:00.000Z',
      },
      note: 'Safe after review.',
    });

    const response = await PATCH(
      new NextRequest(
        'https://proofound.io/api/admin/internal-ops/queues/33333333-3333-4333-8333-333333333333',
        {
          method: 'PATCH',
          body: JSON.stringify({
            status: 'resolved',
            note: 'Safe after review.',
          }),
        }
      ),
      { params: Promise.resolve({ id: '33333333-3333-4333-8333-333333333333' }) }
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(mocks.transitionInternalOpsQueueItemMock).toHaveBeenCalledWith({
      id: '33333333-3333-4333-8333-333333333333',
      nextStatus: 'resolved',
      note: 'Safe after review.',
      actorId: 'admin-1',
    });
    expect(mocks.logAdminActionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        adminId: 'admin-1',
        action: 'internal_ops_queue_status_changed',
        targetType: 'internal_ops_queue_item',
        targetId: '33333333-3333-4333-8333-333333333333',
        reason: 'Safe after review.',
      })
    );
    expect(body.item.status).toBe('resolved');
  });

  it('returns 400 for malformed PATCH JSON before mutating a queue item', async () => {
    mocks.requirePlatformAdminJsonMock.mockResolvedValue({
      adminLevel: 'platform_admin',
      userId: 'admin-1',
      email: 'ops@proofound.io',
      platformRole: 'platform_admin',
    });

    const response = await PATCH(
      new NextRequest(
        'https://proofound.io/api/admin/internal-ops/queues/33333333-3333-4333-8333-333333333333',
        {
          method: 'PATCH',
          headers: { 'content-type': 'application/json' },
          body: '{',
        }
      ),
      { params: Promise.resolve({ id: '33333333-3333-4333-8333-333333333333' }) }
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe('Invalid JSON body');
    expect(mocks.transitionInternalOpsQueueItemMock).not.toHaveBeenCalled();
    expect(mocks.reviewUploadedFileQueueItemMock).not.toHaveBeenCalled();
    expect(mocks.logAdminActionMock).not.toHaveBeenCalled();
  });

  it('rejects uploaded-file review actions from platform admins', async () => {
    mocks.requirePlatformAdminJsonMock.mockResolvedValue({
      adminLevel: 'platform_admin',
      userId: 'admin-1',
      email: 'ops@proofound.io',
      platformRole: 'platform_admin',
    });

    const response = await PATCH(
      new NextRequest(
        'https://proofound.io/api/admin/internal-ops/queues/33333333-3333-4333-8333-333333333333',
        {
          method: 'PATCH',
          body: JSON.stringify({
            status: 'resolved',
            uploadReviewAction: 'approve',
            note: 'Audited internally and safe for private evidence attachment.',
          }),
        }
      ),
      { params: Promise.resolve({ id: '33333333-3333-4333-8333-333333333333' }) }
    );
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error).toBe('Upload review requires super admin access');
    expect(mocks.reviewUploadedFileQueueItemMock).not.toHaveBeenCalled();
    expect(mocks.transitionInternalOpsQueueItemMock).not.toHaveBeenCalled();
    expect(mocks.logAdminActionMock).not.toHaveBeenCalled();
  });

  it('approves uploaded-file queue items through the explicit super-admin upload review action', async () => {
    mocks.requirePlatformAdminJsonMock.mockResolvedValue({
      adminLevel: 'super_admin',
      userId: 'admin-1',
      email: 'ops@proofound.io',
      platformRole: 'super_admin',
    });
    mocks.reviewUploadedFileQueueItemMock.mockResolvedValue({
      previous: {
        id: '33333333-3333-4333-8333-333333333333',
        queueType: 'correction_revocation',
        status: 'in_progress',
        priority: 'high',
        linkedEntityType: 'uploaded_file',
        linkedEntityId: '22222222-2222-2222-2222-222222222222',
        summary: 'Risky evidence upload held for privacy-safe review.',
        metadata: {},
        createdAt: '2026-03-21T10:00:00.000Z',
        updatedAt: '2026-03-21T11:00:00.000Z',
        resolvedAt: null,
      },
      current: {
        id: '33333333-3333-4333-8333-333333333333',
        queueType: 'correction_revocation',
        status: 'resolved',
        priority: 'high',
        linkedEntityType: 'uploaded_file',
        linkedEntityId: '22222222-2222-2222-2222-222222222222',
        summary: 'Risky evidence upload held for privacy-safe review.',
        metadata: {
          uploadReviewAction: 'approved',
          uploadedFileLifecycleState: 'ready_private',
          uploadedFileAttachStatus: 'attachable',
        },
        createdAt: '2026-03-21T10:00:00.000Z',
        updatedAt: '2026-03-21T12:00:00.000Z',
        resolvedAt: '2026-03-21T12:00:00.000Z',
      },
      note: 'Audited internally and safe for private evidence attachment.',
      uploadReviewAction: 'approve',
    });

    const response = await PATCH(
      new NextRequest(
        'https://proofound.io/api/admin/internal-ops/queues/33333333-3333-4333-8333-333333333333',
        {
          method: 'PATCH',
          body: JSON.stringify({
            status: 'resolved',
            uploadReviewAction: 'approve',
            note: 'Audited internally and safe for private evidence attachment.',
          }),
        }
      ),
      { params: Promise.resolve({ id: '33333333-3333-4333-8333-333333333333' }) }
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(mocks.reviewUploadedFileQueueItemMock).toHaveBeenCalledWith({
      queueItemId: '33333333-3333-4333-8333-333333333333',
      action: 'approve',
      note: 'Audited internally and safe for private evidence attachment.',
      actorId: 'admin-1',
    });
    expect(mocks.transitionInternalOpsQueueItemMock).not.toHaveBeenCalled();
    expect(mocks.logAdminActionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        adminId: 'admin-1',
        action: 'internal_ops_queue_upload_reviewed',
        targetType: 'internal_ops_queue_item',
        reason: 'Audited internally and safe for private evidence attachment.',
        changes: expect.objectContaining({
          fromStatus: 'in_progress',
          toStatus: 'resolved',
          uploadReviewAction: 'approve',
        }),
      })
    );
    expect(JSON.stringify(body)).not.toContain('user-uploads-private');
    expect(JSON.stringify(body)).not.toContain('Jane Doe Resume.pdf');
    expect(body.item.status).toBe('resolved');
  });

  it('returns a validation error when a queue transition requires a note', async () => {
    mocks.requirePlatformAdminJsonMock.mockResolvedValue({
      adminLevel: 'platform_admin',
      userId: 'admin-1',
      email: 'ops@proofound.io',
      platformRole: 'platform_admin',
    });
    mocks.transitionInternalOpsQueueItemMock.mockRejectedValue(
      new mocks.MockInternalOpsQueueMutationError(
        'note_required',
        'An operator note is required for resolve, cancel, and reopen actions.'
      )
    );

    const response = await PATCH(
      new NextRequest(
        'https://proofound.io/api/admin/internal-ops/queues/33333333-3333-4333-8333-333333333333',
        {
          method: 'PATCH',
          body: JSON.stringify({
            status: 'resolved',
          }),
        }
      ),
      { params: Promise.resolve({ id: '33333333-3333-4333-8333-333333333333' }) }
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain('operator note');
    expect(mocks.logAdminActionMock).not.toHaveBeenCalled();
  });

  it('returns the guard response for non-admin PATCH access', async () => {
    mocks.requirePlatformAdminJsonMock.mockResolvedValue(
      NextResponse.json({ error: 'Unauthorized', details: null }, { status: 401 })
    );

    const response = await PATCH(
      new NextRequest(
        'https://proofound.io/api/admin/internal-ops/queues/33333333-3333-4333-8333-333333333333',
        {
          method: 'PATCH',
          body: JSON.stringify({
            status: 'in_progress',
          }),
        }
      ),
      { params: Promise.resolve({ id: '33333333-3333-4333-8333-333333333333' }) }
    );

    expect(response.status).toBe(401);
    expect(mocks.transitionInternalOpsQueueItemMock).not.toHaveBeenCalled();
  });

  it('returns a generic PATCH error without backend details for unexpected failures', async () => {
    mocks.requirePlatformAdminJsonMock.mockResolvedValue({
      adminLevel: 'platform_admin',
      userId: 'admin-1',
      email: 'ops@proofound.io',
      platformRole: 'platform_admin',
    });
    mocks.transitionInternalOpsQueueItemMock.mockRejectedValue(
      new Error('raw queue storage path user-uploads-private/Jane Doe Resume.pdf')
    );

    const response = await PATCH(
      new NextRequest(
        'https://proofound.io/api/admin/internal-ops/queues/33333333-3333-4333-8333-333333333333',
        {
          method: 'PATCH',
          body: JSON.stringify({
            status: 'in_progress',
            note: 'Start review.',
          }),
        }
      ),
      { params: Promise.resolve({ id: '33333333-3333-4333-8333-333333333333' }) }
    );
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe('Failed to update operations queue item');
    expect(body.details).toBeUndefined();
    expect(JSON.stringify(body)).not.toContain('user-uploads-private');
    expect(JSON.stringify(body)).not.toContain('Jane Doe Resume.pdf');
  });
});
