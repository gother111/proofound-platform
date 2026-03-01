import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

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
import { suggestWizardForDocuments } from '@/lib/expertise/cv-import-wizard-extractor';
import {
  CvImportWizardSuggestRequestSchema,
  type CvImportWizardSuggestRequest,
  type CvImportWizardSuggestResponse,
} from '@/lib/expertise/cv-import-wizard-types';
import type { CvImportLimits, CvImportSuggestResponse } from '@/lib/expertise/cv-import-suggest';
import { createClient } from '@/lib/supabase/server';

const DEFAULT_LIMITS: CvImportLimits = {
  maxDocuments: 5,
  maxCharsPerDocument: 30000,
  maxTotalChars: 90000,
};

const DEFAULT_SERVER_TIMEOUT_MS = 15000;
const GENERIC_WIZARD_ERROR = 'Failed to process CV wizard suggestions';
const WIZARD_DEPENDENCY_UNAVAILABLE_CODE = 'WIZARD_DEPENDENCY_UNAVAILABLE';
const WIZARD_PROCESSING_FAILED_CODE = 'WIZARD_PROCESSING_FAILED';
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

function defaultMetadata(limits: CvImportLimits): CvImportWizardSuggestResponse['metadata'] {
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
  payload: CvImportWizardSuggestResponse,
  mode: CvImportEngineMode,
  engineUsed: EngineUsed
): CvImportWizardSuggestResponse {
  return {
    ...payload,
    metadata: {
      ...payload.metadata,
      engine_mode: mode,
      engine_used: engineUsed,
    },
  };
}

async function attachEngineMetadata(
  response: NextResponse,
  requestId: string,
  mode: CvImportEngineMode,
  engineUsed: EngineUsed
) {
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
            error: GENERIC_WIZARD_ERROR,
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
      // Keep original body as-is when text parsing fails.
    }
  }

  return withRequestId(response, requestId);
}

