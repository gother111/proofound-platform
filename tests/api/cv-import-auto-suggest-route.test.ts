import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/lib/expertise/cv-import-suggest', () => ({
  suggestSkillsForDocuments: vi.fn(),
}));

vi.mock('@/lib/expertise/gemini/budget-ledger', () => ({
  updateUsageLog: vi.fn(),
}));

vi.mock('@/lib/expertise/gemini/skill-extractor', () => {
  class GeminiSuggestError extends Error {
    code: string;
    status: number;
    fallbackReason: string;
    logId?: string;

    constructor(
      message: string,
      code: string,
      status: number,
      fallbackReason: string,
      details?: { logId?: string }
    ) {
      super(message);
      this.code = code;
      this.status = status;
      this.fallbackReason = fallbackReason;
      this.logId = details?.logId;
    }
  }

  return {
    GeminiSuggestError,
    suggestSkillsWithGemini: vi.fn(),
  };
});

import { POST } from '@/app/api/expertise/auto-suggest/route';
import { createClient } from '@/lib/supabase/server';
import { suggestSkillsForDocuments } from '@/lib/expertise/cv-import-suggest';
import { updateUsageLog } from '@/lib/expertise/gemini/budget-ledger';
import {
  GeminiSuggestError,
  suggestSkillsWithGemini,
} from '@/lib/expertise/gemini/skill-extractor';

function buildRequest(url: string, body: Record<string, unknown>) {
  return new NextRequest(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  });
}

function buildSuggestPayload() {
  return {
    documents: [
      {
        document_id: 'legacy-auto-suggest',
        file_name: 'legacy-input.txt',
        context: 'general' as const,
        parsed_text: 'React TypeScript',
        parse_error: null,
        parse_error_code: null,
        candidate_count: 1,
        candidates: [
          {
            candidate_id: 'candidate-1',
            raw_skill_text: 'React',
            category: 'technical' as const,
            evidence_snippets: ['Built React apps'],
            confidence: 0.9,
            suggestions: [
              {
                skill_id: 'skill_react',
                skill_name: 'React',
                match_method: 'exact' as const,
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
        max_documents: 1,
        max_chars_per_document: 30000,
        max_total_chars: 30000,
      },
    },
  };
}

describe('POST /api/expertise/auto-suggest', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.CV_IMPORT_ENGINE_MODE;
    process.env.CV_IMPORT_USER_RATE_LIMIT_MAX = '100';
    process.env.CV_IMPORT_USER_RATE_LIMIT_WINDOW_SECONDS = '60';
  });

  it('returns 401 when user is unauthenticated', async () => {
    (createClient as any).mockResolvedValue({
      auth: {
        getUser: async () => ({ data: { user: null } }),
      },
    });

    const response = await POST(
      buildRequest('http://localhost/api/expertise/auto-suggest', { text: 'React' })
    );

    expect(response.status).toBe(401);
  });

  it('returns deterministic suggestions by default', async () => {
    (createClient as any).mockResolvedValue({
      auth: {
        getUser: async () => ({ data: { user: { id: 'user-1' } } }),
      },
    });
    (suggestSkillsForDocuments as any).mockResolvedValue(buildSuggestPayload());

    const response = await POST(
      buildRequest('http://localhost/api/expertise/auto-suggest', {
        text: 'React TypeScript',
        context: 'cv',
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.suggestions).toHaveLength(1);
    expect(payload.metadata.method).toBe('deterministic');
    expect(payload.metadata.engine_used).toBe('typescript');
    expect(suggestSkillsForDocuments).toHaveBeenCalledTimes(1);
    expect(suggestSkillsWithGemini).not.toHaveBeenCalled();
  });

  it('uses Gemini when requested and returns AI metadata', async () => {
    (createClient as any).mockResolvedValue({
      auth: {
        getUser: async () => ({ data: { user: { id: 'user-1' } } }),
      },
    });

    const geminiPayload = {
      ...buildSuggestPayload(),
      metadata: {
        ...buildSuggestPayload().metadata,
        ai_provider: 'gemini' as const,
        ai_model: 'gemini-3.1-flash-lite',
        ai_key_slot: 'primary' as const,
        ai_fallback_reason: null,
        cost_ore: 12,
        currency: 'SEK' as const,
      },
    };

    (suggestSkillsWithGemini as any).mockResolvedValue({
      response: geminiPayload,
      idempotencyKey: 'idem-1',
      replayed: false,
    });

    const response = await POST(
      buildRequest('http://localhost/api/expertise/auto-suggest?engine=gemini', {
        text: 'React TypeScript',
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.metadata.method).toBe('gemini');
    expect(payload.metadata.ai_provider).toBe('gemini');
    expect(payload.metadata.ai_key_slot).toBe('primary');
    expect(payload.metadata.cost_ore).toBe(12);
    expect(payload.metadata.currency).toBe('SEK');
    expect(payload.metadata.engine_mode).toBe('gemini');
    expect(payload.metadata.engine_used).toBe('gemini');
    expect(suggestSkillsWithGemini).toHaveBeenCalledTimes(1);
    expect(suggestSkillsForDocuments).not.toHaveBeenCalled();
  });

  it('returns 429 when Gemini budget is exhausted', async () => {
    (createClient as any).mockResolvedValue({
      auth: {
        getUser: async () => ({ data: { user: { id: 'user-1' } } }),
      },
    });

    (suggestSkillsWithGemini as any).mockRejectedValue(
      new GeminiSuggestError(
        'Monthly Gemini budget exceeded.',
        'CV_IMPORT_BUDGET_EXCEEDED',
        429,
        'budget_exceeded'
      )
    );

    const response = await POST(
      buildRequest('http://localhost/api/expertise/auto-suggest?engine=gemini', {
        text: 'React TypeScript',
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(429);
    expect(payload.code).toBe('CV_IMPORT_BUDGET_EXCEEDED');
    expect(suggestSkillsForDocuments).not.toHaveBeenCalled();
  });

  it('falls back to deterministic extraction on non-budget Gemini errors', async () => {
    (createClient as any).mockResolvedValue({
      auth: {
        getUser: async () => ({ data: { user: { id: 'user-1' } } }),
      },
    });
    (suggestSkillsWithGemini as any).mockRejectedValue(
      new GeminiSuggestError(
        'Gemini returned invalid JSON.',
        'CV_IMPORT_GEMINI_INVALID_JSON',
        502,
        'invalid_json',
        { logId: 'log-1' }
      )
    );
    (suggestSkillsForDocuments as any).mockResolvedValue(buildSuggestPayload());

    const response = await POST(
      buildRequest('http://localhost/api/expertise/auto-suggest?engine=gemini', {
        text: 'React TypeScript',
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.metadata.method).toBe('deterministic_fallback');
    expect(payload.metadata.ai_provider).toBe('gemini');
    expect(payload.metadata.ai_fallback_reason).toBe('invalid_json');
    expect(payload.metadata.cost_ore).toBe(0);
    expect(payload.metadata.currency).toBe('SEK');
    expect(updateUsageLog).toHaveBeenCalledWith(
      'log-1',
      expect.objectContaining({
        status: 'fallback_success',
        errorCode: 'CV_IMPORT_GEMINI_INVALID_JSON',
      })
    );
  });
});
