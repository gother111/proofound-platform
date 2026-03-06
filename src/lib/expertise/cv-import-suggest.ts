import { and, eq } from 'drizzle-orm';
import { z } from 'zod';

import { extractSkillPhrases, getSkillVariations } from '@/lib/ai/nlp-extractor';
import { cosineSimilarity, generateEmbedding } from '@/lib/ai/embedding-service';
import { db } from '@/db';
import { skillsTaxonomy } from '@/db/schema';
import { verifyAtlasSkillCandidate } from '@/lib/expertise/atlas-skill-verifier';
import { extractLocalSkillCandidates } from '@/lib/expertise/local-skill-candidate-extractor';
import {
  calibrateCandidateConfidence,
  computeEvidenceQuality,
  shouldRejectWeakTopSuggestion,
} from '@/lib/expertise/skill-confidence';
import { normalizeTaxonomyComparison } from '@/lib/expertise/taxonomy-normalization';

const TAXONOMY_CACHE_TTL_MS = 10 * 60 * 1000;
const MAX_CANDIDATES_PER_DOCUMENT = 40;
const MAX_CANDIDATE_TOKENS = 8;
const MAX_CANDIDATE_TEXT_LENGTH = 80;
const DEFAULT_SUGGESTIONS_LIMIT = 8;
const DEFAULT_SEMANTIC_TIMEOUT_MS = 1800;
const DEFAULT_SEMANTIC_FUZZY_POOL = 120;
const DEFAULT_FUZZY_THRESHOLD = 0.76;
const DEFAULT_SEMANTIC_THRESHOLD = 0.74;
const EVIDENCE_CONTEXT_WINDOW = 80;
const AMBIGUOUS_SHORT_VARIATIONS = new Set(['go', 'r', 'next', 'ml', 'ai', 'js', 'ts', 'pm', 'bi']);
const GENERIC_CANDIDATE_PHRASES = new Set([
  'experience',
  'skills',
  'knowledge',
  'responsibilities',
  'responsibility',
  'expertise',
  'technology',
  'technologies',
  'development',
  'engineering',
  'software',
]);
const STOPWORD_TOKENS = new Set([
  'and',
  'or',
  'with',
  'without',
  'in',
  'of',
  'for',
  'to',
  'the',
  'a',
  'an',
]);

const LANGUAGE_KEYWORDS = new Set([
  'english',
  'swedish',
  'spanish',
  'german',
  'french',
  'italian',
  'portuguese',
  'arabic',
  'hindi',
  'mandarin',
  'japanese',
  'korean',
  'norwegian',
  'danish',
  'finnish',
]);

const SOFT_SKILL_KEYWORDS = new Set([
  'communication',
  'leadership',
  'collaboration',
  'teamwork',
  'problem solving',
  'stakeholder management',
  'critical thinking',
  'presentation',
  'mentoring',
]);

const CERTIFICATION_KEYWORDS = ['certification', 'certified', 'certificate', 'iso', 'pmp'];

const TOOL_KEYWORDS = [
  'jira',
  'figma',
  'docker',
  'kubernetes',
  'aws',
  'azure',
  'gcp',
  'github',
  'gitlab',
  'jenkins',
  'tableau',
  'power bi',
  'excel',
  'salesforce',
  'sap',
  'notion',
  'slack',
  'postgresql',
  'mysql',
  'mongodb',
  'redis',
  'react',
  'typescript',
  'python',
  'java',
  'node',
  'next.js',
  'nextjs',
];

export const CvImportContextSchema = z.enum(['cv', 'jd', 'general']);

export const CvImportCategorySchema = z.enum([
  'technical',
  'soft_skills',
  'tools_technologies',
  'languages',
  'certifications',
  'other',
]);

export const CvImportDocumentSchema = z.object({
  document_id: z.string().min(1).max(128),
  file_name: z.string().min(1).max(260),
  text: z.string().min(1),
  context: CvImportContextSchema.default('cv'),
});

export const CvImportSuggestRequestSchema = z.object({
  documents: z.array(CvImportDocumentSchema).min(1),
  suggestions_limit: z.number().int().min(5).max(10).optional(),
});

export const CvImportSuggestionSchema = z.object({
  skill_id: z.string(),
  skill_name: z.string(),
  match_method: z.enum(['exact', 'synonym', 'fuzzy', 'semantic']),
  score: z.number().min(0).max(1),
});

