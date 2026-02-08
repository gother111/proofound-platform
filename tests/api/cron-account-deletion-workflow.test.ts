import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

import { GET as cronWorkflow } from '@/app/api/cron/account-deletion-workflow/route';

const mockAdminClient = {
  auth: {
    admin: {
      getUserById: vi.fn(),
      deleteUser: vi.fn(),
    },
  },
};

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(() => mockAdminClient),
}));

vi.mock('@/lib/email', () => ({
  sendDeletionReminderEmail: vi.fn(() => Promise.resolve()),
  sendDeletionCompleteEmail: vi.fn(() => Promise.resolve()),
}));

vi.mock('@/lib/analytics/fairness-note-generator', () => ({
  generateFairnessNote: vi.fn(() => Promise.resolve('note-1')),
}));

const selectMock = vi.fn();
const insertMock = vi.fn(() => Promise.resolve());
const executeMock = vi.fn(() => Promise.resolve());

vi.mock('@/db', () => ({
  db: {
    select: (...args: any[]) => (selectMock as any)(...args),
    insert: (...args: any[]) => ({ values: insertMock }) as any,
    execute: (...args: any[]) => (executeMock as any)(...args),
  },
}));

describe('Account deletion cron workflow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    selectMock.mockReset();
    process.env.CRON_SECRET = 'test-secret';
  });

  it('returns 401 without valid authorization header', async () => {
    const req = new NextRequest('http://localhost/api/cron/account-deletion-workflow');
    const res = await cronWorkflow(req);
    expect(res.status).toBe(401);
  });

  it('anonymizes account and deletes auth user when scheduled date has passed', async () => {
    // Step 1: reminders
    selectMock.mockImplementationOnce(() => ({
      from: () => ({
        where: () => Promise.resolve([]),
      }),
    }));

    // Step 2: deletions
    selectMock.mockImplementationOnce(() => ({
      from: () => ({
        where: () =>
          Promise.resolve([
            { id: 'user-1', deletionScheduledFor: new Date('2020-01-01T00:00:00.000Z') },
          ]),
      }),
    }));

    mockAdminClient.auth.admin.getUserById.mockResolvedValue({
      data: { user: { email: 'user@example.com' } },
      error: null,
    });
    mockAdminClient.auth.admin.deleteUser.mockResolvedValue({ data: {}, error: null });

    const req = new NextRequest('http://localhost/api/cron/account-deletion-workflow', {
      headers: {
        authorization: `Bearer ${process.env.CRON_SECRET}`,
      },
    });

    const res = await cronWorkflow(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.deletions.processed).toBe(1);

    expect(executeMock).toHaveBeenCalledTimes(1);
    expect(mockAdminClient.auth.admin.deleteUser).toHaveBeenCalledWith('user-1');
  });

  it('skips reminder when already sent for same scheduledFor', async () => {
    const sevenDaysOut = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // Step 1: reminders has 1 account
    selectMock.mockImplementationOnce(() => ({
      from: () => ({
        where: () => Promise.resolve([{ id: 'user-2', deletionScheduledFor: sevenDaysOut }]),
      }),
    }));

    // Existing reminder found
    selectMock.mockImplementationOnce(() => ({
      from: () => ({
        where: () => ({
          limit: () => Promise.resolve([{}]),
        }),
      }),
    }));

    // Step 2: deletions none
    selectMock.mockImplementationOnce(() => ({
      from: () => ({
        where: () => Promise.resolve([]),
      }),
    }));

    const req = new NextRequest('http://localhost/api/cron/account-deletion-workflow', {
      headers: {
        authorization: `Bearer ${process.env.CRON_SECRET}`,
      },
    });

    const res = await cronWorkflow(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.reminders.processed).toBe(1);
    expect(body.reminders.results[0].status).toBe('skipped');
    expect(mockAdminClient.auth.admin.getUserById).not.toHaveBeenCalled();
  });
});
