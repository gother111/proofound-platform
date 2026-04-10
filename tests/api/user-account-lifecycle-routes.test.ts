import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  requireApiAuthContext: vi.fn(),
  getLatestProfileDeletionRequest: vi.fn(),
  createProfileDeletionRequest: vi.fn(),
  updateProfileDeletionRequestState: vi.fn(),
  createLifecycleOperation: vi.fn(),
  executeAccountDeletionLifecycle: vi.fn(),
  finalizeLifecycleOperation: vi.fn(),
  authGetUser: vi.fn(),
  signInWithPassword: vi.fn(),
  adminDeleteUser: vi.fn(),
  select: vi.fn(),
  execute: vi.fn(),
  logInfo: vi.fn(),
  logWarn: vi.fn(),
  logError: vi.fn(),
}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn(() => 'eq'),
  sql: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  requireApiAuthContext: mocks.requireApiAuthContext,
}));

vi.mock('@/db', () => ({
  db: {
    select: mocks.select,
    execute: mocks.execute,
  },
}));

vi.mock('@/db/schema', () => ({
  profiles: {
    id: 'id',
    lifecycleState: 'lifecycleState',
    deletionRequestedAt: 'deletionRequestedAt',
    deleted: 'deleted',
  },
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: {
      getUser: mocks.authGetUser,
      signInWithPassword: mocks.signInWithPassword,
    },
  }),
}));

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn().mockReturnValue({
    auth: {
      admin: {
        deleteUser: mocks.adminDeleteUser,
      },
    },
  }),
}));

vi.mock('@/lib/lifecycle/reconciliation', () => ({
  createLifecycleOperation: mocks.createLifecycleOperation,
  executeAccountDeletionLifecycle: mocks.executeAccountDeletionLifecycle,
  finalizeLifecycleOperation: mocks.finalizeLifecycleOperation,
}));

vi.mock('@/lib/lifecycle/residual', () => ({
  createProfileDeletionRequest: mocks.createProfileDeletionRequest,
  getLatestProfileDeletionRequest: mocks.getLatestProfileDeletionRequest,
  updateProfileDeletionRequestState: mocks.updateProfileDeletionRequestState,
}));

vi.mock('@/lib/launch/trace', () => ({
  emitLaunchTrace: vi.fn(),
  startLaunchTrace: vi.fn(() => ({
    objectRefs: {},
  })),
}));

vi.mock('@/lib/log', () => ({
  log: {
    info: mocks.logInfo,
    error: mocks.logError,
    warn: mocks.logWarn,
  },
}));

import { GET as getAccountStatus } from '@/app/api/user/account/route';
import { DELETE as deleteAccount } from '@/app/api/user/account/route';
import { POST as cancelDeletion } from '@/app/api/user/account/cancel-deletion/route';

function mockProfileLookup(profile: Record<string, unknown> | undefined) {
  const limit = vi.fn().mockResolvedValue(profile ? [profile] : []);
  const where = vi.fn().mockReturnValue({ limit });
  const from = vi.fn().mockReturnValue({ where });
  mocks.select.mockReturnValue({ from });
}

describe('/api/user/account lifecycle routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.authGetUser.mockResolvedValue({
      data: { user: { email: 'user-1@example.com' } },
      error: null,
    });
    mocks.signInWithPassword.mockResolvedValue({ error: null });
    mocks.createLifecycleOperation.mockResolvedValue({ id: 'operation-1' });
    mocks.createProfileDeletionRequest.mockResolvedValue({ id: 'deletion-1' });
    mocks.updateProfileDeletionRequestState.mockResolvedValue(undefined);
    mocks.adminDeleteUser.mockResolvedValue({ error: null });
    mocks.execute.mockResolvedValue(undefined);
    mocks.executeAccountDeletionLifecycle.mockResolvedValue(undefined);
    mocks.finalizeLifecycleOperation.mockResolvedValue(undefined);
  });

  it('reports immediate irreversible deletion status without a cancel window', async () => {
    mocks.requireApiAuthContext.mockResolvedValue({
      user: { id: 'user-1' },
    });
    mocks.getLatestProfileDeletionRequest.mockResolvedValue({
      lifecycleState: 'deleted',
      requestedAt: new Date('2026-04-09T10:00:00.000Z'),
    });
    mockProfileLookup({
      id: 'user-1',
      lifecycleState: 'active',
      deletionRequestedAt: null,
      deleted: false,
    });

    const response = await getAccountStatus();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      accountStatus: 'deleted',
      deletionRequestedAt: '2026-04-09T10:00:00.000Z',
      deletionScheduledFor: null,
      daysRemaining: null,
      canCancelDeletion: false,
    });
  });

  it('returns 410 for cancel deletion because scheduled deletion is not supported', async () => {
    mocks.requireApiAuthContext.mockResolvedValue({
      user: { id: 'user-1' },
    });

    const response = await cancelDeletion();
    const body = await response.json();

    expect(response.status).toBe(410);
    expect(body).toEqual({
      error: 'Cancellation unavailable',
      message:
        'Account deletion is immediate and irreversible. There is no scheduled deletion state to cancel.',
    });
  });

  it('deletes the account immediately after password confirmation', async () => {
    mocks.requireApiAuthContext.mockResolvedValue({
      user: { id: 'user-1' },
    });
    mockProfileLookup({
      id: 'user-1',
      lifecycleState: 'active',
      deletionRequestedAt: null,
      deleted: false,
    });

    const response = await deleteAccount(
      new NextRequest('http://localhost/api/user/account', {
        method: 'DELETE',
        body: JSON.stringify({
          password: 'TestPassword123!',
          confirmPhrase: 'DELETE MY ACCOUNT',
          reason: 'Privacy request',
        }),
        headers: {
          'content-type': 'application/json',
        },
      })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      status: 'deleted',
      deletionRequestId: 'deletion-1',
      operationId: 'operation-1',
      message: 'Your account has been permanently deleted. This action cannot be undone.',
    });
    expect(mocks.signInWithPassword).toHaveBeenCalledWith({
      email: 'user-1@example.com',
      password: 'TestPassword123!',
    });
    expect(mocks.adminDeleteUser).toHaveBeenCalledWith('user-1');
    expect(mocks.execute).toHaveBeenCalled();
    expect(mocks.executeAccountDeletionLifecycle).toHaveBeenCalledWith({
      userId: 'user-1',
      reason: 'Privacy request',
      operationId: 'operation-1',
    });
    expect(mocks.updateProfileDeletionRequestState).toHaveBeenCalledWith(
      expect.objectContaining({
        deletionRequestId: 'deletion-1',
        toState: 'deleted',
      })
    );
  });
});
