import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import {
  CvImportSuggestRequestSchema,
  suggestSkillsForDocuments,
  type CvImportLimits,
  type CvImportSuggestResponse,
} from '@/lib/expertise/cv-import-suggest';
import {
  createRequestId,
  enforceCvImportUserRateLimit,
  jsonWithRequestId,
  resolveCvImportEngineMode,
  shouldProxyToPython,
  withRequestId,
} from '@/lib/expertise/cv-import-runtime';
import { updateUsageLog } from '@/lib/expertise/gemini/budget-ledger';
import type { CvImportEngineMode } from '@/lib/expertise/gemini/config';
import {
  GeminiSuggestError,
  suggestSkillsWithGemini,
  type GeminiSourceDocument,
} from '@/lib/expertise/gemini/skill-extractor';
import { proxyCvRequestToPython } from '@/lib/expertise/python-cv-proxy';
import { createClient } from '@/lib/supabase/server';

const DEFAULT_LIMITS: CvImportLimits = {
  maxDocuments: 5,
  maxCharsPerDocument: 30000,
  maxTotalChars: 90000,
};

const DEFAULT_SERVER_TIMEOUT_MS = 6000;
const GENERIC_SUGGEST_ERROR = 'Failed to process CV documents';
const UPLOAD_METADATA_ENCODING_ERROR_MESSAGE =
  'Upload metadata contains unsupported characters. Please rename the PDF and retry.';
const UTF8_CODEC_ERROR_PATTERN =
  /utf-8['"]?\s+codec\s+can'?t\s+decode\s+byte|can't decode byte.*utf-8|invalid continuation byte/i;

type EngineUsed = 'python' | 'typescript' | 'gemini';

type ExtractDocument = {
  document_id: string;
  file_name: string;
  context: 'cv' | 'jd' | 'general';
  parsed_text: string;
  parse_error?: string | null;
  parse_error_code?: string | null;
};

const ExtractResponseSchema = z.object({
  documents: z.array(
    z.object({
      document_id: z.string().min(1),
      file_name: z.string().min(1),
      context: z.enum(['cv', 'jd', 'general']).default('cv'),
      parsed_text: z.string().default(''),
      parse_error: z.string().nullable().optional(),
      parse_error_code: z.string().nullable().optional(),
    })
  ),
  metadata: z.unknown().optional(),
});

function parsePositiveInt(value: string | undefined, fallback: number): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return Math.floor(parsed);
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Request timed out')), timeoutMs);

    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

function normalizeSuggestionsLimit(value: number | undefined): number | undefined {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return undefined;
  }
  return Math.max(5, Math.min(10, Math.floor(value)));
}

function resolveSuggestionsLimitFromQuery(request: NextRequest): number | undefined {
  const raw = request.nextUrl.searchParams.get('suggestions_limit');
  if (!raw) {
    return undefined;
  }
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) {
    return undefined;
  }
  return normalizeSuggestionsLimit(parsed);
}

function defaultMetadata(limits: CvImportLimits): CvImportSuggestResponse['metadata'] {
  return {
    semantic_used: false,
    semantic_fallback_triggered: false,
    unmapped_candidates_count: 0,
    limits: {
      max_documents: limits.maxDocuments,
      max_chars_per_document: limits.maxCharsPerDocument,
      max_total_chars: limits.maxTotalChars,
    },
  };
}

function containsUtf8CodecError(value: string): boolean {
  return UTF8_CODEC_ERROR_PATTERN.test(value.toLowerCase());
}

function sanitizeCodecErrorRecord(record: Record<string, unknown>): Record<string, unknown> {
  let changed = false;
  const next: Record<string, unknown> = { ...record };

  for (const key of ['error', 'message', 'detail']) {
    const current = record[key];
    if (typeof current === 'string' && containsUtf8CodecError(current)) {
      next[key] = UPLOAD_METADATA_ENCODING_ERROR_MESSAGE;
      changed = true;
    }
  }

  return changed ? next : record;
}

function decorateMetadata(
  payload: CvImportSuggestResponse,
  mode: CvImportEngineMode,
  engineUsed: EngineUsed
): CvImportSuggestResponse {
  return {
    ...payload,
    metadata: {
      ...payload.metadata,
      engine_mode: mode,
      engine_used: engineUsed,
    },
  };
}