export const CvImportCandidateSchema = z.object({
  candidate_id: z.string(),
  raw_skill_text: z.string(),
  category: CvImportCategorySchema,
  evidence_snippets: z.array(z.string()).min(1).max(3),
  confidence: z.number().min(0).max(1),
  suggestions: z.array(CvImportSuggestionSchema),
  unmapped_candidate: z.boolean(),
  already_in_profile: z.boolean().optional(),
});

export const CvImportDocumentResultSchema = z.object({
  document_id: z.string(),
  file_name: z.string(),
  context: CvImportContextSchema,
  parsed_text: z.string().default(''),
  parse_error: z.string().optional().nullable(),
  parse_error_code: z.string().optional().nullable(),
  candidate_count: z.number().int().min(0),
  candidates: z.array(CvImportCandidateSchema),
});

export const CvImportSuggestResponseSchema = z.object({
  documents: z.array(CvImportDocumentResultSchema),
  metadata: z.object({
    semantic_used: z.boolean(),
    semantic_fallback_triggered: z.boolean(),
    fallback_stage: z
      .enum([
        'none',
        'python_multipart_failed',
        'python_json_retry',
        'typescript_retry',
        'candidate_only',
      ])
      .optional(),
    candidate_only_fallback_triggered: z.boolean().optional(),
    match_dependency_error_code: z.string().optional(),
    unmapped_candidates_count: z.number().int().min(0),
    limits: z.object({
      max_documents: z.number().int().positive(),
      max_chars_per_document: z.number().int().positive(),
      max_total_chars: z.number().int().positive(),
    }),
    ai_provider: z.literal('gemini').optional(),
    ai_model: z.string().optional().nullable(),
    ai_key_slot: z.enum(['primary', 'secondary']).optional().nullable(),
    ai_fallback_reason: z.string().optional().nullable(),
    ai_schema_mode: z.string().optional(),
    cost_ore: z.number().int().min(0).optional(),
    currency: z.literal('SEK').optional(),
    idempotency_key: z.string().optional(),
    timings: z
      .object({
        extract_ms: z.number().int().min(0).optional(),
        shortlist_ms: z.number().int().min(0).optional(),
        gemini_ms: z.number().int().min(0).optional(),
        total_ms: z.number().int().min(0).optional(),
      })
      .optional(),
    quality: z
      .object({
        mapped_ratio: z.number().min(0).max(1),
        skills_mapped_after_rerank: z.number().int().min(0).optional(),
        evidence_valid_ratio: z.number().min(0).max(1),
        high_confidence_count: z.number().int().min(0),
        confidence_tiers: z.object({
          high: z.number().int().min(0),
          medium: z.number().int().min(0),
          low: z.number().int().min(0),
        }),
        avg_skills_per_document: z.number().min(0),
        cost_per_mapped_skill_ore: z.number().int().min(0).optional(),
      })
      .optional(),
    review_hints: z
      .object({
        skills_first: z.boolean().optional(),
        recommended_action: z.string().optional(),
        quick_apply_label: z.string().optional(),
      })
      .optional(),
    engine_mode: z.enum(['auto', 'typescript', 'python', 'gemini']).optional(),
    engine_used: z.enum(['python', 'typescript', 'gemini']).optional(),
  }),
});

export type CvImportContext = z.infer<typeof CvImportContextSchema>;
export type CvImportSuggestRequest = z.infer<typeof CvImportSuggestRequestSchema>;
export type CvImportSuggestResponse = z.infer<typeof CvImportSuggestResponseSchema>;
export type CvImportCandidate = z.infer<typeof CvImportCandidateSchema>;

export interface CvImportLimits {
  maxDocuments: number;
  maxCharsPerDocument: number;
  maxTotalChars: number;
}

interface SuggestionOptions {
  suggestionsLimit?: number;
  semanticEnabled?: boolean;
  semanticTimeoutMs?: number;
  semanticPoolLimit?: number;
  fuzzyThreshold?: number;
  semanticThreshold?: number;
}

interface SuggestionRuntimeState {
  semanticUsed: boolean;
  semanticFallbackTriggered: boolean;
  matchDependencyErrorCode?: string;
  candidateEmbeddings: Map<string, number[]>;
}

interface TaxonomySkill {
  skillId: string;
  skillName: string;
  normalizedName: string;
  normalizedAliases: string[];
  embedding: number[] | null;
}

interface TaxonomyCache {
  loadedAt: number;
  semanticCapable: boolean;
  matchDependencyErrorCode?: string;
  skills: TaxonomySkill[];
  byName: Map<string, TaxonomySkill[]>;
  byAlias: Map<string, TaxonomySkill[]>;
}

