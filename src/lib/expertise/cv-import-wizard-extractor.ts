import {
  CEFR_LEVELS,
  LANGUAGE_OPTIONS,
  type CEFRLevel,
  type TaxonomyItem,
} from '@/lib/taxonomy/data';
import {
  suggestSkillsForDocuments,
  type CvImportLimits,
  type CvImportCandidate,
  type CvImportSuggestResponse,
} from '@/lib/expertise/cv-import-suggest';
import { extractSkillPhrases } from '@/lib/ai/nlp-extractor';
import {
  CvImportWizardSuggestRequestSchema,
  CvImportWizardSuggestResponseSchema,
  type CvImportWizardLanguage,
  type CvImportWizardSuggestRequest,
  type CvImportWizardSuggestResponse,
} from '@/lib/expertise/cv-import-wizard-types';

type SectionType = 'work' | 'learning' | 'volunteering' | 'languages';

interface LineSlice {
  text: string;
  start: number;
  end: number;
}

interface BlockSlice {
  text: string;
  start: number;
  end: number;
}

interface WizardSuggestOptions {
  semanticEnabled?: boolean;
  suggestionsLimit?: number;
  skillSuggestionMode?: 'deterministic' | 'disabled';
}

const MAX_ITEMS_PER_ENTITY = 10;
const EVIDENCE_CONTEXT_WINDOW = 80;

const SECTION_HEADING_PATTERNS: Record<SectionType, RegExp[]> = {
  work: [
    /\bexperience\b/i,
    /\bwork\s+history\b/i,
    /\bemployment\b/i,
    /\bprofessional\s+experience\b/i,
    /\bcareer\s+history\b/i,
  ],
  learning: [
    /\beducation\b/i,
    /\blearning\b/i,
    /\bacademic\b/i,
    /\bcertifications?\b/i,
    /\btraining\b/i,
  ],
  volunteering: [
    /\bvolunteer(?:ing)?\b/i,
    /\bcommunity\s+service\b/i,
    /\bservice\b/i,
    /\bnon[-\s]?profit\b/i,
  ],
  languages: [/\blanguages?\b/i, /\blanguage\s+skills\b/i],
};

const DATE_RANGE_PATTERN =
  /(\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)?\s*\d{4}\s*[-–]\s*(?:present|current|now|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)?\s*\d{4})\b)|(\b\d{4}\s*[-–]\s*(?:present|current|\d{4})\b)/i;

const INSTITUTION_PATTERN =
  /\b(university|college|school|institute|academy|polytechnic|bootcamp|faculty)\b/i;
const DEGREE_PATTERN =
  /\b(bachelor|master|phd|doctorate|diploma|certificate|bootcamp|course|mba|msc|bsc|ba)\b/i;

const CEFR_RANK: Record<CEFRLevel, number> = {
  A1: 1,
  A2: 2,
  B1: 3,
  B2: 4,
  C1: 5,
  C2: 6,
};

const LANGUAGE_SYNONYMS: Record<string, string[]> = {
  en: ['english'],
  es: ['spanish', 'espanol'],
  fr: ['french'],
  de: ['german'],
  it: ['italian'],
  pt: ['portuguese'],
  zh: ['chinese', 'mandarin'],
  ja: ['japanese'],
  ko: ['korean'],
  ar: ['arabic'],
  hi: ['hindi'],
  ru: ['russian'],
  sv: ['swedish'],
  nl: ['dutch'],
  pl: ['polish'],
};

const FALLBACK_MAX_SKILL_CANDIDATES = 40;
const FALLBACK_STOPWORDS = new Set([
  'and',
  'or',
  'the',
  'a',
  'an',
  'with',
  'for',
  'in',
  'of',
  'to',
  'using',
  'experience',
  'skills',
  'knowledge',
]);
const FALLBACK_LANGUAGE_KEYWORDS = new Set([
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
]);
const FALLBACK_SOFT_SKILL_KEYWORDS = new Set([
  'communication',
  'leadership',
  'collaboration',
  'teamwork',
  'problem solving',
  'critical thinking',
  'stakeholder management',
]);
const FALLBACK_CERTIFICATION_KEYWORDS = ['certification', 'certified', 'certificate', 'iso', 'pmp'];
const FALLBACK_TOOL_KEYWORDS = [
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
const FALLBACK_DATE_PATTERN =
  /\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)?\s*\d{4}\b|(?:\b\d{4}\s*[-–]\s*(?:present|current|\d{4}))|(?:\d+\s*(?:years?|months?))/i;
