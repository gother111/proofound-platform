import { createHash } from 'node:crypto';
import { z } from 'zod';

import { generateJson, resolveAiAssistantsEnabled } from '@/lib/ai/provider';
import { AiProviderError } from '@/lib/ai/provider/types';
import type { CvImportContext } from '@/lib/expertise/cv-import-suggest';
import type { CvImportSuggestResponse } from '@/lib/expertise/cv-import-suggest';
import {
  buildCvImportIdempotencyKey,
  ensureInProgressUsageLog,
  updateUsageLog,
  type CvImportUsageStatus,
} from '@/lib/expertise/gemini/budget-ledger';
import {
  resolveConfiguredKeySlots,
  resolveGeminiAdaptiveMaxOutputTokens,
  resolveGeminiModelDefault,
  resolveGeminiModelFallback,
  resolveGeminiTemperature,
  resolveGeminiTaxonomyGuidedEnabled,
  type GeminiKeySlot,
} from '@/lib/expertise/gemini/config';
import { computeGeminiCostOre } from '@/lib/expertise/gemini/pricing';
import {
  GEMINI_DOCUMENTS_EXTRACTION_JSON_SCHEMA,
  GeminiDocumentsExtractionSchema,
  type GeminiSkillCandidate,
} from '@/lib/expertise/gemini/schemas';
import { verifyAtlasSkillCandidate } from '@/lib/expertise/atlas-skill-verifier';
import { rerankGeminiCandidates } from '@/lib/expertise/gemini/reranker';
import {
  buildTaxonomyShortlistsForDocuments,
  type TaxonomyShortlistSkill,
} from '@/lib/expertise/gemini/taxonomy-shortlist';
import { mapGeminiCandidatesToCvImportCandidates } from '@/lib/expertise/gemini/taxonomy-mapper';
import { log } from '@/lib/log';

const DEFAULT_SUGGESTIONS_LIMIT = 8;
const SKILL_EXTRACTION_PROMPT_VERSION = 'cv_import_skill_extraction_v1';
const AI_FEATURE_CV_IMPORT = 'cv_import';

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

function trimModelName(value: string | null | undefined): string {
  return value?.trim().toLowerCase() || '';
}

function renderShortlistForPrompt(shortlist: TaxonomyShortlistSkill[] | undefined): string {
  if (!shortlist || shortlist.length === 0) {
    return 'Shortlist: []';
  }

  const compact = shortlist.slice(0, 120).map((entry) => ({
    skill_id: entry.skill_id,
    skill_name: entry.skill_name,
    aliases: entry.aliases.slice(0, 4),
    category: entry.category,
  }));

  return `Taxonomy shortlist:\n${JSON.stringify(compact)}`;
}

