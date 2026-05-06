// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  dbExecute: vi.fn(),
  createAdminClient: vi.fn(),
  extractTextFromDocument: vi.fn(),
  isFeatureEnabled: vi.fn(),
  recordUploadEvent: vi.fn(),
}));

vi.mock('@/db', () => ({
  db: {
    execute: (...args: unknown[]) => mocks.dbExecute(...args),
  },
}));

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: (...args: unknown[]) => mocks.createAdminClient(...args),
}));

vi.mock('@/lib/expertise/document-extraction-provider', () => ({
  extractTextFromDocument: (...args: unknown[]) => mocks.extractTextFromDocument(...args),
}));

vi.mock('@/lib/feature-flags/server', () => ({
  isFeatureEnabled: (...args: unknown[]) => mocks.isFeatureEnabled(...args),
}));

vi.mock('@/lib/uploads/lifecycle', () => ({
  recordUploadEvent: (...args: unknown[]) => mocks.recordUploadEvent(...args),
}));

import {
  applyProofArtifactOcrDraft,
  extractProofArtifactText,
  ProofArtifactOcrError,
} from '@/lib/proof-artifacts/text-extraction';

const USER_ID = '11111111-1111-4111-8111-111111111111';
const ARTIFACT_ID = '22222222-2222-4222-8222-222222222222';
const UPLOAD_ID = '33333333-3333-4333-8333-333333333333';
const PACK_ID = '44444444-4444-4444-8444-444444444444';

function pdfBytes(pages = 1) {
  const pageObjects = Array.from(
    { length: pages },
    (_, index) => `${index + 1} 0 obj\n<< /Type /Page >>\nendobj`
  ).join('\n');
  return Buffer.from(`%PDF-1.4\n${pageObjects}\n%%EOF`);
}

function artifactRow(overrides: Record<string, unknown> = {}) {
  return {
    artifact_id: ARTIFACT_ID,
    artifact_title: 'Launch memo',
    artifact_kind: 'file',
    artifact_lifecycle_state: 'active',
    artifact_visibility: 'owner_only',
    artifact_reveal_gate: 'none',
    uploaded_file_id: UPLOAD_ID,
    owner_id: USER_ID,
    detected_mime: 'application/pdf',
    size_bytes: 1024,
    upload_lifecycle_state: 'ready_private',
    safety_status: 'clean',
    attach_status: 'attached',
    quarantine_bucket: 'user-uploads-quarantine',
    quarantine_path: 'individual_profile/user/proof/file.pdf',
    durable_bucket: null,
    durable_path: null,
    public_bucket: null,
    public_path: null,
    ...overrides,
  };
}

function mockDownload(bytes = pdfBytes()) {
  mocks.createAdminClient.mockReturnValue({
    storage: {
      from: vi.fn(() => ({
        download: vi.fn(async () => ({
          data: new Blob([bytes]),
          error: null,
        })),
      })),
    },
  });
}

function ocrBetaEnv(overrides: Record<string, string | undefined> = {}) {
  return {
    PROOF_ARTIFACT_OCR_BETA_ENABLED: 'true',
    GCP_CV_OCR_ENABLED: 'true',
    GCP_CV_OCR_EXPIRES_AT: '2026-08-03T00:00:00.000Z',
    GCP_CV_OCR_BASE_URL: 'https://ocr.example',
    GCP_CV_OCR_AUTH_MODE: 'hmac',
    GCP_CV_OCR_SHARED_SECRET: 'secret',
    ...overrides,
  };
}

