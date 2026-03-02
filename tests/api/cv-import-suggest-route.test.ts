import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

import { POST } from '@/app/api/expertise/cv-import/suggest/route';
import { createClient } from '@/lib/supabase/server';
import { suggestSkillsForDocuments } from '@/lib/expertise/cv-import-suggest';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/lib/expertise/cv-import-suggest', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/expertise/cv-import-suggest')>();
  return {
    ...actual,
    CvImportSuggestRequestSchema: {
      parse: (value: unknown) => value,
    },
    suggestSkillsForDocuments: vi.fn(),
  };
});

function createAuthenticatedSupabaseMock(userId = 'user-1', existingSkillIds: string[] = []) {
  return {
    auth: {
      getUser: async () => ({
        data: {
          user: {
            id: userId,
          },
        },
      }),
    },
    from: (table: string) => {
      if (table !== 'skills') {
        throw new Error(`Unexpected table: ${table}`);
      }

      return {
        select: () => ({
          eq: async (_column: string, _value: string) => ({
            data: existingSkillIds.map((skillId) => ({
              skill_id: skillId,
              skill_code: skillId,
            })),
            error: null,
          }),
        }),
      };
    },
  };
}

describe('cv-import suggest route', () => {
  const originalTimeout = process.env.CV_IMPORT_SERVER_TIMEOUT_MS;
  const originalMode = process.env.CV_IMPORT_ENGINE_MODE;

  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.CV_IMPORT_SERVER_TIMEOUT_MS;
    delete process.env.CV_IMPORT_FORCE_PYTHON;
    delete process.env.CV_IMPORT_ENGINE_MODE;
  });

  afterEach(() => {
    if (originalTimeout === undefined) {
      delete process.env.CV_IMPORT_SERVER_TIMEOUT_MS;
    } else {
      process.env.CV_IMPORT_SERVER_TIMEOUT_MS = originalTimeout;
    }
    if (originalMode === undefined) {
      delete process.env.CV_IMPORT_ENGINE_MODE;
    } else {
      process.env.CV_IMPORT_ENGINE_MODE = originalMode;
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
    (createClient as any).mockResolvedValue(createAuthenticatedSupabaseMock('user-1'));

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
    expect(body.metadata.engine_mode).toBe('auto');
    expect(body.metadata.engine_used).toBe('typescript');
    expect(suggestSkillsForDocuments).toHaveBeenCalledTimes(1);
  });

  it('proxies multipart payloads to python runtime endpoint', async () => {
    (createClient as any).mockResolvedValue(createAuthenticatedSupabaseMock('user-1'));

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
      headers: {
        'Content-Type': 'multipart/form-data; boundary=----vitest',
        'x-csrf-token': 'csrf-token-value',
        cookie: 'csrf_token=csrf-token-value; sb-auth-token=session-value',
      },
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [targetUrl, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    const headers = init.headers as Record<string, string>;
    expect(targetUrl).toContain('/api/python/cv_import?endpoint=suggest');
    expect(headers['x-csrf-token']).toBe('csrf-token-value');
    expect(headers.cookie).toContain('csrf_token=csrf-token-value');
    expect(suggestSkillsForDocuments).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it('returns friendly upload metadata message when upstream proxy reports utf-8 codec errors', async () => {
    process.env.CV_IMPORT_ENGINE_MODE = 'python';
    (createClient as any).mockResolvedValue(createAuthenticatedSupabaseMock('user-1'));

    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          error: 'Failed to process CV documents',
          message:
            "'utf-8' codec can't decode byte 0xc4 in position 177: invalid continuation byte",
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
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

    expect(response.status).toBe(400);
    expect(body.message).toBe(
      'Upload metadata contains unsupported characters. Please rename the PDF and retry.'
    );
    expect(body.code).toBe('CV_IMPORT_MULTIPART_METADATA_INVALID');
    expect(String(body.message).toLowerCase()).not.toContain('utf-8');
    fetchSpy.mockRestore();
  });

  it('routes JSON payloads to python engine when engine mode is python', async () => {
    process.env.CV_IMPORT_ENGINE_MODE = 'python';
    (createClient as any).mockResolvedValue(createAuthenticatedSupabaseMock('user-1'));

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
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(body.metadata.engine_mode).toBe('python');
    expect(body.metadata.engine_used).toBe('python');
    expect(suggestSkillsForDocuments).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it('honors engine=typescript override even when mode is python', async () => {
    process.env.CV_IMPORT_ENGINE_MODE = 'python';
    (createClient as any).mockResolvedValue(createAuthenticatedSupabaseMock('user-1'));

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

    const fetchSpy = vi.spyOn(global, 'fetch');

    const request = new NextRequest(
      'http://localhost/api/expertise/cv-import/suggest?engine=typescript',
      {
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
      }
    );

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.metadata.engine_mode).toBe('typescript');
    expect(body.metadata.engine_used).toBe('typescript');
    expect(suggestSkillsForDocuments).toHaveBeenCalledTimes(1);
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it('returns timeout response when processing exceeds budget', async () => {
    process.env.CV_IMPORT_SERVER_TIMEOUT_MS = '1';

    (createClient as any).mockResolvedValue(createAuthenticatedSupabaseMock('user-1'));

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
    expect(body.code).toBe('CV_IMPORT_SUGGEST_TIMEOUT');
  });

  it('tags duplicate-only candidates as already_in_profile', async () => {
    (createClient as any).mockResolvedValue(
      createAuthenticatedSupabaseMock('user-1', ['skill_react'])
    );

    (suggestSkillsForDocuments as any).mockResolvedValue({
      documents: [
        {
          document_id: 'doc-1',
          file_name: 'cv.pdf',
          context: 'cv',
          parsed_text: 'React TypeScript',
          parse_error: null,
          parse_error_code: null,
          candidate_count: 1,
          candidates: [
            {
              candidate_id: 'candidate-1',
              raw_skill_text: 'React',
              category: 'technical',
              evidence_snippets: ['Built React apps'],
              confidence: 0.9,
              suggestions: [
                {
                  skill_id: 'skill_react',
                  skill_name: 'React',
                  match_method: 'exact',
                  score: 1,
                },
              ],
              unmapped_candidate: false,
            },
          ],
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
    expect(body.documents[0].candidates[0].suggestions).toEqual([]);
    expect(body.documents[0].candidates[0].already_in_profile).toBe(true);
    expect(body.documents[0].candidates[0].unmapped_candidate).toBe(false);
    expect(body.metadata.unmapped_candidates_count).toBe(0);
  });
});
