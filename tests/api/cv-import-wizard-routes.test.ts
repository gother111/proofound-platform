import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  requireApiAuthContext: vi.fn(),
  extractPdfTextFromFile: vi.fn(),
  suggestWizardForDocuments: vi.fn(),
  applyWizardSelections: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  requireApiAuthContext: mocks.requireApiAuthContext,
}));

vi.mock('@/lib/expertise/pdf-client-extractor', async () => {
  const actual = await vi.importActual<typeof import('@/lib/expertise/pdf-client-extractor')>(
    '@/lib/expertise/pdf-client-extractor'
  );
  return {
    ...actual,
    extractPdfTextFromFile: mocks.extractPdfTextFromFile,
  };
});

vi.mock('@/lib/expertise/cv-import-wizard-extractor', () => ({
  suggestWizardForDocuments: mocks.suggestWizardForDocuments,
}));

vi.mock('@/lib/expertise/cv-import-wizard-apply', () => ({
  applyWizardSelections: mocks.applyWizardSelections,
}));

function authedUser() {
  mocks.requireApiAuthContext.mockResolvedValue({
    user: { id: '00000000-0000-4000-8000-000000000001' },
    supabase: {},
  });
}

describe('CV import wizard API routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authedUser();
  });

  it('queues PDF extraction and returns extracted text from status', async () => {
    mocks.extractPdfTextFromFile.mockResolvedValue('Experience\nLead at Acme\n2020 - 2024');

    const { POST } = await import('@/app/api/expertise/cv-import/wizard-extract/route');
    const { GET } = await import('@/app/api/expertise/cv-import/wizard-extract/status/route');

    const formData = new FormData();
    formData.append('files', new File(['%PDF'], 'cv.pdf', { type: 'application/pdf' }));
    formData.append('document_ids', 'doc-1');
    formData.append('contexts', 'cv');

    const queued = await POST({ formData: async () => formData } as unknown as NextRequest);
    const queuedBody = await queued.json();

    expect(queued.status).toBe(202);
    expect(queuedBody.status).toBe('queued');

    const status = await GET(
      new NextRequest(
        `http://localhost/api/expertise/cv-import/wizard-extract/status?job_id=${queuedBody.job_id}`
      )
    );
    const statusBody = await status.json();

    expect(statusBody.status).toBe('completed');
    expect(statusBody.documents[0]).toMatchObject({
      document_id: 'doc-1',
      file_name: 'cv.pdf',
      text: 'Experience\nLead at Acme\n2020 - 2024',
      context: 'cv',
    });
  });

  it('runs wizard suggestions through the TypeScript extractor contract', async () => {
    mocks.suggestWizardForDocuments.mockResolvedValue({
      documents: [],
      metadata: {
        semantic_used: false,
        semantic_fallback_triggered: false,
        candidate_only_fallback_triggered: false,
        unmapped_candidates_count: 0,
        limits: {
          max_documents: 5,
          max_chars_per_document: 30000,
          max_total_chars: 90000,
        },
      },
    });

    const { POST } = await import('@/app/api/expertise/cv-import/wizard-suggest/route');
    const response = await POST(
      new NextRequest('http://localhost/api/expertise/cv-import/wizard-suggest?engine=typescript', {
        method: 'POST',
        body: JSON.stringify({ documents: [] }),
        headers: { 'Content-Type': 'application/json' },
      })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(mocks.suggestWizardForDocuments).toHaveBeenCalled();
    expect(body.metadata.engine_used).toBe('typescript');
  });

  it('applies approved selections for the authenticated user', async () => {
    mocks.applyWizardSelections.mockResolvedValue({
      imported_counts: {
        skills: 0,
        work_experiences: 1,
        learning_experiences: 1,
        volunteering: 1,
        languages: 0,
      },
      skipped_counts: {
        skills: 0,
        work_experiences: 0,
        learning_experiences: 0,
        volunteering: 0,
        languages: 0,
      },
      warnings: [],
    });

    const { POST } = await import('@/app/api/expertise/cv-import/wizard-apply/route');
    const response = await POST(
      new NextRequest('http://localhost/api/expertise/cv-import/wizard-apply', {
        method: 'POST',
        body: JSON.stringify({ documents: [] }),
        headers: { 'Content-Type': 'application/json' },
      })
    );

    expect(response.status).toBe(200);
    expect(mocks.applyWizardSelections).toHaveBeenCalledWith(
      '00000000-0000-4000-8000-000000000001',
      { documents: [] }
    );
  });
});
