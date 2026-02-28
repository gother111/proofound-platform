const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;

export type CefrLevel = (typeof CEFR_LEVELS)[number];

export interface LegacyLanguageEntry {
  code?: unknown;
  level?: unknown;
}

export interface AtlasProfileSkillRow {
  skillCode?: string | null;
  skillId?: string | null;
  level?: number | null;
}

export interface AtlasLanguageTaxonomyRow {
  code: string;
  catId?: number | null;
  subcatId?: number | null;
  l3Id?: number | null;
  slug?: string | null;
  nameI18n?: unknown;
  tags?: unknown;
}

const CEFR_RANK: Record<CefrLevel, number> = {
  A1: 1,
  A2: 2,
  B1: 3,
  B2: 4,
  C1: 5,
  C2: 6,
};

const LANGUAGE_TOKEN_TO_CODE: Record<string, string> = {
  afrikaans: 'af',
  albanian: 'sq',
  amharic: 'am',
  arabic: 'ar',
  armenian: 'hy',
  basque: 'eu',
  bengali: 'bn',
  bosnian: 'bs',
  bulgarian: 'bg',
  burmese: 'my',
  catalan: 'ca',
  chinese: 'zh',
  croatian: 'hr',
  czech: 'cs',
  danish: 'da',
  dutch: 'nl',
  english: 'en',
  estonian: 'et',
  filipino: 'tl',
  finnish: 'fi',
  french: 'fr',
  galician: 'gl',
  georgian: 'ka',
  german: 'de',
  greek: 'el',
  hebrew: 'he',
  hindi: 'hi',
  hungarian: 'hu',
  icelandic: 'is',
  indonesian: 'id',
  irish: 'ga',
  italian: 'it',
  japanese: 'ja',
  kazakh: 'kk',
  khmer: 'km',
  korean: 'ko',
  lao: 'lo',
  latvian: 'lv',
  lithuanian: 'lt',
  macedonian: 'mk',
  malay: 'ms',
  marathi: 'mr',
  mongolian: 'mn',
  nepali: 'ne',
  norwegian: 'no',
  persian: 'fa',
  polish: 'pl',
  portuguese: 'pt',
  punjabi: 'pa',
  romanian: 'ro',
  russian: 'ru',
  serbian: 'sr',
  sinhala: 'si',
  slovak: 'sk',
  slovenian: 'sl',
  somali: 'so',
  spanish: 'es',
  swahili: 'sw',
  swedish: 'sv',
  tamil: 'ta',
  telugu: 'te',
  thai: 'th',
  turkish: 'tr',
  ukrainian: 'uk',
  urdu: 'ur',
  uzbek: 'uz',
  vietnamese: 'vi',
  welsh: 'cy',
  yoruba: 'yo',
  zulu: 'zu',
};

function normalizeToken(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-');
}

function toCefrLevel(value: unknown): CefrLevel | null {
  if (typeof value !== 'string') {
    return null;
  }
  const normalized = value.trim().toUpperCase();
  if ((CEFR_LEVELS as readonly string[]).includes(normalized)) {
    return normalized as CefrLevel;
  }
  return null;
}

function strongerLevel(current: CefrLevel | undefined, next: CefrLevel): CefrLevel {
  if (!current) {
    return next;
  }
  return CEFR_RANK[next] >= CEFR_RANK[current] ? next : current;
}

function parseTags(tags: unknown): string[] {
  if (!Array.isArray(tags)) {
    return [];
  }
  return tags
    .filter((tag): tag is string => typeof tag === 'string')
    .map((tag) => normalizeToken(tag))
    .filter(Boolean);
}

function extractEnglishName(nameI18n: unknown): string | null {
  if (!nameI18n || typeof nameI18n !== 'object') {
    return null;
  }
  const maybeEn = (nameI18n as { en?: unknown }).en;
  return typeof maybeEn === 'string' ? maybeEn : null;
}

function resolveLanguageCodeFromTaxonomy(row: AtlasLanguageTaxonomyRow): string | null {
  const tags = parseTags(row.tags);
  for (const token of tags) {
    if (token in LANGUAGE_TOKEN_TO_CODE) {
      return LANGUAGE_TOKEN_TO_CODE[token];
    }
  }

  const slug = typeof row.slug === 'string' ? normalizeToken(row.slug) : '';
  if (slug.endsWith('-language-proficiency')) {
    const token = slug.replace(/-language-proficiency$/, '');
    if (token in LANGUAGE_TOKEN_TO_CODE) {
      return LANGUAGE_TOKEN_TO_CODE[token];
    }
  }

  const englishName = extractEnglishName(row.nameI18n);
  if (englishName) {
    const nameToken = normalizeToken(englishName.replace(/\s+language\s+proficiency$/i, ''));
    if (nameToken in LANGUAGE_TOKEN_TO_CODE) {
      return LANGUAGE_TOKEN_TO_CODE[nameToken];
    }
  }

  return null;
}

function isNaturalLanguageTaxonomy(row: AtlasLanguageTaxonomyRow): boolean {
  if (row.catId !== 4 || row.subcatId !== 105) {
    return false;
  }

  if (row.l3Id === 840) {
    return true;
  }

  const slug = typeof row.slug === 'string' ? normalizeToken(row.slug) : '';
  if (slug.includes('language-proficiency')) {
    return true;
  }

  const tags = parseTags(row.tags);
  return tags.includes('language') && tags.includes('cefr');
}

function skillLevelToCefr(level: number | null | undefined): CefrLevel {
  const safeLevel = Number.isFinite(level) ? Math.round(level as number) : 0;
  const clamped = Math.min(5, Math.max(0, safeLevel));
  return CEFR_LEVELS[clamped];
}

export function parseLegacyLanguageLevels(value: unknown): Record<string, CefrLevel> {
  if (!Array.isArray(value)) {
    return {};
  }

  const result: Record<string, CefrLevel> = {};
  for (const item of value as LegacyLanguageEntry[]) {
    const code = typeof item.code === 'string' ? item.code.trim().toLowerCase() : '';
    const level = toCefrLevel(item.level);
    if (!code || !level) {
      continue;
    }
    result[code] = strongerLevel(result[code], level);
  }

  return result;
}

export function deriveAtlasLanguageLevels(
  skillRows: AtlasProfileSkillRow[],
  taxonomyRows: AtlasLanguageTaxonomyRow[]
): Record<string, CefrLevel> {
  const taxonomyByCode = new Map(taxonomyRows.map((row) => [row.code, row]));
  const result: Record<string, CefrLevel> = {};

  for (const skill of skillRows) {
    const taxonomyCode = skill.skillCode || skill.skillId;
    if (!taxonomyCode) {
      continue;
    }

    const taxonomy = taxonomyByCode.get(taxonomyCode);
    if (!taxonomy || !isNaturalLanguageTaxonomy(taxonomy)) {
      continue;
    }

    const languageCode = resolveLanguageCodeFromTaxonomy(taxonomy);
    if (!languageCode) {
      continue;
    }

    const cefr = skillLevelToCefr(skill.level);
    result[languageCode] = strongerLevel(result[languageCode], cefr);
  }

  return result;
}

export function resolveLanguageLevel(
  requiredCode: string,
  atlasLevels: Record<string, CefrLevel>,
  legacyLevels: Record<string, CefrLevel>
): CefrLevel | null {
  const code = requiredCode.trim().toLowerCase();
  if (!code) {
    return null;
  }

  return atlasLevels[code] || legacyLevels[code] || null;
}
