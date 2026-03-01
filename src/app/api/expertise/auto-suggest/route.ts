import { NextRequest } from 'next/server';

import type { CvImportContext, CvImportSuggestResponse } from '@/lib/expertise/cv-import-suggest';
import { suggestSkillsForDocuments } from '@/lib/expertise/cv-import-suggest';
import {
  createRequestId,
  enforceCvImportUserRateLimit,
  jsonWithRequestId,
  resolveCvImportEngineMode,
} from '@/lib/expertise/cv-import-runtime';
import { updateUsageLog } from '@/lib/expertise/gemini/budget-ledger';
import {
  GeminiSuggestError,
  suggestSkillsWithGemini,
} from '@/lib/expertise/gemini/skill-extractor';
import { createClient } from '@/lib/supabase/server';

const LEGACY_MAX_SUGGESTIONS = 20;

function buildLegacySuggestions(suggestionResponse: CvImportSuggestResponse) {
  const documentResult = suggestionResponse.documents[0];

  const suggestionMap = new Map<
    string,
    {
      id: string;
      code: string;
      name: string;
      aliases: string[];
      description: string | null;
      slug: string;
      tags: string[] | null;
      score: number;
      confidence: number;
    }
  >();

  for (const candidate of documentResult?.candidates || []) {
    const mapped = candidate.suggestions[0];
    if (!mapped) {
      continue;
    }

    const existing = suggestionMap.get(mapped.skill_id);
    const confidence = Math.max(candidate.confidence, mapped.score);

    if (!existing || confidence > existing.confidence) {
      suggestionMap.set(mapped.skill_id, {
        id: mapped.skill_id,
        code: mapped.skill_id,
        name: mapped.skill_name,
        aliases: [],
        description: candidate.evidence_snippets[0] || null,
        slug: mapped.skill_name.toLowerCase().replace(/\s+/g, '-'),
        tags: null,
        score: mapped.score,
        confidence,
      });
    }
  }

  return Array.from(suggestionMap.values())
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, LEGACY_MAX_SUGGESTIONS);
}

async function markFallbackSuccess(error: GeminiSuggestError, payload: unknown) {
  if (!error.logId) {
    return;
  }

  try {
    await updateUsageLog(error.logId, {
      status: 'fallback_success',
      errorCode: error.code,
      errorMessage: error.message,
      responsePayload: payload,
      metadata: {
        deterministic_fallback: true,
        fallback_reason: error.fallbackReason,
      },
    });
  } catch {
    // Non-blocking usage log update.
  }
}

function isBudgetBlockingError(error: GeminiSuggestError): boolean {
  return error.code === 'CV_IMPORT_BUDGET_EXCEEDED' || error.code === 'CV_IMPORT_BUDGET_DISABLED';
}

