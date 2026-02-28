import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

import { POST } from '@/app/api/expertise/cv-import/wizard-suggest/route';
import { createClient } from '@/lib/supabase/server';
import { suggestWizardForDocuments } from '@/lib/expertise/cv-import-wizard-extractor';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/lib/expertise/cv-import-wizard-extractor', () => ({
  suggestWizardForDocuments: vi.fn(),
}));

vi.mock('@/lib/expertise/cv-import-wizard-types', () => ({
  CvImportWizardSuggestRequestSchema: {
    parse: (value: unknown) => value,
  },
}));

describe('cv-import wizard suggest route', () => {
  const originalTimeout = process.env.CV_IMPORT_SERVER_TIMEOUT_MS;

  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.CV_IMPORT_SERVER_TIMEOUT_MS;
  });

  afterEach(() => {
    if (originalTimeout === undefined) {
      delete process.env.CV_IMPORT_SERVER_TIMEOUT_MS;
    } else {
      process.env.CV_IMPORT_SERVER_TIMEOUT_MS = originalTimeout;
    }
  });

  it('returns 401 for unauthenticated users', async () => {
    (createClient as any).mockResolvedValue({
      auth: {
        getUser: async () => ({ data: { user: null } }),
      },
    });

    const request = new NextRequest('http://localhost/api/expertise/cv-import/wizard-suggest', {
      method: 'POST',
      body: JSON.stringify({ documents: [] }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request);

    expect(response.status).toBe(401);
  });

  it('returns structured wizard response for authenticated users', async () => {
    (createClient as any).mockResolvedValue({
      auth: {
        getUser: async () => ({ data: { user: { id: 'user-1' } } }),
      },
    });

    (suggestWizardForDocuments as any).mockResolvedValue({
      documents: [
        {
          document_id: 'doc-1',
          file_name: 'cv.pdf',
          context: 'cv',
          work_experiences: [],
          learning_experiences: [],
          volunteering: [],
          languages: [],
          skill_candidates: [],
        },
      ],
      metadata: {
        semantic_used: false,
        semantic_fallback_triggered: false,
        unmapped_candidates_count: 0,
        limits: {
          max_documents: 5,
          max_chars_per_document: 30000,
          max_total_chars: 90000,
        },
      },
    });

    const request = new NextRequest('http://localhost/api/expertise/cv-import/wizard-suggest', {
      method: 'POST',
      body: JSON.stringify({
        documents: [
          {
            document_id: 'doc-1',
            file_name: 'cv.pdf',
            text: 'React TypeScript',
            context: 'cv',
          },
        ],
      }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.documents).toHaveLength(1);
    expect(suggestWizardForDocuments).toHaveBeenCalledTimes(1);
  });

  it('returns timeout response when wizard processing exceeds budget', async () => {
    process.env.CV_IMPORT_SERVER_TIMEOUT_MS = '1';

    (createClient as any).mockResolvedValue({
      auth: {
        getUser: async () => ({ data: { user: { id: 'user-1' } } }),
      },
    });

    (suggestWizardForDocuments as any).mockImplementation(
      () =>
        new Promise(() => {
          // unresolved on purpose
        })
    );

    const request = new NextRequest('http://localhost/api/expertise/cv-import/wizard-suggest', {
      method: 'POST',
      body: JSON.stringify({
        documents: [
          {
            document_id: 'doc-1',
            file_name: 'cv.pdf',
            text: 'React TypeScript',
            context: 'cv',
          },
        ],
      }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(408);
    expect(body.error).toBe('CV wizard processing timed out');
  });

  it('returns 503 with dependency code when taxonomy dependency is unavailable', async () => {
    (createClient as any).mockResolvedValue({
      auth: {
        getUser: async () => ({ data: { user: { id: 'user-1' } } }),
      },
    });

    (suggestWizardForDocuments as any).mockRejectedValue(
      new Error('relation "skills_taxonomy" does not exist')
    );

    const request = new NextRequest('http://localhost/api/expertise/cv-import/wizard-suggest', {
      method: 'POST',
      body: JSON.stringify({
        documents: [
          {
            document_id: 'doc-1',
            file_name: 'cv.pdf',
            text: 'React TypeScript',
            context: 'cv',
          },
        ],
      }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.error).toBe('Failed to process CV wizard suggestions');
    expect(body.code).toBe('WIZARD_DEPENDENCY_UNAVAILABLE');
    expect(body.message).toContain('temporarily unavailable');
  });

  it('returns structured 500 with processing code for unknown failures', async () => {
    (createClient as any).mockResolvedValue({
      auth: {
        getUser: async () => ({ data: { user: { id: 'user-1' } } }),
      },
    });

    (suggestWizardForDocuments as any).mockRejectedValue(new Error('unexpected parser branch'));

    const request = new NextRequest('http://localhost/api/expertise/cv-import/wizard-suggest', {
      method: 'POST',
      body: JSON.stringify({
        documents: [
          {
            document_id: 'doc-1',
            file_name: 'cv.pdf',
            text: 'React TypeScript',
            context: 'cv',
          },
        ],
      }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe('Failed to process CV wizard suggestions');
    expect(body.code).toBe('WIZARD_PROCESSING_FAILED');
    expect(body.message).toContain('unexpected parser branch');
  });
});
