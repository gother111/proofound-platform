import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  insertValues: vi.fn(),
  syncConsentObligation: vi.fn(),
  getConsentCheck: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: {
      getUser: mocks.getUser,
    },
  })),
}));

vi.mock('@/db', () => ({
  db: {
    insert: vi.fn(() => ({
      values: mocks.insertValues,
    })),
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          orderBy: vi.fn(async () => []),
        })),
      })),
    })),
  },
}));

vi.mock('@/lib/workflow/service', () => ({
  getConsentCheck: mocks.getConsentCheck,
  syncConsentObligation: mocks.syncConsentObligation,
}));

vi.mock('@/lib/utils/privacy', () => ({
  anonymizeIP: vi.fn(() => 'ip-hash'),
  anonymizeUserAgent: vi.fn(() => 'ua-hash'),
}));

vi.mock('@/lib/log', () => ({
  log: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

import { POST } from '@/app/api/user/consent/route';
import { db } from '@/db';

describe('/api/user/consent route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getUser.mockResolvedValue({
      data: { user: { id: '11111111-1111-4111-8111-111111111111' } },
      error: null,
    });
    mocks.insertValues.mockResolvedValue(undefined);
    mocks.getConsentCheck.mockResolvedValue({ obligations: [] });
  });

  it('rejects malformed JSON before consent writes or workflow sync', async () => {
    const response = await POST(
      new NextRequest('http://localhost/api/user/consent', {
        method: 'POST',
        body: '{"consents":',
        headers: { 'content-type': 'application/json' },
      })
    );

    await expect(response.json()).resolves.toEqual({ error: 'Invalid JSON body' });
    expect(response.status).toBe(400);
    expect(db.insert).not.toHaveBeenCalled();
    expect(mocks.syncConsentObligation).not.toHaveBeenCalled();
  });
});