const FALLBACK_SENTENCE_VERB_PATTERN =
  /\b(built|designed|led|delivered|implemented|optimized|coordinated|improved|managed)\b/i;

function normalizeSpace(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function splitLines(text: string): LineSlice[] {
  const lines = text.split(/\r?\n/);
  const slices: LineSlice[] = [];
  let cursor = 0;

  for (const line of lines) {
    const start = cursor;
    const end = start + line.length;
    slices.push({ text: line, start, end });
    cursor = end + 1;
  }

  return slices;
}

function headingTypeFromLine(line: string): SectionType | null {
  const trimmed = normalizeSpace(line).replace(/[:\-]+$/g, '');
  if (!trimmed || trimmed.length > 80) {
    return null;
  }

  for (const [sectionType, patterns] of Object.entries(SECTION_HEADING_PATTERNS) as Array<
    [SectionType, RegExp[]]
  >) {
    if (patterns.some((pattern) => pattern.test(trimmed))) {
      return sectionType;
    }
  }

  return null;
}

function detectSections(
  lines: LineSlice[]
): Partial<Record<SectionType, { start: number; end: number }>> {
  const headings: Array<{ type: SectionType; lineIndex: number }> = [];

  for (let index = 0; index < lines.length; index += 1) {
    const type = headingTypeFromLine(lines[index].text);
    if (!type) {
      continue;
    }
    headings.push({ type, lineIndex: index });
  }

  const sections: Partial<Record<SectionType, { start: number; end: number }>> = {};

  for (let index = 0; index < headings.length; index += 1) {
    const current = headings[index];
    const next = headings[index + 1];
    const start = current.lineIndex + 1;
    const end = next ? next.lineIndex : lines.length;

    if (start >= end) {
      continue;
    }

    if (!sections[current.type]) {
      sections[current.type] = { start, end };
    }
  }

  return sections;
}

function extractBlocks(
  lines: LineSlice[],
  range: { start: number; end: number } | null
): BlockSlice[] {
  if (!range) {
    return [];
  }

  const blocks: BlockSlice[] = [];
  let blockStart = -1;

  for (let index = range.start; index < range.end; index += 1) {
    const line = lines[index];
    const isEmpty = normalizeSpace(line.text).length === 0;

    if (!isEmpty && blockStart === -1) {
      blockStart = index;
      continue;
    }

    if (isEmpty && blockStart !== -1) {
      const blockLines = lines.slice(blockStart, index);
      const text = blockLines
        .map((entry) => entry.text)
        .join('\n')
        .trim();
      if (text) {
        blocks.push({
          text,
          start: blockLines[0].start,
          end: blockLines[blockLines.length - 1].end,
        });
      }
      blockStart = -1;
    }
  }

  if (blockStart !== -1) {
    const blockLines = lines.slice(blockStart, range.end);
    const text = blockLines
      .map((entry) => entry.text)
      .join('\n')
      .trim();
    if (text) {
      blocks.push({
        text,
        start: blockLines[0].start,
        end: blockLines[blockLines.length - 1].end,
      });
    }
  }

  return blocks;
}

function buildEvidenceSnippet(text: string, start: number, end: number): string[] {
  const snippetStart = Math.max(0, start - EVIDENCE_CONTEXT_WINDOW);
  const snippetEnd = Math.min(text.length, end + EVIDENCE_CONTEXT_WINDOW);
  const snippet = normalizeSpace(text.slice(snippetStart, snippetEnd));

  if (!snippet) {
    return [];
  }

  return [snippet];
}

function splitFirstLine(blockText: string): string {
  const [firstLine] = blockText.split(/\r?\n/);
  return normalizeSpace(firstLine || '');
}

function parseRoleAndOrganization(firstLine: string): { title: string; organization: string } {
  const atMatch = firstLine.match(/^(.+?)\s+(?:at|@)\s+(.+)$/i);
  if (atMatch) {
    return {
      title: normalizeSpace(atMatch[1]),
      organization: normalizeSpace(atMatch[2]),
    };
  }

  const commaMatch = firstLine.match(/^([^,]{2,120}),\s*(.{2,120})$/);
  if (commaMatch) {
    return {
      title: normalizeSpace(commaMatch[1]),
      organization: normalizeSpace(commaMatch[2]),
    };
  }

  return {
    title: firstLine.slice(0, 120) || 'Imported Experience',
    organization: 'Organization not specified',
  };
}

function extractDuration(text: string): string {
  const match = text.match(DATE_RANGE_PATTERN);
  if (match) {
    return normalizeSpace(match[0]);
  }

  return 'Duration not specified';
}

function summarizeBlock(text: string, fallback: string): string {
  const normalized = normalizeSpace(text.replace(/^[-•]\s*/gm, ''));
  if (!normalized) {
    return fallback;
  }

  return normalized.slice(0, 1000);
}

function extractWorkExperiences(
  text: string,
  lines: LineSlice[],
  sections: Partial<Record<SectionType, { start: number; end: number }>>
) {
  const blocks = extractBlocks(lines, sections.work || null);
  const candidateBlocks = blocks.length > 0 ? blocks : [];

  return candidateBlocks
    .slice(0, MAX_ITEMS_PER_ENTITY)
    .reduce<
      CvImportWizardSuggestResponse['documents'][number]['work_experiences']
    >((acc, block, index) => {
      const firstLine = splitFirstLine(block.text);
      if (!firstLine) {
        return acc;
      }

      const parsed = parseRoleAndOrganization(firstLine);
      const duration = extractDuration(block.text);
      const summary = summarizeBlock(block.text, firstLine);
      const evidenceSnippets = buildEvidenceSnippet(text, block.start, block.end);

      if (evidenceSnippets.length === 0) {
        return acc;
      }

      acc.push({
        item_id: `work-${index}`,
        title: parsed.title,
        organization: parsed.organization,
        duration,
        summary,
        evidence_snippets: evidenceSnippets,
        confidence: duration === 'Duration not specified' ? 0.62 : 0.76,
      });

      return acc;
    }, []);
}

function extractLearningExperiences(
  text: string,
  lines: LineSlice[],
  sections: Partial<Record<SectionType, { start: number; end: number }>>
) {
  const blocks = extractBlocks(lines, sections.learning || null);

  return blocks
    .slice(0, MAX_ITEMS_PER_ENTITY)
    .reduce<
      CvImportWizardSuggestResponse['documents'][number]['learning_experiences']
    >((acc, block, index) => {
      const firstLine = splitFirstLine(block.text);
      if (!firstLine) {
        return acc;
      }

      const normalizedBlock = normalizeSpace(block.text);
      const linesInBlock = block.text.split(/\r?\n/).map((line) => normalizeSpace(line));

      const institutionLine =
        linesInBlock.find((line) => INSTITUTION_PATTERN.test(line)) || firstLine;
      const degreeLine = linesInBlock.find((line) => DEGREE_PATTERN.test(line)) || firstLine;
      const duration = extractDuration(block.text);

      const evidenceSnippets = buildEvidenceSnippet(text, block.start, block.end);
      if (evidenceSnippets.length === 0) {
        return acc;
      }

      const summary = summarizeBlock(normalizedBlock, firstLine);

      acc.push({
        item_id: `learning-${index}`,
        institution: institutionLine.slice(0, 200),
        degree: degreeLine.slice(0, 200),
        duration,
        skills: summary.slice(0, 500),
        projects: summary.slice(0, 500),
        evidence_snippets: evidenceSnippets,
        confidence: duration === 'Duration not specified' ? 0.6 : 0.74,
      });

      return acc;
    }, []);
}

function extractVolunteering(
  text: string,
  lines: LineSlice[],
  sections: Partial<Record<SectionType, { start: number; end: number }>>
) {
  const blocks = extractBlocks(lines, sections.volunteering || null);

  return blocks
    .slice(0, MAX_ITEMS_PER_ENTITY)
    .reduce<
      CvImportWizardSuggestResponse['documents'][number]['volunteering']
    >((acc, block, index) => {
      const firstLine = splitFirstLine(block.text);
      if (!firstLine) {
        return acc;
      }

      const parsed = parseRoleAndOrganization(firstLine);
      const duration = extractDuration(block.text);
      const summary = summarizeBlock(block.text, firstLine);
      const evidenceSnippets = buildEvidenceSnippet(text, block.start, block.end);

      if (evidenceSnippets.length === 0) {
        return acc;
      }

      acc.push({
        item_id: `volunteering-${index}`,
        title: parsed.title,
        organization: parsed.organization,
        duration,
        cause: summary.slice(0, 280),
        impact: summary.slice(0, 500),
        skills_deployed: summary.slice(0, 500),
        personal_why: summary.slice(0, 500),
        evidence_snippets: evidenceSnippets,
        confidence: duration === 'Duration not specified' ? 0.58 : 0.72,
      });

      return acc;
    }, []);
}

function inferLanguageLevel(windowText: string): CEFRLevel {
  const normalized = windowText.toLowerCase();

  if (/native|mother\s*tongue|bilingual/.test(normalized)) {
    return 'C2';
  }

  if (/fluent|full\s+professional|professional\s+proficiency|advanced/.test(normalized)) {
    return 'C1';
  }

  if (/upper\s+intermediate|intermediate/.test(normalized)) {
    return 'B2';
  }

  if (/conversational|working\s+proficiency/.test(normalized)) {
    return 'B1';
  }

  if (/basic|elementary|beginner/.test(normalized)) {
    return 'A2';
  }

  return 'B2';
}

function strongestLevel(first: CEFRLevel, second: CEFRLevel): CEFRLevel {
  return CEFR_RANK[first] >= CEFR_RANK[second] ? first : second;
}

function createLanguageMatchers(options: TaxonomyItem[]) {
  return options.map((option) => {
    const synonyms = LANGUAGE_SYNONYMS[option.key] || [];
    const tokens = [option.label.toLowerCase(), option.key.toLowerCase(), ...synonyms].filter(
      Boolean
    );
    const escaped = Array.from(new Set(tokens)).map((token) =>
      token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    );
    return {
      key: option.key,
      label: option.label,
      regex: new RegExp(`(^|[^a-z])(${escaped.join('|')})(?=$|[^a-z])`, 'i'),
    };
  });
}

const LANGUAGE_MATCHERS = createLanguageMatchers(LANGUAGE_OPTIONS);

function extractLanguages(
  text: string,
  lines: LineSlice[],
  sections: Partial<Record<SectionType, { start: number; end: number }>>
) {
  const range = sections.languages || { start: 0, end: lines.length };
  const relevantLines = lines.slice(range.start, range.end);

  const resultByCode = new Map<string, CvImportWizardLanguage>();

  for (let index = 0; index < relevantLines.length; index += 1) {
    const line = relevantLines[index];
    const normalizedLine = normalizeSpace(line.text);
    if (!normalizedLine) {
      continue;
    }

    for (const matcher of LANGUAGE_MATCHERS) {
      const matched = matcher.regex.exec(normalizedLine.toLowerCase());
      if (!matched) {
        continue;
      }

      const windowStart = Math.max(0, line.start - EVIDENCE_CONTEXT_WINDOW);
      const windowEnd = Math.min(text.length, line.end + EVIDENCE_CONTEXT_WINDOW);
      const contextWindow = text.slice(windowStart, windowEnd);
      const evidenceSnippets = buildEvidenceSnippet(text, line.start, line.end);
      if (evidenceSnippets.length === 0) {
        continue;
      }

      const level = inferLanguageLevel(contextWindow);
      const existing = resultByCode.get(matcher.key);

      if (!existing) {
        resultByCode.set(matcher.key, {
          item_id: `language-${resultByCode.size}`,
          language_code: matcher.key,
          language_name: matcher.label,
          level,
          evidence_snippets: evidenceSnippets,
          confidence: 0.8,
        });
        continue;
      }

      existing.level = strongestLevel(existing.level, level);
      existing.evidence_snippets = Array.from(
        new Set([...existing.evidence_snippets, ...evidenceSnippets])
      ).slice(0, 3);
    }
  }

  return Array.from(resultByCode.values()).slice(0, MAX_ITEMS_PER_ENTITY);
}

function extractWizardEntities(text: string) {
  const lines = splitLines(text);
  const sections = detectSections(lines);

  return {
    work_experiences: extractWorkExperiences(text, lines, sections),
    learning_experiences: extractLearningExperiences(text, lines, sections),
    volunteering: extractVolunteering(text, lines, sections),
    languages: extractLanguages(text, lines, sections),
  };
}

function normalizeFallbackText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9+.#/\-\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function splitFallbackCandidateText(rawText: string): string[] {
  const normalized = normalizeSpace(rawText);
  if (!normalized) {
    return [];
  }

  return normalized
    .split(/\s*(?:,|;|\||\band\b|\bor\b)\s*/gi)
    .map((entry) => normalizeSpace(entry))
    .filter(Boolean);
}

