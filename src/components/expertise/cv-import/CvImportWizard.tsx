'use client';

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { Download, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

import { apiFetch } from '@/lib/api/fetch';
import {
  ANALYZE_PROGRESS_AUTO_COLLAPSE_MS,
  AnalyzeProgressPanel,
  type AnalyzeProgressPhase,
  type AnalyzeProgressState,
  createIdleAnalyzeProgressState,
} from '@/components/expertise/cv-import/AnalyzeProgressPanel';
import { EntitySummaryCard } from '@/components/expertise/cv-import/EntitySummaryCard';
import {
  ImportActionBanner,
  type ImportActionSummary,
} from '@/components/expertise/cv-import/ImportActionBanner';
import { resolveInitialSkillSelectionState } from '@/components/expertise/cv-import/initial-selection';
import { buildManualSuggestion } from '@/components/expertise/cv-import/manual-suggestion';
import { buildCvImportTaxonomySearchUrl } from '@/components/expertise/cv-import/taxonomy-search';
import {
  SkillReviewPanel,
  type SkillReviewOutcome,
  type SkillReviewSelectionMeta,
} from '@/components/expertise/cv-import/SkillReviewPanel';
import { EventType } from '@/lib/analytics/constants';
import { buildCvImportReviewTelemetry } from '@/lib/expertise/cv-review-telemetry';
import { getAmbiguousTokenHints } from '@/lib/expertise/skill-confidence';
import { LANGUAGE_OPTIONS, CEFR_LEVELS } from '@/lib/taxonomy/data';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

type CandidateCategory =
  | 'technical'
  | 'soft_skills'
  | 'tools_technologies'
  | 'languages'
  | 'certifications'
  | 'other';

type MatchMethod = 'exact' | 'synonym' | 'fuzzy' | 'semantic';
type ApiFallbackStage =
  | 'none'
  | 'python_multipart_failed'
  | 'python_json_retry'
  | 'typescript_retry'
  | 'candidate_only';

interface ApiSuggestion {
  skill_id: string;
  skill_name: string;
  match_method: MatchMethod;
  score: number;
}

interface ApiSkillCandidate {
  candidate_id: string;
  raw_skill_text: string;
  category: CandidateCategory;
  evidence_snippets: string[];
  confidence: number;
  suggestions: ApiSuggestion[];
  unmapped_candidate: boolean;
  already_in_profile?: boolean;
  verification_fallback_reason?: string | null;
}

interface ApiWorkExperience {
  item_id: string;
  title: string;
  organization: string;
  duration: string;
  summary: string;
  evidence_snippets: string[];
  confidence: number;
}

interface ApiLearningExperience {
  item_id: string;
  institution: string;
  degree: string;
  duration: string;
  skills: string;
  projects: string;
  evidence_snippets: string[];
  confidence: number;
}

interface ApiVolunteering {
  item_id: string;
  title: string;
  organization: string;
  duration: string;
  cause: string;
  impact: string;
  skills_deployed: string;
  personal_why: string;
  evidence_snippets: string[];
  confidence: number;
}

interface ApiLanguage {
  item_id: string;
  language_code: string;
  language_name: string;
  level: string;
  evidence_snippets: string[];
  confidence: number;
}

interface ApiDocumentResult {
  document_id: string;
  file_name: string;
  context: 'cv';
  parsed_text: string;
  parse_error: string | undefined;
  parse_error_code: string | undefined;
  work_experiences: ApiWorkExperience[];
  learning_experiences: ApiLearningExperience[];
  volunteering: ApiVolunteering[];
  languages: ApiLanguage[];
  skill_candidates: ApiSkillCandidate[];
}

interface ApiMetadata {
  semantic_used: boolean;
  semantic_fallback_triggered: boolean;
  fallback_stage: ApiFallbackStage;
  candidate_only_fallback_triggered: boolean;
  match_dependency_error_code?: string;
  unmapped_candidates_count: number;
  ai_model?: string | null;
  ai_key_slot?: 'primary' | 'secondary' | null;
  ai_fallback_reason?: string | null;
  partial_results?: boolean;
  atlas_verification_fallback_triggered?: boolean;
  wizard_stage_failed?:
    | 'python_extract'
    | 'wizard_entities'
    | 'gemini_skills'
    | 'atlas_verification';
  cost_ore?: number;
  engine_mode?: 'auto' | 'typescript' | 'python' | 'gemini';
  engine_used?: 'python' | 'typescript' | 'gemini';
  limits: {
    max_documents: number;
    max_chars_per_document: number;
    max_total_chars: number;
  };
}

interface ApiSuggestResponse {
  documents: ApiDocumentResult[];
  metadata: ApiMetadata;
}

interface ApiExtractedTextDocument {
  document_id: string;
  file_name: string;
  text: string;
  context: 'cv';
}

interface ApiExtractFailedDocument {
  document_id: string;
  file_name: string;
  context: 'cv';
  parse_error: string;
  parse_error_code?: string | null;
}

type ApiExtractStatusResponse =
  | {
      job_id: string;
      status: 'queued' | 'processing';
      poll_after_ms: number;
      retry_after_ms?: number;
      recovery_state?: 'queued' | 'retrying';
    }
  | {
      job_id: string;
      status: 'completed';
      documents: ApiExtractedTextDocument[];
      failed_documents: ApiExtractFailedDocument[];
      cleanup_pending?: boolean;
    }
  | {
      job_id: string;
      status: 'failed';
      error: string;
      message?: string;
      code?: string;
    };

interface WorkState extends ApiWorkExperience {
  approved: boolean;
}

interface LearningState extends ApiLearningExperience {
  approved: boolean;
}

interface VolunteeringState extends ApiVolunteering {
  approved: boolean;
}

interface LanguageState extends ApiLanguage {
  approved: boolean;
}

interface SkillState extends ApiSkillCandidate {
  approved: boolean;
  selected_skill_ids: string[];
  manual_search_query: string;
  manual_options: ApiSuggestion[];
  manual_loading: boolean;
  show_all_suggestions: boolean;
  manual_last_search_at?: string;
  review_outcome: SkillReviewOutcome;
}

interface ParsedDocumentState {
  document_id: string;
  file_name: string;
  file?: File;
  parsed_text: string;
  parse_error?: string;
  parse_error_code?: string;
  work_experiences: WorkState[];
  learning_experiences: LearningState[];
  volunteering: VolunteeringState[];
  languages: LanguageState[];
  skill_candidates: SkillState[];
}

interface CvImportWizardProps {
  onApplyComplete?: (payload: {
    skillIds: string[];
    skillNameById: Record<string, string>;
  }) => void;
}

interface AnalyzeDocumentDescriptor {
  localId: string;
  requestId: string;
  document: ParsedDocumentState;
}

interface StoredExtractJobState {
  jobId: string;
  fingerprint: string;
  documents: Array<{
    requestId: string;
    localId: string;
    fileName: string;
  }>;
}

const DEFAULT_METADATA: ApiMetadata = {
  semantic_used: false,
  semantic_fallback_triggered: false,
  fallback_stage: 'none',
  candidate_only_fallback_triggered: false,
  match_dependency_error_code: undefined,
  unmapped_candidates_count: 0,
  partial_results: false,
  atlas_verification_fallback_triggered: false,
  wizard_stage_failed: undefined,
  limits: {
    max_documents: 5,
    max_chars_per_document: 30000,
    max_total_chars: 90000,
  },
};

const EXTRACT_JOB_SESSION_STORAGE_KEY = 'cv-import-wizard-extract-job';

const GENERIC_BACKEND_ERRORS = new Set([
  'Failed to extract CV text',
  'Failed to process CV wizard suggestions',
  'Failed to process CV documents',
]);
const PROXY_RETRYABLE_CODES = new Set([
  'CV_IMPORT_PROXY_UNAVAILABLE',
  'CV_IMPORT_PROXY_TIMEOUT',
  'CV_IMPORT_PROXY_INVALID_CONTRACT',
]);
const MAX_QUEUED_EXTRACT_WAIT_MS = 10_000;
const BACKGROUND_CONTINUE_NOTICE_MS = 20_000;
const BACKGROUND_CONTINUE_POLL_AFTER_MS = 5_000;
const MAX_PYTHON_REQUEUE_ATTEMPTS = 1;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

async function readJsonSafely(response: Response): Promise<unknown | null> {
  try {
    return await response.clone().json();
  } catch {
    return null;
  }
}

async function readTextSafely(response: Response): Promise<string> {
  try {
    return (await response.clone().text()).trim();
  } catch {
    return '';
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function buildAnalyzeFingerprint(documents: AnalyzeDocumentDescriptor[]): string {
  return documents
    .map(({ requestId, document }) =>
      [
        requestId,
        document.file_name,
        document.file?.size ?? 0,
        document.file?.lastModified ?? 0,
      ].join(':')
    )
    .join('|');
}

function saveStoredExtractJobState(state: StoredExtractJobState): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.sessionStorage.setItem(EXTRACT_JOB_SESSION_STORAGE_KEY, JSON.stringify(state));
}

function readStoredExtractJobState(): StoredExtractJobState | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const raw = window.sessionStorage.getItem(EXTRACT_JOB_SESSION_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as StoredExtractJobState;
    if (
      typeof parsed?.jobId !== 'string' ||
      typeof parsed?.fingerprint !== 'string' ||
      !Array.isArray(parsed?.documents)
    ) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

function clearStoredExtractJobState(): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.sessionStorage.removeItem(EXTRACT_JOB_SESSION_STORAGE_KEY);
}

async function readErrorMessage(response: Response, fallback: string): Promise<string> {
  const payload = await readJsonSafely(response);
  if (isRecord(payload)) {
    const error = payload.error;
    const message = payload.message;

    if (
      typeof error === 'string' &&
      typeof message === 'string' &&
      message.trim().length > 0 &&
      GENERIC_BACKEND_ERRORS.has(error.trim())
    ) {
      return message;
    }

    if (typeof error === 'string' && error.trim().length > 0) {
      return error;
    }

    if (typeof message === 'string' && message.trim().length > 0) {
      return message;
    }
  }

  const textPayload = await readTextSafely(response);
  if (textPayload.length > 0) {
    return textPayload;
  }

  return fallback;
}

function normalizeExtractStatusResponse(payload: unknown): ApiExtractStatusResponse | null {
  if (
    !isRecord(payload) ||
    typeof payload.job_id !== 'string' ||
    typeof payload.status !== 'string'
  ) {
    return null;
  }

  if (payload.status === 'queued' || payload.status === 'processing') {
    return {
      job_id: payload.job_id,
      status: payload.status,
      poll_after_ms:
        typeof payload.poll_after_ms === 'number' && Number.isFinite(payload.poll_after_ms)
          ? Math.max(250, Math.floor(payload.poll_after_ms))
          : 1500,
      retry_after_ms:
        typeof payload.retry_after_ms === 'number' && Number.isFinite(payload.retry_after_ms)
          ? Math.max(250, Math.floor(payload.retry_after_ms))
          : undefined,
      recovery_state:
        payload.recovery_state === 'queued' || payload.recovery_state === 'retrying'
          ? payload.recovery_state
          : undefined,
    };
  }

  if (payload.status === 'completed') {
    const documents = Array.isArray(payload.documents)
      ? payload.documents.flatMap((document) =>
          isRecord(document) &&
          typeof document.document_id === 'string' &&
          typeof document.file_name === 'string' &&
          typeof document.text === 'string' &&
          document.context === 'cv'
            ? [
                {
                  document_id: document.document_id,
                  file_name: document.file_name,
                  text: document.text,
                  context: 'cv' as const,
                },
              ]
            : []
        )
      : [];

    const failedDocuments = Array.isArray(payload.failed_documents)
      ? payload.failed_documents.flatMap((document) =>
          isRecord(document) &&
          typeof document.document_id === 'string' &&
          typeof document.file_name === 'string' &&
          typeof document.parse_error === 'string' &&
          document.context === 'cv'
            ? [
                {
                  document_id: document.document_id,
                  file_name: document.file_name,
                  context: 'cv' as const,
                  parse_error: document.parse_error,
                  parse_error_code:
                    typeof document.parse_error_code === 'string'
                      ? document.parse_error_code
                      : null,
                },
              ]
            : []
        )
      : [];

    return {
      job_id: payload.job_id,
      status: 'completed',
      documents,
      failed_documents: failedDocuments,
      cleanup_pending: Boolean(payload.cleanup_pending),
    };
  }

  if (payload.status === 'failed' && typeof payload.error === 'string') {
    return {
      job_id: payload.job_id,
      status: 'failed',
      error: payload.error,
      message: typeof payload.message === 'string' ? payload.message : payload.error,
      code: typeof payload.code === 'string' ? payload.code : undefined,
    };
  }

  return null;
}

function isProxyRetryableError(payload: unknown): boolean {
  if (!isRecord(payload)) {
    return false;
  }

  return typeof payload.code === 'string' && PROXY_RETRYABLE_CODES.has(payload.code);
}

function isProxyRetryableCode(code: string | undefined): boolean {
  return typeof code === 'string' && PROXY_RETRYABLE_CODES.has(code);
}

function isFallbackStage(value: unknown): value is ApiFallbackStage {
  return (
    value === 'none' ||
    value === 'python_multipart_failed' ||
    value === 'python_json_retry' ||
    value === 'typescript_retry' ||
    value === 'candidate_only'
  );
}

function normalizeScore(value: unknown, fallback = 0): number {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return fallback;
  }

  return Math.max(0, Math.min(1, value));
}

function createSafeDocumentId(index: number): string {
  const timestampPart = Date.now().toString(36);
  const randomPart = Math.random().toString(36).slice(2, 10);
  return `doc_${timestampPart}_${index.toString(36)}_${randomPart}`;
}

function isSafeDocumentId(value: string): boolean {
  return /^[A-Za-z0-9_-]{1,128}$/.test(value);
}

function buildAnalyzeDocumentDescriptors(
  documents: ParsedDocumentState[]
): AnalyzeDocumentDescriptor[] {
  const usedIds = new Set<string>();

  return documents.map((document, index) => {
    const localId = document.document_id;
    let requestId = localId.trim();

    if (!isSafeDocumentId(requestId) || usedIds.has(requestId)) {
      requestId = createSafeDocumentId(index);
      while (usedIds.has(requestId)) {
        requestId = createSafeDocumentId(index);
      }
    }

    usedIds.add(requestId);

    return {
      localId,
      requestId,
      document,
    };
  });
}

function sanitizeMultipartFilename(fileName: string): string {
  const normalized = fileName.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
  const [basePart, ...extParts] = normalized.split('.');
  const ext = extParts.length > 0 ? `.${extParts.join('.')}` : '';
  const safeBase = (basePart || 'upload')
    .replace(/[^a-zA-Z0-9._-]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^[_\-.]+|[_\-.]+$/g, '')
    .slice(0, 120);
  const safeExt = ext.replace(/[^a-zA-Z0-9.]+/g, '').slice(0, 16);
  const finalBase = safeBase.length > 0 ? safeBase : 'upload';
  return `${finalBase}${safeExt || '.pdf'}`;
}

function normalizeMetadata(value: unknown): ApiMetadata {
  if (!isRecord(value)) {
    return DEFAULT_METADATA;
  }

  const limits = isRecord(value.limits) ? value.limits : {};

  return {
    semantic_used: Boolean(value.semantic_used),
    semantic_fallback_triggered: Boolean(value.semantic_fallback_triggered),
    fallback_stage: isFallbackStage(value.fallback_stage)
      ? value.fallback_stage
      : DEFAULT_METADATA.fallback_stage,
    candidate_only_fallback_triggered: Boolean(value.candidate_only_fallback_triggered),
    match_dependency_error_code:
      typeof value.match_dependency_error_code === 'string' &&
      value.match_dependency_error_code.trim().length > 0
        ? value.match_dependency_error_code.trim()
        : undefined,
    unmapped_candidates_count:
      typeof value.unmapped_candidates_count === 'number'
        ? Math.max(0, Math.floor(value.unmapped_candidates_count))
        : 0,
    ai_model: typeof value.ai_model === 'string' ? value.ai_model : null,
    ai_key_slot:
      value.ai_key_slot === 'primary' || value.ai_key_slot === 'secondary'
        ? value.ai_key_slot
        : null,
    ai_fallback_reason:
      typeof value.ai_fallback_reason === 'string' ? value.ai_fallback_reason : null,
    partial_results: Boolean(value.partial_results),
    atlas_verification_fallback_triggered: Boolean(value.atlas_verification_fallback_triggered),
    wizard_stage_failed:
      value.wizard_stage_failed === 'python_extract' ||
      value.wizard_stage_failed === 'wizard_entities' ||
      value.wizard_stage_failed === 'gemini_skills' ||
      value.wizard_stage_failed === 'atlas_verification'
        ? value.wizard_stage_failed
        : undefined,
    cost_ore:
      typeof value.cost_ore === 'number' && Number.isFinite(value.cost_ore)
        ? value.cost_ore
        : undefined,
    engine_mode:
      value.engine_mode === 'auto' ||
      value.engine_mode === 'typescript' ||
      value.engine_mode === 'python' ||
      value.engine_mode === 'gemini'
        ? value.engine_mode
        : undefined,
    engine_used:
      value.engine_used === 'python' ||
      value.engine_used === 'typescript' ||
      value.engine_used === 'gemini'
        ? value.engine_used
        : undefined,
    limits: {
      max_documents:
        typeof limits.max_documents === 'number'
          ? Math.max(1, Math.floor(limits.max_documents))
          : DEFAULT_METADATA.limits.max_documents,
      max_chars_per_document:
        typeof limits.max_chars_per_document === 'number'
          ? Math.max(1, Math.floor(limits.max_chars_per_document))
          : DEFAULT_METADATA.limits.max_chars_per_document,
      max_total_chars:
        typeof limits.max_total_chars === 'number'
          ? Math.max(1, Math.floor(limits.max_total_chars))
          : DEFAULT_METADATA.limits.max_total_chars,
    },
  };
}

function normalizeSuggestResponse(value: unknown): ApiSuggestResponse | null {
  if (!isRecord(value) || !Array.isArray(value.documents)) {
    return null;
  }

  const documents: ApiDocumentResult[] = value.documents
    .map((document, docIndex): ApiDocumentResult | null => {
      if (!isRecord(document)) {
        return null;
      }

      const documentId =
        typeof document.document_id === 'string' && document.document_id.trim().length > 0
          ? document.document_id
          : `doc-${docIndex}`;
      const fileName =
        typeof document.file_name === 'string' && document.file_name.trim().length > 0
          ? document.file_name
          : `${documentId}.pdf`;
      const parsedText =
        typeof document.parsed_text === 'string' && document.parsed_text.trim().length > 0
          ? document.parsed_text
          : '';
      const parseError =
        typeof document.parse_error === 'string' && document.parse_error.trim().length > 0
          ? document.parse_error.trim()
          : undefined;
      const parseErrorCode =
        typeof document.parse_error_code === 'string' && document.parse_error_code.trim().length > 0
          ? document.parse_error_code.trim()
          : undefined;

      const normalizeEvidence = (candidate: unknown): string[] =>
        Array.isArray(candidate)
          ? candidate
              .filter((entry): entry is string => typeof entry === 'string')
              .map((entry) => entry.trim())
              .filter(Boolean)
              .slice(0, 3)
          : [];

      const workExperiences = Array.isArray(document.work_experiences)
        ? document.work_experiences
            .map((entry, index) => {
              if (!isRecord(entry)) {
                return null;
              }

              const title = typeof entry.title === 'string' ? entry.title.trim() : '';
              if (!title) {
                return null;
              }

              return {
                item_id:
                  typeof entry.item_id === 'string' && entry.item_id.trim().length > 0
                    ? entry.item_id
                    : `work-${index}`,
                title,
                organization:
                  typeof entry.organization === 'string' && entry.organization.trim().length > 0
                    ? entry.organization.trim()
                    : 'Organization not specified',
                duration:
                  typeof entry.duration === 'string' && entry.duration.trim().length > 0
                    ? entry.duration.trim()
                    : 'Duration not specified',
                summary:
                  typeof entry.summary === 'string' && entry.summary.trim().length > 0
                    ? entry.summary.trim()
                    : title,
                evidence_snippets: normalizeEvidence(entry.evidence_snippets),
                confidence: normalizeScore(entry.confidence, 0.6),
              };
            })
            .filter((entry): entry is ApiWorkExperience => Boolean(entry))
        : [];

      const learningExperiences = Array.isArray(document.learning_experiences)
        ? document.learning_experiences
            .map((entry, index) => {
              if (!isRecord(entry)) {
                return null;
              }

              const institution =
                typeof entry.institution === 'string' ? entry.institution.trim() : '';
              const degree = typeof entry.degree === 'string' ? entry.degree.trim() : '';
              if (!institution || !degree) {
                return null;
              }

              return {
                item_id:
                  typeof entry.item_id === 'string' && entry.item_id.trim().length > 0
                    ? entry.item_id
                    : `learning-${index}`,
                institution,
                degree,
                duration:
                  typeof entry.duration === 'string' && entry.duration.trim().length > 0
                    ? entry.duration.trim()
                    : 'Duration not specified',
                skills:
                  typeof entry.skills === 'string' && entry.skills.trim().length > 0
                    ? entry.skills.trim()
                    : degree,
                projects:
                  typeof entry.projects === 'string' && entry.projects.trim().length > 0
                    ? entry.projects.trim()
                    : degree,
                evidence_snippets: normalizeEvidence(entry.evidence_snippets),
                confidence: normalizeScore(entry.confidence, 0.6),
              };
            })
            .filter((entry): entry is ApiLearningExperience => Boolean(entry))
        : [];

      const volunteering = Array.isArray(document.volunteering)
        ? document.volunteering
            .map((entry, index) => {
              if (!isRecord(entry)) {
                return null;
              }

              const title = typeof entry.title === 'string' ? entry.title.trim() : '';
              const organization =
                typeof entry.organization === 'string' ? entry.organization.trim() : '';
              if (!title || !organization) {
                return null;
              }

              return {
                item_id:
                  typeof entry.item_id === 'string' && entry.item_id.trim().length > 0
                    ? entry.item_id
                    : `volunteering-${index}`,
                title,
                organization,
                duration:
                  typeof entry.duration === 'string' && entry.duration.trim().length > 0
                    ? entry.duration.trim()
                    : 'Duration not specified',
                cause:
                  typeof entry.cause === 'string' && entry.cause.trim().length > 0
                    ? entry.cause.trim()
                    : title,
                impact:
                  typeof entry.impact === 'string' && entry.impact.trim().length > 0
                    ? entry.impact.trim()
                    : title,
                skills_deployed:
                  typeof entry.skills_deployed === 'string' &&
                  entry.skills_deployed.trim().length > 0
                    ? entry.skills_deployed.trim()
                    : title,
                personal_why:
                  typeof entry.personal_why === 'string' && entry.personal_why.trim().length > 0
                    ? entry.personal_why.trim()
                    : title,
                evidence_snippets: normalizeEvidence(entry.evidence_snippets),
                confidence: normalizeScore(entry.confidence, 0.6),
              };
            })
            .filter((entry): entry is ApiVolunteering => Boolean(entry))
        : [];

      const languages = Array.isArray(document.languages)
        ? document.languages
            .map((entry, index) => {
              if (!isRecord(entry)) {
                return null;
              }

              const languageCode =
                typeof entry.language_code === 'string' ? entry.language_code.trim() : '';
              if (!languageCode) {
                return null;
              }

              const level = typeof entry.level === 'string' ? entry.level.trim() : 'B2';

              return {
                item_id:
                  typeof entry.item_id === 'string' && entry.item_id.trim().length > 0
                    ? entry.item_id
                    : `language-${index}`,
                language_code: languageCode,
                language_name:
                  typeof entry.language_name === 'string' && entry.language_name.trim().length > 0
                    ? entry.language_name.trim()
                    : languageCode,
                level: CEFR_LEVELS.includes(level as (typeof CEFR_LEVELS)[number]) ? level : 'B2',
                evidence_snippets: normalizeEvidence(entry.evidence_snippets),
                confidence: normalizeScore(entry.confidence, 0.7),
              };
            })
            .filter((entry): entry is ApiLanguage => Boolean(entry))
        : [];

      const skillCandidates = Array.isArray(document.skill_candidates)
        ? document.skill_candidates
            .map((candidate, index): ApiSkillCandidate | null => {
              if (!isRecord(candidate)) {
                return null;
              }

              const candidateId =
                typeof candidate.candidate_id === 'string' &&
                candidate.candidate_id.trim().length > 0
                  ? candidate.candidate_id
                  : `${documentId}::${index}`;
              const rawSkillText =
                typeof candidate.raw_skill_text === 'string' ? candidate.raw_skill_text.trim() : '';
              if (!rawSkillText) {
                return null;
              }

              const rawCategory = candidate.category;
              const category: CandidateCategory =
                rawCategory === 'technical' ||
                rawCategory === 'soft_skills' ||
                rawCategory === 'tools_technologies' ||
                rawCategory === 'languages' ||
                rawCategory === 'certifications' ||
                rawCategory === 'other'
                  ? rawCategory
                  : 'other';

              const evidenceSnippets = normalizeEvidence(candidate.evidence_snippets);

              const suggestions = Array.isArray(candidate.suggestions)
                ? candidate.suggestions
                    .map((suggestion): ApiSuggestion | null => {
                      if (!isRecord(suggestion)) {
                        return null;
                      }

                      const skillId =
                        typeof suggestion.skill_id === 'string' ? suggestion.skill_id.trim() : '';
                      const skillName =
                        typeof suggestion.skill_name === 'string'
                          ? suggestion.skill_name.trim()
                          : '';

                      if (!skillId || !skillName) {
                        return null;
                      }

                      const method = suggestion.match_method;
                      const matchMethod: MatchMethod =
                        method === 'exact' ||
                        method === 'synonym' ||
                        method === 'fuzzy' ||
                        method === 'semantic'
                          ? method
                          : 'fuzzy';

                      return {
                        skill_id: skillId,
                        skill_name: skillName,
                        match_method: matchMethod,
                        score: normalizeScore(suggestion.score),
                      };
                    })
                    .filter((entry): entry is ApiSuggestion => Boolean(entry))
                : [];

              return {
                candidate_id: candidateId,
                raw_skill_text: rawSkillText,
                category,
                evidence_snippets: evidenceSnippets,
                confidence: normalizeScore(candidate.confidence, 0.5),
                suggestions,
                unmapped_candidate:
                  typeof candidate.unmapped_candidate === 'boolean'
                    ? candidate.unmapped_candidate
                    : suggestions.length === 0,
                already_in_profile: Boolean(candidate.already_in_profile),
                verification_fallback_reason:
                  typeof candidate.verification_fallback_reason === 'string' &&
                  candidate.verification_fallback_reason.trim().length > 0
                    ? candidate.verification_fallback_reason.trim()
                    : null,
              };
            })
            .filter((entry): entry is ApiSkillCandidate => Boolean(entry))
        : [];

      return {
        document_id: documentId,
        file_name: fileName,
        parsed_text: parsedText,
        parse_error: parseError,
        parse_error_code: parseErrorCode,
        context: 'cv' as const,
        work_experiences: workExperiences,
        learning_experiences: learningExperiences,
        volunteering,
        languages,
        skill_candidates: skillCandidates,
      };
    })
    .filter((entry): entry is ApiDocumentResult => Boolean(entry));

  return {
    documents,
    metadata: normalizeMetadata(value.metadata),
  };
}

function toSkillNameMap(document: ParsedDocumentState): Record<string, string> {
  const map: Record<string, string> = {};
  for (const candidate of document.skill_candidates) {
    for (const option of [...candidate.suggestions, ...candidate.manual_options]) {
      map[option.skill_id] = option.skill_name;
    }
  }
  return map;
}

function collectApprovedSkillIds(document: ParsedDocumentState): string[] {
  const validSkillIds = new Set<string>();

  for (const candidate of document.skill_candidates) {
    if (!candidate.approved) {
      continue;
    }

    const optionIds = new Set([
      ...candidate.suggestions.map((option) => option.skill_id),
      ...candidate.manual_options.map((option) => option.skill_id),
    ]);

    for (const skillId of candidate.selected_skill_ids) {
      if (optionIds.has(skillId)) {
        validSkillIds.add(skillId);
      }
    }
  }

  return Array.from(validSkillIds);
}

function isUnreadableDocument(document: ParsedDocumentState): boolean {
  return (
    typeof document.parse_error === 'string' &&
    document.parse_error.trim().length > 0 &&
    document.work_experiences.length === 0 &&
    document.learning_experiences.length === 0 &&
    document.volunteering.length === 0 &&
    document.languages.length === 0 &&
    document.skill_candidates.length === 0
  );
}

function hasPartialRecovery(metadata: ApiMetadata): boolean {
  return Boolean(
    metadata.partial_results ||
      metadata.atlas_verification_fallback_triggered ||
      metadata.wizard_stage_failed
  );
}

function buildAnalyzeWarningMessage(params: {
  metadata: ApiMetadata;
  documents: ParsedDocumentState[];
}): string {
  const unreadableDocuments = params.documents.filter(isUnreadableDocument);
  if (unreadableDocuments.length === params.documents.length && unreadableDocuments.length > 0) {
    return 'Analysis completed, but the uploaded PDFs could not be read. Review the document errors below or upload a clearer text-based PDF.';
  }

  if (unreadableDocuments.length > 0) {
    return 'Analysis completed, but some PDFs could not be read. Review the document errors below or upload a clearer text-based PDF.';
  }

  if (params.metadata.wizard_stage_failed === 'atlas_verification') {
    return 'Analysis completed with partial recovery. Atlas verification was unavailable, so review skill matches carefully below.';
  }

  if (params.metadata.wizard_stage_failed === 'gemini_skills') {
    return 'Analysis completed with partial recovery. Skill mapping fell back to deterministic extraction, so review skill matches carefully below.';
  }

  return 'Analysis completed with partial recovery. Review the extracted results below before applying them.';
}

function normalizeAnalyzeFailureMessage(error: unknown): string {
  const message =
    error instanceof Error && error.message.trim().length > 0
      ? error.message.trim()
      : 'Analysis failed. Please try again.';
  const normalized = message.toLowerCase();

  if (normalized.includes('timed out')) {
    return 'Analysis timed out. Try fewer documents or shorter CV content.';
  }

  if (
    normalized.includes('temporarily unavailable') ||
    normalized.includes('service is unavailable') ||
    normalized.includes('dependencies are temporarily unavailable')
  ) {
    return 'Analysis service is temporarily unavailable. Please retry in a few minutes.';
  }

  if (
    normalized.includes('upload metadata contains unsupported characters') ||
    normalized.includes('parser could not start') ||
    normalized.includes('no text could be extracted') ||
    normalized.includes('could not be read')
  ) {
    return message;
  }

  return message;
}

function resolveInitialReviewOutcome(params: {
  approved: boolean;
  alreadyInProfile: boolean;
}): SkillReviewOutcome {
  if (params.approved || params.alreadyInProfile) {
    return 'accepted';
  }
  return 'pending';
}

function downloadJson(filename: string, payload: unknown) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function downloadCsv(filename: string, rows: Array<Array<string | number>>) {
  const content = rows
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function formatRelativeTimeLabel(dateIso: string | undefined): string | undefined {
  if (!dateIso) {
    return undefined;
  }

  const value = new Date(dateIso);
  if (Number.isNaN(value.getTime())) {
    return undefined;
  }

  return `Last searched ${value.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })}`;
}

function mapTaxonomyPayloadToSuggestions(params: {
  query: string;
  payload: unknown;
  limit?: number;
}): ApiSuggestion[] {
  const l4Skills =
    isRecord(params.payload) && Array.isArray(params.payload.l4_skills)
      ? params.payload.l4_skills
      : [];

  return l4Skills.slice(0, params.limit ?? 8).reduce<ApiSuggestion[]>((acc, skill: any) => {
    const skillId = typeof skill?.code === 'string' ? skill.code.trim() : '';
    if (!skillId) {
      return acc;
    }

    const skillName =
      typeof skill?.nameI18n?.en === 'string' && skill.nameI18n.en.trim().length > 0
        ? skill.nameI18n.en.trim()
        : skillId;

    acc.push(
      buildManualSuggestion({
        query: params.query,
        skillId,
        skillName,
        matchMethod:
          skill?.matchMethod === 'exact' ||
          skill?.matchMethod === 'synonym' ||
          skill?.matchMethod === 'fuzzy' ||
          skill?.matchMethod === 'semantic'
            ? skill.matchMethod
            : null,
        matchScore:
          typeof skill?.matchScore === 'number' && Number.isFinite(skill.matchScore)
            ? skill.matchScore
            : null,
      })
    );

    return acc;
  }, []);
}

function buildInitialSkillState(candidate: ApiSkillCandidate): SkillState {
  const initialSelection = resolveInitialSkillSelectionState(candidate);
  const seededOptions = candidate.suggestions.slice(0, 8);

  return {
    ...candidate,
    approved: initialSelection.approved,
    selected_skill_ids: initialSelection.selectedSkillIds,
    manual_search_query: candidate.raw_skill_text,
    manual_options: seededOptions,
    manual_loading: false,
    show_all_suggestions: false,
    already_in_profile: Boolean(candidate.already_in_profile),
    review_outcome: resolveInitialReviewOutcome({
      approved: initialSelection.approved,
      alreadyInProfile: Boolean(candidate.already_in_profile),
    }),
  };
}

function buildVerifiedSkillRefreshState(
  current: SkillState,
  suggestions: ApiSuggestion[]
): Partial<SkillState> {
  const refreshedCandidate: ApiSkillCandidate = {
    ...current,
    suggestions,
    unmapped_candidate: suggestions.length === 0,
    already_in_profile: false,
    verification_fallback_reason: null,
  };
  const initialSelection = resolveInitialSkillSelectionState(refreshedCandidate);

  return {
    suggestions,
    manual_options: suggestions.slice(0, 8),
    manual_loading: false,
    manual_last_search_at: new Date().toISOString(),
    approved: initialSelection.approved,
    selected_skill_ids: initialSelection.selectedSkillIds,
    already_in_profile: false,
    unmapped_candidate: initialSelection.selectedSkillIds.length === 0,
    review_outcome: resolveInitialReviewOutcome({
      approved: initialSelection.approved,
      alreadyInProfile: false,
    }),
  };
}

function buildSectionStatusBadges(totalCount: number, hasParseWarning: boolean) {
  const badges: Array<{ label: string; variant?: 'secondary' | 'outline' | 'destructive' }> = [];
  if (totalCount > 0) {
    badges.push({ label: `Loaded ${totalCount} ${totalCount === 1 ? 'entry' : 'entries'}` });
  } else {
    badges.push({ label: 'No entries found', variant: 'outline' });
  }
  if (hasParseWarning) {
    badges.push({ label: 'Has parse warnings', variant: 'destructive' });
  }
  return badges;
}

function createEmptyParsedDocumentState(params: {
  documentId: string;
  fileName: string;
  file?: File;
  parseError?: string;
  parseErrorCode?: string;
}): ParsedDocumentState {
  return {
    document_id: params.documentId,
    file_name: params.fileName,
    file: params.file,
    parsed_text: '',
    parse_error: params.parseError,
    parse_error_code: params.parseErrorCode,
    work_experiences: [],
    learning_experiences: [],
    volunteering: [],
    languages: [],
    skill_candidates: [],
  };
}

async function trackCvImportUiEvent(action: string, properties?: Record<string, unknown>) {
  try {
    await apiFetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventType: EventType.CUSTOM_EVENT,
        entityType: 'cv_import_review',
        entityId: action,
        properties: {
          action,
          ...(properties || {}),
        },
      }),
    });
  } catch {
    // Analytics should never block UX.
  }
}