function normalizeWizardErrorDocument(
  document: ExtractDocument
): CvImportWizardSuggestResponse['documents'][number] {
  const parseError =
    typeof document.parse_error === 'string' && document.parse_error.trim().length > 0
      ? document.parse_error.trim()
      : 'No extractable text found in document.';

  return {
    document_id: document.document_id,
    file_name: document.file_name,
    context: 'cv',
    parsed_text: '',
    parse_error: parseError,
    parse_error_code: document.parse_error_code || 'PDF_EMPTY_TEXT',
    work_experiences: [],
    learning_experiences: [],
    volunteering: [],
    languages: [],
    skill_candidates: [],
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

function mergeWizardDocuments(params: {
  sourceOrder: Array<{ document_id: string; file_name: string; context: 'cv' | 'jd' | 'general' }>;
  failedDocuments: ExtractDocument[];
  wizardEntities: CvImportWizardSuggestResponse;
  geminiSkills: CvImportSuggestResponse;
}): CvImportWizardSuggestResponse['documents'] {
  const failedByDocumentId = new Map(
    params.failedDocuments.map((document) => [document.document_id, document])
  );
  const entitiesByDocumentId = new Map(
    params.wizardEntities.documents.map((document) => [document.document_id, document])
  );
  const skillsByDocumentId = new Map(
    params.geminiSkills.documents.map((document) => [document.document_id, document])
  );

  return params.sourceOrder.map((sourceDocument) => {
    const failed = failedByDocumentId.get(sourceDocument.document_id);
    if (failed) {
      return normalizeWizardErrorDocument(failed);
    }

    const entities = entitiesByDocumentId.get(sourceDocument.document_id);
    const skills = skillsByDocumentId.get(sourceDocument.document_id);

    if (!entities) {
      return {
        document_id: sourceDocument.document_id,
        file_name: sourceDocument.file_name,
        context: 'cv',
        parsed_text: '',
        parse_error: 'Document could not be analyzed.',
        parse_error_code: 'CV_IMPORT_ANALYSIS_FAILED',
        work_experiences: [],
        learning_experiences: [],
        volunteering: [],
        languages: [],
        skill_candidates: skills?.candidates || [],
      };
    }

    return {
      ...entities,
      skill_candidates: skills?.candidates || entities.skill_candidates,
    };
  });
}

function isDependencyUnavailableError(error: Error): boolean {
  const message = error.message.toLowerCase();

  const dependencyIndicators = [
    'skills_taxonomy',
    'relation',
    'column',
    'does not exist',
    'connection terminated',
    'connection refused',
    'timeout expired',
    'database',
    'econnrefused',
    'etimedout',
    'enotfound',
    'ehostunreach',
    'server closed the connection unexpectedly',
  ];

  return dependencyIndicators.some((indicator) => message.includes(indicator));
}

function isBudgetBlockingError(error: GeminiSuggestError): boolean {
  return error.code === 'CV_IMPORT_BUDGET_EXCEEDED' || error.code === 'CV_IMPORT_BUDGET_DISABLED';
}

function buildGeminiFallbackMetadata(
  metadata: CvImportWizardSuggestResponse['metadata'],
  fallbackReason: string
): CvImportWizardSuggestResponse['metadata'] {
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

async function markFallbackSuccess(
  error: GeminiSuggestError,
  payload: CvImportWizardSuggestResponse
) {
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
    route: '/api/expertise/cv-import/wizard-suggest',
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
        const response = await proxyCvRequestToPython(request, '/wizard-suggest', timeoutMs);
        return await attachEngineMetadata(response, requestId, engineMode, 'python');
      } catch (error) {
        if (error instanceof Error && error.message.includes('timed out')) {
          return jsonWithRequestId(
            requestId,
            {
              error: 'CV wizard processing timed out',
              message: 'Try fewer documents or shorter CV content.',
            },
            408
          );
        }

        return jsonWithRequestId(
          requestId,
          {
            error: GENERIC_WIZARD_ERROR,
            message: 'Python CV service is temporarily unavailable. Please retry shortly.',
            code: WIZARD_DEPENDENCY_UNAVAILABLE_CODE,
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
      const payload = CvImportWizardSuggestRequestSchema.parse(
        (await request.json()) as CvImportWizardSuggestRequest
      );
      sourceDocuments = payload.documents.map((document) => ({
        document_id: document.document_id,
        file_name: document.file_name,
        context: document.context,
        parsed_text: document.text,
      }));
      suggestionsLimit = normalizeSuggestionsLimit(payload.suggestions_limit);
    }

    const sourceOrder = [...sourceDocuments, ...failedDocuments].map((document) => ({
      document_id: document.document_id,
      file_name: document.file_name,
      context: document.context,
    }));

    if (engineMode === 'gemini') {
      if (sourceDocuments.length === 0) {
        const noTextPayload: CvImportWizardSuggestResponse = {
          documents: failedDocuments.map((document) => normalizeWizardErrorDocument(document)),
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

      const wizardEntities = await withTimeout(
        suggestWizardForDocuments(
          {
            documents: sourceDocuments.map((document) => ({
              document_id: document.document_id,
              file_name: document.file_name,
              text: document.parsed_text,
              context: 'cv',
            })),
            suggestions_limit: suggestionsLimit,
          },
          limits,
          {
            semanticEnabled,
            suggestionsLimit,
            skillSuggestionMode: 'disabled',
          }
        ),
        timeoutMs
      );

      const geminiInput = sourceDocuments.map((document) => buildGeminiSourceDocument(document));

      try {
        const geminiSkills = await withTimeout(
          suggestSkillsWithGemini({
            requestId,
            userId: user.id,
            route: '/api/expertise/cv-import/wizard-suggest',
            documents: geminiInput,
            suggestionsLimit,
            idempotencyKeyHeader: request.headers.get('x-idempotency-key'),
          }),
          timeoutMs
        );

        const mergedPayload: CvImportWizardSuggestResponse = {
          ...wizardEntities,
          documents: mergeWizardDocuments({
            sourceOrder,
            failedDocuments,
            wizardEntities,
            geminiSkills: geminiSkills.response,
          }),
          metadata: {
            ...wizardEntities.metadata,
            ...(geminiSkills.response.metadata as Record<string, unknown>),
          } as CvImportWizardSuggestResponse['metadata'],
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

        const deterministicFallback = await withTimeout(
          suggestWizardForDocuments(
            {
              documents: sourceDocuments.map((document) => ({
                document_id: document.document_id,
                file_name: document.file_name,
                text: document.parsed_text,
                context: 'cv',
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

        const mergedFallbackPayload: CvImportWizardSuggestResponse = {
          ...deterministicFallback,
          documents: mergeWizardDocuments({
            sourceOrder,
            failedDocuments,
            wizardEntities: deterministicFallback,
            geminiSkills: {
              documents: deterministicFallback.documents.map((document) => ({
                document_id: document.document_id,
                file_name: document.file_name,
                context: document.context,
                parsed_text: document.parsed_text,
                parse_error: document.parse_error,
                parse_error_code: document.parse_error_code,
                candidate_count: document.skill_candidates.length,
                candidates: document.skill_candidates,
              })),
              metadata: deterministicFallback.metadata,
            },
          }),
          metadata: buildGeminiFallbackMetadata(deterministicFallback.metadata, fallbackReason),
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

    const payload = await withTimeout(
      suggestWizardForDocuments(
        {
          documents: sourceDocuments.map((document) => ({
            document_id: document.document_id,
            file_name: document.file_name,
            text: document.parsed_text,
            context: 'cv',
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

    return jsonWithRequestId(requestId, decorateMetadata(payload, engineMode, 'typescript'), 200);
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
          error: 'CV wizard processing timed out',
          message: 'Try fewer documents or shorter CV content.',
        },
        408
      );
    }

    if (error instanceof Error && error.message.includes('CV context')) {
      return jsonWithRequestId(requestId, { error: error.message }, 400);
    }

    if (error instanceof Error && isDependencyUnavailableError(error)) {
      return jsonWithRequestId(
        requestId,
        {
          error: GENERIC_WIZARD_ERROR,
          message:
            'CV wizard dependencies are temporarily unavailable. Please retry in a few minutes.',
          code: WIZARD_DEPENDENCY_UNAVAILABLE_CODE,
        },
        503
      );
    }

    return jsonWithRequestId(
      requestId,
      {
        error: GENERIC_WIZARD_ERROR,
        message:
          error instanceof Error && error.message.trim().length > 0
            ? `CV wizard processing failed: ${error.message}`
            : 'CV wizard processing failed due to an unknown error. Please retry.',
        code: WIZARD_PROCESSING_FAILED_CODE,
      },
      500
    );
  }
}
