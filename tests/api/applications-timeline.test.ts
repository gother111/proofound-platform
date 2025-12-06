import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET as getApplication } from '@/app/api/applications/[id]/route';
import { NextRequest } from 'next/server';

vi.mock('@/lib/auth', () => ({
  requireAuth: vi.fn(() => Promise.resolve({ id: 'test-user' })),
}));

const mockFindFirst = vi.fn();

vi.mock('@/db', () => ({
  db: {
    query: {
      applicationTimeline: {
        findFirst: (...args: any[]) => mockFindFirst(...args),
      },
      assignments: {
        findFirst: vi.fn(() => Promise.resolve({ id: 'a1', role: 'Engineer' })),
      },
    },
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        orderBy: vi.fn(() => []),
      })),
    })),
  },
}));

describe('Applications timeline API', () => {
  beforeEach(() => {
    mockFindFirst.mockReset();
  });

  it('returns 404 when timeline not found', async () => {
    mockFindFirst.mockResolvedValue(null);
    const req = new NextRequest('http://localhost/api/applications/unknown');
    const res = await getApplication(req, { params: Promise.resolve({ id: 'missing' }) });
    expect(res.status).toBe(404);
  });
});