function inferFallbackCategory(rawText: string): CvImportCandidate['category'] {
  const normalized = normalizeFallbackText(rawText);

  if (FALLBACK_LANGUAGE_KEYWORDS.has(normalized)) {
    return 'languages';
  }

  if (FALLBACK_SOFT_SKILL_KEYWORDS.has(normalized)) {
    return 'soft_skills';
  }

  if (FALLBACK_CERTIFICATION_KEYWORDS.some((keyword) => normalized.includes(keyword))) {
    return 'certifications';
  }

  if (FALLBACK_TOOL_KEYWORDS.some((keyword) => normalized.includes(keyword))) {
    return 'tools_technologies';
  }

  if (normalized.includes('engineering') || normalized.includes('development')) {
    return 'technical';
  }

  return 'other';
}

function isValidFallbackCandidate(rawText: string): boolean {
  const normalized = normalizeFallbackText(rawText);
  if (!normalized || normalized.length < 2 || normalized.length > 80) {
    return false;
  }

  const tokens = normalized.split(' ').filter(Boolean);
  if (tokens.length === 0 || tokens.length > 8) {
    return false;
  }

  if (tokens.every((token) => FALLBACK_STOPWORDS.has(token))) {
    return false;
  }

  if (FALLBACK_DATE_PATTERN.test(normalized)) {
    return false;
  }

  if (tokens.length > 4 && FALLBACK_SENTENCE_VERB_PATTERN.test(normalized)) {
    return false;
  }

  return /[a-z]/i.test(normalized);
}

