// @vitest-environment node

import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

const mocks = vi.hoisted(() => {
  class MockProofArtifactOcrError extends Error {
    constructor(
      readonly code: string,
      readonly status: number
    ) {
      super(code);
      this.name = 'ProofArtifactOcrError';
    }
  }

  return {
    dbWhere: vi.fn(),
    requireApiAuthContext: vi.fn(),
    extractProofArtifactText: vi.fn(),
    applyProofArtifactOcrDraft: vi.fn(),
    isProofArtifactOcrEligible: vi.fn(),
    resolveGcpCvOcrConfig: vi.fn(),
    resolveGcpCvOcrSafeStatus: vi.fn(),
    ProofArtifactOcrError: MockProofArtifactOcrError,
  };
});

vi.mock('@/db', () => ({
  db: {
    select: () => ({
      from: () => ({
        where: (...args: unknown[]) => mocks.dbWhere(...args),
      }),
    }),
  },
}));

vi.mock('@/lib/auth', () => ({
  requireApiAuthContext: (...args: unknown[]) => mocks.requireApiAuthContext(...args),
}));

vi.mock('@/lib/expertise/gcp-cv-ocr-config', () => ({
  resolveGcpCvOcrConfig: (...args: unknown[]) => mocks.resolveGcpCvOcrConfig(...args),
}));

vi.mock('@/lib/expertise/gcp-cv-ocr-status', () => ({
  resolveGcpCvOcrSafeStatus: (...args: unknown[]) => mocks.resolveGcpCvOcrSafeStatus(...args),
}));

vi.mock('@/lib/proof-artifacts/text-extraction', () => ({
  ProofArtifactOcrError: mocks.ProofArtifactOcrError,
  ProofArtifactOcrConsentSchema: z
    .object({
      consentToProcess: z.literal(true),
    })
    .strict(),
  ApplyProofArtifactOcrDraftSchema: z
    .object({
      proofPackId: z.string().uuid(),
      sourceExtractionRequestId: z.string().trim().max(128).optional().nullable(),
      selectedFields: z
        .object({
          title: z.string().trim().min(1).max(180).optional(),
          summary: z.string().trim().min(1).max(1200).optional(),
          evidenceSummary: z.string().trim().min(1).max(1200).optional(),
          outcomesSummary: z.string().trim().min(1).max(1200).optional(),
          ownershipStatement: z.string().trim().min(1).max(800).optional(),
        })
        .strict()
        .refine((fields) => Object.keys(fields).length > 0, {
          message: 'At least one selected draft field is required.',
        }),
    })
    .strict(),
  extractProofArtifactText: (...args: unknown[]) => mocks.extractProofArtifactText(...args),
  applyProofArtifactOcrDraft: (...args: unknown[]) => mocks.applyProofArtifactOcrDraft(...args),
  isProofArtifactOcrEligible: (...args: unknown[]) => mocks.isProofArtifactOcrEligible(...args),
}));

import { POST as extractText } from '@/app/api/proof-artifacts/[artifactId]/text-extraction/route';
import { POST as applyTextDraft } from '@/app/api/proof-artifacts/[artifactId]/text-extraction/apply/route';
import { GET as getTextExtractionStatus } from '@/app/api/proof-artifacts/text-extraction/status/route';

const USER_ID = '11111111-1111-4111-8111-111111111111';
const ARTIFACT_ID = '22222222-2222-4222-8222-222222222222';
const PROOF_PACK_ID = '33333333-3333-4333-8333-333333333333';

