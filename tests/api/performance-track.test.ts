import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/performance/track/route';
import { db } from '@/db';

vi.mock('@/db', () => ({
  db: {
    insert: vi.fn(() => ({
      values: vi.fn(() => Promise.resolve()),
    })),
  },
}));

describe('/api/performance/track', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('accepts INP metricType and returns 200', async () => {
    const req = new NextRequest('http://localhost/api/performance/track', {
      method: 'POST',
      headers: {
        origin: 'http://localhost',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        metricType: 'inp',
        pageRoute: '/app/i/dashboard',
        valueMs: 123,
        deviceType: 'desktop',
        userAgent: 'test',
        timestamp: new Date().toISOString(),
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(db.insert).toHaveBeenCalled();
  });

  it('rejects unknown metric types', async () => {
    const req = new NextRequest('http://localhost/api/performance/track', {
      method: 'POST',
      headers: {
        origin: 'http://localhost',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        metricType: 'unknown_metric',
        pageRoute: '/x',
        valueMs: 10,
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('rejects cross-origin requests', async () => {
    const req = new NextRequest('http://localhost/api/performance/track', {
      method: 'POST',
      headers: {
        origin: 'http://evil.example',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        metricType: 'inp',
        pageRoute: '/x',
        valueMs: 10,
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(403);
  });
});
