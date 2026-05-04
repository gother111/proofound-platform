// @vitest-environment node

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  requireApiAuthContext: vi.fn(),
  runPrivacyPreflightCheck: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  requireApiAuthContext: (...args: unknown[]) => mocks.requireApiAuthContext(...args),
}));

vi.mock('@/lib/ai/privacy-preflight', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/ai/privacy-preflight')>();
  return {
    ...actual,
    runPrivacyPreflightCheck: (...args: unknown[]) => mocks.runPrivacyPreflightCheck(...args),
  };
});

import { POST } from '@/app/api/ai/privacy-preflight/check/route';

function request(body: unknown) {
  return new NextRequest('http://localhost/api/ai/privacy-preflight/check', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/ai/privacy-preflight/check', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireApiAuthContext.mockResolvedValue({
      user: { id: 'user-1' },
      supabase: {
        from: vi.fn(),
      },
    });
    mocks.runPrivacyPreflightCheck.mockResolvedValue({
      riskLevel: 'low',
      flags: [],
      safeToPublishSuggestion: 'No high-risk deterministic flags were found.',
      notes: ['This is not a privacy guarantee.'],
      promptVersion: 'ai-privacy-preflight-v1',
      modelReview: { attempted: false, used: false },
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('requires authentication', async () => {
    mocks.requireApiAuthContext.mockResolvedValueOnce(null);

    const response = await POST(request({ text: 'public proof summary' }));

    expect(response.status).toBe(401);
    expect(mocks.runPrivacyPreflightCheck).not.toHaveBeenCalled();
  });

  it('honors the feature-level privacy preflight kill switch', async () => {
    vi.stubEnv('AI_KILL_SWITCH_PRIVACY_PREFLIGHT', 'true');

    const response = await POST(
      request({
        surface: 'proof_publication',
        fields: [{ label: 'proof summary', value: 'Built the release.' }],
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(503);
    expect(payload.code).toBe('ai_feature_kill_switch');
    expect(mocks.runPrivacyPreflightCheck).not.toHaveBeenCalled();
  });

  it('returns deterministic privacy preflight output', async () => {
    const response = await POST(
      request({
        surface: 'proof_publication',
        fields: [{ label: 'proof summary', value: 'Built the release.' }],
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toMatchObject({
      riskLevel: 'low',
      flags: [],
      promptVersion: 'ai-privacy-preflight-v1',
    });
    expect(mocks.runPrivacyPreflightCheck).toHaveBeenCalledWith(
      expect.objectContaining({
        input: expect.objectContaining({ surface: 'proof_publication' }),
        userId: 'user-1',
      })
    );
  });

  it('rejects full file payload fields before privacy preflight service access', async () => {
    const response = await POST(
      request({
        surface: 'proof_publication',
        fields: [{ label: 'proof summary', value: 'Built the release.' }],
        fullFilePayload: 'raw document bytes',
      })
    );

    expect(response.status).toBe(400);
    expect(mocks.runPrivacyPreflightCheck).not.toHaveBeenCalled();
  });

  it('rejects signed URLs and tokenized links before privacy preflight service access', async () => {
    const response = await POST(
      request({
        surface: 'proof_publication',
        fields: [
          {
            label: 'proof summary',
            value: 'Review https://example.com/private.pdf?token=secret before publish.',
          },
        ],
      })
    );

    expect(response.status).toBe(400);
    expect(mocks.runPrivacyPreflightCheck).not.toHaveBeenCalled();
  });
});
