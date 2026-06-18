/** @vitest-environment node */

import { afterEach, describe, expect, it, vi } from 'vitest';
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
import { VISUAL_FEEDBACK_INTERVIEW_IDS } from '@/lib/feedback/visual-fixtures';

describe('GET /api/feedback/[interviewId]', () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  it('serves the visual interview feedback fixture without touching auth data', async () => {
    vi.stubEnv('NEXT_PUBLIC_USE_MOCK_SUPABASE', 'true');
    vi.stubEnv('PROOFOUND_VISUAL_FIXTURES', 'true');
    vi.stubEnv('VERCEL_ENV', 'development');

    const response = await GET(
      new NextRequest(`http://localhost/api/feedback/${VISUAL_FEEDBACK_INTERVIEW_IDS.completed}`),
      {
        params: Promise.resolve({ interviewId: VISUAL_FEEDBACK_INTERVIEW_IDS.completed }),
      }
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.interview.id).toBe(VISUAL_FEEDBACK_INTERVIEW_IDS.completed);
    expect(body.templates.map((template: { name: string }) => template.name)).toEqual([
      'Participant feedback',
      'Organization workflow feedback',
    ]);
    expect(body.responses[0].submitted_by).toBeNull();
    expect(mocks.createClient).not.toHaveBeenCalled();
  });

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