function buildFallbackEvidence(text: string, rawText: string, context?: string): string[] {
  const contextSnippet = normalizeSpace((context || '').replace(/^\.{3}|\.\.\.$/g, ''));
  if (contextSnippet.length > 0) {
    return [contextSnippet.slice(0, 260)];
  }

  const escaped = rawText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = new RegExp(escaped, 'i').exec(text);
  if (!match || typeof match.index !== 'number') {
    return [];
  }

  const snippetStart = Math.max(0, match.index - EVIDENCE_CONTEXT_WINDOW);
  const snippetEnd = Math.min(text.length, match.index + match[0].length + EVIDENCE_CONTEXT_WINDOW);
  const snippet = normalizeSpace(text.slice(snippetStart, snippetEnd));

  return snippet.length > 0 ? [snippet] : [];
}

function buildCandidateOnlyRows(
  text: string
): CvImportSuggestResponse['documents'][number]['candidates'] {
  const extraction = extractSkillPhrases(text);
  const candidateMap = new Map<
    string,
    CvImportSuggestResponse['documents'][number]['candidates'][number]
  >();

  for (const phrase of extraction.phrases) {
    if (phrase.type !== 'skill' && phrase.type !== 'experience') {
      continue;
    }

    const phraseCandidates = splitFallbackCandidateText(phrase.text);
    for (const phraseCandidate of phraseCandidates) {
      if (!isValidFallbackCandidate(phraseCandidate)) {
        continue;
      }

      const normalized = normalizeFallbackText(phraseCandidate);
      const evidenceSnippets = buildFallbackEvidence(text, phraseCandidate, phrase.context);
      if (evidenceSnippets.length === 0) {
        continue;
      }

      const confidence =
        typeof phrase.confidence === 'number'
          ? Math.max(0.35, Math.min(0.92, phrase.confidence))
          : 0.5;

      const existing = candidateMap.get(normalized);
      if (!existing || confidence > existing.confidence) {
        candidateMap.set(normalized, {
          candidate_id: `fallback-${candidateMap.size + 1}`,
          raw_skill_text: phraseCandidate,
          category: inferFallbackCategory(phraseCandidate),
          evidence_snippets: evidenceSnippets.slice(0, 3),
          confidence,
          suggestions: [],
          unmapped_candidate: true,
        });
      }
    }
  }

  return Array.from(candidateMap.values())
    .sort((left, right) => right.confidence - left.confidence)
    .slice(0, FALLBACK_MAX_SKILL_CANDIDATES)
    .map((candidate, index) => ({
      ...candidate,
      candidate_id: `fallback-${index + 1}`,
    }));
}