let taxonomyCache: TaxonomyCache | null = null;

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9+.#\-\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function clamp(value: number, min = 0, max = 1): number {
  return Math.max(min, Math.min(max, value));
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildEvidenceRegex(variation: string): RegExp {
  const parts = variation.trim().split(/\s+/).filter(Boolean).map(escapeRegex);
  const joinedPattern = parts.join('\\s+');

  // We cannot rely on \b for skills like C++, C#, and CI/CD.
  return new RegExp(`(?<![a-z0-9])${joinedPattern}(?![a-z0-9])`, 'gi');
}

function hasAtLeastOneAlpha(value: string): boolean {
  return /[a-z]/i.test(value);
}

function splitCompositeCandidate(rawSkillText: string): string[] {
  const trimmed = rawSkillText.trim();
  if (!trimmed) {
    return [];
  }

  const splitTokens = trimmed
    .split(/\s*(?:,|;|\||\band\b|\bor\b)\s*/gi)
    .map((segment) => segment.trim())
    .filter(Boolean);

  if (splitTokens.length <= 1) {
    return [trimmed];
  }

  const cleanedSegments = splitTokens.filter(
    (segment) => !/^\d+$/.test(segment) && hasAtLeastOneAlpha(segment)
  );
  return cleanedSegments.length > 0 ? cleanedSegments : [trimmed];
}

function sanitizeCandidateText(rawSkillText: string): string {
  return rawSkillText
    .replace(/^\d+\+?\s*(?:years?|months?)\s+of\s+experience\s+(?:in|with)\s+/i, '')
    .replace(/^(?:of\s+experience|experience)\s+(?:in|with)\s+/i, '')
    .replace(/\s+for\s+side\s+projects?$/i, '')
    .replace(/\s+in\s+side\s+projects?$/i, '')
    .trim();
}

function isUsefulEvidenceVariation(variation: string, rawSkillText: string): boolean {
  const trimmed = variation.trim();
  if (trimmed.length < 2) {
    return false;
  }

  const normalized = normalizeText(trimmed);
  if (!normalized) {
    return false;
  }

  if (normalized === normalizeText(rawSkillText)) {
    return true;
  }

  if (normalized.length <= 2) {
    return false;
  }

  if (AMBIGUOUS_SHORT_VARIATIONS.has(normalized)) {
    return normalized === normalizeText(rawSkillText);
  }

  return true;
}

function buildEvidenceVariations(rawSkillText: string): string[] {
  const candidateVariations = [rawSkillText, ...getSkillVariations(rawSkillText)];
  const unique = new Map<string, string>();

  for (const variation of candidateVariations) {
    const trimmed = variation.trim();
    const normalized = normalizeText(trimmed);
    if (!normalized || unique.has(normalized)) {
      continue;
    }
    if (!isUsefulEvidenceVariation(trimmed, rawSkillText)) {
      continue;
    }
    unique.set(normalized, trimmed);
  }

  return Array.from(unique.values()).sort((a, b) => b.length - a.length);
}

function parseAliases(rawAliases: unknown): string[] {
  if (!rawAliases) {
    return [];
  }

  if (Array.isArray(rawAliases)) {
    return rawAliases
      .map((entry) => {
        if (typeof entry === 'string') {
          return entry;
        }
        if (entry && typeof entry === 'object' && 'en' in entry) {
          const maybe = (entry as { en?: unknown }).en;
          return typeof maybe === 'string' ? maybe : null;
        }
        return null;
      })
      .filter((entry): entry is string => Boolean(entry && entry.trim()));
  }

  if (typeof rawAliases === 'object' && rawAliases !== null) {
    const maybe = (rawAliases as { en?: unknown }).en;
    if (Array.isArray(maybe)) {
      return maybe.filter(
        (entry): entry is string => typeof entry === 'string' && entry.length > 0
      );
    }
  }

  return [];
}

function inferCategory(skillText: string): z.infer<typeof CvImportCategorySchema> {
  const normalized = normalizeText(skillText);

  if (!normalized) {
    return 'other';
  }

  if (LANGUAGE_KEYWORDS.has(normalized)) {
    return 'languages';
  }

  if (SOFT_SKILL_KEYWORDS.has(normalized)) {
    return 'soft_skills';
  }

  if (CERTIFICATION_KEYWORDS.some((keyword) => normalized.includes(keyword))) {
    return 'certifications';
  }

  if (TOOL_KEYWORDS.some((keyword) => normalized.includes(keyword))) {
    return 'tools_technologies';
  }

  if (normalized.includes('programming') || normalized.includes('engineering')) {
    return 'technical';
  }

  return 'other';
}