function normalizeErrorDocument(
  document: ExtractDocument
): CvImportSuggestResponse['documents'][number] {
  const parseError =
    typeof document.parse_error === 'string' && document.parse_error.trim().length > 0
      ? document.parse_error.trim()
      : 'No extractable text found in document.';

  return {
    document_id: document.document_id,
    file_name: document.file_name,
    context: document.context,
    parsed_text: '',
    parse_error: parseError,
    parse_error_code: document.parse_error_code || 'PDF_EMPTY_TEXT',
    candidate_count: 0,
    candidates: [],
  };
}

function buildGeminiSourceDocument(document: ExtractDocument): GeminiSourceDocument {
  return {
    document_id: document.document_id,
    file_name: document.file_name,
    context: document.context,
    text: document.parsed_text,
    parse_error:
      typeof document.parse_error === 'string' && document.parse_error.trim().length > 0
        ? document.parse_error.trim()
        : undefined,
    parse_error_code:
      typeof document.parse_error_code === 'string' && document.parse_error_code.trim().length > 0
        ? document.parse_error_code
        : undefined,
  };
}

function mergeGeminiAndFailedDocuments(params: {
  sourceOrder: Array<{ document_id: string; file_name: string; context: 'cv' | 'jd' | 'general' }>;
  geminiResponse: CvImportSuggestResponse;
  failedDocuments: ExtractDocument[];
}): CvImportSuggestResponse['documents'] {
  const byDocumentId = new Map(
    params.geminiResponse.documents.map((document) => [document.document_id, document])
  );
  const failedByDocumentId = new Map(
    params.failedDocuments.map((document) => [document.document_id, document])
  );

  return params.sourceOrder.map((sourceDocument) => {
    const failed = failedByDocumentId.get(sourceDocument.document_id);
    if (failed) {
      return normalizeErrorDocument(failed);
    }

    const suggested = byDocumentId.get(sourceDocument.document_id);
    if (suggested) {
      return suggested;
    }

    return {
      document_id: sourceDocument.document_id,
      file_name: sourceDocument.file_name,
      context: sourceDocument.context,
      parsed_text: '',
      parse_error: 'Document could not be analyzed.',
      parse_error_code: 'CV_IMPORT_ANALYSIS_FAILED',
      candidate_count: 0,
      candidates: [],
    };
  });
}

async function attachEngineMetadata(
  response: NextResponse,
  requestId: string,
  mode: CvImportEngineMode,
  engineUsed: EngineUsed
): Promise<NextResponse> {
  try {
    const payload = await response.clone().json();
    if (payload && typeof payload === 'object') {
      const record = sanitizeCodecErrorRecord(payload as Record<string, unknown>);
      const metadata =
        record.metadata && typeof record.metadata === 'object'
          ? (record.metadata as Record<string, unknown>)
          : {};

      const next = {
        ...record,
        metadata: {
          ...metadata,
          engine_mode: mode,
          engine_used: engineUsed,
        },
      };

      return jsonWithRequestId(requestId, next, response.status);
    }
  } catch {
    try {
      const textPayload = await response.clone().text();
      if (textPayload.trim().length > 0 && containsUtf8CodecError(textPayload)) {
        return jsonWithRequestId(
          requestId,
          {
            error: GENERIC_SUGGEST_ERROR,
            message: UPLOAD_METADATA_ENCODING_ERROR_MESSAGE,
            metadata: {
              engine_mode: mode,
              engine_used: engineUsed,
            },
          },
          response.status >= 400 ? response.status : 502
        );
      }
    } catch {
      // Keep original response body if text parsing fails.
    }
  }

  return withRequestId(response, requestId);
}

function isBudgetBlockingError(error: GeminiSuggestError): boolean {
  return error.code === 'CV_IMPORT_BUDGET_EXCEEDED' || error.code === 'CV_IMPORT_BUDGET_DISABLED';
}

function buildGeminiFallbackMetadata(
  metadata: CvImportSuggestResponse['metadata'],
  fallbackReason: string
): CvImportSuggestResponse['metadata'] {
  return {
    ...metadata,
    ai_provider: 'gemini',
    ai_model: null,
    ai_key_slot: null,
    ai_fallback_reason: fallbackReason,
    cost_ore: 0,
    currency: 'SEK',
  };
}

