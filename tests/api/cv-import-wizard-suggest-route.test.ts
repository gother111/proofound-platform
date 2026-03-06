import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

import { POST } from '@/app/api/expertise/cv-import/wizard-suggest/route';
import { createClient } from '@/lib/supabase/server';
import { suggestWizardForDocuments } from '@/lib/expertise/cv-import-wizard-extractor';
import { suggestSkillsWithGemini } from '@/lib/expertise/gemini/skill-extractor';
import { verifyAtlasSkillCandidate } from '@/lib/expertise/atlas-skill-verifier';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/lib/expertise/cv-import-wizard-extractor', () => ({
  suggestWizardForDocuments: vi.fn(),
}));

vi.mock('@/lib/expertise/gemini/skill-extractor', () => ({
  suggestSkillsWithGemini: vi.fn(),
  GeminiSuggestError: class GeminiSuggestError extends Error {
    code: string;
    status: number;
    fallbackReason: string;

    constructor(message: string, code: string, status: number, fallbackReason: string) {
      super(message);
      this.code = code;
      this.status = status;
      this.fallbackReason = fallbackReason;
    }
  },
}));

vi.mock('@/lib/expertise/atlas-skill-verifier', () => ({
  verifyAtlasSkillCandidate: vi.fn(async ({ suggestions }: { suggestions?: Array<unknown> }) => ({
    suggestions: Array.isArray(suggestions) ? suggestions : [],
    forceUnmapped: !Array.isArray(suggestions) || suggestions.length === 0,
  })),
}));

vi.mock('@/lib/expertise/cv-import-wizard-types', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/expertise/cv-import-wizard-types')>();
  return {
    ...actual,
    CvImportWizardSuggestRequestSchema: {
      parse: (value: unknown) => value,
    },
  };
});