function buildSkillDependencyErrorCode(error: unknown): string {
  if (!(error instanceof Error)) {
    return 'SKILL_MATCHING_UNAVAILABLE';
  }

  const message = error.message.toLowerCase();
  if (message.includes('embedding') || message.includes('vector') || message.includes('pgvector')) {
    return 'TAXONOMY_EMBEDDING_UNAVAILABLE';
  }

  if (
    message.includes('skills_taxonomy') ||
    message.includes('relation') ||
    message.includes('column') ||
    message.includes('database')
  ) {
    return 'SKILL_MATCH_DEPENDENCY_UNAVAILABLE';
  }

  return 'SKILL_MATCHING_UNAVAILABLE';
}

function buildSkillSuggestionFallback(
  input: CvImportWizardSuggestRequest,
  limits: CvImportLimits,
  dependencyErrorCode: string = 'SKILL_MATCHING_UNAVAILABLE'
): CvImportSuggestResponse {
  const documents = input.documents.map((document) => {
    const candidates = buildCandidateOnlyRows(document.text);
    return {
      document_id: document.document_id,
      file_name: document.file_name,
      context: document.context,
      parsed_text: document.text,
      parse_error: null,
      parse_error_code: null,
      candidate_count: candidates.length,
      candidates,
    };
  });

  const unmappedCandidatesCount = documents.reduce(
    (count, document) =>
      count +
      document.candidates.reduce(
        (candidateCount, candidate) => candidateCount + (candidate.unmapped_candidate ? 1 : 0),
        0
      ),
    0
  );

  return {
    documents,
    metadata: {
      semantic_used: false,
      semantic_fallback_triggered: true,
      fallback_stage: 'candidate_only',
      candidate_only_fallback_triggered: true,
      match_dependency_error_code: dependencyErrorCode,
      unmapped_candidates_count: unmappedCandidatesCount,
      limits: {
        max_documents: limits.maxDocuments,
        max_chars_per_document: limits.maxCharsPerDocument,
        max_total_chars: limits.maxTotalChars,
      },
    },
  };
}

