import { beforeEach, describe, expect, it, vi } from 'vitest';

const selectMock = vi.hoisted(() => vi.fn());
const listCanonicalSkillVerificationRequestsForOwnerMock = vi.hoisted(() => vi.fn());
const mapCanonicalSkillVerificationRequestRecordMock = vi.hoisted(() =>
  vi.fn((record: any) => record)
);
const listCanonicalImpactVerificationRequestsForOwnerMock = vi.hoisted(() => vi.fn());
const mapCanonicalImpactVerificationRequestRecordMock = vi.hoisted(() =>
  vi.fn((record: any) => record)
);
const listCanonicalBundlesForOwnerMock = vi.hoisted(() => vi.fn());

vi.mock('@/db', () => ({
  db: {
    select: (...args: any[]) => selectMock(...args),
    execute: vi.fn(),
  },
}));

vi.mock('@/db/schema', () => ({
  assignments: {
    id: 'assignments.id',
    role: 'assignments.role',
    status: 'assignments.status',
    updatedAt: 'assignments.updatedAt',
    orgId: 'assignments.orgId',
  },
  growthPlans: {
    id: 'growth.id',
    title: 'growth.title',
    status: 'growth.status',
    updatedAt: 'growth.updatedAt',
    profileId: 'growth.profileId',
  },
  interviews: {
    id: 'interviews.id',
    scheduledAt: 'interviews.scheduledAt',
    status: 'interviews.status',
    matchId: 'interviews.matchId',
  },
  matches: {
    id: 'matches.id',
    profileId: 'matches.profileId',
    assignmentId: 'matches.assignmentId',
    createdAt: 'matches.createdAt',
  },
  notifications: {
    id: 'notifications.id',
    type: 'notifications.type',
    title: 'notifications.title',
    message: 'notifications.message',
    actionUrl: 'notifications.actionUrl',
    createdAt: 'notifications.createdAt',
    userId: 'notifications.userId',
  },
}));

vi.mock('@/lib/verification/canonical-requests', () => ({
  listCanonicalSkillVerificationRequestsForOwner: (...args: any[]) =>
    listCanonicalSkillVerificationRequestsForOwnerMock(...args),
  mapCanonicalSkillVerificationRequestRecord: (...args: any[]) =>
    mapCanonicalSkillVerificationRequestRecordMock(...args),
}));

vi.mock('@/lib/verification/canonical-impact-requests', () => ({
  listCanonicalImpactVerificationRequestsForOwner: (...args: any[]) =>
    listCanonicalImpactVerificationRequestsForOwnerMock(...args),
  mapCanonicalImpactVerificationRequestRecord: (...args: any[]) =>
    mapCanonicalImpactVerificationRequestRecordMock(...args),
}));

vi.mock('@/lib/verification/canonical-bundles', () => ({
  listCanonicalBundlesForOwner: (...args: any[]) => listCanonicalBundlesForOwnerMock(...args),
}));

import { getIndividualActivityEvents } from '@/lib/momentum/activity';

function createQuery(result: unknown[]) {
  const query: any = {
    from: vi.fn(() => query),
    innerJoin: vi.fn(() => query),
    where: vi.fn(() => query),
    orderBy: vi.fn(() => query),
    limit: vi.fn(async () => result),
  };

  return query;
}

describe('getIndividualActivityEvents', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    selectMock
      .mockImplementationOnce(() =>
        createQuery([
          {
            id: 'notification-1',
            type: 'verification_completed',
            title: 'Verification update',
            message: 'A verifier responded.',
            actionUrl: '/app/i/verifications',
            createdAt: new Date('2026-03-17T08:00:00.000Z'),
          },
        ])
      )
      .mockImplementationOnce(() =>
        createQuery([
          {
            id: 'goal-1',
            title: 'Grow trust',
            status: 'in_progress',
            updatedAt: new Date('2026-03-16T08:00:00.000Z'),
          },
        ])
      )
      .mockImplementationOnce(() =>
        createQuery([
          {
            interviewId: 'interview-1',
            scheduledAt: new Date('2026-03-15T08:00:00.000Z'),
            status: 'scheduled',
          },
        ])
      );

    listCanonicalSkillVerificationRequestsForOwnerMock.mockResolvedValue([
      {
        id: 'skill-standalone-1',
        custom_request_id: null,
        status: 'accepted',
        responded_at: '2026-03-14T10:00:00.000Z',
        created_at: '2026-03-13T10:00:00.000Z',
      },
      {
        id: 'skill-bundle-child-1',
        custom_request_id: 'bundle-1',
        status: 'pending',
        responded_at: null,
        created_at: '2026-03-17T09:00:00.000Z',
      },
    ]);
    listCanonicalImpactVerificationRequestsForOwnerMock.mockResolvedValue([
      {
        id: 'impact-standalone-1',
        custom_request_id: null,
        status: 'pending',
        responded_at: null,
        created_at: '2026-03-15T10:00:00.000Z',
      },
    ]);
    listCanonicalBundlesForOwnerMock.mockResolvedValue([
      {
        id: 'bundle-1',
        status: 'pending',
        created_at: '2026-03-17T09:00:00.000Z',
        responded_at: null,
      },
    ]);
  });

  it('uses canonical verification activity rows and groups bundle-backed requests once', async () => {
    const events = await getIndividualActivityEvents('user-1', 8);

    expect(events.some((event) => event.text === 'Custom verification bundle pending')).toBe(true);
    expect(events.some((event) => event.text === 'Impact story verification request pending')).toBe(
      true
    );
    expect(events.some((event) => event.text === 'Skill verification request accepted')).toBe(true);
    expect(
      events.filter((event) => event.text.includes('Custom verification bundle'))
    ).toHaveLength(1);
    expect(selectMock).toHaveBeenCalledTimes(3);
  });
});
