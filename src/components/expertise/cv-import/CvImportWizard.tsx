'use client';

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { Download, Search, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

import { apiFetch } from '@/lib/api/fetch';
import {
  ANALYZE_PROGRESS_AUTO_COLLAPSE_MS,
  AnalyzeProgressPanel,
  type AnalyzeProgressPhase,
  type AnalyzeProgressState,
  createIdleAnalyzeProgressState,
} from '@/components/expertise/cv-import/AnalyzeProgressPanel';
import {
  extractPdfTextFromFile,
  normalizePdfParseError,
} from '@/lib/expertise/pdf-client-extractor';
import {
  extractPdfTextWithOcr,
  isOcrClientEnabled,
  resolveOcrClientLimits,
} from '@/lib/expertise/ocr-client';
import { LANGUAGE_OPTIONS, CEFR_LEVELS } from '@/lib/taxonomy/data';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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

type WizardStep = 'work' | 'learning' | 'volunteering' | 'languages' | 'skills';

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

const STEPS: Array<{ id: WizardStep; label: string }> = [
  { id: 'work', label: 'Work Experiences' },
  { id: 'learning', label: 'Learning Experiences' },
  { id: 'volunteering', label: 'Volunteering' },
  { id: 'languages', label: 'Languages' },
  { id: 'skills', label: 'Skills' },
];

const DEFAULT_METADATA: ApiMetadata = {
  semantic_used: false,
  semantic_fallback_triggered: false,
  fallback_stage: 'none',
  candidate_only_fallback_triggered: false,
  match_dependency_error_code: undefined,
  unmapped_candidates_count: 0,
  limits: {
    max_documents: 5,
    max_chars_per_document: 30000,
    max_total_chars: 90000,
  },
};

const GENERIC_BACKEND_ERRORS = new Set([
  'Failed to process CV wizard suggestions',
  'Failed to process CV documents',
]);
const PROXY_RETRYABLE_CODES = new Set(['CV_IMPORT_PROXY_UNAVAILABLE', 'CV_IMPORT_PROXY_TIMEOUT']);
const OCR_RETRYABLE_PARSE_CODES = new Set(['PDF_EMPTY_TEXT']);

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

function isClientFallbackEnabled(): boolean {
  return process.env.NEXT_PUBLIC_CV_IMPORT_CLIENT_FALLBACK_ENABLED !== 'false';
}

function isProxyRetryableError(payload: unknown): boolean {
  if (!isRecord(payload)) {
    return false;
  }

  return typeof payload.code === 'string' && PROXY_RETRYABLE_CODES.has(payload.code);
}

async function buildTextFallbackPayload(documents: ParsedDocumentState[]): Promise<{
  documents: Array<{
    document_id: string;
    file_name: string;
    text: string;
    context: 'cv';
  }>;
}> {
  const fallbackDocuments: Array<{
    document_id: string;
    file_name: string;
    text: string;
    context: 'cv';
  }> = [];

  for (const document of documents) {
    if (!document.file) {
      continue;
    }

    try {
      const text = await extractPdfTextFromFile(document.file);
      if (!text) {
        throw new Error('No text could be extracted from the PDF.');
      }

      fallbackDocuments.push({
        document_id: document.document_id,
        file_name: document.file_name,
        text,
        context: 'cv',
      });
    } catch (error) {
      throw new Error(normalizePdfParseError(error));
    }
  }

  if (fallbackDocuments.length === 0) {
    throw new Error('Upload at least one PDF before analyzing.');
  }

  return { documents: fallbackDocuments };
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

  const documents = value.documents
    .map((document, docIndex) => {
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
            .map((candidate, index) => {
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
                    .map((suggestion) => {
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

function shouldRetryWithOcr(document: ApiDocumentResult): boolean {
  return (
    typeof document.parse_error === 'string' &&
    document.parse_error.length > 0 &&
    typeof document.parse_error_code === 'string' &&
    OCR_RETRYABLE_PARSE_CODES.has(document.parse_error_code)
  );
}

async function retryOcrDocuments(params: {
  payload: ApiSuggestResponse;
  sourceByRequestId: Map<string, ParsedDocumentState>;
}): Promise<{ payload: ApiSuggestResponse; ocrAttempted: number; ocrFailed: number }> {
  if (!isOcrClientEnabled()) {
    return { payload: params.payload, ocrAttempted: 0, ocrFailed: 0 };
  }

  const ocrInputs: Array<{
    document_id: string;
    file_name: string;
    text: string;
    context: 'cv';
  }> = [];
  let ocrFailed = 0;

  for (const document of params.payload.documents) {
    if (!shouldRetryWithOcr(document)) {
      continue;
    }

    const source = params.sourceByRequestId.get(document.document_id);
    if (!source?.file) {
      continue;
    }

    try {
      const extracted = await extractPdfTextWithOcr(source.file);
      ocrInputs.push({
        document_id: document.document_id,
        file_name: document.file_name,
        text: extracted.text,
        context: 'cv',
      });
    } catch (error) {
      ocrFailed += 1;
      console.warn('[cv-import] OCR fallback failed', {
        documentId: document.document_id,
        error: error instanceof Error ? error.message : 'Unknown OCR error',
      });
    }
  }

  if (ocrInputs.length === 0) {
    return { payload: params.payload, ocrAttempted: 0, ocrFailed };
  }

  const ocrResponse = await apiFetch('/api/expertise/cv-import/wizard-suggest?engine=gemini', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ documents: ocrInputs }),
  });

  if (!ocrResponse.ok) {
    throw new Error(await readErrorMessage(ocrResponse, 'OCR retry failed'));
  }

  const ocrPayload = normalizeSuggestResponse(await readJsonSafely(ocrResponse));
  if (!ocrPayload) {
    throw new Error('OCR retry returned invalid response format.');
  }

  const byId = new Map(ocrPayload.documents.map((document) => [document.document_id, document]));
  const mergedDocuments = params.payload.documents.map(
    (document) => byId.get(document.document_id) || document
  );

  return {
    payload: {
      ...params.payload,
      documents: mergedDocuments,
    },
    ocrAttempted: ocrInputs.length,
    ocrFailed,
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

function formatCategory(value: CandidateCategory): string {
  return value.replace(/_/g, ' ');
}

function parseMultiSelect(event: ChangeEvent<HTMLSelectElement>): string[] {
  return Array.from(event.target.selectedOptions).map((option) => option.value);
}

export function CvImportWizard({ onApplyComplete }: CvImportWizardProps) {
  const [documents, setDocuments] = useState<ParsedDocumentState[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [apiMetadata, setApiMetadata] = useState<ApiMetadata | null>(null);
  const [analyzeProgress, setAnalyzeProgress] = useState<AnalyzeProgressState>(
    createIdleAnalyzeProgressState
  );
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const progressResetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentStep = STEPS[currentStepIndex]?.id || 'work';

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

  const setFailedProgress = (message: string) => {
    setAnalyzeProgress((previous) => ({
      ...previous,
      status: 'failed',
      message,
      completedAt: Date.now(),
    }));
  };

  useEffect(
    () => () => {
      if (progressResetTimerRef.current !== null) {
        clearTimeout(progressResetTimerRef.current);
        progressResetTimerRef.current = null;
      }
    },
    []
  );

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
      setCurrentStepIndex(0);
      clearProgressResetTimer();
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

      const formData = new FormData();
      for (const descriptor of analyzeDocuments) {
        if (!descriptor.document.file) continue;
        formData.append(
          'files',
          descriptor.document.file,
          sanitizeMultipartFilename(descriptor.document.file_name)
        );
        formData.append('document_ids', descriptor.requestId);
        formData.append('contexts', 'cv');
      }

      setRunningProgress('submitting', 25, 'Submitting files to extraction service...');

      let fallbackStageUsed: ApiFallbackStage | null = null;
      let response = await apiFetch('/api/expertise/cv-import/wizard-suggest?engine=gemini', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok && isClientFallbackEnabled()) {
        const failurePayload = await readJsonSafely(response);

        if (isProxyRetryableError(failurePayload)) {
          console.warn(
            '[cv-import] wizard suggest proxy retryable failure, retrying with gemini json payload'
          );

          const fallbackPayload = await buildTextFallbackPayload(
            analyzeDocuments.map((descriptor) => ({
              ...descriptor.document,
              document_id: descriptor.requestId,
            }))
          );
          setRunningProgress('extracting', 45, 'Retrying extraction with fallback service...');

          response = await apiFetch('/api/expertise/cv-import/wizard-suggest?engine=gemini', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(fallbackPayload),
          });
          fallbackStageUsed = 'python_json_retry';

          if (!response.ok) {
            const pythonFailurePayload = await readJsonSafely(response);
            if (isProxyRetryableError(pythonFailurePayload)) {
              setRunningProgress(
                'extracting',
                48,
                'Retrying extraction with deterministic fallback service...'
              );
              response = await apiFetch(
                '/api/expertise/cv-import/wizard-suggest?engine=typescript',
                {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(fallbackPayload),
                }
              );
              fallbackStageUsed = 'typescript_retry';
            }
          }
        }
      }

      if (!response.ok) {
        throw new Error(await readErrorMessage(response, 'Failed to analyze uploaded PDFs'));
      }

      setRunningProgress('extracting', 55, 'Extracting skills and experience...');

      let payload = normalizeSuggestResponse(await readJsonSafely(response));
      if (!payload) {
        throw new Error('Invalid response format from CV analysis service');
      }

      if (fallbackStageUsed && payload.metadata.fallback_stage === 'none') {
        payload = {
          ...payload,
          metadata: {
            ...payload.metadata,
            fallback_stage: fallbackStageUsed,
          },
        };
      }

      if (isOcrClientEnabled()) {
        setRunningProgress('extracting', 60, 'Running OCR fallback for scanned PDFs...');
        const {
          payload: mergedPayload,
          ocrAttempted,
          ocrFailed,
        } = await retryOcrDocuments({
          payload,
          sourceByRequestId,
        });
        payload = mergedPayload;

        if (ocrAttempted > 0) {
          if (ocrFailed > 0) {
            toast.info(
              'OCR succeeded for some scanned PDFs. Upload a clearer text-based PDF for documents that still failed.'
            );
          } else {
            toast.success('OCR fallback extracted text from scanned PDF documents.');
          }
        } else if (ocrFailed > 0) {
          toast.error(
            'OCR fallback could not extract readable text. Upload a better text-based PDF.'
          );
        }
      }

      setRunningProgress('mapping', 78, 'Matching to taxonomy...');
      setApiMetadata(payload.metadata);

      const analyzedDocuments = payload.documents.map((document) => {
        const source = sourceByRequestId.get(document.document_id);

        return {
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
          skill_candidates: document.skill_candidates.map((candidate) => ({
            ...candidate,
            approved: true,
            selected_skill_ids: candidate.suggestions.slice(0, 1).map((option) => option.skill_id),
            manual_search_query: candidate.raw_skill_text,
            manual_options: [],
            manual_loading: false,
            show_all_suggestions: false,
          })),
        };
      });

      setRunningProgress('finalizing', 92, 'Finalizing results...');
      setDocuments(analyzedDocuments);
      setCurrentStepIndex(0);

      const totalSkillCandidates = payload.documents.reduce(
        (count, document) => count + document.skill_candidates.length,
        0
      );
      if (fallbackStageUsed) {
        toast.info('CV analysis recovered via fallback path.');
      }
      if (payload.metadata.semantic_fallback_triggered && totalSkillCandidates === 0) {
        toast.info(
          'Skill suggestions are temporarily unavailable, but core CV entities were extracted.'
        );
      } else if (payload.metadata.candidate_only_fallback_triggered && totalSkillCandidates > 0) {
        toast.info('Showing candidate-only skills while taxonomy matching recovers.');
      }

      setCompletedProgress('Extraction completed. Review and approve the results below.');
      toast.success(
        `Analyzed ${payload.documents.length} document${payload.documents.length > 1 ? 's' : ''}.`
      );
    } catch (error) {
      setFailedProgress('Analysis failed. Please try again.');
      toast.error(error instanceof Error ? error.message : 'Failed to analyze uploaded PDFs');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const searchManualMappings = async (documentId: string, candidateId: string) => {
    const candidate = documents
      .find((document) => document.document_id === documentId)
      ?.skill_candidates.find((entry) => entry.candidate_id === candidateId);

    if (!candidate) {
      return;
    }

    const query = candidate.manual_search_query.trim();
    if (!query) {
      toast.error('Enter a search query for manual mapping.');
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
        `/api/expertise/taxonomy?search=${encodeURIComponent(query)}`
      );
      if (!response.ok) {
        throw new Error(await readErrorMessage(response, 'Failed to search taxonomy'));
      }

      const payload = await readJsonSafely(response);
      const l4Skills =
        isRecord(payload) && Array.isArray(payload.l4_skills) ? payload.l4_skills : [];

      const mappedOptions = l4Skills.slice(0, 8).reduce<ApiSuggestion[]>((acc, skill: any) => {
        const skillId = typeof skill?.code === 'string' ? skill.code.trim() : '';
        if (!skillId) {
          return acc;
        }

        const skillName =
          typeof skill?.nameI18n?.en === 'string' && skill.nameI18n.en.trim().length > 0
            ? skill.nameI18n.en.trim()
            : skillId;

        acc.push({
          skill_id: skillId,
          skill_name: skillName,
          match_method: 'fuzzy',
          score: 0.5,
        });

        return acc;
      }, []);

      updateDocument(documentId, (document) => ({
        ...document,
        skill_candidates: document.skill_candidates.map((entry) =>
          entry.candidate_id === candidateId
            ? { ...entry, manual_loading: false, manual_options: mappedOptions }
            : entry
        ),
      }));

      if (mappedOptions.length === 0) {
        toast.info('No taxonomy matches found for manual mapping.');
      }
    } catch (error) {
      updateDocument(documentId, (document) => ({
        ...document,
        skill_candidates: document.skill_candidates.map((entry) =>
          entry.candidate_id === candidateId ? { ...entry, manual_loading: false } : entry
        ),
      }));

      toast.error(error instanceof Error ? error.message : 'Failed to search taxonomy');
    }
  };

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

  const applyApproved = async () => {
    const readyDocuments = documents.filter((document) => !document.parse_error);

    if (readyDocuments.length === 0) {
      toast.error('No parsed CV documents available to apply.');
      return;
    }

    const payloadDocuments = readyDocuments.map((document) => ({
      document_id: document.document_id,
      file_name: document.file_name,
      work_experiences: document.work_experiences.filter((entry) => entry.approved),
      learning_experiences: document.learning_experiences.filter((entry) => entry.approved),
      volunteering: document.volunteering.filter((entry) => entry.approved),
      languages: document.languages.filter((entry) => entry.approved),
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
  const ocrEnabled = isOcrClientEnabled();
  const ocrLimits = ocrEnabled ? resolveOcrClientLimits() : null;

  const stepTabs = (
    <div className="flex flex-wrap gap-2">
      {STEPS.map((step, index) => (
        <Button
          key={step.id}
          size="sm"
          variant={index === currentStepIndex ? 'default' : 'outline'}
          onClick={() => setCurrentStepIndex(index)}
        >
          {index + 1}. {step.label}
        </Button>
      ))}
    </div>
  );

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
              {ocrEnabled && ocrLimits
                ? `Text-based PDFs are recommended. OCR fallback is enabled for scanned PDFs up to ${ocrLimits.maxPages} pages and ${Math.round(ocrLimits.maxFileSizeBytes / (1024 * 1024))}MB.`
                : 'Text-based PDFs only. Enable OCR fallback to process scanned PDFs.'}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={handleAnalyze} disabled={!canAnalyze || isParsing || isAnalyzing}>
              {isAnalyzing ? 'Analyzing...' : 'Analyze Uploaded PDFs'}
            </Button>
            <Button onClick={applyApproved} disabled={isApplying || documents.length === 0}>
              {isApplying
                ? 'Applying...'
                : `Apply Approved (${approvedSkillIds.length}) to Profile`}
            </Button>
          </div>

          <AnalyzeProgressPanel progress={analyzeProgress} />

          {apiMetadata && (
            <div className="rounded-lg border p-3 text-sm">
              <p>Semantic used: {apiMetadata.semantic_used ? 'yes' : 'no'}</p>
              <p>
                Semantic fallback triggered:{' '}
                {apiMetadata.semantic_fallback_triggered ? 'yes' : 'no'}
              </p>
              <p>Unmapped candidates: {apiMetadata.unmapped_candidates_count}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {documents.length > 0 && stepTabs}

      {documents.map((document) => (
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

                {currentStep === 'work' && (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Approve</TableHead>
                          <TableHead>Title</TableHead>
                          <TableHead>Organization</TableHead>
                          <TableHead>Duration</TableHead>
                          <TableHead>Summary</TableHead>
                          <TableHead>Evidence</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {document.work_experiences.map((entry) => (
                          <TableRow key={entry.item_id}>
                            <TableCell>
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
                            </TableCell>
                            <TableCell>
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
                              />
                            </TableCell>
                            <TableCell>
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
                              />
                            </TableCell>
                            <TableCell>
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
                              />
                            </TableCell>
                            <TableCell>
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
                              />
                            </TableCell>
                            <TableCell>
                              <ul className="list-disc pl-4 text-xs">
                                {entry.evidence_snippets.map((snippet, index) => (
                                  <li key={`${entry.item_id}-${index}`}>{snippet}</li>
                                ))}
                              </ul>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}

                {currentStep === 'learning' && (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Approve</TableHead>
                          <TableHead>Institution</TableHead>
                          <TableHead>Degree</TableHead>
                          <TableHead>Duration</TableHead>
                          <TableHead>Skills</TableHead>
                          <TableHead>Projects</TableHead>
                          <TableHead>Evidence</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {document.learning_experiences.map((entry) => (
                          <TableRow key={entry.item_id}>
                            <TableCell>
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
                            </TableCell>
                            <TableCell>
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
                              />
                            </TableCell>
                            <TableCell>
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
                              />
                            </TableCell>
                            <TableCell>
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
                              />
                            </TableCell>
                            <TableCell>
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
                              />
                            </TableCell>
                            <TableCell>
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
                              />
                            </TableCell>
                            <TableCell>
                              <ul className="list-disc pl-4 text-xs">
                                {entry.evidence_snippets.map((snippet, index) => (
                                  <li key={`${entry.item_id}-${index}`}>{snippet}</li>
                                ))}
                              </ul>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}

                {currentStep === 'volunteering' && (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Approve</TableHead>
                          <TableHead>Title</TableHead>
                          <TableHead>Organization</TableHead>
                          <TableHead>Duration</TableHead>
                          <TableHead>Cause</TableHead>
                          <TableHead>Impact</TableHead>
                          <TableHead>Evidence</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {document.volunteering.map((entry) => (
                          <TableRow key={entry.item_id}>
                            <TableCell>
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
                            </TableCell>
                            <TableCell>
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
                              />
                            </TableCell>
                            <TableCell>
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
                              />
                            </TableCell>
                            <TableCell>
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
                              />
                            </TableCell>
                            <TableCell>
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
                              />
                            </TableCell>
                            <TableCell>
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
                              />
                            </TableCell>
                            <TableCell>
                              <ul className="list-disc pl-4 text-xs">
                                {entry.evidence_snippets.map((snippet, index) => (
                                  <li key={`${entry.item_id}-${index}`}>{snippet}</li>
                                ))}
                              </ul>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}

                {currentStep === 'languages' && (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Approve</TableHead>
                          <TableHead>Language</TableHead>
                          <TableHead>Code</TableHead>
                          <TableHead>CEFR</TableHead>
                          <TableHead>Evidence</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {document.languages.map((entry) => (
                          <TableRow key={entry.item_id}>
                            <TableCell>
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
                            </TableCell>
                            <TableCell>
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
                            </TableCell>
                            <TableCell>{entry.language_code}</TableCell>
                            <TableCell>
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
                            </TableCell>
                            <TableCell>
                              <ul className="list-disc pl-4 text-xs">
                                {entry.evidence_snippets.map((snippet, index) => (
                                  <li key={`${entry.item_id}-${index}`}>{snippet}</li>
                                ))}
                              </ul>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}

                {currentStep === 'skills' && (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Approve</TableHead>
                          <TableHead>Candidate</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Confidence</TableHead>
                          <TableHead>Evidence</TableHead>
                          <TableHead>Mapped skill_ids</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {document.skill_candidates.map((candidate) => {
                          const visibleAutoSuggestions = candidate.suggestions.slice(
                            0,
                            candidate.show_all_suggestions ? 20 : 5
                          );
                          const selectedFallbackSuggestions = candidate.suggestions.filter(
                            (option) => candidate.selected_skill_ids.includes(option.skill_id)
                          );
                          const optionMap = new Map<string, ApiSuggestion>();
                          for (const option of [
                            ...visibleAutoSuggestions,
                            ...selectedFallbackSuggestions,
                            ...candidate.manual_options,
                          ]) {
                            optionMap.set(option.skill_id, option);
                          }

                          const options = Array.from(optionMap.values());

                          return (
                            <TableRow key={candidate.candidate_id}>
                              <TableCell>
                                <input
                                  type="checkbox"
                                  checked={candidate.approved}
                                  onChange={(event) => {
                                    updateDocument(document.document_id, (current) => ({
                                      ...current,
                                      skill_candidates: current.skill_candidates.map((item) =>
                                        item.candidate_id === candidate.candidate_id
                                          ? { ...item, approved: event.target.checked }
                                          : item
                                      ),
                                    }));
                                  }}
                                />
                              </TableCell>
                              <TableCell className="min-w-[220px]">
                                <Textarea
                                  value={candidate.raw_skill_text}
                                  rows={2}
                                  onChange={(event) => {
                                    updateDocument(document.document_id, (current) => ({
                                      ...current,
                                      skill_candidates: current.skill_candidates.map((item) =>
                                        item.candidate_id === candidate.candidate_id
                                          ? {
                                              ...item,
                                              raw_skill_text: event.target.value,
                                              manual_search_query: event.target.value,
                                            }
                                          : item
                                      ),
                                    }));
                                  }}
                                />
                              </TableCell>
                              <TableCell>
                                <select
                                  className="rounded border px-2 py-1 text-sm"
                                  value={candidate.category}
                                  onChange={(event) => {
                                    updateDocument(document.document_id, (current) => ({
                                      ...current,
                                      skill_candidates: current.skill_candidates.map((item) =>
                                        item.candidate_id === candidate.candidate_id
                                          ? {
                                              ...item,
                                              category: event.target.value as CandidateCategory,
                                            }
                                          : item
                                      ),
                                    }));
                                  }}
                                >
                                  {[
                                    'technical',
                                    'soft_skills',
                                    'tools_technologies',
                                    'languages',
                                    'certifications',
                                    'other',
                                  ].map((option) => (
                                    <option key={option} value={option}>
                                      {formatCategory(option as CandidateCategory)}
                                    </option>
                                  ))}
                                </select>
                              </TableCell>
                              <TableCell>
                                <Badge variant="secondary">
                                  {Math.round(candidate.confidence * 100)}%
                                </Badge>
                              </TableCell>
                              <TableCell className="min-w-[260px]">
                                <ul className="list-disc pl-4 text-xs">
                                  {candidate.evidence_snippets.map((snippet, index) => (
                                    <li key={`${candidate.candidate_id}-${index}`}>{snippet}</li>
                                  ))}
                                </ul>
                              </TableCell>
                              <TableCell className="min-w-[280px] space-y-2">
                                <select
                                  multiple
                                  className="h-28 w-full rounded border px-2 py-1 text-xs"
                                  value={candidate.selected_skill_ids}
                                  onChange={(event) => {
                                    const selectedSkillIds = parseMultiSelect(event);
                                    updateDocument(document.document_id, (current) => ({
                                      ...current,
                                      skill_candidates: current.skill_candidates.map((item) =>
                                        item.candidate_id === candidate.candidate_id
                                          ? { ...item, selected_skill_ids: selectedSkillIds }
                                          : item
                                      ),
                                    }));
                                  }}
                                >
                                  {options.map((option) => (
                                    <option key={option.skill_id} value={option.skill_id}>
                                      {option.skill_id} · {option.skill_name} ({option.match_method}
                                      : {(option.score * 100).toFixed(0)}%)
                                    </option>
                                  ))}
                                </select>

                                {candidate.suggestions.length > 5 && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() =>
                                      updateDocument(document.document_id, (current) => ({
                                        ...current,
                                        skill_candidates: current.skill_candidates.map((item) =>
                                          item.candidate_id === candidate.candidate_id
                                            ? {
                                                ...item,
                                                show_all_suggestions: !item.show_all_suggestions,
                                              }
                                            : item
                                        ),
                                      }))
                                    }
                                  >
                                    {candidate.show_all_suggestions
                                      ? 'Show fewer suggestions'
                                      : 'Show more suggestions'}
                                  </Button>
                                )}

                                <div className="flex items-center gap-2">
                                  <Input
                                    value={candidate.manual_search_query}
                                    onChange={(event) => {
                                      updateDocument(document.document_id, (current) => ({
                                        ...current,
                                        skill_candidates: current.skill_candidates.map((item) =>
                                          item.candidate_id === candidate.candidate_id
                                            ? { ...item, manual_search_query: event.target.value }
                                            : item
                                        ),
                                      }));
                                    }}
                                    placeholder="Search taxonomy for manual mapping"
                                  />
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      searchManualMappings(
                                        document.document_id,
                                        candidate.candidate_id
                                      )
                                    }
                                    disabled={candidate.manual_loading}
                                  >
                                    <Search className="mr-2 h-4 w-4" />
                                    {candidate.manual_loading ? '...' : 'Find'}
                                  </Button>
                                </div>

                                {candidate.unmapped_candidate &&
                                  candidate.selected_skill_ids.length === 0 && (
                                    <p className="text-xs text-amber-700">
                                      Unmapped candidate. Select at least one taxonomy skill_id.
                                    </p>
                                  )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      ))}

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
