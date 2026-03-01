import { createHash } from 'node:crypto';
import { z } from 'zod';

import type { CvImportContext } from '@/lib/expertise/cv-import-suggest';
import type { CvImportSuggestResponse } from '@/lib/expertise/cv-import-suggest';
import {
  buildCvImportIdempotencyKey,
  ensureInProgressUsageLog,
  finalizeBudgetReservation,
  releaseBudgetReservation,
  reserveBudgetForSlot,
  updateUsageLog,
  type CvImportUsageStatus,
} from '@/lib/expertise/gemini/budget-ledger';
import {
  callGeminiStructuredJson,
  GeminiClientError,
  isGeminiQuotaExceededError,
} from '@/lib/expertise/gemini/client';
import {
  resolveConfiguredKeySlots,
  resolveGeminiApiKey,
  resolveGeminiMaxOutputTokens,
  resolveGeminiModelDefault,
  resolveGeminiModelFallback,
  resolveGeminiTemperature,
  resolveGeminiTimeoutMs,
  type GeminiKeySlot,
} from '@/lib/expertise/gemini/config';
import { computeGeminiCostOre, estimateReservationCostOre } from '@/lib/expertise/gemini/pricing';
import {
  GEMINI_DOCUMENTS_EXTRACTION_JSON_SCHEMA,
  GeminiDocumentsExtractionSchema,
  type GeminiSkillCandidate,
} from '@/lib/expertise/gemini/schemas';
import { mapGeminiCandidatesToCvImportCandidates } from '@/lib/expertise/gemini/taxonomy-mapper';
import { log } from '@/lib/log';

const DEFAULT_SUGGESTIONS_LIMIT = 8;

function normalizeSuggestionsLimit(value: number | undefined): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return DEFAULT_SUGGESTIONS_LIMIT;
  }
  return Math.max(5, Math.min(10, Math.floor(value)));
}

function computeSourceHash(params: {
  userId: string;
  route: string;
  documents: GeminiSourceDocument[];
  suggestionsLimit: number;
}): string {
  const material = JSON.stringify({
    userId: params.userId,
    route: params.route,
    suggestionsLimit: params.suggestionsLimit,
    documents: params.documents.map((document) => ({
      document_id: document.document_id,
      file_name: document.file_name,
      context: document.context,
      text: document.text,
      parse_error: document.parse_error || null,
      parse_error_code: document.parse_error_code || null,
    })),
  });
  return createHash('sha256').update(material).digest('hex');
}

function trimModelName(value: string): string {
  return value.trim().toLowerCase();
}

function buildGeminiPrompt(documents: GeminiSourceDocument[]): string {
  const renderedDocuments = documents
    .map((document) => {
      const text = document.text.slice(0, 30000);
      return [
        `Document ID: ${document.document_id}`,
        `Context: ${document.context}`,
        'Text:',
        text,
      ].join('\n');
    })
    .join('\n\n---\n\n');

  return [
    'Extract skill candidates for each document.',
    'Return JSON only. Do not include markdown.',
    'Rules:',
    '- Return each document from the input by document_id.',
    '- Include only concrete skills/tools/technologies/languages/certifications/soft skills present in text.',
    '- Do not invent skills.',
    '- confidence must be between 0 and 1.',
    '- evidence_snippets must be short verbatim snippets from the input text.',
    '',
    renderedDocuments,
  ].join('\n');
}

function normalizeUsageStatusFromFailure(error: unknown): CvImportUsageStatus {
  if (error instanceof GeminiSuggestError && error.code === 'CV_IMPORT_BUDGET_EXCEEDED') {
    return 'budget_blocked';
  }
  if (error instanceof GeminiSuggestError && error.code === 'CV_IMPORT_BUDGET_DISABLED') {
    return 'budget_blocked';
  }
  if (error instanceof GeminiSuggestError && error.code === 'CV_IMPORT_GEMINI_QUOTA_EXCEEDED') {
    return 'quota_failover';
  }
  if (error instanceof GeminiSuggestError && error.code === 'CV_IMPORT_GEMINI_INVALID_JSON') {
    return 'invalid_json';
  }
  if (error instanceof z.ZodError) {
    return 'invalid_json';
  }
  if (error instanceof GeminiClientError && error.code === 'invalid_json') {
    return 'invalid_json';
  }
  if (error instanceof GeminiClientError && error.code === 'quota_exceeded') {
    return 'quota_failover';
  }
  return 'model_error';
}