function buildDisabledSkillSuggestionResponse(
  input: CvImportWizardSuggestRequest,
  limits: CvImportLimits
): CvImportSuggestResponse {
  return {
    documents: input.documents.map((document) => ({
      document_id: document.document_id,
      file_name: document.file_name,
      context: document.context,
      parsed_text: document.text,
      parse_error: null,
      parse_error_code: null,
      candidate_count: 0,
      candidates: [],
    })),
    metadata: {
      semantic_used: false,
      semantic_fallback_triggered: false,
      fallback_stage: 'none',
      candidate_only_fallback_triggered: false,
      unmapped_candidates_count: 0,
      limits: {
        max_documents: limits.maxDocuments,
        max_chars_per_document: limits.maxCharsPerDocument,
        max_total_chars: limits.maxTotalChars,
      },
    },
  };
}

export async function suggestWizardForDocuments(
  input: CvImportWizardSuggestRequest,
  limits: CvImportLimits,
  options: WizardSuggestOptions = {}
): Promise<CvImportWizardSuggestResponse> {
  const parsedInput = CvImportWizardSuggestRequestSchema.parse(input);

  for (const document of parsedInput.documents) {
    if (document.context !== 'cv') {
      throw new Error('Wizard suggest only supports CV context.');
    }
  }

  const skillSuggestionMode = options.skillSuggestionMode ?? 'deterministic';
  let skillResponse: CvImportSuggestResponse;

  if (skillSuggestionMode === 'disabled') {
    skillResponse = buildDisabledSkillSuggestionResponse(parsedInput, limits);
  } else {
    try {
      skillResponse = await suggestSkillsForDocuments(
        {
          documents: parsedInput.documents,
          suggestions_limit: options.suggestionsLimit,
        },
        limits,
        {
          semanticEnabled: options.semanticEnabled,
          suggestionsLimit: options.suggestionsLimit,
        }
      );
    } catch (error) {
      console.error(
        '[cv-import-wizard] skill suggestion dependency failed; continuing without skill candidates',
        error
      );
      skillResponse = buildSkillSuggestionFallback(
        parsedInput,
        limits,
        buildSkillDependencyErrorCode(error)
      );
    }
  }

  const skillResultById = new Map(
    skillResponse.documents.map((document) => [document.document_id, document])
  );

  const documents = parsedInput.documents.map((document) => {
    const extracted = extractWizardEntities(document.text);
    const skillResult = skillResultById.get(document.document_id);

    return {
      document_id: document.document_id,
      file_name: document.file_name,
      context: document.context,
      parsed_text: document.text,
      parse_error: null,
      parse_error_code: null,
      work_experiences: extracted.work_experiences,
      learning_experiences: extracted.learning_experiences,
      volunteering: extracted.volunteering,
      languages: extracted.languages,
      skill_candidates: skillResult?.candidates || [],
    };
  });

  return CvImportWizardSuggestResponseSchema.parse({
    documents,
    metadata: skillResponse.metadata,
  });
}
