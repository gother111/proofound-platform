/** @vitest-environment node */

import { describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  logError: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: mocks.createClient,
}));

vi.mock('@/lib/log', () => ({
  log: {
    error: mocks.logError,
  },
}));

import { GET } from '@/app/api/feedback/[interviewId]/route';

describe('GET /api/feedback/[interviewId]', () => {
  it('logs route-level load failures with structured diagnostics', async () => {
    const loadError = new Error('feedback client unavailable');
    mocks.createClient.mockRejectedValue(loadError);

    const response = await GET(new NextRequest('https://proofound.io/api/feedback/interview-1'), {
      params: Promise.resolve({ interviewId: '11111111-1111-4111-8111-111111111111' }),
    });
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({ error: 'Failed to load feedback' });
    expect(mocks.logError).toHaveBeenCalledWith('feedback.load.failed', {
      error: loadError,
    });
  });
});
