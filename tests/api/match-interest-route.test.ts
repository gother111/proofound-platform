import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';

const {
  mockRequireAuth,
  mockAssignmentsFindFirst,
  mockMatchInterestFindFirst,
  mockInsertMatchInterestReturning,
  mockSelectLimit,
  mockLogInfo,
  mockLogError,
} = vi.hoisted(() => ({
  mockRequireAuth: vi.fn(),
  mockAssignmentsFindFirst: vi.fn(),
  mockMatchInterestFindFirst: vi.fn(),
  mockInsertMatchInterestReturning: vi.fn(),
  mockSelectLimit: vi.fn(),
  mockLogInfo: vi.fn(),
  mockLogError: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  requireAuth: mockRequireAuth,
}));

vi.mock('@/lib/log', () => ({
  log: {
    info: mockLogInfo,
    error: mockLogError,
  },
}));

vi.mock('@/lib/analytics/events', () => ({
  emitMatchActioned: vi.fn(),
}));

vi.mock('@/lib/notifications', () => ({
  notifyIntroAccepted: vi.fn(),
}));

vi.mock('@/db', () => ({
  db: {
    query: {
      assignments: {
        findFirst: mockAssignmentsFindFirst,
      },
      profiles: {
        findFirst: vi.fn(),
      },
    },
    transaction: vi.fn(async (callback: (tx: any) => Promise<unknown>) =>
      callback({
        insert: vi.fn(() => ({
          values: vi.fn(() => ({
            onConflictDoNothing: vi.fn(() => ({
              returning: mockInsertMatchInterestReturning,
            })),
          })),
        })),
        query: {
          matchInterest: {
            findFirst: mockMatchInterestFindFirst,
          },
        },
      })
    ),
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: mockSelectLimit,
        })),
      })),
    })),
  },
}));

import { POST } from '@/app/api/core/matching/interest/route';

const ASSIGNMENT_ID = '11111111-1111-4111-8111-111111111111';
const ORG_USER_ID = '22222222-2222-4222-8222-222222222222';
const CANDIDATE_ID = '33333333-3333-4333-8333-333333333333';

function createRequest(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/match/interest', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

describe('/api/match/interest POST', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockRequireAuth.mockResolvedValue({ id: ORG_USER_ID });
    mockAssignmentsFindFirst.mockResolvedValue({
      id: ASSIGNMENT_ID,
      orgId: ORG_USER_ID,
    });
    mockSelectLimit.mockResolvedValue([]);
  });

  it('records org interest successfully for a fresh signal', async () => {
    mockInsertMatchInterestReturning.mockResolvedValue([{ id: 'interest-1' }]);
    mockMatchInterestFindFirst.mockResolvedValue(null);

    const res = await POST(
      createRequest({
        assignmentId: ASSIGNMENT_ID,
        targetProfileId: CANDIDATE_ID,
      })
    );
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toEqual({ revealed: false });
    expect(mockLogInfo).toHaveBeenCalledWith(
      'match.interest.recorded',
      expect.objectContaining({
        assignmentId: ASSIGNMENT_ID,
        targetProfileId: CANDIDATE_ID,
        mutualInterest: false,
        interestInsertSkipped: false,
      })
    );
  });

  it('treats duplicate org interest as idempotent success', async () => {
    mockInsertMatchInterestReturning.mockResolvedValue([]);
    mockMatchInterestFindFirst.mockResolvedValue(null);

    const res = await POST(
      createRequest({
        assignmentId: ASSIGNMENT_ID,
        targetProfileId: CANDIDATE_ID,
      })
    );
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toEqual({ revealed: false });
    expect(mockLogInfo).toHaveBeenCalledWith(
      'match.interest.recorded',
      expect.objectContaining({
        assignmentId: ASSIGNMENT_ID,
        targetProfileId: CANDIDATE_ID,
        mutualInterest: false,
        interestInsertSkipped: true,
      })
    );
  });

  it('keeps mutual-interest flow working when reciprocal signal exists', async () => {
    mockInsertMatchInterestReturning.mockResolvedValue([{ id: 'interest-2' }]);
    mockMatchInterestFindFirst.mockResolvedValue({ id: 'reciprocal-interest' });

    const res = await POST(
      createRequest({
        assignmentId: ASSIGNMENT_ID,
        targetProfileId: CANDIDATE_ID,
      })
    );
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toEqual({ revealed: true });
    expect(mockLogInfo).toHaveBeenCalledWith(
      'match.interest.recorded',
      expect.objectContaining({
        assignmentId: ASSIGNMENT_ID,
        targetProfileId: CANDIDATE_ID,
        mutualInterest: true,
        interestInsertSkipped: false,
      })
    );
  });
});
