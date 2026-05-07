import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  analyticsInsert: vi.fn(),
  findFirst: vi.fn(),
  updateSet: vi.fn(),
  logError: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: {
      getUser: mocks.getUser,
    },
    from: vi.fn(() => ({
      insert: mocks.analyticsInsert,
    })),
  })),
}));

vi.mock('@/db', () => ({
  db: {
    query: {
      individualProfiles: {
        findFirst: mocks.findFirst,
      },
    },
    update: vi.fn(() => ({
      set: mocks.updateSet,
    })),
  },
}));

vi.mock('@/lib/log', () => ({
  log: {
    error: mocks.logError,
  },
}));

import { GET, POST } from '@/app/api/user/privacy-settings/route';
import { db } from '@/db';

describe('user privacy settings route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getUser.mockResolvedValue({
      data: {
        user: { id: 'user-1' },
      },
      error: null,
    });
    mocks.analyticsInsert.mockResolvedValue({ error: null });
  });

  it('returns private-by-default context fields alongside stored visibility settings', async () => {
    mocks.findFirst.mockResolvedValue({
      fieldVisibility: {
        mission: 'public',
      },
      redactMode: false,
    });

    const response = await GET(new NextRequest('http://localhost/api/user/privacy-settings'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.fieldVisibility).toMatchObject({
      mission: 'public',
      experiences: 'private',
      education: 'private',
      volunteering: 'private',
    });
  });

  it('writes private-by-default context fields when saving a partial payload', async () => {
    const where = vi.fn().mockResolvedValue(undefined);
    mocks.updateSet.mockReturnValue({ where });

    const response = await POST(
      new NextRequest('http://localhost/api/user/privacy-settings', {
        method: 'POST',
        body: JSON.stringify({
          fieldVisibility: {
            mission: 'public',
          },
          redactMode: false,
        }),
      })
    );

    expect(response.status).toBe(200);
    expect(mocks.updateSet).toHaveBeenCalledWith({
      fieldVisibility: {
        mission: 'public',
        experiences: 'private',
        education: 'private',
        volunteering: 'private',
      },
      redactMode: false,
    });
    expect(db.update).toHaveBeenCalledTimes(1);
    expect(mocks.analyticsInsert).toHaveBeenCalledTimes(1);
  });

  it('rejects unknown visibility fields instead of persisting arbitrary keys', async () => {
    const response = await POST(
      new NextRequest('http://localhost/api/user/privacy-settings', {
        method: 'POST',
        body: JSON.stringify({
          fieldVisibility: {
            mission: 'public',
            databaseTable: 'public',
          },
          redactMode: false,
        }),
      })
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe('Invalid privacy settings');
    expect(db.update).not.toHaveBeenCalled();
    expect(mocks.analyticsInsert).not.toHaveBeenCalled();
  });

  it('does not expose backend error details when loading privacy settings fails', async () => {
    mocks.findFirst.mockRejectedValueOnce(
      new Error('relation "individual_profiles" does not exist for verifier@example.com')
    );

    const response = await GET(new NextRequest('http://localhost/api/user/privacy-settings'));
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({ error: 'Failed to fetch privacy settings' });
    expect(JSON.stringify(body)).not.toContain('individual_profiles');
    expect(JSON.stringify(body)).not.toContain('verifier@example.com');
    expect(JSON.stringify(mocks.logError.mock.calls)).not.toContain('individual_profiles');
    expect(JSON.stringify(mocks.logError.mock.calls)).not.toContain('verifier@example.com');
  });
});