function buildGeminiPrompt(params: {
  documents: GeminiSourceDocument[];
  shortlistByDocument: Map<string, TaxonomyShortlistSkill[]>;
  taxonomyGuided: boolean;
  suggestionsLimit: number;
}): string {
  const maxSkillsPerDocument = Math.max(14, Math.min(30, params.suggestionsLimit * 3));
  const renderedDocuments = params.documents
    .map((document) => {
      const text = document.text.slice(0, 30000);
      const shortlistSection = params.taxonomyGuided
        ? renderShortlistForPrompt(params.shortlistByDocument.get(document.document_id))
        : 'Taxonomy shortlist: []';
      return [
        `Document ID: ${document.document_id}`,
        `Context: ${document.context}`,
        shortlistSection,
        'Text:',
        text,
      ].join('\n');
    })
    .join('\n\n---\n\n');

  return [
    'Extract skill candidates for each document.',
    'Return JSON only. Do not include markdown.',
    'Rules:',
    '- Output format is { "skills": [ ... ] }.',
    '- Return one item per detected skill in a flat skills array.',
    '- Each skill item must include: document_id, raw_skill_text.',
    `- Return at most ${maxSkillsPerDocument} skills per document.`,
    '- Do not repeat duplicates or near-duplicate aliases (for example React.js vs React).',
    '- category is optional and should be one of: technical, soft_skills, tools_technologies, languages, certifications, other.',
    '- confidence is optional and must be between 0 and 1 when provided.',
    '- raw_skill_text should be concise and specific (max 60 chars) with no trailing punctuation.',
    '- evidence_snippet is optional but should be short (max 120 chars), verbatim, and contain the same skill mention.',
    '- taxonomy_candidate_skill_ids is optional and may include up to 3 skill IDs from the shortlist.',
    '- Use document_id values exactly as provided in input.',
    '- Include only concrete skills/tools/technologies/languages/certifications/soft skills present in text with explicit evidence.',
    '- Exclude generic role phrases, company names, and location names.',
    '- Do not invent skills.',
    '- If uncertain about taxonomy mapping, keep taxonomy_candidate_skill_ids empty.',
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
  if (
    error instanceof AiProviderError &&
    (error.code === 'invalid_json' || error.code === 'validation_failed')
  ) {
    return 'invalid_json';
  }
  if (error instanceof AiProviderError && error.code === 'quota_exceeded') {
    return 'quota_failover';
  }
  if (error instanceof AiProviderError && error.code === 'budget_exceeded') {
    return 'budget_blocked';
  }
  if (error instanceof AiProviderError && error.code === 'rate_limited') {
    return 'budget_blocked';
  }
  return 'model_error';
}

function normalizeFailureCode(error: unknown): string {
  if (error instanceof z.ZodError) {
    return 'CV_IMPORT_GEMINI_INVALID_JSON';
  }
  if (error instanceof AiProviderError) {
    if (error.code === 'quota_exceeded') {
      return 'CV_IMPORT_GEMINI_QUOTA_EXCEEDED';
    }
    if (error.code === 'invalid_json' || error.code === 'validation_failed') {
      return 'CV_IMPORT_GEMINI_INVALID_JSON';
    }
    if (error.code === 'assistants_disabled') {
      return 'CV_IMPORT_AI_ASSISTANTS_DISABLED';
    }
    if (error.code === 'missing_api_key') {
      return 'CV_IMPORT_GEMINI_KEYS_MISSING';
    }
    if (error.code === 'budget_exceeded') {
      return 'CV_IMPORT_BUDGET_EXCEEDED';
    }
    if (error.code === 'rate_limited') {
      return 'CV_IMPORT_AI_RATE_LIMITED';
    }
  }
  return 'CV_IMPORT_GEMINI_MODEL_ERROR';
}

function shouldRetryWithFallbackModel(error: unknown): boolean {
  if (error instanceof z.ZodError) {
    return true;
  }
  if (error instanceof AiProviderError) {
    return error.code === 'invalid_json' || error.code === 'validation_failed';
  }
  return false;
}

function isInvalidJsonLikeError(error: unknown): boolean {
  if (error instanceof z.ZodError) {
    return true;
  }
  return (
    error instanceof AiProviderError &&
    (error.code === 'invalid_json' || error.code === 'validation_failed')
  );
}

async function extractSkillCandidates(params: {
  model: string;
  keySlot: GeminiKeySlot;
  prompt: string;
  requestId: string;
  maxOutputTokens: number;
  userId: string;
  sourceHash: string;
  aggregateChars: number;
  documentsCount: number;
  suggestionsLimit: number;
}): Promise<{
  extracted: z.infer<typeof GeminiDocumentsExtractionSchema>;
  usage: { promptTokenCount: number; candidatesTokenCount: number; totalTokenCount: number };
  modelUsed: string;
  provider: 'gemini';
  promptVersion: string;
  feature: string;
}> {
  const response = await generateJson({
    model: params.model,
    prompt: params.prompt,
    responseJsonSchema: GEMINI_DOCUMENTS_EXTRACTION_JSON_SCHEMA,
    schema: GeminiDocumentsExtractionSchema,
    maxOutputTokens: params.maxOutputTokens,
    temperature: resolveGeminiTemperature(),
    requestId: params.requestId,
    promptVersion: SKILL_EXTRACTION_PROMPT_VERSION,
    feature: AI_FEATURE_CV_IMPORT,
    keySlot: params.keySlot,
    usage: {
      userId: params.userId,
      entityType: 'cv_import_batch',
      entityId: params.sourceHash.slice(0, 64),
      inputHash: params.sourceHash,
      sanitizedInputChars: params.aggregateChars,
      redactionSummary: {
        raw_prompt_stored: false,
        input_hash_only: true,
        documents_count: params.documentsCount,
      },
      safeMetadata: {
        documents_count: params.documentsCount,
        suggestions_limit: params.suggestionsLimit,
        key_slot: params.keySlot,
      },
    },
  });

  return {
    extracted: response.data,
    usage: {
      promptTokenCount: response.tokenUsage.inputTokens,
      candidatesTokenCount: response.tokenUsage.outputTokens,
      totalTokenCount: response.tokenUsage.totalTokens,
    },
    modelUsed: trimModelName(response.model || params.model),
    provider: response.provider,
    promptVersion: response.promptVersion,
    feature: response.feature,
  };
}

function groupSkillsByDocument(params: {
  extracted: z.infer<typeof GeminiDocumentsExtractionSchema>;
  documentIds: Set<string>;
}): Map<string, GeminiSkillCandidate[]> {
  const normalizeCategory = (value: string): GeminiSkillCandidate['category'] => {
    const normalized = value.trim().toLowerCase();
    if (
      normalized === 'technical' ||
      normalized === 'soft_skills' ||
      normalized === 'tools_technologies' ||
      normalized === 'languages' ||
      normalized === 'certifications' ||
      normalized === 'other'
    ) {
      return normalized;
    }
    return 'other';
  };

  const normalizeEvidence = (value: GeminiSkillCandidate['evidence_snippet']): string => {
    if (typeof value === 'string') {
      return value.trim();
    }
    if (Array.isArray(value)) {
      for (const entry of value) {
        const snippet = typeof entry === 'string' ? entry.trim() : '';
        if (snippet.length > 0) {
          return snippet;
        }
      }
    }
    return '';
  };

  const byDocumentId = new Map<string, GeminiSkillCandidate[]>();
  for (const skill of params.extracted.skills) {
    const documentId = skill.document_id.trim();
    const rawSkillText = skill.raw_skill_text.trim();
    if (!params.documentIds.has(documentId) || rawSkillText.length === 0) {
      continue;
    }

    const evidenceSnippet = normalizeEvidence(skill.evidence_snippet);
    const normalizedSkill: GeminiSkillCandidate = {
      ...skill,
      document_id: documentId,
      raw_skill_text: rawSkillText,
      category: normalizeCategory(skill.category),
      confidence: clamp(skill.confidence),
      evidence_snippet: evidenceSnippet.length > 0 ? evidenceSnippet : rawSkillText,
      taxonomy_candidate_skill_ids: (skill.taxonomy_candidate_skill_ids || [])
        .map((value) => value.trim())
        .filter((value) => value.length > 0)
        .slice(0, 3),
    };

    const current = byDocumentId.get(documentId) || [];
    current.push(normalizedSkill);
    byDocumentId.set(documentId, current);
  }
  return byDocumentId;
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
      ai_request_id: string;
      ai_prompt_version: string;
      ai_feature: string;
      ai_token_usage: {
        input_tokens: number;
        output_tokens: number;
        total_tokens: number;
      };
      cost_ore: number;
      currency: 'SEK';
      idempotency_key: string;
      ai_schema_mode: 'flat_skills_v1';
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

type QualityMetadata = {
  mapped_ratio: number;
  skills_mapped_after_rerank: number;
  evidence_valid_ratio: number;
  high_confidence_count: number;
  confidence_tiers: {
    high: number;
    medium: number;
    low: number;
  };
  avg_skills_per_document: number;
  cost_per_mapped_skill_ore?: number;
};

function clamp(value: number, min = 0, max = 1): number {
  return Math.max(min, Math.min(max, value));
}

function safeDivide(numerator: number, denominator: number): number {
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator <= 0) {
    return 0;
  }
  return numerator / denominator;
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

  if (!resolveAiAssistantsEnabled()) {
    throw new GeminiSuggestError(
      'AI assistants are disabled.',
      'CV_IMPORT_AI_ASSISTANTS_DISABLED',
      503,
      'assistants_disabled',
      { idempotencyKey }
    );
  }

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
  const aggregateChars = params.documents.reduce((sum, document) => sum + document.text.length, 0);
  const adaptiveMaxOutputTokens = resolveGeminiAdaptiveMaxOutputTokens(aggregateChars);
  const taxonomyGuided = resolveGeminiTaxonomyGuidedEnabled();
  const shortlistByDocument = taxonomyGuided
    ? await buildTaxonomyShortlistsForDocuments({
        documents: params.documents,
        suggestionsLimit,
      })
    : new Map<string, TaxonomyShortlistSkill[]>();
  const prompt = buildGeminiPrompt({
    documents: params.documents,
    shortlistByDocument,
    taxonomyGuided,
    suggestionsLimit,
  });
  const shortlistDurationMs = Date.now() - startedAt;

  for (const keySlot of keySlots) {
    try {
      const fallbackModel = resolveGeminiModelFallback();
      const defaultModel = resolveGeminiModelDefault();
      let usedFallbackModel = false;
      const geminiStartedAt = Date.now();
      let extraction: Awaited<ReturnType<typeof extractSkillCandidates>>;
      const boostedMaxOutputTokens = Math.min(
        3200,
        Math.max(adaptiveMaxOutputTokens + 400, adaptiveMaxOutputTokens * 2)
      );

      const extractWithRetries = async (model: string) => {
        try {
          return await extractSkillCandidates({
            model,
            keySlot,
            prompt,
            requestId: params.requestId,
            maxOutputTokens: adaptiveMaxOutputTokens,
            userId: params.userId,
            sourceHash,
            aggregateChars,
            documentsCount: params.documents.length,
            suggestionsLimit,
          });
        } catch (error) {
          if (!isInvalidJsonLikeError(error) || boostedMaxOutputTokens <= adaptiveMaxOutputTokens) {
            throw error;
          }

          return await extractSkillCandidates({
            model,
            keySlot,
            prompt,
            requestId: params.requestId,
            maxOutputTokens: boostedMaxOutputTokens,
            userId: params.userId,
            sourceHash,
            aggregateChars,
            documentsCount: params.documents.length,
            suggestionsLimit,
          });
        }
      };

      try {
        extraction = await extractWithRetries(defaultModel);
      } catch (error) {
        if (
          fallbackModel &&
          trimModelName(fallbackModel) !== trimModelName(defaultModel) &&
          shouldRetryWithFallbackModel(error)
        ) {
          usedFallbackModel = true;
          extraction = await extractWithRetries(fallbackModel);
        } else {
          throw error;
        }
      }

      const byDocumentId = groupSkillsByDocument({
        extracted: extraction.extracted,
        documentIds: new Set(params.documents.map((document) => document.document_id)),
      });

      const responseDocuments = [] as CvImportSuggestResponse['documents'];
      let totalInputCandidates = 0;
      let totalFinalCandidates = 0;
      let totalMappedCandidates = 0;
      let totalHighConfidenceCount = 0;
      const aggregatedTiers = { high: 0, medium: 0, low: 0 };
      let analyzedDocuments = 0;

      for (const document of params.documents) {
        const extractedSkills = (byDocumentId.get(document.document_id) ||
          []) as GeminiSkillCandidate[];
        const mappedCandidates =
          document.parse_error || document.text.trim().length === 0
            ? []
            : await mapGeminiCandidatesToCvImportCandidates({
                documentId: document.document_id,
                extractedSkills,
                suggestionsLimit,
                taxonomyShortlist: shortlistByDocument.get(document.document_id) || [],
              });

        const reranked = rerankGeminiCandidates({
          text: document.text,
          candidates: mappedCandidates,
        });
        const verifiedCandidates = await Promise.all(
          reranked.candidates.map(async (candidate) => {
            const atlasVerification = await verifyAtlasSkillCandidate({
              rawSkillText: candidate.raw_skill_text,
              category: candidate.category,
              evidenceSnippets: candidate.evidence_snippets,
              suggestions: candidate.suggestions,
              limit: suggestionsLimit,
            });

            const nextCandidate = {
              ...candidate,
              suggestions: atlasVerification.suggestions,
              unmapped_candidate:
                atlasVerification.forceUnmapped || atlasVerification.suggestions.length === 0,
            };

            return nextCandidate;
          })
        );
        totalInputCandidates += reranked.metrics.inputCandidateCount;
        totalFinalCandidates += verifiedCandidates.length;
        totalMappedCandidates += verifiedCandidates.filter(
          (candidate) => !candidate.unmapped_candidate
        ).length;
        totalHighConfidenceCount += reranked.metrics.highConfidenceCount;
        aggregatedTiers.high += reranked.metrics.confidenceTiers.high;
        aggregatedTiers.medium += reranked.metrics.confidenceTiers.medium;
        aggregatedTiers.low += reranked.metrics.confidenceTiers.low;
        if (!document.parse_error && document.text.trim().length > 0) {
          analyzedDocuments += 1;
        }

        responseDocuments.push({
          document_id: document.document_id,
          file_name: document.file_name,
          context: document.context,
          parsed_text: document.parse_error ? '' : document.text,
          parse_error: document.parse_error || null,
          parse_error_code: document.parse_error_code || null,
          candidate_count: verifiedCandidates.length,
          candidates: verifiedCandidates,
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
      const geminiDurationMs = Date.now() - geminiStartedAt;
      const totalDurationMs = Date.now() - startedAt;
      const aiFallbackReason =
        quotaFailoverCount > 0 ? 'quota_failover' : usedFallbackModel ? 'model_retry' : null;
      const quality: QualityMetadata = {
        mapped_ratio: clamp(safeDivide(totalMappedCandidates, totalFinalCandidates || 1)),
        skills_mapped_after_rerank: totalMappedCandidates,
        evidence_valid_ratio: clamp(safeDivide(totalFinalCandidates, totalInputCandidates || 1)),
        high_confidence_count: totalHighConfidenceCount,
        confidence_tiers: aggregatedTiers,
        avg_skills_per_document: Number(
          safeDivide(totalFinalCandidates, Math.max(1, analyzedDocuments)).toFixed(2)
        ),
      };
      if (totalMappedCandidates > 0) {
        quality.cost_per_mapped_skill_ore = Math.max(
          0,
          Math.round(actualCostOre / totalMappedCandidates)
        );
      }

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
          ai_request_id: params.requestId,
          ai_prompt_version: extraction.promptVersion,
          ai_feature: extraction.feature,
          ai_token_usage: {
            input_tokens: promptTokens,
            output_tokens: outputTokens,
            total_tokens: totalTokens,
          },
          cost_ore: actualCostOre,
          currency: 'SEK',
          idempotency_key: idempotencyKey,
          ai_schema_mode: 'flat_skills_v1',
          timings: {
            shortlist_ms: shortlistDurationMs,
            gemini_ms: geminiDurationMs,
            total_ms: totalDurationMs,
          },
          quality,
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
        reservedOre: 0,
        latencyMs: Date.now() - startedAt,
        responsePayload: payload,
        metadata: {
          documents_count: params.documents.length,
          suggestions_limit: suggestionsLimit,
          quota_failovers: quotaFailoverCount,
          model_fallback_used: usedFallbackModel,
          taxonomy_guided: taxonomyGuided,
          adaptive_max_output_tokens: adaptiveMaxOutputTokens,
          timings: {
            shortlist_ms: shortlistDurationMs,
            gemini_ms: geminiDurationMs,
            total_ms: totalDurationMs,
          },
          quality,
        },
      });

      return {
        response: payload,
        idempotencyKey,
        replayed: false,
      };
    } catch (error) {
      lastError = error;

      if (error instanceof AiProviderError && error.code === 'quota_exceeded') {
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
      timings: {
        shortlist_ms: shortlistDurationMs,
        total_ms: Date.now() - startedAt,
      },
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

  if (errorCode === 'CV_IMPORT_AI_RATE_LIMITED') {
    throw new GeminiSuggestError(errorMessage, errorCode, 429, 'rate_limited', {
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