describe('Proof Artifact Text Extraction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.isFeatureEnabled.mockResolvedValue(true);
    mocks.extractTextFromDocument.mockResolvedValue({
      status: 'completed',
      provider: 'gcp_document_ai',
      requestId: 'proof_ocr_test',
      documentId: ARTIFACT_ID,
      pageCount: 1,
      text: 'Launch memo\nContact jane@example.com\ncandidate-secret.pdf',
      confidence: 0.91,
      elapsedMs: 42,
      warnings: [],
      fallback: false,
    });
    mocks.recordUploadEvent.mockResolvedValue(undefined);
    mockDownload();
  });

  it('stays hidden unless the beta env gate and audience flag both allow it', async () => {
    await expect(
      extractProofArtifactText({
        artifactId: ARTIFACT_ID,
        userId: USER_ID,
        consentToProcess: true,
        env: {
          PROOF_ARTIFACT_OCR_BETA_ENABLED: 'false',
        },
      })
    ).rejects.toMatchObject({
      code: 'PROOF_ARTIFACT_OCR_NOT_AVAILABLE',
      status: 404,
    });

    expect(mocks.dbExecute).not.toHaveBeenCalled();
    expect(mocks.extractTextFromDocument).not.toHaveBeenCalled();
  });

  it('disables OCR before storage access when kill switches close the route gate', async () => {
    for (const env of [
      ocrBetaEnv({ GCP_CV_OCR_KILL_SWITCH: 'true' }),
      ocrBetaEnv({ PROOF_ARTIFACT_OCR_BETA_KILL_SWITCH: 'true' }),
    ]) {
      await expect(
        extractProofArtifactText({
          artifactId: ARTIFACT_ID,
          userId: USER_ID,
          consentToProcess: true,
          env,
        })
      ).rejects.toMatchObject({
        code: 'PROOF_ARTIFACT_OCR_NOT_AVAILABLE',
        status: 404,
      });
    }

    expect(mocks.dbExecute).not.toHaveBeenCalled();
    expect(mocks.extractTextFromDocument).not.toHaveBeenCalled();
  });

  it('requires explicit consent before OCR can call Document AI', async () => {
    await expect(
      extractProofArtifactText({
        artifactId: ARTIFACT_ID,
        userId: USER_ID,
        consentToProcess: false as true,
        env: {
          PROOF_ARTIFACT_OCR_BETA_ENABLED: 'true',
        },
      })
    ).rejects.toMatchObject({
      code: 'CONSENT_REQUIRED',
      status: 400,
    });

    expect(mocks.dbExecute).not.toHaveBeenCalled();
    expect(mocks.extractTextFromDocument).not.toHaveBeenCalled();
  });

  it('extracts text only from an owned, processable proof artifact and stores no raw OCR text', async () => {
    mocks.dbExecute.mockResolvedValueOnce({ rows: [artifactRow()] });

    const result = await extractProofArtifactText({
      artifactId: ARTIFACT_ID,
      userId: USER_ID,
      userEmail: 'owner@example.com',
      orgIds: ['org-1'],
      roles: ['org_reviewer'],
      consentToProcess: true,
      requestId: 'proof_ocr_test',
      env: ocrBetaEnv(),
    });

    expect(result).toMatchObject({
      status: 'completed',
      source: 'user_owned_proof_artifact',
      draftOnly: true,
      provider: 'gcp_document_ai',
      artifactId: ARTIFACT_ID,
      uploadedFileId: UPLOAD_ID,
    });
    expect(result.extractedTextPreview).toContain('Launch memo');
    expect(result.extractedTextPreview).not.toContain('candidate-secret.pdf');
    expect(result.extractedTextPreview).not.toContain('jane@example.com');
    expect(result.extractedTextPreview).toContain('[redacted-email]');
    expect(result.privacyRiskWarnings).toContain('May contain email addresses.');
    expect(result.suggestedProofPackFieldsDraft).toHaveProperty('title');

    expect(mocks.extractTextFromDocument).toHaveBeenCalledWith(
      expect.objectContaining({
        requestId: 'proof_ocr_test',
        userId: USER_ID,
        documentId: ARTIFACT_ID,
        contentType: 'application/pdf',
      }),
      expect.any(Object)
    );
    expect(mocks.isFeatureEnabled).toHaveBeenCalledWith(
      'FF_PROOF_ARTIFACT_OCR_BETA',
      expect.objectContaining({
        userId: USER_ID,
      }),
      false
    );
    expect(JSON.stringify(mocks.extractTextFromDocument.mock.calls[0][0])).not.toMatch(
      /quarantine|storage|signed|filename/i
    );
    expect(mocks.recordUploadEvent).toHaveBeenCalledWith(
      UPLOAD_ID,
      'metadata_extracted',
      expect.objectContaining({
        source: 'proof_artifact_text_extraction',
        textHash: expect.any(String),
        draftOnly: true,
      })
    );
    expect(JSON.stringify(mocks.recordUploadEvent.mock.calls[0][2])).not.toContain('Launch memo');
    expect(JSON.stringify(mocks.dbExecute.mock.calls)).not.toMatch(
      /UPDATE proof_packs|portfolio_publication_states|match_review_states|review_queue/i
    );
  });

  it('does not let an org reviewer trigger OCR for an artifact they do not own', async () => {
    mocks.dbExecute.mockResolvedValueOnce({ rows: [] });

    await expect(
      extractProofArtifactText({
        artifactId: ARTIFACT_ID,
        userId: '55555555-5555-4555-8555-555555555555',
        roles: ['org_reviewer'],
        consentToProcess: true,
        env: ocrBetaEnv(),
      })
    ).rejects.toMatchObject({
      code: 'PROOF_ARTIFACT_NOT_FOUND',
      status: 404,
    });

    expect(mocks.extractTextFromDocument).not.toHaveBeenCalled();
  });

  it('enforces the beta page cap before calling Document AI', async () => {
    mocks.dbExecute.mockResolvedValueOnce({ rows: [artifactRow()] });
    mockDownload(pdfBytes(5));

    await expect(
      extractProofArtifactText({
        artifactId: ARTIFACT_ID,
        userId: USER_ID,
        consentToProcess: true,
        env: ocrBetaEnv(),
      })
    ).rejects.toMatchObject({
      code: 'PROOF_ARTIFACT_TOO_MANY_PAGES',
      status: 400,
    });

    expect(mocks.extractTextFromDocument).not.toHaveBeenCalled();
  });

  it('rejects unsupported MIME types and too-large artifacts before provider calls', async () => {
    mocks.dbExecute.mockResolvedValueOnce({
      rows: [artifactRow({ detected_mime: 'application/msword' })],
    });

    await expect(
      extractProofArtifactText({
        artifactId: ARTIFACT_ID,
        userId: USER_ID,
        consentToProcess: true,
        env: ocrBetaEnv(),
      })
    ).rejects.toMatchObject({
      code: 'UNSUPPORTED_PROOF_ARTIFACT_MIME',
      status: 400,
    });

    mocks.dbExecute.mockResolvedValueOnce({
      rows: [artifactRow({ size_bytes: 6 * 1024 * 1024 })],
    });

    await expect(
      extractProofArtifactText({
        artifactId: ARTIFACT_ID,
        userId: USER_ID,
        consentToProcess: true,
        env: ocrBetaEnv(),
      })
    ).rejects.toMatchObject({
      code: 'PROOF_ARTIFACT_TOO_LARGE',
      status: 400,
    });

    expect(mocks.extractTextFromDocument).not.toHaveBeenCalled();
  });

  it('explicitly applies only user-selected OCR draft fields to an owned draft Proof Pack', async () => {
    mocks.dbExecute
      .mockResolvedValueOnce({ rows: [artifactRow()] })
      .mockResolvedValueOnce({
        rows: [
          {
            id: PACK_ID,
            lifecycle_state: 'draft',
            owner_id: USER_ID,
            linked_artifact_id: ARTIFACT_ID,
          },
        ],
      })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });

    const result = await applyProofArtifactOcrDraft({
      artifactId: ARTIFACT_ID,
      proofPackId: PACK_ID,
      userId: USER_ID,
      selectedFields: {
        evidenceSummary: 'Manually selected launch evidence.',
      },
      sourceExtractionRequestId: 'proof_ocr_test',
      env: ocrBetaEnv(),
    });

    expect(result).toEqual({
      ok: true,
      proofPackId: PACK_ID,
      artifactId: ARTIFACT_ID,
      appliedFields: ['evidenceSummary'],
      draftOnly: true,
    });
    expect(mocks.extractTextFromDocument).not.toHaveBeenCalled();
    expect(mocks.dbExecute).toHaveBeenCalledTimes(4);
    expect(JSON.stringify(mocks.dbExecute.mock.calls)).not.toMatch(
      /portfolio_publication_states|match_review_states|review_queue|public_portfolio/i
    );
  });

  it('blocks apply when the Proof Pack is not draft-only', async () => {
    mocks.dbExecute.mockResolvedValueOnce({ rows: [artifactRow()] }).mockResolvedValueOnce({
      rows: [
        {
          id: PACK_ID,
          lifecycle_state: 'published',
          owner_id: USER_ID,
          linked_artifact_id: ARTIFACT_ID,
        },
      ],
    });

    await expect(
      applyProofArtifactOcrDraft({
        artifactId: ARTIFACT_ID,
        proofPackId: PACK_ID,
        userId: USER_ID,
        selectedFields: {
          summary: 'Selected text',
        },
        env: ocrBetaEnv(),
      })
    ).rejects.toBeInstanceOf(ProofArtifactOcrError);
  });
});
