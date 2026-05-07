import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  getPurposeEditHistory: vi.fn(),
  logError: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: {
      getUser: mocks.getUser,
    },
  })),
}));

vi.mock('@/lib/audit/purpose-log', () => ({
  getPurposeEditHistory: mocks.getPurposeEditHistory,
}));

vi.mock('@/lib/log', () => ({
  log: {
    error: mocks.logError,
  },
}));

import { GET } from '@/app/api/user/audit-log/purpose/route';

describe('user purpose audit log route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getUser.mockResolvedValue({
      data: {
        user: { id: 'user-1' },
      },
      error: null,
    });
    mocks.getPurposeEditHistory.mockResolvedValue([]);
  });

  it('returns the authenticated user purpose history', async () => {
    mocks.getPurposeEditHistory.mockResolvedValueOnce([
      {
        id: 'entry-1',
        userId: 'user-1',
        fieldName: 'mission',
        oldValue: 'old',
        newValue: 'new',
      },
    ]);

    const response = await GET(
      new NextRequest('http://localhost/api/user/audit-log/purpose?field=mission&limit=5')
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.count).toBe(1);
    expect(mocks.getPurposeEditHistory).toHaveBeenCalledWith('user-1', 'mission', 5);
  });

  it('does not expose backend error details when history lookup fails', async () => {
    mocks.getPurposeEditHistory.mockRejectedValueOnce(
      new Error('relation "purpose_edit_log" does not exist for verifier@example.com')
    );

    const response = await GET(new NextRequest('http://localhost/api/user/audit-log/purpose'));
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({
      error: 'Failed to fetch purpose edit history',
    });
    expect(JSON.stringify(body)).not.toContain('purpose_edit_log');
    expect(JSON.stringify(body)).not.toContain('verifier@example.com');
    expect(JSON.stringify(mocks.logError.mock.calls)).not.toContain('purpose_edit_log');
    expect(JSON.stringify(mocks.logError.mock.calls)).not.toContain('verifier@example.com');
  });
});