function createAuthenticatedSupabaseMock(userId = 'user-1', existingSkillIds: string[] = []) {
  return {
    auth: {
      getUser: async () => ({ data: { user: { id: userId } } }),
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

describe('cv-import wizard suggest route', () => {
  const originalTimeout = process.env.CV_IMPORT_SERVER_TIMEOUT_MS;
  const originalWizardTimeout = process.env.CV_IMPORT_WIZARD_TIMEOUT_MS;
  const originalMode = process.env.CV_IMPORT_ENGINE_MODE;
  const originalRateLimitMax = process.env.CV_IMPORT_USER_RATE_LIMIT_MAX;

  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.CV_IMPORT_SERVER_TIMEOUT_MS;
    delete process.env.CV_IMPORT_WIZARD_TIMEOUT_MS;
    delete process.env.CV_IMPORT_FORCE_PYTHON;
    delete process.env.CV_IMPORT_ENGINE_MODE;
    process.env.CV_IMPORT_USER_RATE_LIMIT_MAX = '1000';
    (verifyAtlasSkillCandidate as any).mockImplementation(
      async ({ suggestions }: { suggestions?: Array<unknown> }) => ({
        suggestions: Array.isArray(suggestions) ? suggestions : [],
        forceUnmapped: !Array.isArray(suggestions) || suggestions.length === 0,
      })
    );
  });

  afterEach(() => {
    if (originalTimeout === undefined) {
      delete process.env.CV_IMPORT_SERVER_TIMEOUT_MS;
    } else {
      process.env.CV_IMPORT_SERVER_TIMEOUT_MS = originalTimeout;
    }
    if (originalWizardTimeout === undefined) {
      delete process.env.CV_IMPORT_WIZARD_TIMEOUT_MS;
    } else {
      process.env.CV_IMPORT_WIZARD_TIMEOUT_MS = originalWizardTimeout;
    }
    if (originalMode === undefined) {
      delete process.env.CV_IMPORT_ENGINE_MODE;
    } else {
      process.env.CV_IMPORT_ENGINE_MODE = originalMode;
    }
    if (originalRateLimitMax === undefined) {
      delete process.env.CV_IMPORT_USER_RATE_LIMIT_MAX;
    } else {
      process.env.CV_IMPORT_USER_RATE_LIMIT_MAX = originalRateLimitMax;
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
    (createClient as any).mockResolvedValue(createAuthenticatedSupabaseMock('user-1'));

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
    expect(body.metadata.engine_mode).toBe('auto');
    expect(body.metadata.engine_used).toBe('typescript');
    expect(suggestWizardForDocuments).toHaveBeenCalledTimes(1);
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

    const request = new NextRequest('http://localhost/api/expertise/cv-import/wizard-suggest', {
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
    expect(targetUrl).toContain('/api/python/cv_import?endpoint=wizard-suggest');
    expect(headers['x-csrf-token']).toBe('csrf-token-value');
    expect(headers.cookie).toContain('csrf_token=csrf-token-value');
    expect(suggestWizardForDocuments).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it('returns friendly upload metadata message when upstream proxy reports utf-8 codec errors', async () => {
    process.env.CV_IMPORT_ENGINE_MODE = 'python';
    (createClient as any).mockResolvedValue(createAuthenticatedSupabaseMock('user-1'));

    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          error: 'Failed to process CV wizard suggestions',
          message:
            "'utf-8' codec can't decode byte 0xc4 in position 177: invalid continuation byte",
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
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

    expect(response.status).toBe(400);
    expect(body.message).toBe(
      'Upload metadata contains unsupported characters. Please rename the PDF and retry.'
    );
    expect(body.code).toBe('CV_IMPORT_MULTIPART_METADATA_INVALID');
    expect(String(body.message).toLowerCase()).not.toContain('utf-8');
    fetchSpy.mockRestore();
  });

  it('returns structured 504 timeout code when python proxy times out', async () => {
    (createClient as any).mockResolvedValue(createAuthenticatedSupabaseMock('user-1'));

    const fetchSpy = vi
      .spyOn(global, 'fetch')
      .mockRejectedValueOnce(new Error('Request timed out'));

    const formData = new FormData();
    formData.append('files', new File(['dummy'], 'cv.pdf', { type: 'application/pdf' }));
    formData.append('document_ids', 'doc-1');
    formData.append('contexts', 'cv');

    const request = new NextRequest('http://localhost/api/expertise/cv-import/wizard-suggest', {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data; boundary=----vitest',
      },
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(504);
    expect(body.error).toBe('Failed to process CV wizard suggestions');
    expect(body.code).toBe('CV_IMPORT_PROXY_TIMEOUT');
    expect(body.message).toContain('timed out');
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(suggestWizardForDocuments).not.toHaveBeenCalled();
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
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(body.metadata.engine_mode).toBe('python');
    expect(body.metadata.engine_used).toBe('python');
    expect(suggestWizardForDocuments).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it('honors engine=typescript override even when mode is python', async () => {
    process.env.CV_IMPORT_ENGINE_MODE = 'python';
    (createClient as any).mockResolvedValue(createAuthenticatedSupabaseMock('user-1'));

    (suggestWizardForDocuments as any).mockResolvedValue({
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
      'http://localhost/api/expertise/cv-import/wizard-suggest?engine=typescript',
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
    expect(suggestWizardForDocuments).toHaveBeenCalledTimes(1);
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it('returns timeout response when wizard processing exceeds budget', async () => {
    process.env.CV_IMPORT_SERVER_TIMEOUT_MS = '1';

    (createClient as any).mockResolvedValue(createAuthenticatedSupabaseMock('user-1'));

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
    expect(body.code).toBe('CV_IMPORT_WIZARD_TIMEOUT');
  });

  it('prefers CV_IMPORT_WIZARD_TIMEOUT_MS over CV_IMPORT_SERVER_TIMEOUT_MS', async () => {
    process.env.CV_IMPORT_SERVER_TIMEOUT_MS = '60000';
    process.env.CV_IMPORT_WIZARD_TIMEOUT_MS = '1';

    (createClient as any).mockResolvedValue(createAuthenticatedSupabaseMock('user-1'));

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
    expect(body.code).toBe('CV_IMPORT_WIZARD_TIMEOUT');
  });

  it('returns 503 with dependency code when taxonomy dependency is unavailable', async () => {
    (createClient as any).mockResolvedValue(createAuthenticatedSupabaseMock('user-1'));

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
    (createClient as any).mockResolvedValue(createAuthenticatedSupabaseMock('user-1'));

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

  it('fuses local and gemini candidates in gemini mode with local taxonomy verification', async () => {
    (createClient as any).mockResolvedValue(createAuthenticatedSupabaseMock('user-1'));

    (suggestWizardForDocuments as any).mockResolvedValue({
      documents: [
        {
          document_id: 'doc-1',
          file_name: 'cv.pdf',
          context: 'cv',
          parsed_text: 'React TypeScript',
          work_experiences: [],
          learning_experiences: [],
          volunteering: [],
          languages: [],
          skill_candidates: [
            {
              candidate_id: 'local-1',
              raw_skill_text: 'React.js',
              category: 'technical',
              evidence_snippets: ['Built React.js dashboards.'],
              confidence: 0.7,
              suggestions: [
                {
                  skill_id: 'skill_react',
                  skill_name: 'React',
                  match_method: 'fuzzy',
                  score: 0.82,
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

    (suggestSkillsWithGemini as any).mockResolvedValueOnce({
      response: {
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
                candidate_id: 'gemini-1',
                raw_skill_text: 'React',
                category: 'technical',
                evidence_snippets: ['Led React delivery.'],
                confidence: 0.9,
                suggestions: [
                  {
                    skill_id: 'skill_react',
                    skill_name: 'React',
                    match_method: 'exact',
                    score: 0.97,
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
          ai_provider: 'gemini',
          ai_model: 'gemini-3.1-flash-lite',
          ai_key_slot: 'primary',
          ai_fallback_reason: null,
          cost_ore: 10,
          currency: 'SEK',
          idempotency_key: 'idem-1',
          ai_schema_mode: 'flat_skills_v1',
          timings: {
            shortlist_ms: 3,
            gemini_ms: 15,
            total_ms: 20,
          },
          quality: {
            mapped_ratio: 1,
            skills_mapped_after_rerank: 1,
            evidence_valid_ratio: 1,
            high_confidence_count: 1,
            confidence_tiers: {
              high: 1,
              medium: 0,
              low: 0,
            },
            avg_skills_per_document: 1,
          },
        },
      },
      idempotencyKey: 'idem-1',
      replayed: false,
    });

    const request = new NextRequest(
      'http://localhost/api/expertise/cv-import/wizard-suggest?engine=gemini',
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
    expect(body.metadata.engine_mode).toBe('gemini');
    expect(body.metadata.engine_used).toBe('gemini');
    expect(body.documents[0].skill_candidates).toHaveLength(1);
    expect(body.documents[0].skill_candidates[0].suggestions[0].match_method).toBe('exact');
    expect(body.metadata.unmapped_candidates_count).toBe(0);
  });

  it('reuses deterministic baseline when gemini overlay fails in gemini mode', async () => {
    (createClient as any).mockResolvedValue(createAuthenticatedSupabaseMock('user-1'));

    (suggestWizardForDocuments as any).mockResolvedValue({
      documents: [
        {
          document_id: 'doc-1',
          file_name: 'cv.pdf',
          context: 'cv',
          parsed_text: 'React TypeScript',
          work_experiences: [],
          learning_experiences: [],
          volunteering: [],
          languages: [],
          skill_candidates: [
            {
              candidate_id: 'candidate-1',
              raw_skill_text: 'React',
              category: 'technical',
              evidence_snippets: ['React TypeScript'],
              confidence: 0.7,
              suggestions: [],
              unmapped_candidate: true,
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

    (suggestSkillsWithGemini as any).mockRejectedValueOnce(
      new Error('schema depth exceeded for structured output')
    );

    const request = new NextRequest(
      'http://localhost/api/expertise/cv-import/wizard-suggest?engine=gemini',
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
    expect(body.metadata.engine_mode).toBe('gemini');
    expect(body.metadata.engine_used).toBe('typescript');
    expect(body.metadata.ai_provider).toBe('gemini');
    expect(body.metadata.ai_fallback_reason).toBe('model_error');
    expect(body.metadata.timings.total_ms).toBeTypeOf('number');
    expect(body.documents[0].skill_candidates).toHaveLength(1);
    expect(suggestWizardForDocuments).toHaveBeenCalledTimes(1);
    expect(suggestSkillsWithGemini).toHaveBeenCalledTimes(1);
  });

  it('tags duplicate-only wizard skill candidates as already_in_profile', async () => {
    (createClient as any).mockResolvedValue(
      createAuthenticatedSupabaseMock('user-1', ['skill_react'])
    );

    (suggestWizardForDocuments as any).mockResolvedValue({
      documents: [
        {
          document_id: 'doc-1',
          file_name: 'cv.pdf',
          context: 'cv',
          parsed_text: 'React',
          parse_error: null,
          parse_error_code: null,
          work_experiences: [],
          learning_experiences: [],
          volunteering: [],
          languages: [],
          skill_candidates: [
            {
              candidate_id: 'candidate-1',
              raw_skill_text: 'React',
              category: 'technical',
              evidence_snippets: ['Built React apps'],
              confidence: 0.8,
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

    const request = new NextRequest('http://localhost/api/expertise/cv-import/wizard-suggest', {
      method: 'POST',
      body: JSON.stringify({
        documents: [
          {
            document_id: 'doc-1',
            file_name: 'cv.pdf',
            text: 'React',
            context: 'cv',
          },
        ],
      }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.documents[0].skill_candidates[0].suggestions).toEqual([]);
    expect(body.documents[0].skill_candidates[0].already_in_profile).toBe(true);
    expect(body.documents[0].skill_candidates[0].unmapped_candidate).toBe(false);
    expect(body.metadata.unmapped_candidates_count).toBe(0);
  });
});