function jsonRequest(url: string, body: unknown) {
  return new NextRequest(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function malformedJsonRequest(url: string) {
  return new NextRequest(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: '{',
  });
}

function artifactParams() {
  return {
    params: Promise.resolve({
      artifactId: ARTIFACT_ID,
    }),
  };
}

function authContext() {
  return {
    user: {
      id: USER_ID,
    },
    supabase: {
      auth: {
        getUser: vi.fn(async () => ({
          data: {
            user: {
              email: 'owner@example.com',
            },
          },
        })),
      },
    },
  };
}

describe('Proof artifact OCR API routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireApiAuthContext.mockResolvedValue(authContext());
    mocks.dbWhere.mockResolvedValue([
      {
        orgId: 'org-1',
        role: 'org_reviewer',
      },
    ]);
    mocks.extractProofArtifactText.mockResolvedValue({
      status: 'completed',
      artifactId: ARTIFACT_ID,
      draftOnly: true,
      extractedTextPreview: 'Launch memo preview',
      privacyRiskWarnings: [],
    });
    mocks.applyProofArtifactOcrDraft.mockResolvedValue({
      ok: true,
      proofPackId: PROOF_PACK_ID,
      artifactId: ARTIFACT_ID,
      appliedFields: ['summary'],
      draftOnly: true,
    });
    mocks.isProofArtifactOcrEligible.mockResolvedValue(true);
    mocks.resolveGcpCvOcrConfig.mockReturnValue({
      available: true,
      maxFileSizeMb: 9,
      maxPages: 12,
      allowedMimeTypes: ['application/pdf', 'image/png'],
      unavailableReason: null,
    });
    mocks.resolveGcpCvOcrSafeStatus.mockResolvedValue({
      status: 'ready',
    });
  });

  it('requires authentication before extracting proof artifact text', async () => {
    mocks.requireApiAuthContext.mockResolvedValueOnce(null);

    const response = await extractText(
      jsonRequest(`http://localhost/api/proof-artifacts/${ARTIFACT_ID}/text-extraction`, {
        consentToProcess: true,
      }),
      artifactParams()
    );

    expect(response.status).toBe(401);
    expect(mocks.dbWhere).not.toHaveBeenCalled();
    expect(mocks.extractProofArtifactText).not.toHaveBeenCalled();
  });

  it('requires explicit OCR consent before loading beta context or provider work', async () => {
    const response = await extractText(
      jsonRequest(`http://localhost/api/proof-artifacts/${ARTIFACT_ID}/text-extraction`, {
        consentToProcess: false,
      }),
      artifactParams()
    );
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toBe('Explicit OCR consent is required.');
    expect(mocks.dbWhere).not.toHaveBeenCalled();
    expect(mocks.extractProofArtifactText).not.toHaveBeenCalled();
  });

  it('returns 400 for malformed extraction JSON before loading beta context or provider work', async () => {
    const response = await extractText(
      malformedJsonRequest(`http://localhost/api/proof-artifacts/${ARTIFACT_ID}/text-extraction`),
      artifactParams()
    );
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload).toEqual({ error: 'Invalid JSON body' });
    expect(mocks.dbWhere).not.toHaveBeenCalled();
    expect(mocks.extractProofArtifactText).not.toHaveBeenCalled();
  });

  it('passes only scoped auth, membership, and consent context into text extraction', async () => {
    const response = await extractText(
      jsonRequest(`http://localhost/api/proof-artifacts/${ARTIFACT_ID}/text-extraction`, {
        consentToProcess: true,
      }),
      artifactParams()
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(payload).toMatchObject({
      status: 'completed',
      artifactId: ARTIFACT_ID,
      draftOnly: true,
    });
    expect(mocks.extractProofArtifactText).toHaveBeenCalledWith({
      artifactId: ARTIFACT_ID,
      userId: USER_ID,
      userEmail: 'owner@example.com',
      orgIds: ['org-1'],
      roles: ['org_reviewer'],
      consentToProcess: true,
    });
  });

  it('maps OCR extraction errors to safe public messages', async () => {
    mocks.extractProofArtifactText.mockRejectedValueOnce(
      new mocks.ProofArtifactOcrError('PROOF_ARTIFACT_FILE_UNAVAILABLE', 409)
    );

    const response = await extractText(
      jsonRequest(`http://localhost/api/proof-artifacts/${ARTIFACT_ID}/text-extraction`, {
        consentToProcess: true,
      }),
      artifactParams()
    );
    const payload = await response.json();

    expect(response.status).toBe(409);
    expect(payload).toEqual({
      error: 'Proof artifact OCR is not available.',
    });
    expect(JSON.stringify(payload)).not.toMatch(/bucket|path|storage|signed|filename/i);
  });

  it('applies only selected OCR draft fields through the apply route', async () => {
    const response = await applyTextDraft(
      jsonRequest(`http://localhost/api/proof-artifacts/${ARTIFACT_ID}/text-extraction/apply`, {
        proofPackId: PROOF_PACK_ID,
        selectedFields: {
          summary: 'User-selected OCR draft summary.',
        },
        sourceExtractionRequestId: 'proof_ocr_route_test',
      }),
      artifactParams()
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(payload).toMatchObject({
      ok: true,
      proofPackId: PROOF_PACK_ID,
      artifactId: ARTIFACT_ID,
      draftOnly: true,
    });
    expect(mocks.applyProofArtifactOcrDraft).toHaveBeenCalledWith({
      artifactId: ARTIFACT_ID,
      proofPackId: PROOF_PACK_ID,
      selectedFields: {
        summary: 'User-selected OCR draft summary.',
      },
      sourceExtractionRequestId: 'proof_ocr_route_test',
      userId: USER_ID,
      userEmail: 'owner@example.com',
      orgIds: ['org-1'],
      roles: ['org_reviewer'],
    });
  });

  it('rejects apply requests with no selected fields before service access', async () => {
    const response = await applyTextDraft(
      jsonRequest(`http://localhost/api/proof-artifacts/${ARTIFACT_ID}/text-extraction/apply`, {
        proofPackId: PROOF_PACK_ID,
        selectedFields: {},
      }),
      artifactParams()
    );

    expect(response.status).toBe(400);
    expect(mocks.applyProofArtifactOcrDraft).not.toHaveBeenCalled();
  });

  it('returns 400 for malformed apply JSON before loading beta context or service access', async () => {
    const response = await applyTextDraft(
      malformedJsonRequest(
        `http://localhost/api/proof-artifacts/${ARTIFACT_ID}/text-extraction/apply`
      ),
      artifactParams()
    );
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload).toEqual({ error: 'Invalid JSON body' });
    expect(mocks.dbWhere).not.toHaveBeenCalled();
    expect(mocks.applyProofArtifactOcrDraft).not.toHaveBeenCalled();
  });

  it('returns redacted status and capped OCR limits', async () => {
    const response = await getTextExtractionStatus();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(payload).toEqual({
      visible: true,
      available: true,
      status: 'ready',
      unavailableReason: null,
      limits: {
        maxFileSizeMb: 5,
        maxPages: 4,
        allowedMimeTypes: ['application/pdf', 'image/png'],
      },
    });
    expect(mocks.isProofArtifactOcrEligible).toHaveBeenCalledWith({
      userId: USER_ID,
      userEmail: 'owner@example.com',
      orgIds: ['org-1'],
      roles: ['org_reviewer'],
    });
  });

  it('does not expose OCR availability details when the beta surface is hidden', async () => {
    mocks.isProofArtifactOcrEligible.mockResolvedValueOnce(false);
    mocks.resolveGcpCvOcrConfig.mockReturnValueOnce({
      available: false,
      unavailableReason: 'missing_shared_secret',
      maxFileSizeMb: 5,
      maxPages: 4,
      allowedMimeTypes: ['application/pdf'],
    });

    const response = await getTextExtractionStatus();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toMatchObject({
      visible: false,
      available: false,
      unavailableReason: null,
    });
    expect(JSON.stringify(payload)).not.toContain('missing_shared_secret');
  });
});
