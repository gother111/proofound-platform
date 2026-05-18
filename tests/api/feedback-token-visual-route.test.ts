/** @vitest-environment node */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(),
}));

import { GET } from '@/app/api/feedback/token/[token]/route';
import { VISUAL_FEEDBACK_TOKENS } from '@/lib/feedback/visual-fixtures';
import { createAdminClient } from '@/lib/supabase/admin';

describe('GET /api/feedback/token/[token] visual fixture', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('NEXT_PUBLIC_USE_MOCK_SUPABASE', 'true');
    vi.stubEnv('PROOFOUND_VISUAL_FIXTURES', 'true');
    vi.stubEnv('VERCEL_ENV', 'development');
  });

  it('serves the filled feedback form fixture without touching admin data', async () => {
    const response = await GET(
      new NextRequest(
        `http://localhost/api/feedback/token/${VISUAL_FEEDBACK_TOKENS.pendingCandidateToOrg}`
      ),
      {
        params: Promise.resolve({ token: VISUAL_FEEDBACK_TOKENS.pendingCandidateToOrg }),
      }
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.token).toBe(VISUAL_FEEDBACK_TOKENS.pendingCandidateToOrg);
    expect(payload.template.name).toMatch(/Candidate to organization/i);
    expect(payload.questions).toHaveLength(2);
    expect(createAdminClient).not.toHaveBeenCalled();
  });
});
