import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

import { DELETE as deleteAccount } from '@/app/api/user/account/route';
import { POST as cancelDeletion } from '@/app/api/user/account/cancel-deletion/route';

vi.mock('@/lib/auth', () => ({
  requireAuth: vi.fn(() => Promise.resolve({ id: 'test-user-id' })),
}));

const mocks = vi.hoisted(() => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
      signInWithPassword: vi.fn(),
    },
  },
  sendDeletionScheduledEmail: vi.fn(() => Promise.resolve()),
  trackAccountDeletionRequested: vi.fn(() => Promise.resolve()),
  trackAccountDeletionCancelled: vi.fn(() => Promise.resolve()),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve(mocks.supabase)),
}));

vi.mock('@/lib/email', () => ({
  sendDeletionScheduledEmail: mocks.sendDeletionScheduledEmail,
}));

vi.mock('@/lib/analytics', () => ({
  trackAccountDeletionRequested: mocks.trackAccountDeletionRequested,
  trackAccountDeletionCancelled: mocks.trackAccountDeletionCancelled,
}));

const updateWhereMock = vi.fn(() => Promise.resolve());
const updateSetMock = vi.fn(() => ({ where: updateWhereMock }));
const updateMock = vi.fn(() => ({ set: updateSetMock }));

const selectMock = vi.fn();

vi.mock('@/db', () => ({
  db: {
    select: (...args: any[]) => (selectMock as any)(...args),
    update: (...args: any[]) => (updateMock as any)(...args),
  },
}));

describe('Account Deletion API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    selectMock.mockReset();
  });

  it('schedules deletion with 30-day grace period', async () => {
    const profile = {
      id: 'test-user-id',
      deleted: false,
      deletionScheduledFor: null,
    };

    selectMock.mockImplementationOnce(() => ({
      from: () => ({
        where: () => ({
          limit: () => Promise.resolve([profile]),
        }),
      }),
    }));

    mocks.supabase.auth.getUser.mockResolvedValue({
      data: { user: { email: 'user@example.com' } },
      error: null,
    });
    mocks.supabase.auth.signInWithPassword.mockResolvedValue({ error: null });

    const req = new NextRequest('http://localhost/api/user/account', {
      method: 'DELETE',
      body: JSON.stringify({
        password: 'CorrectPassword123',
        confirmPhrase: 'DELETE MY ACCOUNT',
        reason: 'Other',
      }),
    });

    const res = await deleteAccount(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.accountStatus).toBe('deletion_scheduled');
    expect(body.deletionScheduledFor).toMatch(/T/);
    expect(body.canCancelDeletion).toBe(true);

    expect(updateMock).toHaveBeenCalled();
    expect(updateSetMock).toHaveBeenCalledWith(
      expect.objectContaining({
        deletionRequestedAt: expect.any(Date),
        deletionScheduledFor: expect.any(Date),
        deleted: false,
      })
    );

    expect(mocks.sendDeletionScheduledEmail).toHaveBeenCalledWith(
      'user@example.com',
      'test-user-id',
      expect.any(Date)
    );
    expect(mocks.trackAccountDeletionRequested).toHaveBeenCalledWith(
      'test-user-id',
      expect.any(String),
      req,
      'Other'
    );
  });

  it('rejects invalid confirmation phrase', async () => {
    const profile = {
      id: 'test-user-id',
      deleted: false,
      deletionScheduledFor: null,
    };

    selectMock.mockImplementationOnce(() => ({
      from: () => ({
        where: () => ({
          limit: () => Promise.resolve([profile]),
        }),
      }),
    }));

    mocks.supabase.auth.getUser.mockResolvedValue({
      data: { user: { email: 'user@example.com' } },
      error: null,
    });

    const req = new NextRequest('http://localhost/api/user/account', {
      method: 'DELETE',
      body: JSON.stringify({
        password: 'CorrectPassword123',
        // Wrong phrase
        confirmPhrase: 'DELETE',
      }),
    });

    const res = await deleteAccount(req);
    expect(res.status).toBe(400);
  });

  it('returns 409 when deletion is already scheduled', async () => {
    const profile = {
      id: 'test-user-id',
      deleted: false,
      deletionScheduledFor: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    };

    selectMock.mockImplementationOnce(() => ({
      from: () => ({
        where: () => ({
          limit: () => Promise.resolve([profile]),
        }),
      }),
    }));

    mocks.supabase.auth.getUser.mockResolvedValue({
      data: { user: { email: 'user@example.com' } },
      error: null,
    });

    const req = new NextRequest('http://localhost/api/user/account', {
      method: 'DELETE',
      body: JSON.stringify({
        password: 'CorrectPassword123',
        confirmPhrase: 'DELETE MY ACCOUNT',
      }),
    });

    const res = await deleteAccount(req);
    expect(res.status).toBe(409);
    expect(updateMock).not.toHaveBeenCalled();
  });

  it('returns 410 when account is already deleted', async () => {
    const profile = {
      id: 'test-user-id',
      deleted: true,
      deletionScheduledFor: null,
    };

    selectMock.mockImplementationOnce(() => ({
      from: () => ({
        where: () => ({
          limit: () => Promise.resolve([profile]),
        }),
      }),
    }));

    mocks.supabase.auth.getUser.mockResolvedValue({
      data: { user: { email: 'user@example.com' } },
      error: null,
    });

    const req = new NextRequest('http://localhost/api/user/account', {
      method: 'DELETE',
      body: JSON.stringify({
        password: 'CorrectPassword123',
        confirmPhrase: 'DELETE MY ACCOUNT',
      }),
    });

    const res = await deleteAccount(req);
    expect(res.status).toBe(410);
    expect(updateMock).not.toHaveBeenCalled();
  });

  it('cancels scheduled deletion', async () => {
    const scheduledFor = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);

    selectMock.mockImplementationOnce(() => ({
      from: () => ({
        where: () => ({
          limit: () =>
            Promise.resolve([
              {
                id: 'test-user-id',
                deletionRequestedAt: new Date(),
                deletionScheduledFor: scheduledFor,
                deleted: false,
              },
            ]),
        }),
      }),
    }));

    const req = new NextRequest('http://localhost/api/user/account/cancel-deletion', {
      method: 'POST',
    });

    const res = await cancelDeletion(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.accountStatus).toBe('active');

    expect(updateMock).toHaveBeenCalled();
    expect(mocks.trackAccountDeletionCancelled).toHaveBeenCalledWith(
      'test-user-id',
      expect.any(Number),
      req
    );
  });

  it('returns 400 when cancelling with no scheduled deletion', async () => {
    selectMock.mockImplementationOnce(() => ({
      from: () => ({
        where: () => ({
          limit: () =>
            Promise.resolve([
              {
                id: 'test-user-id',
                deletionRequestedAt: null,
                deletionScheduledFor: null,
                deleted: false,
              },
            ]),
        }),
      }),
    }));

    const req = new NextRequest('http://localhost/api/user/account/cancel-deletion', {
      method: 'POST',
    });

    const res = await cancelDeletion(req);
    expect(res.status).toBe(400);
    expect(updateMock).not.toHaveBeenCalled();
  });
});