export async function POST(request: NextRequest) {
  const requestId = createRequestId(request);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return jsonWithRequestId(requestId, { error: 'Unauthorized' }, 401);
  }

  const rateLimitResult = enforceCvImportUserRateLimit({
    userId: user.id,
    route: '/api/expertise/auto-suggest',
  });

  if (!rateLimitResult.allowed) {
    return jsonWithRequestId(
      requestId,
      {
        error: 'Too many requests',
        message: 'Rate limit exceeded. Please try again later.',
        code: 'CV_IMPORT_RATE_LIMIT_EXCEEDED',
        retry_after_seconds: rateLimitResult.retryAfterSeconds,
      },
      429,
      {
        'Retry-After': String(rateLimitResult.retryAfterSeconds),
      }
    );
  }

  try {
    const body = await request.json();
    const text = typeof body?.text === 'string' ? body.text : '';
    const context: CvImportContext =
      body?.context === 'cv' || body?.context === 'jd' || body?.context === 'general'
        ? body.context
        : 'general';

    if (!text.trim()) {
      return jsonWithRequestId(
        requestId,
        {
          error: 'Invalid input',
          message: 'text field is required and must be a string',
        },
        400
      );
    }

    const startedAt = Date.now();
    const engineMode = resolveCvImportEngineMode(request);

    const deterministicSuggest = async () =>
      suggestSkillsForDocuments(
        {
          documents: [
            {
              document_id: 'legacy-auto-suggest',
              file_name: 'legacy-input.txt',
              text,
              context,
            },
          ],
        },
        {
          maxDocuments: 1,
          maxCharsPerDocument: 30000,
          maxTotalChars: 30000,
        },
        {
          suggestionsLimit: 10,
          semanticEnabled: process.env.CV_IMPORT_SEMANTIC_ENABLED !== 'false',
        }
      );

    let suggestionResponse: CvImportSuggestResponse;
    let method: 'deterministic' | 'gemini' | 'deterministic_fallback' = 'deterministic';

    if (engineMode === 'gemini') {
      try {
        const gemini = await suggestSkillsWithGemini({
          requestId,
          userId: user.id,
          route: '/api/expertise/auto-suggest',
          documents: [
            {
              document_id: 'legacy-auto-suggest',
              file_name: 'legacy-input.txt',
              text,
              context,
            },
          ],
          suggestionsLimit: 10,
          idempotencyKeyHeader: request.headers.get('x-idempotency-key'),
        });

        suggestionResponse = gemini.response;
        method = 'gemini';
      } catch (error) {
        if (error instanceof GeminiSuggestError && isBudgetBlockingError(error)) {
          return jsonWithRequestId(
            requestId,
            {
              error: 'CV import budget exceeded',
              message: error.message,
              code: 'CV_IMPORT_BUDGET_EXCEEDED',
            },
            error.status
          );
        }

        suggestionResponse = await deterministicSuggest();
        method = 'deterministic_fallback';

        const fallbackPayload = {
          documents: suggestionResponse.documents,
          metadata: {
            ...suggestionResponse.metadata,
            ai_provider: 'gemini',
            ai_model: null,
            ai_key_slot: null,
            ai_fallback_reason:
              error instanceof GeminiSuggestError ? error.fallbackReason : 'model_error',
            cost_ore: 0,
            currency: 'SEK',
          },
        } as CvImportSuggestResponse;

        suggestionResponse = fallbackPayload;

        if (error instanceof GeminiSuggestError) {
          await markFallbackSuccess(error, fallbackPayload);
        }
      }
    } else {
      suggestionResponse = await deterministicSuggest();
    }

    const suggestions = buildLegacySuggestions(suggestionResponse);

    return jsonWithRequestId(requestId, {
      success: true,
      suggestions,
      metadata: {
        textLength: text.length,
        uniqueTerms: new Set(text.toLowerCase().split(/\W+/).filter(Boolean)).size,
        totalMatches: suggestions.length,
        context,
        summary: `Found ${suggestionResponse.documents[0]?.candidate_count || 0} candidate skills`,
        method,
        processingTimeMs: Date.now() - startedAt,
        semantic_used: suggestionResponse.metadata.semantic_used,
        semantic_fallback_triggered: suggestionResponse.metadata.semantic_fallback_triggered,
        unmapped_candidates_count: suggestionResponse.metadata.unmapped_candidates_count,
        ai_provider: suggestionResponse.metadata.ai_provider,
        ai_model: suggestionResponse.metadata.ai_model,
        ai_key_slot: suggestionResponse.metadata.ai_key_slot,
        ai_fallback_reason: suggestionResponse.metadata.ai_fallback_reason,
        cost_ore: suggestionResponse.metadata.cost_ore,
        currency: suggestionResponse.metadata.currency,
        engine_mode: engineMode,
        engine_used: method === 'gemini' ? 'gemini' : 'typescript',
      },
    });
  } catch (error) {
    return jsonWithRequestId(
      requestId,
      {
        error: 'Failed to generate suggestions',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
}
