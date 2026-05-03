// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  requireApiAuthContext: vi.fn(),
  composeVerificationRequestForUser: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  requireApiAuthContext: (...args: unknown[]) => mocks.requireApiAuthContext(...args),
}));

vi.mock('@/lib/ai/verification-composer', () => {
  return {
    VERIFICATION_COMPOSER_FIELDS: [
      'title',
      'claim_statement',
      'ownership_statement',
      'outcome_summary',
      'timeframe',
      'evidence_titles',
    ],
    VERIFICATION_SCOPES: [
      'relationship_fact',
      'ownership',
      'observed_behavior',
      'outcome_observation',
      'artifact_familiarity',
    ],
    composeVerificationRequestForUser: (...args: unknown[]) =>
      mocks.composeVerificationRequestForUser(...args),
  };
});

import { POST } from '@/app/api/ai/verifications/compose/route';

function request(body: unknown) {
  return new NextRequest('http://localhost/api/ai/verifications/compose', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('Verification Request Composer route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireApiAuthContext.mockResolvedValue({
      user: { id: 'user-1' },
    });
    mocks.composeVerificationRequestForUser.mockResolvedValue({
      subject: 'Can you confirm this claim?',
      message: 'Please confirm this one scoped claim.',
      claimScope: 'One scoped claim',
      verificationQuestions: ['Can you confirm this claim?'],
      privacyNotes: [],
      tooBroadWarnings: [],
    });
  });

  it('requires an authenticated user', async () => {
    mocks.requireApiAuthContext.mockResolvedValueOnce(null);

    const response = await POST(
      request({
        proofPackId: '11111111-1111-4111-8111-111111111111',
        verifierRelationshipType: 'Peer',
        verificationScope: 'observed_behavior',
        selectedPublicSafeProofFields: ['claim_statement'],
      })
    );

    expect(response.status).toBe(401);
    expect(mocks.composeVerificationRequestForUser).not.toHaveBeenCalled();
  });

  it('rejects requests without a valid Proof Pack or claim', async () => {
    const response = await POST(
      request({
        verifierRelationshipType: 'Peer',
        verificationScope: 'observed_behavior',
        selectedPublicSafeProofFields: ['claim_statement'],
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toBe('Validation failed');
    expect(mocks.composeVerificationRequestForUser).not.toHaveBeenCalled();
  });

  it('returns 404 when composer ownership validation fails', async () => {
    mocks.composeVerificationRequestForUser.mockRejectedValueOnce(
      new Error('PROOF_PACK_NOT_FOUND')
    );

    const response = await POST(
      request({
        proofPackId: '11111111-1111-4111-8111-111111111111',
        verifierRelationshipType: 'Peer',
        verificationScope: 'observed_behavior',
        selectedPublicSafeProofFields: ['claim_statement'],
      })
    );

    expect(response.status).toBe(404);
  });

  it('rejects full file payload fields before composer service access', async () => {
    const response = await POST(
      request({
        proofPackId: '11111111-1111-4111-8111-111111111111',
        verifierRelationshipType: 'Peer',
        verificationScope: 'observed_behavior',
        selectedPublicSafeProofFields: ['claim_statement'],
        fullFilePayload: 'raw private evidence file',
      })
    );

    expect(response.status).toBe(400);
    expect(mocks.composeVerificationRequestForUser).not.toHaveBeenCalled();
  });

  it('rejects signed URLs and tokenized links before composer service access', async () => {
    const response = await POST(
      request({
        proofPackId: '11111111-1111-4111-8111-111111111111',
        verifierRelationshipType: 'Peer https://example.com/proof.pdf?access_token=private-token',
        verificationScope: 'observed_behavior',
        selectedPublicSafeProofFields: ['claim_statement'],
      })
    );

    expect(response.status).toBe(400);
    expect(mocks.composeVerificationRequestForUser).not.toHaveBeenCalled();
  });

  it('strips verifier email before calling the composer service', async () => {
    const response = await POST(
      request({
        proofPackId: '11111111-1111-4111-8111-111111111111',
        verifierEmail: 'verifier@example.com',
        verifierRelationshipType: 'Peer',
        verificationScope: 'observed_behavior',
        selectedPublicSafeProofFields: ['claim_statement', 'ownership_statement'],
        idempotencyKey: 'click-1',
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.verificationQuestions).toEqual(['Can you confirm this claim?']);
    expect(mocks.composeVerificationRequestForUser).toHaveBeenCalledWith(
      expect.not.objectContaining({
        verifierEmail: 'verifier@example.com',
      })
    );
    expect(mocks.composeVerificationRequestForUser).toHaveBeenCalledWith(
      expect.objectContaining({
        proofPackId: '11111111-1111-4111-8111-111111111111',
        userId: 'user-1',
        selectedPublicSafeProofFields: ['claim_statement', 'ownership_statement'],
      })
    );
  });
});
