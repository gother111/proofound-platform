import { createHash } from 'node:crypto';
import { inArray, sql } from 'drizzle-orm';

import { db } from '@/db';
import { skillsCategories } from '@/db/schema';
import { getRows } from '@/lib/db/rows';
import { extractSkillPhrases } from '@/lib/ai/nlp-extractor';
import {
  resolveGeminiTaxonomyShortlistConcurrency,
  resolveGeminiTaxonomyShortlistCacheTtlMs,
  resolveGeminiTaxonomyShortlistDocumentTimeoutMs,
  resolveGeminiTaxonomyShortlistMaxEntries,
  resolveGeminiTaxonomyShortlistMaxTokens,
  resolveGeminiTaxonomyShortlistQueryTimeoutMs,
  resolveGeminiTaxonomyShortlistSeedLimit,
  resolveGeminiTaxonomyVersion,
} from '@/lib/expertise/gemini/config';
import type { GeminiSourceDocument } from '@/lib/expertise/gemini/skill-extractor';

export type TaxonomyShortlistCategory =
  | 'technical'
  | 'soft_skills'
  | 'tools_technologies'
  | 'languages'
  | 'certifications'
  | 'other';

export type TaxonomyShortlistSkill = {
  skill_id: string;
  skill_name: string;
  aliases: string[];
  category: TaxonomyShortlistCategory;
  relevance_score: number;
  seed_hits: number;
};

type SearchSkillShortlistRow = {
  code: string;
  name_i18n: { en?: string } | null;
  aliases_i18n: unknown;
  cat_id: number | string | null;
  relevance_score: number | string | null;
};

type CategoryRow = {
  catId: number;
  slug: string;
  nameI18n: { en?: string } | null;
};

const SEED_STOPWORDS = new Set([
  'and',
  'or',
  'with',
  'without',
  'for',
  'from',
  'using',
  'use',
  'used',
  'work',
  'worked',
  'experience',
  'experiences',
  'skills',
  'knowledge',
  'proficient',
  'responsibilities',
  'responsibility',
  'development',
  'engineering',
  'software',
  'team',
  'project',
  'projects',
]);

const shortlistCache = new Map<string, { expiresAt: number; value: TaxonomyShortlistSkill[] }>();

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error('taxonomy shortlist query timed out')),
      timeoutMs
    );
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

