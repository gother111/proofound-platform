import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  requireApiAuthContext: vi.fn(),
  findFirst: vi.fn(),
  updateSet: vi.fn(),
  emitVisibilityChanged: vi.fn(),
  emitRedactModeToggled: vi.fn(),
  logError: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  requireApiAuthContext: mocks.requireApiAuthContext,
}));

vi.mock('@/lib/analytics/events', () => ({
  emitVisibilityChanged: mocks.emitVisibilityChanged,
  emitRedactModeToggled: mocks.emitRedactModeToggled,
}));

vi.mock('@/lib/log', () => ({
  log: {
    error: mocks.logError,
  },
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

import { GET, POST } from '@/app/api/profile/privacy-settings/route';
import { db } from '@/db';

describe('profile privacy settings route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireApiAuthContext.mockResolvedValue({
      user: { id: 'user-1' },
    });
  });

  it('merges private-by-default context fields into fetched visibility settings', async () => {
    mocks.findFirst.mockResolvedValue({
      fieldVisibility: {
        mission: 'public',
      },
      redactMode: false,
    });

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.fieldVisibility).toMatchObject({
      mission: 'public',
      experiences: 'private',
      education: 'private',
      volunteering: 'private',
    });
  });

  it('does not expose backend error details when fetching visibility settings fails', async () => {
    mocks.findFirst.mockRejectedValueOnce(
      new Error('relation "individual_profiles" does not exist for verifier@example.com')
    );

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({
      error: 'Failed to fetch privacy settings',
    });
    expect(JSON.stringify(body)).not.toContain('individual_profiles');
    expect(JSON.stringify(body)).not.toContain('verifier@example.com');
    expect(JSON.stringify(mocks.logError.mock.calls)).not.toContain('individual_profiles');
    expect(JSON.stringify(mocks.logError.mock.calls)).not.toContain('verifier@example.com');
  });

  it('persists private-by-default context fields when saving partial visibility settings', async () => {
    mocks.findFirst.mockResolvedValue({
      fieldVisibility: {},
      redactMode: false,
    });

    const where = vi.fn().mockResolvedValue(undefined);
    mocks.updateSet.mockReturnValue({ where });

    const response = await POST(
      new NextRequest('http://localhost/api/profile/privacy-settings', {
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
    expect(mocks.updateSet).toHaveBeenCalledWith(
      expect.objectContaining({
        fieldVisibility: {
          mission: 'public',
          experiences: 'private',
          education: 'private',
          volunteering: 'private',
        },
        redactMode: false,
      })
    );
    expect(db.update).toHaveBeenCalledTimes(1);
  });

  it('rejects unknown visibility fields instead of persisting arbitrary keys', async () => {
    const response = await POST(
      new NextRequest('http://localhost/api/profile/privacy-settings', {
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
  });
});
