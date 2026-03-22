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

import { ensureInternalOpsQueueItem, listInternalOpsQueueItems } from '@/lib/internal-ops/queue';

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
});