export function CvImportWizard({ onApplyComplete }: CvImportWizardProps) {
  const reviewV3Enabled = process.env.NEXT_PUBLIC_CV_IMPORT_REVIEW_V3 !== 'false';
  const [documents, setDocuments] = useState<ParsedDocumentState[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [apiMetadata, setApiMetadata] = useState<ApiMetadata | null>(null);
  const [showAdvancedDiagnostics, setShowAdvancedDiagnostics] = useState(false);
  const [sectionExpandSignal, setSectionExpandSignal] = useState(0);
  const [openSkillPicker, setOpenSkillPicker] = useState<{
    documentId: string;
    candidateId: string;
  } | null>(null);
  const [analyzeProgress, setAnalyzeProgress] = useState<AnalyzeProgressState>(
    createIdleAnalyzeProgressState
  );
  const documentsRef = useRef<ParsedDocumentState[]>([]);
  const progressResetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoVerifyTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const activeExtractSequenceRef = useRef(0);
  const resumeAsyncExtractJobRef = useRef<
    | ((
        storedJob: StoredExtractJobState,
        sourceByRequestId: Map<string, ParsedDocumentState>,
        sequence: number
      ) => Promise<void>)
    | null
  >(null);

  const approvedSkillIds = useMemo(() => {
    const selected = new Set<string>();
    for (const document of documents) {
      for (const skillId of collectApprovedSkillIds(document)) {
        selected.add(skillId);
      }
    }
    return Array.from(selected);
  }, [documents]);

  const updateDocument = (
    documentId: string,
    updater: (document: ParsedDocumentState) => ParsedDocumentState
  ) => {
    setDocuments((previous) =>
      previous.map((document) =>
        document.document_id === documentId ? updater(document) : document
      )
    );
  };

  const findSkillCandidateState = (documentId: string, candidateId: string): SkillState | null => {
    const document = documentsRef.current.find((item) => item.document_id === documentId);
    return document?.skill_candidates.find((item) => item.candidate_id === candidateId) || null;
  };

  const clearProgressResetTimer = () => {
    if (progressResetTimerRef.current !== null) {
      clearTimeout(progressResetTimerRef.current);
      progressResetTimerRef.current = null;
    }
  };

  const setRunningProgress = (phase: AnalyzeProgressPhase, percent: number, message: string) => {
    setAnalyzeProgress((previous) => ({
      status: 'running',
      phase,
      percent,
      message,
      startedAt: previous.startedAt ?? Date.now(),
      completedAt: undefined,
    }));
  };

  const setCompletedProgress = (message: string) => {
    const completedAt = Date.now();
    setAnalyzeProgress((previous) => ({
      ...previous,
      status: 'completed',
      percent: 100,
      message,
      completedAt,
    }));
    clearProgressResetTimer();
    progressResetTimerRef.current = setTimeout(() => {
      setAnalyzeProgress(createIdleAnalyzeProgressState());
      progressResetTimerRef.current = null;
    }, ANALYZE_PROGRESS_AUTO_COLLAPSE_MS);
  };

  const setWarningProgress = (message: string) => {
    const completedAt = Date.now();
    setAnalyzeProgress((previous) => ({
      ...previous,
      status: 'warning',
      percent: 100,
      message,
      completedAt,
    }));
    clearProgressResetTimer();
    progressResetTimerRef.current = setTimeout(() => {
      setAnalyzeProgress(createIdleAnalyzeProgressState());
      progressResetTimerRef.current = null;
    }, ANALYZE_PROGRESS_AUTO_COLLAPSE_MS);
  };

  const setFailedProgress = (message: string) => {
    setAnalyzeProgress((previous) => ({
      ...previous,
      status: 'failed',
      message,
      completedAt: Date.now(),
    }));
  };

  const canUseLocalFallback = (sourceByRequestId: Map<string, ParsedDocumentState>) =>
    Array.from(sourceByRequestId.values()).some((document) => Boolean(document.file));

  const buildFailedExtractDocumentStates = (
    failedDocuments: ApiExtractFailedDocument[],
    sourceByRequestId: Map<string, ParsedDocumentState>
  ) =>
    failedDocuments.map((document) => {
      const source = sourceByRequestId.get(document.document_id);
      return createEmptyParsedDocumentState({
        documentId: document.document_id,
        fileName: document.file_name,
        file: source?.file,
        parseError: document.parse_error,
        parseErrorCode: document.parse_error_code ?? undefined,
      });
    });

  const finalizeAnalyzeSuccess = (params: {
    payload: ApiSuggestResponse;
    sourceByRequestId: Map<string, ParsedDocumentState>;
    extraFailedDocuments?: ApiExtractFailedDocument[];
    fallbackStageUsed?: ApiFallbackStage | null;
    metadataFallbackTriggered?: boolean;
    timeoutFallbackTriggered?: boolean;
  }) => {
    let payload = params.payload;

    if (params.fallbackStageUsed && payload.metadata.fallback_stage === 'none') {
      payload = {
        ...payload,
        metadata: {
          ...payload.metadata,
          fallback_stage: params.fallbackStageUsed,
        },
      };
    }

    setRunningProgress('analyzing', 78, 'Matching to taxonomy...');
    setApiMetadata(payload.metadata);

    const analyzedById = new Map<string, ParsedDocumentState>();
    for (const document of payload.documents) {
      const source = params.sourceByRequestId.get(document.document_id);

      analyzedById.set(document.document_id, {
        document_id: document.document_id,
        file_name: document.file_name,
        file: source?.file,
        parsed_text: document.parsed_text || source?.parsed_text || '',
        parse_error: document.parse_error || source?.parse_error,
        parse_error_code: document.parse_error_code || source?.parse_error_code,
        work_experiences: document.work_experiences.map((entry) => ({
          ...entry,
          approved: true,
        })),
        learning_experiences: document.learning_experiences.map((entry) => ({
          ...entry,
          approved: true,
        })),
        volunteering: document.volunteering.map((entry) => ({
          ...entry,
          approved: true,
        })),
        languages: document.languages.map((entry) => ({
          ...entry,
          approved: true,
        })),
        skill_candidates: document.skill_candidates.map(buildInitialSkillState),
      });
    }

    for (const failedDocument of params.extraFailedDocuments ?? []) {
      if (analyzedById.has(failedDocument.document_id)) {
        continue;
      }
      const source = params.sourceByRequestId.get(failedDocument.document_id);
      analyzedById.set(
        failedDocument.document_id,
        createEmptyParsedDocumentState({
          documentId: failedDocument.document_id,
          fileName: failedDocument.file_name,
          file: source?.file,
          parseError: failedDocument.parse_error,
          parseErrorCode: failedDocument.parse_error_code ?? undefined,
        })
      );
    }

    const analyzedDocuments = Array.from(params.sourceByRequestId.keys())
      .map((documentId) => analyzedById.get(documentId))
      .filter((document): document is ParsedDocumentState => Boolean(document));

    const warningMessage = hasPartialRecovery(payload.metadata)
      ? buildAnalyzeWarningMessage({
          metadata: payload.metadata,
          documents: analyzedDocuments,
        })
      : analyzedDocuments.some(isUnreadableDocument)
        ? buildAnalyzeWarningMessage({
            metadata: payload.metadata,
            documents: analyzedDocuments,
          })
        : null;

    setRunningProgress('finalizing', 92, 'Finalizing results...');
    setDocuments(analyzedDocuments);
    setSectionExpandSignal(0);
    setOpenSkillPicker(null);

    const totalSkillCandidates = payload.documents.reduce(
      (count, document) => count + document.skill_candidates.length,
      0
    );

    if (
      params.fallbackStageUsed &&
      !params.metadataFallbackTriggered &&
      !params.timeoutFallbackTriggered
    ) {
      toast.info('CV analysis recovered via fallback path.');
    }
    if (payload.metadata.semantic_fallback_triggered && totalSkillCandidates === 0) {
      toast.info(
        'Skill suggestions are temporarily unavailable, but core CV entities were extracted.'
      );
    } else if (payload.metadata.candidate_only_fallback_triggered && totalSkillCandidates > 0) {
      toast.info('Showing candidate-only skills while taxonomy matching recovers.');
    }

    if (warningMessage) {
      setWarningProgress(warningMessage);
    } else {
      setCompletedProgress('Extraction completed. Review and approve the results below.');
    }
    toast.success(
      `Analyzed ${payload.documents.length} document${payload.documents.length > 1 ? 's' : ''}.`
    );
    if (warningMessage) {
      toast.info(warningMessage);
    }
  };

  const analyzeExtractedTextDocuments = async (params: {
    textDocuments: Array<{
      document_id: string;
      file_name: string;
      text: string;
      context: 'cv';
    }>;
    sourceByRequestId: Map<string, ParsedDocumentState>;
    extraFailedDocuments?: ApiExtractFailedDocument[];
    fallbackStageUsed?: ApiFallbackStage | null;
    metadataFallbackTriggered?: boolean;
    timeoutFallbackTriggered?: boolean;
  }) => {
    let response = await apiFetch('/api/expertise/cv-import/wizard-suggest?engine=gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ documents: params.textDocuments }),
    });

    let fallbackStageUsed = params.fallbackStageUsed ?? null;

    if (!response.ok) {
      const pythonFailurePayload = await readJsonSafely(response);
      if (isProxyRetryableError(pythonFailurePayload)) {
        setRunningProgress(
          'extracting',
          48,
          'Retrying analysis with deterministic fallback service...'
        );
        response = await apiFetch('/api/expertise/cv-import/wizard-suggest?engine=typescript', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ documents: params.textDocuments }),
        });
        fallbackStageUsed = 'typescript_retry';
      }
    }

    if (!response.ok) {
      throw new Error(await readErrorMessage(response, 'Failed to analyze uploaded PDFs'));
    }

    setRunningProgress('analyzing', 62, 'Analyzing skills and experience...');

    let payload = normalizeSuggestResponse(await readJsonSafely(response));
    if (!payload) {
      throw new Error('Invalid response format from CV analysis service');
    }

    finalizeAnalyzeSuccess({
      payload,
      sourceByRequestId: params.sourceByRequestId,
      extraFailedDocuments: params.extraFailedDocuments,
      fallbackStageUsed,
      metadataFallbackTriggered: params.metadataFallbackTriggered,
      timeoutFallbackTriggered: params.timeoutFallbackTriggered,
    });
  };

  const pollExtractJobUntilSettled = async (jobId: string, sequence: number) => {
    const queuedSince = Date.now();
    let backgroundNoticeShown = false;

    while (activeExtractSequenceRef.current === sequence) {
      const response = await apiFetch(
        `/api/expertise/cv-import/wizard-extract/status?job_id=${encodeURIComponent(jobId)}`
      );

      if (!response.ok) {
        throw new Error(await readErrorMessage(response, 'Failed to check CV extraction status'));
      }

      const payload = normalizeExtractStatusResponse(await readJsonSafely(response));
      if (!payload) {
        throw new Error('CV extraction status returned an invalid response.');
      }

      if (payload.status === 'completed' || payload.status === 'failed') {
        return payload;
      }

      const elapsedMs = Date.now() - queuedSince;
      const shouldOfferBackgroundContinuation = elapsedMs >= MAX_QUEUED_EXTRACT_WAIT_MS;
      const pollAfterMs = shouldOfferBackgroundContinuation
        ? Math.max(payload.poll_after_ms, BACKGROUND_CONTINUE_POLL_AFTER_MS)
        : payload.recovery_state === 'retrying' && typeof payload.retry_after_ms === 'number'
          ? Math.max(payload.poll_after_ms, payload.retry_after_ms)
          : payload.poll_after_ms;

      setRunningProgress(
        payload.status === 'queued' ? 'queued' : 'extracting',
        payload.status === 'queued' ? 34 : 50,
        payload.status === 'queued'
          ? shouldOfferBackgroundContinuation
            ? 'Python extraction is still running. You can leave this page and come back later.'
            : payload.recovery_state === 'retrying'
              ? 'Retrying Python extraction after a temporary worker issue...'
              : 'Queued for extraction. Waiting for Python worker...'
          : shouldOfferBackgroundContinuation
            ? 'Python extraction is still running in the background. Results will resume here automatically.'
            : 'Extracting text from uploaded PDFs with Python...'
      );

      if (!backgroundNoticeShown && elapsedMs >= BACKGROUND_CONTINUE_NOTICE_MS) {
        toast.info(
          'Python extraction is still running in the background. You can leave this page and return later.'
        );
        backgroundNoticeShown = true;
      }

      await sleep(pollAfterMs);
    }

    throw new Error('CV extraction polling was interrupted.');
  };

  const canRequeuePythonExtraction = (sourceByRequestId: Map<string, ParsedDocumentState>) =>
    Array.from(sourceByRequestId.values()).some((document) => Boolean(document.file));

  const handleEmptyExtractResult = (params: {
    failedDocuments: ApiExtractFailedDocument[];
    sourceByRequestId: Map<string, ParsedDocumentState>;
  }) => {
    const failedDocuments = buildFailedExtractDocumentStates(
      params.failedDocuments,
      params.sourceByRequestId
    );
    setDocuments(failedDocuments);
    setApiMetadata(DEFAULT_METADATA);
    const warningMessage = buildAnalyzeWarningMessage({
      metadata: DEFAULT_METADATA,
      documents: failedDocuments,
    });
    setWarningProgress(warningMessage);
    toast.info(warningMessage);
  };

  const resumeAsyncExtractJob = async (
    storedJob: StoredExtractJobState,
    sourceByRequestId: Map<string, ParsedDocumentState>,
    sequence: number
  ) => {
    setRunningProgress('queued', 34, 'Resuming background extraction...');

    const settled = await pollExtractJobUntilSettled(storedJob.jobId, sequence);
    clearStoredExtractJobState();

    if (settled.status === 'failed') {
      if (isProxyRetryableCode(settled.code)) {
        throw new Error(
          'Python extraction is still unavailable. Please retry the analysis from this page once the worker recovers.'
        );
      }
      throw new Error(settled.message || settled.error);
    }

    if (settled.documents.length === 0) {
      handleEmptyExtractResult({
        failedDocuments: settled.failed_documents,
        sourceByRequestId,
      });
      return;
    }

    await analyzeExtractedTextDocuments({
      textDocuments: settled.documents,
      sourceByRequestId,
      extraFailedDocuments: settled.failed_documents,
    });

    if (settled.cleanup_pending) {
      toast.info('CV extraction completed, but temp file cleanup is still pending.');
    }
  };
  resumeAsyncExtractJobRef.current = resumeAsyncExtractJob;

  const startAsyncExtractAnalyze = async (
    analyzeDocuments: AnalyzeDocumentDescriptor[],
    sourceByRequestId: Map<string, ParsedDocumentState>,
    requeueAttempt = 0
  ) => {
    const formData = new FormData();
    for (const descriptor of analyzeDocuments) {
      if (!descriptor.document.file) {
        continue;
      }

      formData.append(
        'files',
        descriptor.document.file,
        sanitizeMultipartFilename(descriptor.document.file_name)
      );
      formData.append('document_ids', descriptor.requestId);
      formData.append('contexts', 'cv');
    }

    setRunningProgress('uploading', 25, 'Uploading CV for background extraction...');

    const response = await apiFetch('/api/expertise/cv-import/wizard-extract', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(await readErrorMessage(response, 'Failed to queue CV extraction'));
    }

    const queued = normalizeExtractStatusResponse(await readJsonSafely(response));
    if (!queued || queued.status !== 'queued') {
      throw new Error('CV extraction queue returned an invalid response.');
    }

    saveStoredExtractJobState({
      jobId: queued.job_id,
      fingerprint: buildAnalyzeFingerprint(analyzeDocuments),
      documents: analyzeDocuments.map((descriptor) => ({
        requestId: descriptor.requestId,
        localId: descriptor.localId,
        fileName: descriptor.document.file_name,
      })),
    });

    setRunningProgress('queued', 34, 'Queued for extraction. Waiting for worker...');

    const sequence = ++activeExtractSequenceRef.current;
    const settled = await pollExtractJobUntilSettled(queued.job_id, sequence);
    clearStoredExtractJobState();

    if (settled.status === 'failed') {
      if (
        isProxyRetryableCode(settled.code) &&
        requeueAttempt < MAX_PYTHON_REQUEUE_ATTEMPTS &&
        canRequeuePythonExtraction(sourceByRequestId)
      ) {
        toast.info('Python extraction hit a temporary issue. Retrying automatically.');
        await startAsyncExtractAnalyze(analyzeDocuments, sourceByRequestId, requeueAttempt + 1);
        return;
      }

      throw new Error(settled.message || settled.error);
    }

    if (settled.documents.length === 0) {
      handleEmptyExtractResult({
        failedDocuments: settled.failed_documents,
        sourceByRequestId,
      });
      return;
    }

    await analyzeExtractedTextDocuments({
      textDocuments: settled.documents,
      sourceByRequestId,
      extraFailedDocuments: settled.failed_documents,
    });

    if (settled.cleanup_pending) {
      toast.info('CV extraction completed, but temp file cleanup is still pending.');
    }
  };

  useEffect(
    () => () => {
      if (progressResetTimerRef.current !== null) {
        clearTimeout(progressResetTimerRef.current);
        progressResetTimerRef.current = null;
      }
      for (const timer of autoVerifyTimersRef.current.values()) {
        clearTimeout(timer);
      }
      autoVerifyTimersRef.current.clear();
    },
    []
  );

  useEffect(() => {
    documentsRef.current = documents;
  }, [documents]);

  useEffect(() => {
    const storedJob = readStoredExtractJobState();
    if (!storedJob) {
      return;
    }

    setDocuments((previous) => {
      if (previous.length > 0) {
        return previous;
      }

      return storedJob.documents.map((document) =>
        createEmptyParsedDocumentState({
          documentId: document.requestId,
          fileName: document.fileName,
        })
      );
    });

    setIsAnalyzing(true);
    clearProgressResetTimer();
    setAnalyzeProgress({
      status: 'running',
      phase: 'queued',
      percent: 34,
      message: 'Resuming background extraction...',
      startedAt: Date.now(),
      completedAt: undefined,
    });

    const sourceByRequestId = new Map<string, ParsedDocumentState>(
      storedJob.documents.map((document) => [
        document.requestId,
        createEmptyParsedDocumentState({
          documentId: document.requestId,
          fileName: document.fileName,
        }),
      ])
    );
    const sequence = ++activeExtractSequenceRef.current;

    void resumeAsyncExtractJobRef
      .current?.(storedJob, sourceByRequestId, sequence)
      .catch((error) => {
        clearStoredExtractJobState();
        const message = normalizeAnalyzeFailureMessage(error);
        setFailedProgress(message);
        toast.error(error instanceof Error ? error.message : message);
      })
      .finally(() => {
        setIsAnalyzing(false);
      });
  }, []);

  const handleUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const fileList = Array.from(event.target.files || []);

    if (fileList.length === 0) {
      return;
    }

    const pdfFiles = fileList.filter((file) => file.type === 'application/pdf');

    if (pdfFiles.length !== fileList.length) {
      toast.error('Only PDF files are supported in V1.');
    }

    if (pdfFiles.length === 0) {
      return;
    }

    setIsParsing(true);

    try {
      const parsedDocuments: ParsedDocumentState[] = pdfFiles.map((file, index) => ({
        document_id: createSafeDocumentId(index),
        file_name: file.name,
        file,
        parsed_text: '',
        parse_error_code: undefined,
        work_experiences: [],
        learning_experiences: [],
        volunteering: [],
        languages: [],
        skill_candidates: [],
      }));

      setDocuments(parsedDocuments);
      setApiMetadata(null);
      setSectionExpandSignal(0);
      setOpenSkillPicker(null);
      clearProgressResetTimer();
      clearStoredExtractJobState();
      activeExtractSequenceRef.current += 1;
      setAnalyzeProgress(createIdleAnalyzeProgressState());

      if (parsedDocuments.length > 0) {
        toast.success(
          `Queued ${parsedDocuments.length} PDF${parsedDocuments.length > 1 ? 's' : ''} for analysis.`
        );
      }
    } finally {
      setIsParsing(false);
    }
  };

  const handleAnalyze = async () => {
    const readyDocuments = documents.filter((document) => document.file && !document.parse_error);

    if (readyDocuments.length === 0) {
      toast.error('Upload at least one PDF before analyzing.');
      return;
    }

    setIsAnalyzing(true);
    clearProgressResetTimer();
    setAnalyzeProgress({
      status: 'running',
      phase: 'preparing',
      percent: 10,
      message: 'Preparing documents for analysis...',
      startedAt: Date.now(),
      completedAt: undefined,
    });

    try {
      const analyzeDocuments = buildAnalyzeDocumentDescriptors(readyDocuments);
      const sourceByRequestId = new Map(
        analyzeDocuments.map((descriptor) => [descriptor.requestId, descriptor.document])
      );
      await startAsyncExtractAnalyze(analyzeDocuments, sourceByRequestId);
    } catch (error) {
      clearStoredExtractJobState();
      setFailedProgress(normalizeAnalyzeFailureMessage(error));
      toast.error(error instanceof Error ? error.message : 'Failed to analyze uploaded PDFs');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const searchManualMappings = async (
    documentId: string,
    candidateId: string,
    options?: {
      query?: string;
      syncSuggestions?: boolean;
      silent?: boolean;
    }
  ) => {
    const candidate = documentsRef.current
      .find((document) => document.document_id === documentId)
      ?.skill_candidates.find((entry) => entry.candidate_id === candidateId);

    if (!candidate) {
      return;
    }

    const query = (options?.query ?? candidate.manual_search_query).trim();
    if (!query) {
      if (!options?.silent) {
        toast.error('Enter a search query for manual mapping.');
      }
      return;
    }

    updateDocument(documentId, (document) => ({
      ...document,
      skill_candidates: document.skill_candidates.map((entry) =>
        entry.candidate_id === candidateId ? { ...entry, manual_loading: true } : entry
      ),
    }));

    try {
      const response = await apiFetch(
        buildCvImportTaxonomySearchUrl({
          query,
          category: candidate.category,
          evidenceSnippets: candidate.evidence_snippets,
          limit: 8,
        })
      );
      if (!response.ok) {
        throw new Error(await readErrorMessage(response, 'Failed to search taxonomy'));
      }

      const payload = await readJsonSafely(response);
      const mappedOptions = mapTaxonomyPayloadToSuggestions({
        query,
        payload,
        limit: 8,
      });

      updateDocument(documentId, (document) => ({
        ...document,
        skill_candidates: document.skill_candidates.map((entry) =>
          entry.candidate_id === candidateId
            ? {
                ...entry,
                ...(options?.syncSuggestions
                  ? buildVerifiedSkillRefreshState(
                      {
                        ...entry,
                        raw_skill_text: query,
                      },
                      mappedOptions
                    )
                  : {}),
                raw_skill_text: options?.syncSuggestions ? query : entry.raw_skill_text,
                manual_loading: false,
                manual_options: mappedOptions,
                manual_search_query: query,
                manual_last_search_at: new Date().toISOString(),
              }
            : entry
        ),
      }));

      if (!options?.silent && mappedOptions.length === 0) {
        const hints = getAmbiguousTokenHints(query);
        toast.info(
          hints.length > 0
            ? `No taxonomy matches found. Try a more specific query such as ${hints.slice(0, 3).join(', ')}.`
            : 'No taxonomy matches found for manual mapping.'
        );
      } else if (!options?.silent) {
        toast.success(
          `${mappedOptions.length} Atlas ${mappedOptions.length === 1 ? 'match' : 'matches'} found.`
        );
      }

      void trackCvImportUiEvent(
        'cv_review_find_opened',
        buildCvImportReviewTelemetry({
          action: 'cv_review_find_opened',
          candidate,
          engineUsed: apiMetadata?.engine_used || null,
          resultCount: mappedOptions.length,
          searchQuery: query,
        })
      );
    } catch (error) {
      updateDocument(documentId, (document) => ({
        ...document,
        skill_candidates: document.skill_candidates.map((entry) =>
          entry.candidate_id === candidateId ? { ...entry, manual_loading: false } : entry
        ),
      }));

      if (!options?.silent) {
        toast.error(error instanceof Error ? error.message : 'Failed to search taxonomy');
      }
    }
  };

  const scheduleAtlasVerification = (documentId: string, candidateId: string, query: string) => {
    const timerKey = `${documentId}::${candidateId}`;
    const existingTimer = autoVerifyTimersRef.current.get(timerKey);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    if (!query.trim()) {
      autoVerifyTimersRef.current.delete(timerKey);
      return;
    }

    const timer = setTimeout(async () => {
      autoVerifyTimersRef.current.delete(timerKey);
      await searchManualMappings(documentId, candidateId, {
        query,
        syncSuggestions: true,
        silent: true,
      });
    }, 350);

    autoVerifyTimersRef.current.set(timerKey, timer);
  };

  const selectAtlasMatch = (
    documentId: string,
    candidateId: string,
    option: ApiSuggestion,
    mode: 'select' | 'replace',
    meta: SkillReviewSelectionMeta
  ) => {
    const candidate = findSkillCandidateState(documentId, candidateId);
    updateDocument(documentId, (document) => ({
      ...document,
      skill_candidates: document.skill_candidates.map((entry) => {
        if (entry.candidate_id !== candidateId) {
          return entry;
        }

        const manualOptions = entry.manual_options.some(
          (manual) => manual.skill_id === option.skill_id
        )
          ? entry.manual_options
          : [option, ...entry.manual_options].slice(0, 10);

        const nextSelected =
          mode === 'replace'
            ? [option.skill_id]
            : Array.from(new Set([...entry.selected_skill_ids, option.skill_id]));

        return {
          ...entry,
          manual_options: manualOptions,
          selected_skill_ids: nextSelected,
          approved: true,
          already_in_profile: false,
          unmapped_candidate: nextSelected.length === 0,
          review_outcome: 'accepted',
        };
      }),
    }));

    if (candidate) {
      void trackCvImportUiEvent(
        mode === 'replace' ? 'cv_review_match_replaced' : 'cv_review_match_selected',
        buildCvImportReviewTelemetry({
          action: mode === 'replace' ? 'cv_review_match_replaced' : 'cv_review_match_selected',
          candidate,
          engineUsed: apiMetadata?.engine_used || null,
          riskReasons: meta.riskReasons,
          selectedSkillId: option.skill_id,
          selectedSkillName: option.skill_name,
          selectionSource: meta.selectionSource,
          reviewOutcome: 'accepted',
        })
      );
    }
  };

  const markSkillCandidateOutcome = (
    documentId: string,
    candidateId: string,
    reviewOutcome: Extract<SkillReviewOutcome, 'kept_unmapped' | 'not_skill'>
  ) => {
    const candidate = findSkillCandidateState(documentId, candidateId);

    updateDocument(documentId, (document) => ({
      ...document,
      skill_candidates: document.skill_candidates.map((entry) =>
        entry.candidate_id === candidateId
          ? {
              ...entry,
              approved: false,
              selected_skill_ids: [],
              already_in_profile: false,
              unmapped_candidate: true,
              review_outcome: reviewOutcome,
            }
          : entry
      ),
    }));

    if (candidate) {
      void trackCvImportUiEvent(
        reviewOutcome === 'not_skill' ? 'cv_review_marked_not_skill' : 'cv_review_kept_unmapped',
        buildCvImportReviewTelemetry({
          action:
            reviewOutcome === 'not_skill'
              ? 'cv_review_marked_not_skill'
              : 'cv_review_kept_unmapped',
          candidate,
          engineUsed: apiMetadata?.engine_used || null,
          reviewOutcome,
        })
      );
    }
  };

  const trackCandidateViewed = (documentId: string, candidateId: string) => {
    const candidate = findSkillCandidateState(documentId, candidateId);
    if (!candidate) {
      return;
    }

    void trackCvImportUiEvent(
      'cv_review_candidate_shown',
      buildCvImportReviewTelemetry({
        action: 'cv_review_candidate_shown',
        candidate,
        engineUsed: apiMetadata?.engine_used || null,
        reviewOutcome: candidate.review_outcome,
      })
    );
  };

  const reviewSummary: ImportActionSummary = useMemo(() => {
    let skillsNeedingMapping = 0;
    let workCount = 0;
    let learningCount = 0;
    let volunteeringCount = 0;
    let languageCount = 0;

    for (const document of documents) {
      workCount += document.work_experiences.filter((entry) => entry.approved).length;
      learningCount += document.learning_experiences.filter((entry) => entry.approved).length;
      volunteeringCount += document.volunteering.filter((entry) => entry.approved).length;
      languageCount += document.languages.filter((entry) => entry.approved).length;

      for (const candidate of document.skill_candidates) {
        if (
          candidate.review_outcome === 'pending' &&
          !candidate.already_in_profile &&
          candidate.selected_skill_ids.length === 0
        ) {
          skillsNeedingMapping += 1;
        }
      }
    }

    return {
      skillsSelected: approvedSkillIds.length,
      skillsNeedingMapping,
      workCount,
      learningCount,
      volunteeringCount,
      languageCount,
    };
  }, [documents, approvedSkillIds]);

  const exportDocument = (document: ParsedDocumentState) => {
    const skillIds = collectApprovedSkillIds(document);

    const jsonPayload = {
      document_id: document.document_id,
      file_name: document.file_name,
      approved: {
        work_experiences: document.work_experiences.filter((entry) => entry.approved),
        learning_experiences: document.learning_experiences.filter((entry) => entry.approved),
        volunteering: document.volunteering.filter((entry) => entry.approved),
        languages: document.languages.filter((entry) => entry.approved),
        skill_ids: skillIds,
      },
    };

    const csvRows: Array<Array<string | number>> = [
      ['document_id', 'entity_type', 'primary', 'secondary', 'detail'],
    ];

    for (const entry of document.work_experiences.filter((item) => item.approved)) {
      csvRows.push([
        document.document_id,
        'work_experience',
        entry.title,
        entry.organization,
        entry.duration,
      ]);
    }

    for (const entry of document.learning_experiences.filter((item) => item.approved)) {
      csvRows.push([
        document.document_id,
        'learning_experience',
        entry.degree,
        entry.institution,
        entry.duration,
      ]);
    }

    for (const entry of document.volunteering.filter((item) => item.approved)) {
      csvRows.push([
        document.document_id,
        'volunteering',
        entry.title,
        entry.organization,
        entry.duration,
      ]);
    }

    for (const entry of document.languages.filter((item) => item.approved)) {
      csvRows.push([
        document.document_id,
        'language',
        entry.language_code,
        entry.level,
        entry.language_name,
      ]);
    }

    for (const skillId of skillIds) {
      csvRows.push([document.document_id, 'skill', skillId, '', '']);
    }

    const safeName = document.file_name.replace(/\.pdf$/i, '');
    downloadJson(`${safeName}-wizard-export.json`, jsonPayload);
    downloadCsv(`${safeName}-wizard-export.csv`, csvRows);
  };

  const applyApproved = async (scope: 'all' | 'skills_only' = 'all') => {
    const readyDocuments = documents.filter((document) => !document.parse_error);

    if (readyDocuments.length === 0) {
      toast.error('No parsed CV documents available to apply.');
      return;
    }

    const payloadDocuments = readyDocuments.map((document) => ({
      document_id: document.document_id,
      file_name: document.file_name,
      work_experiences:
        scope === 'skills_only' ? [] : document.work_experiences.filter((entry) => entry.approved),
      learning_experiences:
        scope === 'skills_only'
          ? []
          : document.learning_experiences.filter((entry) => entry.approved),
      volunteering:
        scope === 'skills_only' ? [] : document.volunteering.filter((entry) => entry.approved),
      languages:
        scope === 'skills_only' ? [] : document.languages.filter((entry) => entry.approved),
      skill_ids: collectApprovedSkillIds(document),
    }));

    const hasAnySelection = payloadDocuments.some(
      (document) =>
        document.work_experiences.length > 0 ||
        document.learning_experiences.length > 0 ||
        document.volunteering.length > 0 ||
        document.languages.length > 0 ||
        document.skill_ids.length > 0
    );

    if (!hasAnySelection) {
      toast.error('No approved items selected.');
      return;
    }

    const totalWork = payloadDocuments.reduce(
      (count, document) => count + document.work_experiences.length,
      0
    );
    const totalLearning = payloadDocuments.reduce(
      (count, document) => count + document.learning_experiences.length,
      0
    );
    const totalVolunteering = payloadDocuments.reduce(
      (count, document) => count + document.volunteering.length,
      0
    );
    const totalLanguages = payloadDocuments.reduce(
      (count, document) => count + document.languages.length,
      0
    );
    const totalSkills = payloadDocuments.reduce(
      (count, document) => count + document.skill_ids.length,
      0
    );

    const confirmTitle =
      scope === 'skills_only' ? 'Apply skills only now?' : 'Finish review and apply now?';
    const confirmLabel = `${confirmTitle}\n\nSkills approved: ${totalSkills}\nWork approved: ${totalWork}\nLearning approved: ${totalLearning}\nVolunteering approved: ${totalVolunteering}\nLanguages approved: ${totalLanguages}`;

    if (typeof window !== 'undefined' && !window.confirm(confirmLabel)) {
      return;
    }

    if (reviewSummary.skillsNeedingMapping > 0) {
      void trackCvImportUiEvent('cv_review_unmapped_remaining', {
        remaining: reviewSummary.skillsNeedingMapping,
      });
    }

    void trackCvImportUiEvent(
      scope === 'skills_only' ? 'cv_apply_skills_confirmed' : 'cv_apply_full_confirmed',
      {
        approved_skill_count: totalSkills,
        approved_work_count: totalWork,
        approved_learning_count: totalLearning,
        approved_volunteering_count: totalVolunteering,
        approved_language_count: totalLanguages,
        unresolved_count: reviewSummary.skillsNeedingMapping,
        engine_used: apiMetadata?.engine_used || null,
      }
    );

    setIsApplying(true);

    try {
      const response = await apiFetch('/api/expertise/cv-import/wizard-apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documents: payloadDocuments }),
      });

      if (!response.ok) {
        throw new Error(await readErrorMessage(response, 'Failed to apply approved items'));
      }

      const result = await readJsonSafely(response);
      const importedCounts =
        isRecord(result) && isRecord(result.imported_counts) ? result.imported_counts : {};

      const summary = [
        `skills ${Number(importedCounts.skills || 0)}`,
        `work ${Number(importedCounts.work_experiences || 0)}`,
        `learning ${Number(importedCounts.learning_experiences || 0)}`,
        `volunteering ${Number(importedCounts.volunteering || 0)}`,
        `languages ${Number(importedCounts.languages || 0)}`,
      ];

      toast.success(`Imported: ${summary.join(', ')}.`);
      void trackCvImportUiEvent(
        scope === 'skills_only' ? 'cv_apply_quick_used' : 'cv_apply_full_review_used',
        {
          skill_count: Number(importedCounts.skills || 0),
        }
      );

      const combinedSkillIds = Array.from(
        new Set(payloadDocuments.flatMap((document) => document.skill_ids))
      );
      const skillNameById = documents.reduce<Record<string, string>>((acc, document) => {
        const current = toSkillNameMap(document);
        return { ...acc, ...current };
      }, {});

      onApplyComplete?.({
        skillIds: combinedSkillIds,
        skillNameById,
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to apply approved items');
    } finally {
      setIsApplying(false);
    }
  };

  const canAnalyze = documents.some((document) => Boolean(document.file) && !document.parse_error);
  const canApplyApproved = documents.some((document) => {
    const hasSkillSelection = collectApprovedSkillIds(document).length > 0;
    const hasEntities =
      document.work_experiences.some((entry) => entry.approved) ||
      document.learning_experiences.some((entry) => entry.approved) ||
      document.volunteering.some((entry) => entry.approved) ||
      document.languages.some((entry) => entry.approved);
    return hasSkillSelection || hasEntities;
  });
  const canApplySkillsOnly = approvedSkillIds.length > 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-proofound-forest" />
            CV Skills Import (PDF, Privacy-first)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Input
              data-testid="cv-upload"
              type="file"
              accept="application/pdf"
              multiple
              onChange={handleUpload}
              disabled={isParsing || isAnalyzing || isApplying}
            />
            <p className="text-xs text-muted-foreground">
              Text-based PDFs only. This import flow uses Python extraction and does not fall back
              to browser-side parsing.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={handleAnalyze} disabled={!canAnalyze || isParsing || isAnalyzing}>
              {isAnalyzing ? 'Analyzing...' : 'Analyze Uploaded PDFs'}
            </Button>
            {!reviewV3Enabled && (
              <Button
                onClick={() => applyApproved('all')}
                disabled={isApplying || !canApplyApproved}
              >
                {isApplying
                  ? 'Applying...'
                  : `Apply Approved (${approvedSkillIds.length}) to Profile`}
              </Button>
            )}
          </div>

          <AnalyzeProgressPanel progress={analyzeProgress} />

          {apiMetadata && !reviewV3Enabled && (
            <div className="rounded-lg border p-3 text-sm">
              <p>Semantic used: {apiMetadata.semantic_used ? 'yes' : 'no'}</p>
              <p>
                Semantic fallback triggered:{' '}
                {apiMetadata.semantic_fallback_triggered ? 'yes' : 'no'}
              </p>
              <p>Unmapped candidates: {apiMetadata.unmapped_candidates_count}</p>
            </div>
          )}

          {apiMetadata && reviewV3Enabled && (
            <div className="rounded-lg border p-3 text-sm">
              <button
                type="button"
                className="text-left text-sm font-medium text-proofound-forest hover:underline"
                onClick={() => setShowAdvancedDiagnostics((previous) => !previous)}
              >
                {showAdvancedDiagnostics ? 'Hide advanced diagnostics' : 'Advanced diagnostics'}
              </button>
              {showAdvancedDiagnostics && (
                <div className="mt-2 space-y-1 text-muted-foreground">
                  <p>Semantic matching used: {apiMetadata.semantic_used ? 'yes' : 'no'}</p>
                  <p>
                    Semantic fallback triggered:{' '}
                    {apiMetadata.semantic_fallback_triggered ? 'yes' : 'no'}
                  </p>
                  <p>Needs mapping: {apiMetadata.unmapped_candidates_count}</p>
                  {apiMetadata.fallback_stage && (
                    <p>Fallback stage: {apiMetadata.fallback_stage}</p>
                  )}
                  {apiMetadata.engine_used && <p>Engine used: {apiMetadata.engine_used}</p>}
                  {apiMetadata.ai_model && <p>Model: {apiMetadata.ai_model}</p>}
                  {typeof apiMetadata.cost_ore === 'number' && (
                    <p>Cost: {(apiMetadata.cost_ore / 100).toFixed(2)} SEK</p>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {reviewV3Enabled && documents.length > 0 && (
        <ImportActionBanner
          summary={reviewSummary}
          isApplying={isApplying}
          applyDisabled={!canApplyApproved}
          applySkillsOnlyDisabled={!canApplySkillsOnly}
          onApplyReviewed={() => applyApproved('all')}
          onApplySkillsOnly={() => applyApproved('skills_only')}
          onExpandAll={() => {
            setSectionExpandSignal((previous) => previous + 1);
            void trackCvImportUiEvent('cv_review_unmapped_remaining', {
              remaining: reviewSummary.skillsNeedingMapping,
            });
          }}
        />
      )}

      {documents.map((document) => {
        const hasParseWarning = Boolean(document.parse_error_code);
        const workStatusBadges = buildSectionStatusBadges(
          document.work_experiences.length,
          hasParseWarning
        );
        const learningStatusBadges = buildSectionStatusBadges(
          document.learning_experiences.length,
          hasParseWarning
        );
        const volunteeringStatusBadges = buildSectionStatusBadges(
          document.volunteering.length,
          hasParseWarning
        );
        const languageStatusBadges = buildSectionStatusBadges(
          document.languages.length,
          hasParseWarning
        );

        return (
          <Card key={document.document_id}>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <CardTitle className="text-lg">{document.file_name}</CardTitle>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => exportDocument(document)}
                  disabled={
                    collectApprovedSkillIds(document).length === 0 &&
                    document.work_experiences.every((entry) => !entry.approved) &&
                    document.learning_experiences.every((entry) => !entry.approved) &&
                    document.volunteering.every((entry) => !entry.approved) &&
                    document.languages.every((entry) => !entry.approved)
                  }
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export This CV
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {document.parse_error ? (
                <p className="text-sm text-red-600">{document.parse_error}</p>
              ) : (
                <>
                  <details className="rounded-md border p-3">
                    <summary className="cursor-pointer text-sm font-medium">
                      Extracted text preview
                    </summary>
                    <pre className="mt-3 max-h-56 overflow-auto whitespace-pre-wrap text-xs text-muted-foreground">
                      {document.parsed_text}
                    </pre>
                  </details>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-foreground">Skills to review</p>
                      <Badge variant="secondary">
                        {document.skill_candidates.filter((candidate) => candidate.approved).length}
                        /{document.skill_candidates.length} selected
                      </Badge>
                    </div>

                    <SkillReviewPanel
                      candidates={document.skill_candidates.map((candidate) => ({
                        ...candidate,
                        manual_last_search_at: formatRelativeTimeLabel(
                          candidate.manual_last_search_at
                        ),
                      }))}
                      openPickerId={
                        openSkillPicker?.documentId === document.document_id
                          ? openSkillPicker.candidateId
                          : null
                      }
                      onOpenPicker={(candidateId) =>
                        setOpenSkillPicker(
                          candidateId
                            ? {
                                documentId: document.document_id,
                                candidateId,
                              }
                            : null
                        )
                      }
                      onRawSkillChange={(candidateId, value) => {
                        updateDocument(document.document_id, (current) => ({
                          ...current,
                          skill_candidates: current.skill_candidates.map((item) =>
                            item.candidate_id === candidateId
                              ? {
                                  ...item,
                                  raw_skill_text: value,
                                  manual_search_query: value,
                                  approved: false,
                                  selected_skill_ids: [],
                                  already_in_profile: false,
                                  unmapped_candidate: true,
                                  review_outcome: 'pending',
                                }
                              : item
                          ),
                        }));
                        scheduleAtlasVerification(document.document_id, candidateId, value);
                      }}
                      onCategoryChange={(candidateId, value) => {
                        updateDocument(document.document_id, (current) => ({
                          ...current,
                          skill_candidates: current.skill_candidates.map((item) =>
                            item.candidate_id === candidateId
                              ? { ...item, category: value as CandidateCategory }
                              : item
                          ),
                        }));
                        const candidate = findSkillCandidateState(
                          document.document_id,
                          candidateId
                        );
                        if (candidate) {
                          scheduleAtlasVerification(
                            document.document_id,
                            candidateId,
                            candidate.manual_search_query || candidate.raw_skill_text
                          );
                        }
                      }}
                      onSelectSkillIds={(candidateId, selectedSkillIds) => {
                        updateDocument(document.document_id, (current) => ({
                          ...current,
                          skill_candidates: current.skill_candidates.map((item) =>
                            item.candidate_id === candidateId
                              ? {
                                  ...item,
                                  selected_skill_ids: selectedSkillIds,
                                  approved: selectedSkillIds.length > 0 ? true : false,
                                  already_in_profile:
                                    selectedSkillIds.length > 0 ? false : item.already_in_profile,
                                  unmapped_candidate: selectedSkillIds.length > 0 ? false : true,
                                  review_outcome:
                                    selectedSkillIds.length > 0 ? 'accepted' : 'pending',
                                }
                              : item
                          ),
                        }));
                      }}
                      onManualQueryChange={(candidateId, value) => {
                        updateDocument(document.document_id, (current) => ({
                          ...current,
                          skill_candidates: current.skill_candidates.map((item) =>
                            item.candidate_id === candidateId
                              ? { ...item, manual_search_query: value }
                              : item
                          ),
                        }));
                      }}
                      onToggleSuggestions={(candidateId) => {
                        updateDocument(document.document_id, (current) => ({
                          ...current,
                          skill_candidates: current.skill_candidates.map((item) =>
                            item.candidate_id === candidateId
                              ? {
                                  ...item,
                                  show_all_suggestions: !item.show_all_suggestions,
                                }
                              : item
                          ),
                        }));
                      }}
                      onFind={(candidateId) =>
                        searchManualMappings(document.document_id, candidateId)
                      }
                      onSelectMatch={(candidateId, option, meta) =>
                        selectAtlasMatch(document.document_id, candidateId, option, 'select', meta)
                      }
                      onReplaceMatch={(candidateId, option, meta) =>
                        selectAtlasMatch(document.document_id, candidateId, option, 'replace', meta)
                      }
                      onKeepUnmapped={(candidateId) =>
                        markSkillCandidateOutcome(
                          document.document_id,
                          candidateId,
                          'kept_unmapped'
                        )
                      }
                      onMarkNotSkill={(candidateId) =>
                        markSkillCandidateOutcome(document.document_id, candidateId, 'not_skill')
                      }
                      onCandidateViewed={(candidateId) =>
                        trackCandidateViewed(document.document_id, candidateId)
                      }
                    />
                  </div>

                  <div className="space-y-4">
                    <EntitySummaryCard
                      title="Work Experiences"
                      totalCount={document.work_experiences.length}
                      approvedCount={
                        document.work_experiences.filter((entry) => entry.approved).length
                      }
                      statusBadges={workStatusBadges}
                      expandSignal={sectionExpandSignal}
                      summary="Review title, organization, duration, and concise summary before import."
                    >
                      <div className="space-y-3">
                        {document.work_experiences.length === 0 && (
                          <p className="text-xs text-muted-foreground">
                            No work experiences extracted.
                          </p>
                        )}
                        {document.work_experiences.map((entry) => (
                          <div key={entry.item_id} className="rounded-md border p-3 space-y-3">
                            <label className="flex items-center gap-2 text-sm font-medium">
                              <input
                                type="checkbox"
                                checked={entry.approved}
                                onChange={(event) => {
                                  updateDocument(document.document_id, (current) => ({
                                    ...current,
                                    work_experiences: current.work_experiences.map((item) =>
                                      item.item_id === entry.item_id
                                        ? { ...item, approved: event.target.checked }
                                        : item
                                    ),
                                  }));
                                }}
                              />
                              Include this work entry
                            </label>
                            <div className="grid gap-2 md:grid-cols-3">
                              <Input
                                value={entry.title}
                                onChange={(event) => {
                                  updateDocument(document.document_id, (current) => ({
                                    ...current,
                                    work_experiences: current.work_experiences.map((item) =>
                                      item.item_id === entry.item_id
                                        ? { ...item, title: event.target.value }
                                        : item
                                    ),
                                  }));
                                }}
                                placeholder="Role title"
                              />
                              <Input
                                value={entry.organization}
                                onChange={(event) => {
                                  updateDocument(document.document_id, (current) => ({
                                    ...current,
                                    work_experiences: current.work_experiences.map((item) =>
                                      item.item_id === entry.item_id
                                        ? { ...item, organization: event.target.value }
                                        : item
                                    ),
                                  }));
                                }}
                                placeholder="Organization"
                              />
                              <Input
                                value={entry.duration}
                                onChange={(event) => {
                                  updateDocument(document.document_id, (current) => ({
                                    ...current,
                                    work_experiences: current.work_experiences.map((item) =>
                                      item.item_id === entry.item_id
                                        ? { ...item, duration: event.target.value }
                                        : item
                                    ),
                                  }));
                                }}
                                placeholder="Duration"
                              />
                            </div>
                            <Textarea
                              rows={2}
                              value={entry.summary}
                              onChange={(event) => {
                                updateDocument(document.document_id, (current) => ({
                                  ...current,
                                  work_experiences: current.work_experiences.map((item) =>
                                    item.item_id === entry.item_id
                                      ? { ...item, summary: event.target.value }
                                      : item
                                  ),
                                }));
                              }}
                              placeholder="Concise summary"
                            />
                            <ul className="list-disc pl-4 text-xs text-muted-foreground">
                              {entry.evidence_snippets.map((snippet, index) => (
                                <li key={`${entry.item_id}-${index}`}>{snippet}</li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </EntitySummaryCard>

                    <EntitySummaryCard
                      title="Learning Experiences"
                      totalCount={document.learning_experiences.length}
                      approvedCount={
                        document.learning_experiences.filter((entry) => entry.approved).length
                      }
                      statusBadges={learningStatusBadges}
                      expandSignal={sectionExpandSignal}
                      summary="Review institution, degree, dates, and important skills/projects."
                    >
                      <div className="space-y-3">
                        {document.learning_experiences.length === 0 && (
                          <p className="text-xs text-muted-foreground">
                            No learning experiences extracted.
                          </p>
                        )}
                        {document.learning_experiences.map((entry) => (
                          <div key={entry.item_id} className="rounded-md border p-3 space-y-3">
                            <label className="flex items-center gap-2 text-sm font-medium">
                              <input
                                type="checkbox"
                                checked={entry.approved}
                                onChange={(event) => {
                                  updateDocument(document.document_id, (current) => ({
                                    ...current,
                                    learning_experiences: current.learning_experiences.map(
                                      (item) =>
                                        item.item_id === entry.item_id
                                          ? { ...item, approved: event.target.checked }
                                          : item
                                    ),
                                  }));
                                }}
                              />
                              Include this learning entry
                            </label>
                            <div className="grid gap-2 md:grid-cols-3">
                              <Input
                                value={entry.institution}
                                onChange={(event) => {
                                  updateDocument(document.document_id, (current) => ({
                                    ...current,
                                    learning_experiences: current.learning_experiences.map(
                                      (item) =>
                                        item.item_id === entry.item_id
                                          ? { ...item, institution: event.target.value }
                                          : item
                                    ),
                                  }));
                                }}
                                placeholder="Institution"
                              />
                              <Input
                                value={entry.degree}
                                onChange={(event) => {
                                  updateDocument(document.document_id, (current) => ({
                                    ...current,
                                    learning_experiences: current.learning_experiences.map(
                                      (item) =>
                                        item.item_id === entry.item_id
                                          ? { ...item, degree: event.target.value }
                                          : item
                                    ),
                                  }));
                                }}
                                placeholder="Degree"
                              />
                              <Input
                                value={entry.duration}
                                onChange={(event) => {
                                  updateDocument(document.document_id, (current) => ({
                                    ...current,
                                    learning_experiences: current.learning_experiences.map(
                                      (item) =>
                                        item.item_id === entry.item_id
                                          ? { ...item, duration: event.target.value }
                                          : item
                                    ),
                                  }));
                                }}
                                placeholder="Duration"
                              />
                            </div>
                            <div className="grid gap-2 md:grid-cols-2">
                              <Textarea
                                rows={2}
                                value={entry.skills}
                                onChange={(event) => {
                                  updateDocument(document.document_id, (current) => ({
                                    ...current,
                                    learning_experiences: current.learning_experiences.map(
                                      (item) =>
                                        item.item_id === entry.item_id
                                          ? { ...item, skills: event.target.value }
                                          : item
                                    ),
                                  }));
                                }}
                                placeholder="Relevant skills"
                              />
                              <Textarea
                                rows={2}
                                value={entry.projects}
                                onChange={(event) => {
                                  updateDocument(document.document_id, (current) => ({
                                    ...current,
                                    learning_experiences: current.learning_experiences.map(
                                      (item) =>
                                        item.item_id === entry.item_id
                                          ? { ...item, projects: event.target.value }
                                          : item
                                    ),
                                  }));
                                }}
                                placeholder="Projects or outcomes"
                              />
                            </div>
                            <ul className="list-disc pl-4 text-xs text-muted-foreground">
                              {entry.evidence_snippets.map((snippet, index) => (
                                <li key={`${entry.item_id}-${index}`}>{snippet}</li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </EntitySummaryCard>

                    <EntitySummaryCard
                      title="Volunteering"
                      totalCount={document.volunteering.length}
                      approvedCount={document.volunteering.filter((entry) => entry.approved).length}
                      statusBadges={volunteeringStatusBadges}
                      expandSignal={sectionExpandSignal}
                      summary="Review cause, impact, and contribution details."
                    >
                      <div className="space-y-3">
                        {document.volunteering.length === 0 && (
                          <p className="text-xs text-muted-foreground">
                            No volunteering entries extracted.
                          </p>
                        )}
                        {document.volunteering.map((entry) => (
                          <div key={entry.item_id} className="rounded-md border p-3 space-y-3">
                            <label className="flex items-center gap-2 text-sm font-medium">
                              <input
                                type="checkbox"
                                checked={entry.approved}
                                onChange={(event) => {
                                  updateDocument(document.document_id, (current) => ({
                                    ...current,
                                    volunteering: current.volunteering.map((item) =>
                                      item.item_id === entry.item_id
                                        ? { ...item, approved: event.target.checked }
                                        : item
                                    ),
                                  }));
                                }}
                              />
                              Include this volunteering entry
                            </label>
                            <div className="grid gap-2 md:grid-cols-3">
                              <Input
                                value={entry.title}
                                onChange={(event) => {
                                  updateDocument(document.document_id, (current) => ({
                                    ...current,
                                    volunteering: current.volunteering.map((item) =>
                                      item.item_id === entry.item_id
                                        ? { ...item, title: event.target.value }
                                        : item
                                    ),
                                  }));
                                }}
                                placeholder="Role title"
                              />
                              <Input
                                value={entry.organization}
                                onChange={(event) => {
                                  updateDocument(document.document_id, (current) => ({
                                    ...current,
                                    volunteering: current.volunteering.map((item) =>
                                      item.item_id === entry.item_id
                                        ? { ...item, organization: event.target.value }
                                        : item
                                    ),
                                  }));
                                }}
                                placeholder="Organization"
                              />
                              <Input
                                value={entry.duration}
                                onChange={(event) => {
                                  updateDocument(document.document_id, (current) => ({
                                    ...current,
                                    volunteering: current.volunteering.map((item) =>
                                      item.item_id === entry.item_id
                                        ? { ...item, duration: event.target.value }
                                        : item
                                    ),
                                  }));
                                }}
                                placeholder="Duration"
                              />
                            </div>
                            <div className="grid gap-2 md:grid-cols-2">
                              <Textarea
                                rows={2}
                                value={entry.cause}
                                onChange={(event) => {
                                  updateDocument(document.document_id, (current) => ({
                                    ...current,
                                    volunteering: current.volunteering.map((item) =>
                                      item.item_id === entry.item_id
                                        ? { ...item, cause: event.target.value }
                                        : item
                                    ),
                                  }));
                                }}
                                placeholder="Cause"
                              />
                              <Textarea
                                rows={2}
                                value={entry.impact}
                                onChange={(event) => {
                                  updateDocument(document.document_id, (current) => ({
                                    ...current,
                                    volunteering: current.volunteering.map((item) =>
                                      item.item_id === entry.item_id
                                        ? { ...item, impact: event.target.value }
                                        : item
                                    ),
                                  }));
                                }}
                                placeholder="Impact"
                              />
                              <Textarea
                                rows={2}
                                value={entry.skills_deployed}
                                onChange={(event) => {
                                  updateDocument(document.document_id, (current) => ({
                                    ...current,
                                    volunteering: current.volunteering.map((item) =>
                                      item.item_id === entry.item_id
                                        ? { ...item, skills_deployed: event.target.value }
                                        : item
                                    ),
                                  }));
                                }}
                                placeholder="Skills deployed"
                              />
                              <Textarea
                                rows={2}
                                value={entry.personal_why}
                                onChange={(event) => {
                                  updateDocument(document.document_id, (current) => ({
                                    ...current,
                                    volunteering: current.volunteering.map((item) =>
                                      item.item_id === entry.item_id
                                        ? { ...item, personal_why: event.target.value }
                                        : item
                                    ),
                                  }));
                                }}
                                placeholder="Personal motivation"
                              />
                            </div>
                            <ul className="list-disc pl-4 text-xs text-muted-foreground">
                              {entry.evidence_snippets.map((snippet, index) => (
                                <li key={`${entry.item_id}-${index}`}>{snippet}</li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </EntitySummaryCard>

                    <EntitySummaryCard
                      title="Languages"
                      totalCount={document.languages.length}
                      approvedCount={document.languages.filter((entry) => entry.approved).length}
                      statusBadges={languageStatusBadges}
                      expandSignal={sectionExpandSignal}
                      summary="Confirm language and CEFR level."
                    >
                      <div className="space-y-3">
                        {document.languages.length === 0 && (
                          <p className="text-xs text-muted-foreground">No languages extracted.</p>
                        )}
                        {document.languages.map((entry) => (
                          <div key={entry.item_id} className="rounded-md border p-3 space-y-3">
                            <label className="flex items-center gap-2 text-sm font-medium">
                              <input
                                type="checkbox"
                                checked={entry.approved}
                                onChange={(event) => {
                                  updateDocument(document.document_id, (current) => ({
                                    ...current,
                                    languages: current.languages.map((item) =>
                                      item.item_id === entry.item_id
                                        ? { ...item, approved: event.target.checked }
                                        : item
                                    ),
                                  }));
                                }}
                              />
                              Include this language entry
                            </label>
                            <div className="grid gap-2 md:grid-cols-3">
                              <select
                                className="rounded border px-2 py-1 text-sm"
                                value={entry.language_code}
                                onChange={(event) => {
                                  const selectedOption = LANGUAGE_OPTIONS.find(
                                    (option) => option.key === event.target.value
                                  );
                                  updateDocument(document.document_id, (current) => ({
                                    ...current,
                                    languages: current.languages.map((item) =>
                                      item.item_id === entry.item_id
                                        ? {
                                            ...item,
                                            language_code: event.target.value,
                                            language_name:
                                              selectedOption?.label || event.target.value,
                                          }
                                        : item
                                    ),
                                  }));
                                }}
                              >
                                {LANGUAGE_OPTIONS.map((option) => (
                                  <option key={option.key} value={option.key}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                              <Input value={entry.language_name} readOnly />
                              <select
                                className="rounded border px-2 py-1 text-sm"
                                value={entry.level}
                                onChange={(event) => {
                                  updateDocument(document.document_id, (current) => ({
                                    ...current,
                                    languages: current.languages.map((item) =>
                                      item.item_id === entry.item_id
                                        ? { ...item, level: event.target.value }
                                        : item
                                    ),
                                  }));
                                }}
                              >
                                {CEFR_LEVELS.map((level) => (
                                  <option key={level} value={level}>
                                    {level}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <ul className="list-disc pl-4 text-xs text-muted-foreground">
                              {entry.evidence_snippets.map((snippet, index) => (
                                <li key={`${entry.item_id}-${index}`}>{snippet}</li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </EntitySummaryCard>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        );
      })}

      {documents.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">
            Upload one or more CV PDFs to begin extraction and mapping.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
