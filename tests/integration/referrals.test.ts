import { beforeEach, describe, expect, it, vi } from 'vitest';
import { referrals, referralCredits } from '@/db/schema';
import {
  acceptReferral,
  createReferral,
  getReferralsByUser,
  ReferralServiceError,
} from '@/services/referral-service';

// Mock notifications so we can assert calls without sending anything
const notifyReferralAccepted = vi.fn();
const notifyReferralReceived = vi.fn();
const notifyReferralSignedUp = vi.fn();

vi.mock('@/lib/notifications', () => ({
  notifyReferralAccepted,
  notifyReferralReceived,
  notifyReferralSignedUp,
}));

// Minimal mock DB that satisfies the referral service calls
const mockDb: any = {
  query: {
    referrals: { findFirst: vi.fn() },
    profiles: { findFirst: vi.fn() },
  },
  insert: vi.fn(),
  update: vi.fn(),
  select: vi.fn(),
};

vi.mock('@/db', async () => {
  const actual = await vi.importActual<any>('@/db');
  return { ...actual, db: mockDb };
});

// Helpers for select chain (used in getReferralsByUser)
const makeSelectChain = (rows: any[]) => ({
  from: () => ({
    leftJoin: () => ({
      leftJoin: () => ({
        where: () => ({
          orderBy: () => ({
            limit: () => ({
              offset: () => rows,
            }),
          }),
        }),
      }),
    }),
  }),
});

describe('Referral service', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockDb.query.referrals.findFirst.mockResolvedValue(null);
    mockDb.query.profiles.findFirst.mockResolvedValue(null);

    mockDb.insert.mockImplementation((table: any) => ({
      values: (payload: any) => ({
        returning: async () => {
          if (table === referrals) {
            return [
              {
                id: payload.id ?? 'ref-1',
                referralCode: payload.referralCode ?? 'code-123',
                status: payload.status ?? 'pending',
                ...payload,
              },
            ];
          }
          if (table === referralCredits) {
            return [{ id: 'credit-1', ...payload }];
          }
          return [];
        },
      }),
    }));

    mockDb.update.mockImplementation(() => ({
      set: (payload: any) => ({
        where: () => ({
          returning: async () => [{ id: 'ref-1', ...payload }],
        }),
      }),
    }));
  });

  it('creates a platform referral with a shareable code', async () => {
    const referral = await createReferral({
      referrerId: 'user-1',
      referralType: 'platform',
      referredEmail: 'friend@example.com',
    });

    expect(referral.referralCode).toBeDefined();
    expect(referral.referralType).toBe('platform');
    expect(notifyReferralReceived).not.toHaveBeenCalled();
  });

  it('creates an assignment referral and notifies the referred user', async () => {
    mockDb.query.profiles.findFirst.mockResolvedValueOnce({ displayName: 'Referrer' });

    const referral = await createReferral({
      referrerId: 'user-1',
      referralType: 'assignment',
      assignmentId: 'assign-1',
      referredUserId: 'user-2',
    });

    expect(referral.assignmentId).toBe('assign-1');
    expect(notifyReferralReceived).toHaveBeenCalledWith(
      'user-2',
      'Referrer',
      referral.referralCode,
      'assignment'
    );
  });

  it('accepts a referral code and records a credit', async () => {
    mockDb.query.referrals.findFirst.mockResolvedValueOnce({
      id: 'ref-1',
      referrerId: 'referrer-1',
      referralCode: 'code-accept',
      status: 'pending',
      referralType: 'platform',
      referredUserId: null,
      expiresAt: null,
    });

    const updated = await acceptReferral({ code: 'code-accept', userId: 'user-2' });

    expect(updated.status).toBe('signed_up');
    expect(notifyReferralAccepted).toHaveBeenCalled();
    expect(notifyReferralSignedUp).toHaveBeenCalled();
    expect(mockDb.insert).toHaveBeenCalledWith(referralCredits);
  });

  it('throws a ReferralServiceError for invalid codes', async () => {
    mockDb.query.referrals.findFirst.mockResolvedValueOnce(null);
    await expect(acceptReferral({ code: 'bad-code', userId: 'user-2' })).rejects.toBeInstanceOf(
      ReferralServiceError
    );
  });

  it('lists sent and received referrals', async () => {
    const sentRows = [
      {
        referral: {
          id: 'ref-1',
          referrerId: 'user-1',
          referralCode: 'code-1',
          referralType: 'platform',
          status: 'pending',
        },
        assignmentRole: null,
        assignmentOrgId: null,
        counterpartName: 'Alex',
        counterpartHandle: null,
      },
    ];

    const receivedRows = [
      {
        referral: {
          id: 'ref-2',
          referrerId: 'user-3',
          referredUserId: 'user-1',
          referralCode: 'code-2',
          referralType: 'assignment',
          status: 'signed_up',
        },
        assignmentRole: 'Data Lead',
        assignmentOrgId: 'org-1',
        counterpartName: 'Jamie',
        counterpartHandle: null,
      },
    ];

    let callCount = 0;
    mockDb.select.mockImplementation(() => {
      const rows = callCount === 0 ? sentRows : receivedRows;
      callCount += 1;
      return makeSelectChain(rows);
    });

    const result = await getReferralsByUser('user-1');

    expect(result.sent.length).toBe(1);
    expect(result.received.length).toBe(1);
    expect(result.sent[0].counterpartName).toBe('Alex');
    expect(result.received[0].assignmentRole).toBe('Data Lead');
  });
});
