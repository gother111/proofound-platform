import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/lib/internal-ops/queue', () => ({
  listInternalOpsQueueItems: vi.fn(),
}));

import { createClient } from '@/lib/supabase/server';
import { listInternalOpsQueueItems } from '@/lib/internal-ops/queue';
import { GET } from '@/app/api/admin/verification/linkedin/queue/route';

function buildRequest() {
  return new NextRequest('https://proofound.io/api/admin/verification/linkedin/queue', {
    method: 'GET',
  });
}

function buildSupabaseMock() {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'admin-1' } },
        error: null,
      }),
    },
    from: vi.fn((table: string) => {
      if (table !== 'profiles') throw new Error(`Unexpected table: ${table}`);
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { platform_role: 'platform_admin' },
              error: null,
            }),
          }),
        }),
      };
    }),
  };
}

describe('GET /api/admin/verification/linkedin/queue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns the four narrow internal ops queues for admin review', async () => {
    (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      buildSupabaseMock() as any
    );
    (listInternalOpsQueueItems as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([
      {
        id: 'verification',
        label: 'Verification queue',
        description: 'Manual trust review items.',
        openCount: 1,
        items: [
          {
            id: 'queue-1',
            queueType: 'verification',
            status: 'open',
            priority: 'normal',
            linkedEntityType: 'verification_request',
            linkedEntityId: 'request-1',
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
        label: 'Privacy / reveal exception queue',
        description: 'Reveal resets and exceptions.',
        openCount: 0,
        items: [],
      },
      {
        id: 'correction_revocation',
        label: 'Correction / revocation queue',
        description: 'Contradictions and revocations.',
        openCount: 0,
        items: [],
      },
      {
        id: 'pilot_ops',
        label: 'Pilot ops queue',
        description: 'Pilot follow-through.',
        openCount: 1,
        items: [
          {
            id: 'queue-2',
            queueType: 'pilot_ops',
            status: 'in_progress',
            priority: 'normal',
            linkedEntityType: 'engagement_verification',
            linkedEntityId: 'engagement-1',
            summary: 'Hire recorded. Engagement confirmation still needs follow-through.',
            metadata: {},
            createdAt: '2026-03-20T10:00:00.000Z',
            updatedAt: '2026-03-20T11:00:00.000Z',
            resolvedAt: null,
          },
        ],
      },
    ]);

    const response = await GET(buildRequest());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.queues).toHaveLength(4);
    expect(body.queues.map((queue: { id: string }) => queue.id)).toEqual([
      'verification',
      'privacy_reveal_exception',
      'correction_revocation',
      'pilot_ops',
    ]);
    expect(body.stats.total).toBe(2);
    expect(body.stats.open).toBe(2);
  });
});