function normalizeFailureCode(error: unknown): string {
  if (error instanceof z.ZodError) {
    return 'CV_IMPORT_GEMINI_INVALID_JSON';
  }
  if (error instanceof GeminiClientError) {
    if (error.code === 'quota_exceeded') {
      return 'CV_IMPORT_GEMINI_QUOTA_EXCEEDED';
    }
    if (error.code === 'invalid_json') {
      return 'CV_IMPORT_GEMINI_INVALID_JSON';
    }
  }
  return 'CV_IMPORT_GEMINI_MODEL_ERROR';
}

function shouldRetryWithFallbackModel(error: unknown): boolean {
  if (error instanceof z.ZodError) {
    return true;
  }
  if (error instanceof GeminiClientError) {
    return error.code === 'invalid_json';
  }
  return false;
}

async function extractSkillCandidates(params: {
  model: string;
  apiKey: string;
  prompt: string;
  requestId: string;
}): Promise<{
  extracted: z.infer<typeof GeminiDocumentsExtractionSchema>;
  usage: { promptTokenCount: number; candidatesTokenCount: number; totalTokenCount: number };
  modelUsed: string;
}> {
  const response = await callGeminiStructuredJson({
    apiKey: params.apiKey,
    model: params.model,
    prompt: params.prompt,
    responseJsonSchema: GEMINI_DOCUMENTS_EXTRACTION_JSON_SCHEMA,
    maxOutputTokens: resolveGeminiMaxOutputTokens(),
    temperature: resolveGeminiTemperature(),
    timeoutMs: resolveGeminiTimeoutMs(),
    requestId: params.requestId,
  });

  const parsed = GeminiDocumentsExtractionSchema.parse(response.json);
  return {
    extracted: parsed,
    usage: response.usage,
    modelUsed: trimModelName(response.modelVersion || params.model),
  };
}

export type GeminiSourceDocument = {
  document_id: string;
  file_name: string;
  text: string;
  context: CvImportContext;
  parse_error?: string;
  parse_error_code?: string;
};

export type GeminiSuggestSuccess = {
  response: CvImportSuggestResponse & {
    metadata: CvImportSuggestResponse['metadata'] & {
      ai_provider: 'gemini';
      ai_model: string;
      ai_key_slot: GeminiKeySlot;
      ai_fallback_reason: string | null;
      cost_ore: number;
      currency: 'SEK';
      idempotency_key: string;
    };
  };
  idempotencyKey: string;
  replayed: boolean;
};

export class GeminiSuggestError extends Error {
  code: string;
  status: number;
  fallbackReason: string;
  logId?: string;
  idempotencyKey?: string;

  constructor(
    message: string,
    code: string,
    status: number,
    fallbackReason: string,
    details?: { logId?: string; idempotencyKey?: string }
  ) {
    super(message);
    this.name = 'GeminiSuggestError';
    this.code = code;
    this.status = status;
    this.fallbackReason = fallbackReason;
    this.logId = details?.logId;
    this.idempotencyKey = details?.idempotencyKey;
  }
}