function isLikelySkillCandidate(rawSkillText: string): boolean {
  const trimmed = rawSkillText.trim();
  if (!trimmed || trimmed.length > MAX_CANDIDATE_TEXT_LENGTH) {
    return false;
  }

  const normalized = normalizeText(trimmed);
  if (!normalized) {
    return false;
  }

  if (!hasAtLeastOneAlpha(normalized)) {
    return false;
  }

  if (GENERIC_CANDIDATE_PHRASES.has(normalized)) {
    return false;
  }

  const tokens = normalized.split(' ').filter(Boolean);
  if (tokens.length === 0 || tokens.length > MAX_CANDIDATE_TOKENS) {
    return false;
  }

  const nonStopwordTokens = tokens.filter((token) => !STOPWORD_TOKENS.has(token));
  if (nonStopwordTokens.length === 0) {
    return false;
  }

  const noisePrefixes = [
    'experience in',
    'experience with',
    'worked with',
    'worked on',
    'knowledge of',
    'knowledge in',
    'responsible for',
  ];

  return !noisePrefixes.some((prefix) => normalized.startsWith(prefix));
}

function extractEvidenceSnippets(text: string, rawSkillText: string): string[] {
  const variations = buildEvidenceVariations(rawSkillText);
  const snippets = new Set<string>();

  for (const variation of variations) {
    const regex = buildEvidenceRegex(variation);
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      const start = Math.max(0, match.index - EVIDENCE_CONTEXT_WINDOW);
      const end = Math.min(text.length, match.index + match[0].length + EVIDENCE_CONTEXT_WINDOW);
      const snippet = text.slice(start, end).trim();

      if (snippet.length > 0) {
        snippets.add(snippet);
      }

      if (snippets.size >= 3) {
        return Array.from(snippets).slice(0, 3);
      }
    }
  }

  return Array.from(snippets).slice(0, 3);
}

