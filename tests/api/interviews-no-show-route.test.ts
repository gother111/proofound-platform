import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  canManageInterviewAsOrgAdmin: vi.fn(),
  withWorkflowMutationIdempotency: vi.fn(),
  recordInterviewTransition: vi.fn(),
  buildWorkflowView: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: mocks.createClient,
}));

vi.mock('@/lib/interviews/messaging', () => ({
  canManageInterviewAsOrgAdmin: mocks.canManageInterviewAsOrgAdmin,
}));

vi.mock('@/lib/api/workflow-idempotency', () => ({
  withWorkflowMutationIdempotency: mocks.withWorkflowMutationIdempotency,
}));

vi.mock('@/lib/workflow/service', () => ({
  recordInterviewTransition: mocks.recordInterviewTransition,
  buildWorkflowView: mocks.buildWorkflowView,
}));

import { POST } from '@/app/api/interviews/no-show/route';

function malformedRequest() {
  return new NextRequest('https://example.com/api/interviews/no-show', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: '{',
  });
}

describe('POST /api/interviews/no-show', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.createClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'org-admin-1' } },
          error: null,
        }),
      },
    });
  });

  it('returns 400 for malformed JSON without loading interview management context', async () => {
    const response = await POST(malformedRequest());
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({ error: 'Invalid JSON body' });
    expect(mocks.canManageInterviewAsOrgAdmin).not.toHaveBeenCalled();
    expect(mocks.withWorkflowMutationIdempotency).not.toHaveBeenCalled();
    expect(mocks.recordInterviewTransition).not.toHaveBeenCalled();
  });
});
