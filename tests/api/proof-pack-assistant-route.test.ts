// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  requireApiAuthContext: vi.fn(),
  suggestProofPackForUser: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  requireApiAuthContext: (...args: unknown[]) => mocks.requireApiAuthContext(...args),
}));

vi.mock('@/lib/ai/proof-pack-assistant', () => ({
  suggestProofPackForUser: (...args: unknown[]) => mocks.suggestProofPackForUser(...args),
}));

import { POST } from '@/app/api/ai/proof-pack/suggest/route';

function request(body: unknown) {
  return new NextRequest('http://localhost/api/ai/proof-pack/suggest', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('Proof Pack Assistant route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireApiAuthContext.mockResolvedValue({
      user: { id: 'user-1' },
    });
    mocks.suggestProofPackForUser.mockResolvedValue({
      missingContext: [],
      suggestedRewrite: { title: 'Better proof title' },
      privacyFlags: [],
      verificationSuggestions: [],
      warnings: [],
    });
  });

  it('requires an authenticated user', async () => {
    mocks.requireApiAuthContext.mockResolvedValueOnce(null);

    const response = await POST(request({ proofPackId: '11111111-1111-4111-8111-111111111111' }));

    expect(response.status).toBe(401);
    expect(mocks.suggestProofPackForUser).not.toHaveBeenCalled();
  });

  it('returns 404 when ownership validation fails', async () => {
    mocks.suggestProofPackForUser.mockRejectedValueOnce(new Error('PROOF_PACK_NOT_FOUND'));

    const response = await POST(request({ proofPackId: '11111111-1111-4111-8111-111111111111' }));
    const payload = await response.json();

    expect(response.status).toBe(404);
    expect(payload.error).toBe('Proof Pack not found');
  });

  it('rejects full file payload fields before assistant service access', async () => {
    const response = await POST(
      request({
        proofPackId: '11111111-1111-4111-8111-111111111111',
        fullFilePayload: 'raw private PDF contents',
      })
    );

    expect(response.status).toBe(400);
    expect(mocks.suggestProofPackForUser).not.toHaveBeenCalled();
  });

  it('rejects tokenized links before assistant service access', async () => {
    const response = await POST(
      request({
        proofPackId: '11111111-1111-4111-8111-111111111111',
        idempotencyKey: 'https://storage.googleapis.com/private/file.pdf?X-Goog-Signature=abc',
      })
    );

    expect(response.status).toBe(400);
    expect(mocks.suggestProofPackForUser).not.toHaveBeenCalled();
  });

  it('returns structured suggestions and does not save them in the route', async () => {
    const response = await POST(
      request({
        proofPackId: '11111111-1111-4111-8111-111111111111',
        idempotencyKey: 'click-1',
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toMatchObject({
      missingContext: [],
      suggestedRewrite: { title: 'Better proof title' },
      privacyFlags: [],
      verificationSuggestions: [],
      warnings: [],
    });
    expect(mocks.suggestProofPackForUser).toHaveBeenCalledWith(
      expect.objectContaining({
        proofPackId: '11111111-1111-4111-8111-111111111111',
        userId: 'user-1',
        idempotencyKey: 'click-1',
      })
    );
  });
});