export async function suggestSkillsWithGemini(params: {
  requestId: string;
  userId: string;
  route: string;
  documents: GeminiSourceDocument[];
  suggestionsLimit?: number;
  idempotencyKeyHeader?: string | null;
}): Promise<GeminiSuggestSuccess> {
  const startedAt = Date.now();
  const suggestionsLimit = normalizeSuggestionsLimit(params.suggestionsLimit);
  const sourceHash = computeSourceHash({
    userId: params.userId,
    route: params.route,
    documents: params.documents,
    suggestionsLimit,
  });
  const idempotencyKey = buildCvImportIdempotencyKey({
    userId: params.userId,
    route: params.route,
    sourceHash,
    explicitKey: params.idempotencyKeyHeader,
  });

  const inProgress = await ensureInProgressUsageLog({
    requestId: params.requestId,
    userId: params.userId,
    route: params.route,
    idempotencyKey,
    metadata: {
      documents_count: params.documents.length,
      source_hash: sourceHash,
    },
  });

  if (inProgress.replay) {
    return {
      response: inProgress.replay.payload as GeminiSuggestSuccess['response'],
      idempotencyKey,
      replayed: true,
    };
  }

  const keySlots = resolveConfiguredKeySlots();
  if (keySlots.length === 0) {
    await updateUsageLog(inProgress.logId, {
      status: 'failed',
      errorCode: 'CV_IMPORT_GEMINI_KEYS_MISSING',
      errorMessage: 'Gemini API keys are not configured.',
      latencyMs: Date.now() - startedAt,
    });
    throw new GeminiSuggestError(
      'Gemini CV extraction is unavailable.',
      'CV_IMPORT_GEMINI_KEYS_MISSING',
      503,
      'keys_missing',
      { logId: inProgress.logId, idempotencyKey }
    );
  }

  let lastError: unknown = null;
  let quotaFailoverCount = 0;
  const prompt = buildGeminiPrompt(params.documents);
  const estimatedReservation = estimateReservationCostOre({
    model: resolveGeminiModelDefault(),
    aggregateTextChars: params.documents.reduce((sum, document) => sum + document.text.length, 0),
    maxOutputTokens: resolveGeminiMaxOutputTokens(),
  });

  for (const keySlot of keySlots) {
    const apiKey = resolveGeminiApiKey(keySlot);
    if (!apiKey) {
      continue;
    }

    const reservationResult = await reserveBudgetForSlot({
      keySlot,
      estimatedCostOre: estimatedReservation,
    });

    if (!reservationResult.ok) {
      const budgetErrorCode =
        reservationResult.reason === 'disabled'
          ? 'CV_IMPORT_BUDGET_DISABLED'
          : 'CV_IMPORT_BUDGET_EXCEEDED';
      lastError = new GeminiSuggestError(
        reservationResult.reason === 'disabled'
          ? 'Gemini budget slot is disabled.'
          : 'Monthly Gemini budget exceeded.',
        budgetErrorCode,
        429,
        'budget_exceeded',
        { logId: inProgress.logId, idempotencyKey }
      );
      continue;
    }

    let reservationFinalized = false;
    try {
      const fallbackModel = resolveGeminiModelFallback();
      const defaultModel = resolveGeminiModelDefault();
      let usedFallbackModel = false;
      let extraction: Awaited<ReturnType<typeof extractSkillCandidates>>;

      try {
        extraction = await extractSkillCandidates({
          model: defaultModel,
          apiKey,
          prompt,
          requestId: params.requestId,
        });
      } catch (error) {
        if (
          trimModelName(fallbackModel) !== trimModelName(defaultModel) &&
          shouldRetryWithFallbackModel(error)
        ) {
          usedFallbackModel = true;
          extraction = await extractSkillCandidates({
            model: fallbackModel,
            apiKey,
            prompt,
            requestId: params.requestId,
          });
        } else {
          throw error;
        }
      }

      const byDocumentId = new Map(
        extraction.extracted.documents.map((document) => [document.document_id, document.skills])
      );

      const responseDocuments = [] as CvImportSuggestResponse['documents'];
      for (const document of params.documents) {
        const extractedSkills = (byDocumentId.get(document.document_id) ||
          []) as GeminiSkillCandidate[];
        const mappedCandidates = document.parse_error
          ? []
          : await mapGeminiCandidatesToCvImportCandidates({
              documentId: document.document_id,
              extractedSkills,
              suggestionsLimit,
            });

        responseDocuments.push({
          document_id: document.document_id,
          file_name: document.file_name,
          context: document.context,
          parsed_text: document.parse_error ? '' : document.text,
          parse_error: document.parse_error || null,
          parse_error_code: document.parse_error_code || null,
          candidate_count: mappedCandidates.length,
          candidates: mappedCandidates,
        });
      }

      const unmappedCount = responseDocuments.reduce((count, document) => {
        const unmapped = document.candidates.filter(
          (candidate) => candidate.unmapped_candidate
        ).length;
        return count + unmapped;
      }, 0);
      const promptTokens = extraction.usage.promptTokenCount;
      const outputTokens = extraction.usage.candidatesTokenCount;
      const totalTokens = extraction.usage.totalTokenCount;
      const actualCostOre = computeGeminiCostOre({
        model: extraction.modelUsed,
        promptTokens,
        outputTokens,
      });
      await finalizeBudgetReservation({
        reservation: reservationResult.reservation,
        actualCostOre,
      });
      reservationFinalized = true;

      const aiFallbackReason =
        quotaFailoverCount > 0 ? 'quota_failover' : usedFallbackModel ? 'model_retry' : null;

      const payload: GeminiSuggestSuccess['response'] = {
        documents: responseDocuments,
        metadata: {
          semantic_used: false,
          semantic_fallback_triggered: false,
          unmapped_candidates_count: unmappedCount,
          limits: {
            max_documents: params.documents.length,
            max_chars_per_document: Math.max(
              ...params.documents.map((document) => document.text.length),
              0
            ),
            max_total_chars: params.documents.reduce(
              (sum, document) => sum + document.text.length,
              0
            ),
          },
          ai_provider: 'gemini',
          ai_model: extraction.modelUsed,
          ai_key_slot: keySlot,
          ai_fallback_reason: aiFallbackReason,
          cost_ore: actualCostOre,
          currency: 'SEK',
          idempotency_key: idempotencyKey,
        },
      };

      await updateUsageLog(inProgress.logId, {
        status: 'success',
        keySlot,
        model: extraction.modelUsed,
        promptTokens,
        outputTokens,
        totalTokens,
        costOre: actualCostOre,
        reservedOre: reservationResult.reservation.estimatedCostOre,
        latencyMs: Date.now() - startedAt,
        responsePayload: payload,
        metadata: {
          documents_count: params.documents.length,
          suggestions_limit: suggestionsLimit,
          quota_failovers: quotaFailoverCount,
          model_fallback_used: usedFallbackModel,
        },
      });

      return {
        response: payload,
        idempotencyKey,
        replayed: false,
      };
    } catch (error) {
      lastError = error;
      try {
        if (!reservationFinalized) {
          await releaseBudgetReservation(reservationResult.reservation);
        }
      } catch (releaseError) {
        log.warn('cv_import.gemini.release_reservation_failed', {
          requestId: params.requestId,
          route: params.route,
          userId: params.userId,
          keySlot,
          error: releaseError instanceof Error ? releaseError.message : 'Unknown release error',
        });
      }

      if (isGeminiQuotaExceededError(error)) {
        quotaFailoverCount += 1;
        continue;
      }

      break;
    }
  }

  const status = normalizeUsageStatusFromFailure(lastError);
  const errorCode =
    lastError instanceof GeminiSuggestError ? lastError.code : normalizeFailureCode(lastError);
  const errorMessage =
    lastError instanceof Error ? lastError.message : 'Gemini CV extraction failed.';

  await updateUsageLog(inProgress.logId, {
    status,
    errorCode,
    errorMessage,
    latencyMs: Date.now() - startedAt,
    metadata: {
      documents_count: params.documents.length,
      suggestions_limit: suggestionsLimit,
      quota_failovers: quotaFailoverCount,
    },
  });

  if (errorCode === 'CV_IMPORT_BUDGET_EXCEEDED') {
    throw new GeminiSuggestError(errorMessage, errorCode, 429, 'budget_exceeded', {
      logId: inProgress.logId,
      idempotencyKey,
    });
  }

  if (errorCode === 'CV_IMPORT_BUDGET_DISABLED') {
    throw new GeminiSuggestError(errorMessage, errorCode, 429, 'budget_exceeded', {
      logId: inProgress.logId,
      idempotencyKey,
    });
  }

  if (errorCode === 'CV_IMPORT_GEMINI_QUOTA_EXCEEDED') {
    throw new GeminiSuggestError(errorMessage, errorCode, 429, 'quota_exceeded', {
      logId: inProgress.logId,
      idempotencyKey,
    });
  }

  if (errorCode === 'CV_IMPORT_GEMINI_INVALID_JSON') {
    throw new GeminiSuggestError(errorMessage, errorCode, 502, 'invalid_json', {
      logId: inProgress.logId,
      idempotencyKey,
    });
  }

  log.error('cv_import.gemini.suggest_failed', {
    requestId: params.requestId,
    route: params.route,
    userId: params.userId,
    errorCode,
    errorMessage,
  });

  throw new GeminiSuggestError(errorMessage, errorCode, 503, 'model_error', {
    logId: inProgress.logId,
    idempotencyKey,
  });
}