function asNumber(value: unknown): number {
  if (typeof value === 'number') {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function clamp(value: number, min = 0, max = 1): number {
  return Math.max(min, Math.min(max, value));
}

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9+.#/\-\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeSeed(value: string): string {
  return normalizeText(value)
    .replace(/\b\d+\+?\s*(?:years?|months?)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractInlineSkillLikeSegments(text: string): string[] {
  const segments: string[] = [];
  const lines = text.split(/\r?\n/);

  for (const line of lines) {
    const normalizedLine = line.trim();
    if (!normalizedLine || normalizedLine.length > 220) {
      continue;
    }
    if (
      normalizedLine.includes(',') ||
      normalizedLine.includes(';') ||
      normalizedLine.includes('|') ||
      normalizedLine.includes('•')
    ) {
      const pieces = normalizedLine
        .split(/[,;|•]+/g)
        .map((piece) => piece.trim())
        .filter((piece) => piece.length >= 2 && piece.length <= 80);
      segments.push(...pieces);
    }
  }

  return segments;
}

function extractNgramSeeds(text: string): string[] {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9+.#/\-\s]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length >= 2 && token.length <= 24)
    .slice(0, 800);

  const grams: string[] = [];
  for (let index = 0; index < words.length; index += 1) {
    const unigram = words[index];
    if (!SEED_STOPWORDS.has(unigram)) {
      grams.push(unigram);
    }

    if (index + 1 < words.length) {
      const bigram = `${words[index]} ${words[index + 1]}`;
      if (
        !SEED_STOPWORDS.has(words[index]) &&
        !SEED_STOPWORDS.has(words[index + 1]) &&
        bigram.length <= 48
      ) {
        grams.push(bigram);
      }
    }

    if (index + 2 < words.length) {
      const trigram = `${words[index]} ${words[index + 1]} ${words[index + 2]}`;
      if (
        !SEED_STOPWORDS.has(words[index]) &&
        !SEED_STOPWORDS.has(words[index + 1]) &&
        !SEED_STOPWORDS.has(words[index + 2]) &&
        trigram.length <= 62
      ) {
        grams.push(trigram);
      }
    }
  }

  return grams;
}

function buildSeedList(text: string): string[] {
  const nlp = extractSkillPhrases(text);
  const phraseSeeds = nlp.phrases.map((entry) => entry.text);
  const inlineSegments = extractInlineSkillLikeSegments(text);
  const ngrams = extractNgramSeeds(text);
  const rawSeeds = [...phraseSeeds, ...inlineSegments, ...ngrams];

  const scored = new Map<string, number>();
  for (const raw of rawSeeds) {
    const normalized = normalizeSeed(raw);
    if (!normalized || normalized.length < 2 || normalized.length > 80) {
      continue;
    }

    const tokens = normalized.split(' ');
    if (tokens.every((token) => SEED_STOPWORDS.has(token))) {
      continue;
    }

    const bonus =
      tokens.length === 1 ? 0.9 : tokens.length === 2 ? 1.25 : tokens.length === 3 ? 1.1 : 0.8;
    scored.set(normalized, (scored.get(normalized) || 0) + bonus);
  }

  const limit = resolveGeminiTaxonomyShortlistSeedLimit();
  return Array.from(scored.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([seed]) => seed);
}

async function searchTaxonomyForSeed(
  seed: string,
  resultLimit: number
): Promise<SearchSkillShortlistRow[]> {
  const result = await db.execute(sql`
    SELECT
      code,
      name_i18n,
      aliases_i18n,
      cat_id,
      relevance_score
    FROM public.search_skills_smart(${seed}, ${resultLimit})
    LIMIT ${resultLimit}
  `);

  return getRows(result) as SearchSkillShortlistRow[];
}

async function searchTaxonomyForSeedWithGuards(params: {
  seed: string;
  resultLimit: number;
  timeoutMs: number;
}): Promise<SearchSkillShortlistRow[]> {
  try {
    return await withTimeout(
      searchTaxonomyForSeed(params.seed, params.resultLimit),
      params.timeoutMs
    );
  } catch {
    return [];
  }
}

function parseAliases(value: unknown): string[] {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value
      .map((entry) => (typeof entry === 'string' ? entry.trim() : ''))
      .filter(Boolean)
      .slice(0, 6);
  }

  if (typeof value === 'object') {
    const payload = value as Record<string, unknown>;
    const english = payload.en;
    if (Array.isArray(english)) {
      return english
        .map((entry) => (typeof entry === 'string' ? entry.trim() : ''))
        .filter(Boolean)
        .slice(0, 6);
    }
  }

  return [];
}

function mapCategoryFromTaxonomyContext(context: string): TaxonomyShortlistCategory {
  const normalized = context.toLowerCase();
  if (normalized.includes('language')) {
    return 'languages';
  }
  if (normalized.includes('certificate') || normalized.includes('certification')) {
    return 'certifications';
  }
  if (
    normalized.includes('tool') ||
    normalized.includes('platform') ||
    normalized.includes('framework') ||
    normalized.includes('devops')
  ) {
    return 'tools_technologies';
  }
  if (
    normalized.includes('soft') ||
    normalized.includes('leadership') ||
    normalized.includes('communication') ||
    normalized.includes('management')
  ) {
    return 'soft_skills';
  }
  if (normalized.length === 0) {
    return 'other';
  }
  return 'technical';
}

function estimateTokens(entry: TaxonomyShortlistSkill): number {
  const aliasText = entry.aliases.join(', ');
  const chars =
    entry.skill_name.length + aliasText.length + entry.category.length + entry.skill_id.length;
  return Math.max(10, Math.ceil(chars / 4));
}

async function fetchCategoryContext(catIds: number[]): Promise<Map<number, string>> {
  if (catIds.length === 0) {
    return new Map();
  }

  const rows = (await db
    .select({
      catId: skillsCategories.catId,
      slug: skillsCategories.slug,
      nameI18n: skillsCategories.nameI18n,
    })
    .from(skillsCategories)
    .where(inArray(skillsCategories.catId, catIds))) as CategoryRow[];

  const map = new Map<number, string>();
  for (const row of rows) {
    const englishName = row.nameI18n?.en || '';
    map.set(row.catId, `${row.slug} ${englishName}`.trim());
  }
  return map;
}

export function buildTaxonomyShortlistCacheKey(params: {
  documentText: string;
  suggestionsLimit: number;
  taxonomyVersion: string;
}): string {
  return createHash('sha256')
    .update(`${params.taxonomyVersion}:${params.suggestionsLimit}:${params.documentText}`)
    .digest('hex');
}

async function buildShortlistForDocument(params: {
  document: GeminiSourceDocument;
  suggestionsLimit: number;
  taxonomyVersion: string;
}): Promise<TaxonomyShortlistSkill[]> {
  const cacheKey = buildTaxonomyShortlistCacheKey({
    documentText: params.document.text,
    suggestionsLimit: params.suggestionsLimit,
    taxonomyVersion: params.taxonomyVersion,
  });
  const now = Date.now();
  const cached = shortlistCache.get(cacheKey);
  if (cached && cached.expiresAt > now) {
    return cached.value;
  }

  const seeds = buildSeedList(params.document.text);
  if (seeds.length === 0) {
    return [];
  }

  const perSeedLimit = Math.max(4, Math.min(10, params.suggestionsLimit));
  const perSeedTimeoutMs = resolveGeminiTaxonomyShortlistQueryTimeoutMs();
  const documentTimeoutMs = resolveGeminiTaxonomyShortlistDocumentTimeoutMs();
  const maxConcurrency = Math.max(1, resolveGeminiTaxonomyShortlistConcurrency());
  const deadlineMs = now + documentTimeoutMs;
  const searchResults: SearchSkillShortlistRow[][] = Array.from({ length: seeds.length }, () => []);

  let seedIndex = 0;
  const workers = Array.from({ length: Math.min(maxConcurrency, seeds.length) }, async () => {
    while (seedIndex < seeds.length) {
      const currentIndex = seedIndex;
      seedIndex += 1;
      const seed = seeds[currentIndex];

      if (!seed) {
        continue;
      }

      if (Date.now() >= deadlineMs) {
        break;
      }

      searchResults[currentIndex] = await searchTaxonomyForSeedWithGuards({
        seed,
        resultLimit: perSeedLimit,
        timeoutMs: perSeedTimeoutMs,
      });
    }
  });
  await Promise.all(workers);

  const bySkillId = new Map<
    string,
    {
      skill_id: string;
      skill_name: string;
      aliases: string[];
      cat_id: number | null;
      relevance_score: number;
      seed_hits: number;
    }
  >();

  for (let index = 0; index < seeds.length; index += 1) {
    if (Date.now() >= deadlineMs) {
      break;
    }
    const seed = seeds[index];
    const rows = searchResults[index] || [];

    for (const row of rows) {
      const skillId = typeof row.code === 'string' ? row.code.trim() : '';
      if (!skillId) {
        continue;
      }
      const score = clamp(
        asNumber(row.relevance_score) > 1
          ? asNumber(row.relevance_score) / 130
          : asNumber(row.relevance_score)
      );
      const skillName =
        row.name_i18n && typeof row.name_i18n === 'object' && typeof row.name_i18n.en === 'string'
          ? row.name_i18n.en
          : skillId;
      const aliases = parseAliases(row.aliases_i18n);
      const catId = Number.isFinite(Number(row.cat_id)) ? Number(row.cat_id) : null;

      const existing = bySkillId.get(skillId);
      if (!existing) {
        bySkillId.set(skillId, {
          skill_id: skillId,
          skill_name: skillName,
          aliases,
          cat_id: catId,
          relevance_score: score,
          seed_hits: 1,
        });
        continue;
      }

      existing.relevance_score = Math.max(existing.relevance_score, score);
      existing.seed_hits += 1;
      if (existing.aliases.length < 6) {
        const merged = Array.from(new Set([...existing.aliases, ...aliases]));
        existing.aliases = merged.slice(0, 6);
      }
      if (!existing.cat_id && catId) {
        existing.cat_id = catId;
      }
      if (existing.skill_name === existing.skill_id && skillName !== skillId) {
        existing.skill_name = skillName;
      }
      bySkillId.set(skillId, existing);
    }
  }

  const catIds = Array.from(
    new Set(
      Array.from(bySkillId.values())
        .map((entry) => entry.cat_id)
        .filter((entry): entry is number => typeof entry === 'number')
    )
  );
  const categoryContext = await fetchCategoryContext(catIds);

  const sorted = Array.from(bySkillId.values())
    .sort((a, b) => {
      if (b.seed_hits !== a.seed_hits) {
        return b.seed_hits - a.seed_hits;
      }
      if (b.relevance_score !== a.relevance_score) {
        return b.relevance_score - a.relevance_score;
      }
      return a.skill_name.localeCompare(b.skill_name);
    })
    .map((entry) => {
      const categoryHint = entry.cat_id ? categoryContext.get(entry.cat_id) || '' : '';
      return {
        skill_id: entry.skill_id,
        skill_name: entry.skill_name,
        aliases: entry.aliases,
        category: mapCategoryFromTaxonomyContext(categoryHint),
        relevance_score: entry.relevance_score,
        seed_hits: entry.seed_hits,
      } as TaxonomyShortlistSkill;
    });

  const maxEntries = resolveGeminiTaxonomyShortlistMaxEntries();
  const maxTokens = resolveGeminiTaxonomyShortlistMaxTokens();
  let tokenBudget = 0;
  const shortlist: TaxonomyShortlistSkill[] = [];

  for (const entry of sorted) {
    if (shortlist.length >= maxEntries) {
      break;
    }
    const entryTokens = estimateTokens(entry);
    if (shortlist.length > 0 && tokenBudget + entryTokens > maxTokens) {
      break;
    }
    shortlist.push(entry);
    tokenBudget += entryTokens;
  }

  shortlistCache.set(cacheKey, {
    expiresAt: now + resolveGeminiTaxonomyShortlistCacheTtlMs(),
    value: shortlist,
  });

  return shortlist;
}

export async function buildTaxonomyShortlistsForDocuments(params: {
  documents: GeminiSourceDocument[];
  suggestionsLimit: number;
}): Promise<Map<string, TaxonomyShortlistSkill[]>> {
  const taxonomyVersion = resolveGeminiTaxonomyVersion();
  const shortlistByDocument = new Map<string, TaxonomyShortlistSkill[]>();

  const results = await Promise.all(
    params.documents.map(async (document) => {
      const shortlist = await buildShortlistForDocument({
        document,
        suggestionsLimit: params.suggestionsLimit,
        taxonomyVersion,
      });
      return { documentId: document.document_id, shortlist };
    })
  );

  for (const result of results) {
    shortlistByDocument.set(result.documentId, result.shortlist);
  }

  return shortlistByDocument;
}