async function markFallbackSuccess(error: GeminiSuggestError, payload: CvImportSuggestResponse) {
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
    // Non-blocking logging update.
  }
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
    route: '/api/expertise/cv-import/suggest',
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
    const timeoutMs = parsePositiveInt(
      process.env.CV_IMPORT_SERVER_TIMEOUT_MS,
      DEFAULT_SERVER_TIMEOUT_MS
    );
    const contentType = request.headers.get('content-type') || '';
    const engineMode = resolveCvImportEngineMode(request);
    const proxyToPython = shouldProxyToPython(contentType, engineMode);

    if (proxyToPython) {
      try {
        const response = await proxyCvRequestToPython(request, '/suggest', timeoutMs);
        return await attachEngineMetadata(response, requestId, engineMode, 'python');
      } catch (error) {
        if (error instanceof Error && error.message.includes('timed out')) {
          return jsonWithRequestId(
            requestId,
            {
              error: 'CV import processing timed out',
              message: 'Try fewer documents or shorter CV content.',
            },
            408
          );
        }

        return jsonWithRequestId(
          requestId,
          {
            error: GENERIC_SUGGEST_ERROR,
            message: 'Python CV service is temporarily unavailable. Please retry shortly.',
            code: 'CV_IMPORT_DEPENDENCY_UNAVAILABLE',
          },
          503
        );
      }
    }

    const limits: CvImportLimits = {
      maxDocuments: parsePositiveInt(
        process.env.CV_IMPORT_MAX_DOCUMENTS,
        DEFAULT_LIMITS.maxDocuments
      ),
      maxCharsPerDocument: parsePositiveInt(
        process.env.CV_IMPORT_MAX_CHARS_PER_DOCUMENT,
        DEFAULT_LIMITS.maxCharsPerDocument
      ),
      maxTotalChars: parsePositiveInt(
        process.env.CV_IMPORT_MAX_TOTAL_CHARS,
        DEFAULT_LIMITS.maxTotalChars
      ),
    };

    const semanticEnabled = process.env.CV_IMPORT_SEMANTIC_ENABLED !== 'false';

    let sourceDocuments: ExtractDocument[] = [];
    let failedDocuments: ExtractDocument[] = [];
    let suggestionsLimit: number | undefined;

    if (contentType.startsWith('multipart/form-data') && engineMode === 'gemini') {
      const extractResponse = await proxyCvRequestToPython(request, '/extract', timeoutMs);
      if (!extractResponse.ok) {
        return await attachEngineMetadata(extractResponse, requestId, engineMode, 'gemini');
      }
      const extractPayload = ExtractResponseSchema.parse(await extractResponse.json());

      sourceDocuments = extractPayload.documents.map((document) => ({
        document_id: document.document_id,
        file_name: document.file_name,
        context: document.context,
        parsed_text: document.parsed_text,
        parse_error: document.parse_error,
        parse_error_code: document.parse_error_code,
      }));

      failedDocuments = sourceDocuments.filter(
        (document) =>
          (typeof document.parse_error === 'string' && document.parse_error.trim().length > 0) ||
          document.parsed_text.trim().length === 0
      );
      sourceDocuments = sourceDocuments.filter(
        (document) =>
          (!document.parse_error || document.parse_error.trim().length === 0) &&
          document.parsed_text.trim().length > 0
      );

      suggestionsLimit = resolveSuggestionsLimitFromQuery(request);
    } else {
      const parsedRequest = CvImportSuggestRequestSchema.parse(await request.json());
      sourceDocuments = parsedRequest.documents.map((document) => ({
        document_id: document.document_id,
        file_name: document.file_name,
        context: document.context,
        parsed_text: document.text,
      }));
      suggestionsLimit = normalizeSuggestionsLimit(parsedRequest.suggestions_limit);
    }

    const sourceOrder = [...sourceDocuments, ...failedDocuments].map((document) => ({
      document_id: document.document_id,
      file_name: document.file_name,
      context: document.context,
    }));

    if (engineMode === 'gemini') {
      if (sourceDocuments.length === 0) {
        const noTextPayload: CvImportSuggestResponse = {
          documents: failedDocuments.map((document) => normalizeErrorDocument(document)),
          metadata: {
            ...defaultMetadata(limits),
            ai_provider: 'gemini',
            ai_model: null,
            ai_key_slot: null,
            ai_fallback_reason: 'no_extractable_text',
            cost_ore: 0,
            currency: 'SEK',
          },
        };

        return jsonWithRequestId(
          requestId,
          decorateMetadata(noTextPayload, engineMode, 'gemini'),
          200
        );
      }

      const geminiInput = sourceDocuments.map((document) => buildGeminiSourceDocument(document));

      try {
        const geminiResult = await withTimeout(
          suggestSkillsWithGemini({
            requestId,
            userId: user.id,
            route: '/api/expertise/cv-import/suggest',
            documents: geminiInput,
            suggestionsLimit,
            idempotencyKeyHeader: request.headers.get('x-idempotency-key'),
          }),
          timeoutMs
        );

        const mergedPayload: CvImportSuggestResponse = {
          ...geminiResult.response,
          documents: mergeGeminiAndFailedDocuments({
            sourceOrder,
            geminiResponse: geminiResult.response,
            failedDocuments,
          }),
        };

        return jsonWithRequestId(
          requestId,
          decorateMetadata(mergedPayload, engineMode, 'gemini'),
          200
        );
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

        const deterministic = await withTimeout(
          suggestSkillsForDocuments(
            {
              documents: sourceDocuments.map((document) => ({
                document_id: document.document_id,
                file_name: document.file_name,
                text: document.parsed_text,
                context: document.context,
              })),
              suggestions_limit: suggestionsLimit,
            },
            limits,
            {
              semanticEnabled,
              suggestionsLimit,
            }
          ),
          timeoutMs
        );

        const fallbackReason =
          error instanceof GeminiSuggestError ? error.fallbackReason : 'model_error';

        const mergedFallbackPayload: CvImportSuggestResponse = {
          ...deterministic,
          documents: mergeGeminiAndFailedDocuments({
            sourceOrder,
            geminiResponse: deterministic,
            failedDocuments,
          }),
          metadata: buildGeminiFallbackMetadata(deterministic.metadata, fallbackReason),
        };

        if (error instanceof GeminiSuggestError) {
          await markFallbackSuccess(error, mergedFallbackPayload);
        }

        return jsonWithRequestId(
          requestId,
          decorateMetadata(mergedFallbackPayload, engineMode, 'typescript'),
          200
        );
      }
    }

    const deterministic = await withTimeout(
      suggestSkillsForDocuments(
        {
          documents: sourceDocuments.map((document) => ({
            document_id: document.document_id,
            file_name: document.file_name,
            text: document.parsed_text,
            context: document.context,
          })),
          suggestions_limit: suggestionsLimit,
        },
        limits,
        {
          semanticEnabled,
          suggestionsLimit,
        }
      ),
      timeoutMs
    );

    return jsonWithRequestId(
      requestId,
      decorateMetadata(deterministic, engineMode, 'typescript'),
      200
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonWithRequestId(
        requestId,
        {
          error: 'Invalid request payload',
          details: error.issues.map((issue) => ({
            path: issue.path.join('.'),
            message: issue.message,
          })),
        },
        400
      );
    }

    if (error instanceof Error && error.message.includes('Too many documents')) {
      return jsonWithRequestId(requestId, { error: error.message }, 413);
    }

    if (error instanceof Error && error.message.includes('exceeds max size')) {
      return jsonWithRequestId(requestId, { error: error.message }, 413);
    }

    if (error instanceof Error && error.message.includes('Total payload too large')) {
      return jsonWithRequestId(requestId, { error: error.message }, 413);
    }

    if (error instanceof Error && error.message.includes('timed out')) {
      return jsonWithRequestId(
        requestId,
        {
          error: 'CV import processing timed out',
          message: 'Try fewer documents or shorter CV content.',
        },
        408
      );
    }

    return jsonWithRequestId(
      requestId,
      {
        error: GENERIC_SUGGEST_ERROR,
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
}
