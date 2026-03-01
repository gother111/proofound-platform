import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

import { POST } from '@/app/api/expertise/cv-import/suggest/route';
import { createClient } from '@/lib/supabase/server';
import { suggestSkillsForDocuments } from '@/lib/expertise/cv-import-suggest';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/lib/expertise/cv-import-suggest', () => ({
  CvImportSuggestRequestSchema: {
    parse: (value: unknown) => value,
  },
  suggestSkillsForDocuments: vi.fn(),
}));

describe('cv-import suggest route', () => {
  const originalTimeout = process.env.CV_IMPORT_SERVER_TIMEOUT_MS;

  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.CV_IMPORT_SERVER_TIMEOUT_MS;
    delete process.env.CV_IMPORT_FORCE_PYTHON;
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

    const request = new NextRequest('http://localhost/api/expertise/cv-import/suggest', {
      method: 'POST',
      body: JSON.stringify({ documents: [] }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request);

    expect(response.status).toBe(401);
  });

  it('returns structured response for authenticated users', async () => {
    (createClient as any).mockResolvedValue({
      auth: {
        getUser: async () => ({
          data: {
            user: {
              id: 'user-1',
            },
          },
        }),
      },
    });

    (suggestSkillsForDocuments as any).mockResolvedValue({
      documents: [],
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

    const request = new NextRequest('http://localhost/api/expertise/cv-import/suggest', {
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
    expect(body.metadata.semantic_used).toBe(false);
    expect(suggestSkillsForDocuments).toHaveBeenCalledTimes(1);
  });

  it('proxies multipart payloads to python runtime endpoint', async () => {
    (createClient as any).mockResolvedValue({
      auth: {
        getUser: async () => ({
          data: {
            user: {
              id: 'user-1',
            },
          },
        }),
      },
    });

    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          documents: [],
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
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    );

    const formData = new FormData();
    formData.append('files', new File(['dummy'], 'cv.pdf', { type: 'application/pdf' }));
    formData.append('document_ids', 'doc-1');
    formData.append('contexts', 'cv');

    const request = new NextRequest('http://localhost/api/expertise/cv-import/suggest', {
      method: 'POST',
      body: formData,
      headers: { 'Content-Type': 'multipart/form-data; boundary=----vitest' },
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(suggestSkillsForDocuments).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it('returns timeout response when processing exceeds budget', async () => {
    process.env.CV_IMPORT_SERVER_TIMEOUT_MS = '1';

    (createClient as any).mockResolvedValue({
      auth: {
        getUser: async () => ({
          data: {
            user: {
              id: 'user-1',
            },
          },
        }),
      },
    });

    (suggestSkillsForDocuments as any).mockImplementation(
      () =>
        new Promise(() => {
          // unresolved on purpose
        })
    );

    const request = new NextRequest('http://localhost/api/expertise/cv-import/suggest', {
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
    expect(body.error).toBe('CV import processing timed out');
  });
});