function levenshteinDistance(a: string, b: string): number {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const matrix: number[][] = Array.from({ length: rows }, () => Array(cols).fill(0));

  for (let i = 0; i < rows; i++) {
    matrix[i][0] = i;
  }

  for (let j = 0; j < cols; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i < rows; i++) {
    for (let j = 1; j < cols; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  return matrix[a.length][b.length];
}

function calculateFuzzyScore(a: string, b: string): number {
  if (!a || !b) {
    return 0;
  }

  if (a === b) {
    return 1;
  }

  const aIsSingleToken = !a.includes(' ');
  const bIsSingleToken = !b.includes(' ');

  if (a.includes(b) || b.includes(a)) {
    const shorter = a.length <= b.length ? a : b;
    const longer = a.length > b.length ? a : b;
    const shorterTokens = shorter.split(' ').filter(Boolean);
    const longerTokens = longer.split(' ').filter(Boolean);

    const hasTokenSequenceContainment =
      shorterTokens.length === 1
        ? longerTokens.includes(shorterTokens[0] || '')
        : longerTokens.some((_, startIndex) =>
            shorterTokens.every((token, offset) => longerTokens[startIndex + offset] === token)
          );

    // Avoid high scores for substring-only overlaps like "py" in "jupyter" and "ts" in "environments".
    if (!hasTokenSequenceContainment) {
      return clamp(1 - levenshteinDistance(a, b) / Math.max(a.length, b.length));
    }

    if (aIsSingleToken && bIsSingleToken) {
      const prefixOverlap = longer.startsWith(shorter);
      const normalizedPrefixOverlap = shorter.length / longer.length;

      // Avoid very short substring boosts like "py" in "jupyter".
      if (!prefixOverlap || normalizedPrefixOverlap < 0.9) {
        return clamp(1 - levenshteinDistance(a, b) / Math.max(a.length, b.length));
      }
    } else {
      return 0.9;
    }
  }

  const lev = 1 - levenshteinDistance(a, b) / Math.max(a.length, b.length);
  const aTokens = new Set(a.split(' ').filter(Boolean));
  const bTokens = new Set(b.split(' ').filter(Boolean));

  const intersectionCount = Array.from(aTokens).filter((token) => bTokens.has(token)).length;
  const tokenScore = intersectionCount / Math.max(aTokens.size || 1, bTokens.size || 1);

  return clamp(Math.max(lev, tokenScore));
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, errorMessage: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(errorMessage)), timeoutMs);

    promise
      .then((result) => {
        clearTimeout(timer);
        resolve(result);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

function isEmbeddingDependencyError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();
  const indicators = [
    'embedding',
    'vector',
    'pgvector',
    'operator does not exist',
    'undefined function',
    'column',
    'does not exist',
  ];

  return indicators.some((indicator) => message.includes(indicator));
}

async function queryTaxonomyRows(includeEmbedding: boolean) {
  if (includeEmbedding) {
    const rows = await db
      .select({
        code: skillsTaxonomy.code,
        nameI18n: skillsTaxonomy.nameI18n,
        aliasesI18n: skillsTaxonomy.aliasesI18n,
        embedding: skillsTaxonomy.embedding,
      })
      .from(skillsTaxonomy)
      .where(and(eq(skillsTaxonomy.status, 'active')));

    return rows.map((row) => ({
      code: row.code,
      nameI18n: row.nameI18n,
      aliasesI18n: row.aliasesI18n,
      embedding: row.embedding,
    }));
  }

  const rows = await db
    .select({
      code: skillsTaxonomy.code,
      nameI18n: skillsTaxonomy.nameI18n,
      aliasesI18n: skillsTaxonomy.aliasesI18n,
    })
    .from(skillsTaxonomy)
    .where(and(eq(skillsTaxonomy.status, 'active')));

  return rows.map((row) => ({
    code: row.code,
    nameI18n: row.nameI18n,
    aliasesI18n: row.aliasesI18n,
    embedding: undefined,
  }));
}

async function loadTaxonomy(): Promise<TaxonomyCache> {
  if (taxonomyCache && Date.now() - taxonomyCache.loadedAt < TAXONOMY_CACHE_TTL_MS) {
    return taxonomyCache;
  }

  let rows: Array<{
    code: string;
    nameI18n: unknown;
    aliasesI18n: unknown;
    embedding?: unknown;
  }> = [];
  let semanticCapable = true;
  let matchDependencyErrorCode: string | undefined;

  try {
    rows = await queryTaxonomyRows(true);
  } catch (error) {
    if (!isEmbeddingDependencyError(error)) {
      throw error;
    }

    semanticCapable = false;
    matchDependencyErrorCode = 'TAXONOMY_EMBEDDING_UNAVAILABLE';
    rows = await queryTaxonomyRows(false);
  }

  const skills: TaxonomySkill[] = rows
    .map((row) => {
      const skillName = ((row.nameI18n as { en?: string } | null)?.en || '').trim();
      if (!skillName) {
        return null;
      }

      const normalizedName = normalizeTaxonomyComparison(skillName);
      const normalizedAliases = parseAliases(row.aliasesI18n)
        .map((alias) => normalizeTaxonomyComparison(alias))
        .filter(Boolean);
      const embedding =
        semanticCapable && Array.isArray(row.embedding) ? (row.embedding as number[]) : null;

      return {
        skillId: row.code,
        skillName,
        normalizedName,
        normalizedAliases,
        embedding,
      };
    })
    .filter((skill): skill is TaxonomySkill => Boolean(skill));

  const byName = new Map<string, TaxonomySkill[]>();
  const byAlias = new Map<string, TaxonomySkill[]>();

  for (const skill of skills) {
    const byNameBucket = byName.get(skill.normalizedName) || [];
    byNameBucket.push(skill);
    byName.set(skill.normalizedName, byNameBucket);

    for (const alias of skill.normalizedAliases) {
      const byAliasBucket = byAlias.get(alias) || [];
      byAliasBucket.push(skill);
      byAlias.set(alias, byAliasBucket);
    }
  }

  taxonomyCache = {
    loadedAt: Date.now(),
    semanticCapable,
    matchDependencyErrorCode,
    skills,
    byName,
    byAlias,
  };

  return taxonomyCache;
}

function extractCandidates(
  text: string
): Array<Omit<CvImportCandidate, 'candidate_id' | 'suggestions' | 'unmapped_candidate'>> {
  const deterministicCandidates = extractLocalSkillCandidates(text, {
    maxCandidates: MAX_CANDIDATES_PER_DOCUMENT,
  });
  const groundedCandidateKeys = new Set(
    deterministicCandidates
      .map((candidate) => normalizeText(candidate.raw_skill_text))
      .filter(Boolean)
  );
  const phraseResult = extractSkillPhrases(text);
  const candidatesMap = new Map<
    string,
    Omit<CvImportCandidate, 'candidate_id' | 'suggestions' | 'unmapped_candidate'>
  >();

  for (const deterministic of deterministicCandidates) {
    const normalized = normalizeText(deterministic.raw_skill_text);
    if (!normalized) {
      continue;
    }

    candidatesMap.set(normalized, {
      raw_skill_text: deterministic.raw_skill_text,
      category: deterministic.category,
      evidence_snippets: deterministic.evidence_snippets.slice(0, 3),
      confidence: deterministic.confidence,
    });
  }

  for (const phrase of phraseResult.phrases) {
    if (phrase.type !== 'skill' && phrase.type !== 'experience') {
      continue;
    }

    const sanitized = sanitizeCandidateText(phrase.text);
    const splitCandidates = splitCompositeCandidate(sanitized);
    const confidencePenalty = splitCandidates.length > 1 ? 0.03 : 0;

    for (const rawSkillText of splitCandidates) {
      if (rawSkillText.length < 2) {
        continue;
      }

      if (!isLikelySkillCandidate(rawSkillText)) {
        continue;
      }

      const evidenceSnippets = extractEvidenceSnippets(text, rawSkillText);
      if (evidenceSnippets.length === 0) {
        continue;
      }

      const normalized = normalizeText(rawSkillText);
      if (!normalized) {
        continue;
      }

      const confidence = clamp((phrase.confidence || 0.5) - confidencePenalty);
      const category = inferCategory(rawSkillText);
      const hasGroundedDeterministicMatch = groundedCandidateKeys.has(normalized);

      if (!hasGroundedDeterministicMatch && confidence < 0.5) {
        continue;
      }

      if (!hasGroundedDeterministicMatch && category === 'other' && confidence < 0.7) {
        continue;
      }

      const existing = candidatesMap.get(normalized);

      if (!existing || confidence > existing.confidence) {
        candidatesMap.set(normalized, {
          raw_skill_text: rawSkillText,
          category,
          evidence_snippets: evidenceSnippets,
          confidence,
        });
        continue;
      }

      const mergedSnippets = Array.from(
        new Set([...existing.evidence_snippets, ...evidenceSnippets])
      ).slice(0, 3);
      existing.evidence_snippets = mergedSnippets;
    }
  }

  return Array.from(candidatesMap.values())
    .map((candidate) => {
      const evidenceQuality = computeEvidenceQuality(
        candidate.raw_skill_text,
        candidate.evidence_snippets
      );
      return {
        ...candidate,
        confidence: clamp(candidate.confidence * 0.82 + evidenceQuality * 0.18),
      };
    })
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, MAX_CANDIDATES_PER_DOCUMENT);
}

function upsertSuggestion(
  suggestionMap: Map<string, z.infer<typeof CvImportSuggestionSchema>>,
  incoming: z.infer<typeof CvImportSuggestionSchema>
) {
  const current = suggestionMap.get(incoming.skill_id);
  if (!current) {
    suggestionMap.set(incoming.skill_id, incoming);
    return;
  }

  const methodRank: Record<z.infer<typeof CvImportSuggestionSchema>['match_method'], number> = {
    exact: 4,
    synonym: 3,
    fuzzy: 2,
    semantic: 1,
  };

  const incomingRank = methodRank[incoming.match_method];
  const currentRank = methodRank[current.match_method];

  if (
    incomingRank > currentRank ||
    (incomingRank === currentRank && incoming.score > current.score)
  ) {
    suggestionMap.set(incoming.skill_id, incoming);
  }
}

async function matchCandidate(
  candidateText: string,
  taxonomy: TaxonomyCache,
  options: Required<SuggestionOptions>,
  runtimeState: SuggestionRuntimeState
): Promise<z.infer<typeof CvImportSuggestionSchema>[]> {
  const normalizedCandidate = normalizeTaxonomyComparison(candidateText);
  if (!normalizedCandidate) {
    return [];
  }

  const suggestionMap = new Map<string, z.infer<typeof CvImportSuggestionSchema>>();

  const exactMatches = taxonomy.byName.get(normalizedCandidate) || [];
  for (const skill of exactMatches) {
    upsertSuggestion(suggestionMap, {
      skill_id: skill.skillId,
      skill_name: skill.skillName,
      match_method: 'exact',
      score: 1,
    });
  }

  const synonymMatches = taxonomy.byAlias.get(normalizedCandidate) || [];
  for (const skill of synonymMatches) {
    upsertSuggestion(suggestionMap, {
      skill_id: skill.skillId,
      skill_name: skill.skillName,
      match_method: 'synonym',
      score: 0.95,
    });
  }

  const fuzzyPoolForSemantic: Array<{ skill: TaxonomySkill; score: number }> = [];

  for (const skill of taxonomy.skills) {
    let bestScore = calculateFuzzyScore(normalizedCandidate, skill.normalizedName);

    for (const alias of skill.normalizedAliases) {
      const aliasScore = calculateFuzzyScore(normalizedCandidate, alias);
      if (aliasScore > bestScore) {
        bestScore = aliasScore;
      }
    }

    fuzzyPoolForSemantic.push({ skill, score: bestScore });

    if (bestScore >= options.fuzzyThreshold) {
      upsertSuggestion(suggestionMap, {
        skill_id: skill.skillId,
        skill_name: skill.skillName,
        match_method: 'fuzzy',
        score: clamp(bestScore),
      });
    }
  }

  if (options.semanticEnabled) {
    const minSemanticPoolScore = Math.max(options.fuzzyThreshold - 0.2, 0.35);
    const sortedFuzzyPool = [...fuzzyPoolForSemantic].sort((a, b) => b.score - a.score);
    const semanticPoolCandidates = sortedFuzzyPool
      .filter((match, index) => match.score >= minSemanticPoolScore || index < 25)
      .slice(0, options.semanticPoolLimit);

    const semanticPoolById = new Map<string, TaxonomySkill>();

    for (const skill of [...exactMatches, ...synonymMatches]) {
      if (Array.isArray(skill.embedding) && skill.embedding.length > 0) {
        semanticPoolById.set(skill.skillId, skill);
      }
    }

    for (const match of semanticPoolCandidates) {
      const { skill } = match;
      if (Array.isArray(skill.embedding) && skill.embedding.length > 0) {
        semanticPoolById.set(skill.skillId, skill);
      }
    }

    const semanticPool = Array.from(semanticPoolById.values());

    if (semanticPool.length > 0) {
      runtimeState.semanticUsed = true;

      try {
        let candidateEmbedding = runtimeState.candidateEmbeddings.get(normalizedCandidate);
        if (!candidateEmbedding) {
          candidateEmbedding = await withTimeout(
            generateEmbedding(candidateText),
            options.semanticTimeoutMs,
            'semantic timeout'
          );
          runtimeState.candidateEmbeddings.set(normalizedCandidate, candidateEmbedding);
        }

        const candidateDimensions = candidateEmbedding.length;

        for (const skill of semanticPool) {
          if (!skill.embedding || skill.embedding.length !== candidateDimensions) {
            continue;
          }

          const semanticScoreRaw = cosineSimilarity(candidateEmbedding, skill.embedding);
          const semanticScore = clamp((semanticScoreRaw + 1) / 2);

          if (semanticScore >= options.semanticThreshold) {
            upsertSuggestion(suggestionMap, {
              skill_id: skill.skillId,
              skill_name: skill.skillName,
              match_method: 'semantic',
              score: semanticScore,
            });
          }
        }
      } catch {
        runtimeState.semanticFallbackTriggered = true;
      }
    }
  }

  const methodRank: Record<z.infer<typeof CvImportSuggestionSchema>['match_method'], number> = {
    exact: 4,
    synonym: 3,
    fuzzy: 2,
    semantic: 1,
  };

  return Array.from(suggestionMap.values())
    .sort((a, b) => {
      const rankDiff = methodRank[b.match_method] - methodRank[a.match_method];
      if (rankDiff !== 0) {
        return rankDiff;
      }
      return b.score - a.score;
    })
    .slice(0, options.suggestionsLimit);
}

export async function suggestSkillsForDocuments(
  input: CvImportSuggestRequest,
  limits: CvImportLimits,
  options: SuggestionOptions = {}
): Promise<CvImportSuggestResponse> {
  const parsedInput = CvImportSuggestRequestSchema.parse(input);

  if (parsedInput.documents.length > limits.maxDocuments) {
    throw new Error(`Too many documents. Max allowed is ${limits.maxDocuments}.`);
  }

  const totalChars = parsedInput.documents.reduce((sum, document) => sum + document.text.length, 0);

  if (totalChars > limits.maxTotalChars) {
    throw new Error(`Total payload too large. Max allowed is ${limits.maxTotalChars} characters.`);
  }

  for (const document of parsedInput.documents) {
    if (document.text.length > limits.maxCharsPerDocument) {
      throw new Error(
        `Document ${document.file_name} exceeds max size (${limits.maxCharsPerDocument} characters).`
      );
    }
  }

  const resolvedOptions: Required<SuggestionOptions> = {
    suggestionsLimit:
      options.suggestionsLimit ?? parsedInput.suggestions_limit ?? DEFAULT_SUGGESTIONS_LIMIT,
    semanticEnabled: options.semanticEnabled ?? true,
    semanticTimeoutMs: options.semanticTimeoutMs ?? DEFAULT_SEMANTIC_TIMEOUT_MS,
    semanticPoolLimit: options.semanticPoolLimit ?? DEFAULT_SEMANTIC_FUZZY_POOL,
    fuzzyThreshold: options.fuzzyThreshold ?? DEFAULT_FUZZY_THRESHOLD,
    semanticThreshold: options.semanticThreshold ?? DEFAULT_SEMANTIC_THRESHOLD,
  };

  const taxonomy = await loadTaxonomy();
  const effectiveSemanticEnabled = resolvedOptions.semanticEnabled && taxonomy.semanticCapable;

  const runtimeState: SuggestionRuntimeState = {
    semanticUsed: false,
    semanticFallbackTriggered: resolvedOptions.semanticEnabled && !taxonomy.semanticCapable,
    matchDependencyErrorCode: taxonomy.matchDependencyErrorCode,
    candidateEmbeddings: new Map<string, number[]>(),
  };

  let unmappedCandidatesCount = 0;

  const documents = [] as CvImportSuggestResponse['documents'];

  for (const document of parsedInput.documents) {
    const extractedCandidates = extractCandidates(document.text);

    const candidates: CvImportCandidate[] = [];

    for (let candidateIndex = 0; candidateIndex < extractedCandidates.length; candidateIndex++) {
      const candidate = extractedCandidates[candidateIndex];
      const suggestions = await matchCandidate(
        candidate.raw_skill_text,
        taxonomy,
        {
          ...resolvedOptions,
          semanticEnabled: effectiveSemanticEnabled,
        },
        runtimeState
      );

      const candidateOutput: CvImportCandidate = {
        candidate_id: `${document.document_id}::${candidateIndex}`,
        raw_skill_text: candidate.raw_skill_text,
        category: candidate.category,
        evidence_snippets: candidate.evidence_snippets,
        confidence: candidate.confidence,
        suggestions,
        unmapped_candidate: suggestions.length === 0,
      };

      const atlasVerification = await verifyAtlasSkillCandidate({
        rawSkillText: candidateOutput.raw_skill_text,
        category: candidateOutput.category,
        evidenceSnippets: candidateOutput.evidence_snippets,
        suggestions: candidateOutput.suggestions,
        limit: resolvedOptions.suggestionsLimit,
      });

      candidateOutput.suggestions = atlasVerification.suggestions;
      candidateOutput.confidence = calibrateCandidateConfidence(candidateOutput);
      if (atlasVerification.forceUnmapped || shouldRejectWeakTopSuggestion(candidateOutput)) {
        candidateOutput.unmapped_candidate = true;
        candidateOutput.confidence = clamp(candidateOutput.confidence * 0.84);
      } else {
        candidateOutput.unmapped_candidate = candidateOutput.suggestions.length === 0;
      }

      if (candidateOutput.unmapped_candidate) {
        unmappedCandidatesCount += 1;
      }

      candidates.push(candidateOutput);
    }

    documents.push({
      document_id: document.document_id,
      file_name: document.file_name,
      context: document.context,
      parsed_text: document.text,
      parse_error: null,
      parse_error_code: null,
      candidate_count: candidates.length,
      candidates,
    });
  }

  return CvImportSuggestResponseSchema.parse({
    documents,
    metadata: {
      semantic_used: runtimeState.semanticUsed,
      semantic_fallback_triggered: runtimeState.semanticFallbackTriggered,
      fallback_stage: 'none',
      candidate_only_fallback_triggered: false,
      match_dependency_error_code: runtimeState.matchDependencyErrorCode,
      unmapped_candidates_count: unmappedCandidatesCount,
      limits: {
        max_documents: limits.maxDocuments,
        max_chars_per_document: limits.maxCharsPerDocument,
        max_total_chars: limits.maxTotalChars,
      },
    },
  });
}
