import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  requireApiAuthContext: vi.fn(),
  findFirst: vi.fn(),
  updateSet: vi.fn(),
  emitVisibilityChanged: vi.fn(),
  emitRedactModeToggled: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  requireApiAuthContext: mocks.requireApiAuthContext,
}));

vi.mock('@/lib/analytics/events', () => ({
  emitVisibilityChanged: mocks.emitVisibilityChanged,
  emitRedactModeToggled: mocks.emitRedactModeToggled,
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
});
