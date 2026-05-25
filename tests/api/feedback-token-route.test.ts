/** @vitest-environment node */

import { describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  createAdminClient: vi.fn(),
  logError: vi.fn(),
}));

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: mocks.createAdminClient,
}));

vi.mock('@/lib/feedback/visual-fixtures', () => ({
  buildVisualFeedbackTokenResponse: vi.fn(),
  feedbackVisualFixturesEnabled: vi.fn(() => false),
}));

vi.mock('@/lib/feature-flags/server', () => ({
  isFeatureEnabled: vi.fn(),
}));

vi.mock('@/lib/security/capability-tokens', () => ({
  beginCapabilityTokenRedeemSession: vi.fn(),
  CAPABILITY_REDEEM_SESSION_MAX_AGE_SECONDS: 900,
  CAPABILITY_TOKEN_CLASSES: {
    FEEDBACK_RESPONSE: 'feedback_response',
  },
  getCapabilityRedeemSessionCookieName: vi.fn(() => 'feedback-cookie'),
}));

vi.mock('@/lib/log', () => ({
  log: {
    error: mocks.logError,
  },
}));

import { GET } from '@/app/api/feedback/token/[token]/route';

describe('GET /api/feedback/token/[token]', () => {
  it('logs lookup failures with structured diagnostics', async () => {
    const lookupError = new Error('admin client unavailable');
    mocks.createAdminClient.mockImplementation(() => {
      throw lookupError;
    });

    const response = await GET(new NextRequest('https://proofound.io/api/feedback/token/test'), {
      params: Promise.resolve({ token: 'feedback-token' }),
    });
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({ error: 'Failed to load feedback form' });
    expect(mocks.logError).toHaveBeenCalledWith('feedback.token.lookup_failed', {
      error: lookupError,
    });
  });
});
