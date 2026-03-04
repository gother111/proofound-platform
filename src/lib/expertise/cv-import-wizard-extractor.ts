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
import { extractLocalSkillCandidates } from '@/lib/expertise/local-skill-candidate-extractor';
import { computeEvidenceQuality } from '@/lib/expertise/skill-confidence';
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
const EVIDENCE_MAX_CHARS = 180;
const SUMMARY_MAX_CHARS = 220;

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

const MONTH_TOKEN_PATTERN_SOURCE =
  '(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)';
const DATE_RANGE_SEPARATOR_PATTERN_SOURCE = '(?:-|–|—|to)';
const DATE_RANGE_PATTERN = new RegExp(
  [
    `\\b${MONTH_TOKEN_PATTERN_SOURCE}\\s+\\d{4}\\s*${DATE_RANGE_SEPARATOR_PATTERN_SOURCE}\\s*(?:${MONTH_TOKEN_PATTERN_SOURCE}\\s+\\d{4}|present|current|now)\\b`,
    `\\b(?:0?[1-9]|1[0-2])\\/\\d{4}\\s*${DATE_RANGE_SEPARATOR_PATTERN_SOURCE}\\s*(?:(?:0?[1-9]|1[0-2])\\/\\d{4}|present|current|now)\\b`,
    `\\b\\d{4}\\/(?:0?[1-9]|1[0-2])\\s*${DATE_RANGE_SEPARATOR_PATTERN_SOURCE}\\s*(?:\\d{4}\\/(?:0?[1-9]|1[0-2])|present|current|now)\\b`,
    `\\b\\d{4}(?:-\\d{2}(?:-\\d{2})?)?\\s*${DATE_RANGE_SEPARATOR_PATTERN_SOURCE}\\s*(?:\\d{4}(?:-\\d{2}(?:-\\d{2})?)?|present|current|now)\\b`,
  ].join('|'),
  'i'
);

const INSTITUTION_PATTERN =
  /\b(university|college|school|institute|academy|polytechnic|bootcamp|faculty)\b/i;
const DEGREE_PATTERN =
  /\b(bachelor|master|phd|doctorate|diploma|certificate|bootcamp|course|mba|msc|bsc|ba)\b/i;
const ROLE_KEYWORD_PATTERN =
  /\b(engineer|developer|manager|lead|head|director|intern|consultant|analyst|architect|designer|specialist|coordinator|officer|scientist|researcher|teacher|professor)\b/i;
const ORGANIZATION_KEYWORD_PATTERN =
  /\b(university|college|school|institute|academy|polytechnic|inc|llc|ltd|corp|company|group|agency|bank|foundation|hospital|studio|labs?)\b/i;

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

  return [snippet.slice(0, EVIDENCE_MAX_CHARS)];
}

function splitFirstLine(blockText: string): string {
  const [firstLine] = blockText.split(/\r?\n/);
  return normalizeSpace(firstLine || '');
}

function stripInlineDateRanges(value: string): string {
  return normalizeSpace(value.replace(new RegExp(DATE_RANGE_PATTERN.source, 'gi'), ' '));
}

function sanitizeRoleOrganizationLine(value: string): string {
  let sanitized = normalizeSpace(value.replace(/^[-•*]\s*/, ''));
  sanitized = stripInlineDateRanges(sanitized);
  sanitized = sanitized.replace(/\s+[•·▪]\s+.*$/, '');
  sanitized = sanitized.replace(/\s*(?:\||-|–|—|,)\s*$/, '');
  return normalizeSpace(sanitized);
}

function scoreRoleText(value: string): number {
  const normalized = normalizeSpace(value);
  if (!normalized) {
    return 0;
  }

  let score = 0;
  if (ROLE_KEYWORD_PATTERN.test(normalized)) {
    score += 2;
  }
  if (/\b(senior|junior|principal|staff|lead|head|chief|assistant)\b/i.test(normalized)) {
    score += 1;
  }
  if (normalized.split(/\s+/).length <= 7) {
    score += 0.25;
  }
  return score;
}

function scoreOrganizationText(value: string): number {
  const normalized = normalizeSpace(value);
  if (!normalized) {
    return 0;
  }

  let score = 0;
  if (ORGANIZATION_KEYWORD_PATTERN.test(normalized)) {
    score += 2;
  }
  if (/\b(inc\.?|llc|ltd\.?|corp\.?|co\.?|gmbh|ab|oy|plc)\b/i.test(normalized)) {
    score += 1.5;
  }
  if (/^[A-Z0-9&.,'’\-\s]{2,}$/.test(normalized) && !ROLE_KEYWORD_PATTERN.test(normalized)) {
    score += 0.5;
  }
  return score;
}

function parseRoleOrganizationPair(
  leftRaw: string,
  rightRaw: string
): { title: string; organization: string } {
  const left = normalizeSpace(leftRaw);
  const right = normalizeSpace(rightRaw);

  const leftRoleScore = scoreRoleText(left);
  const rightRoleScore = scoreRoleText(right);
  const leftOrganizationScore = scoreOrganizationText(left);
  const rightOrganizationScore = scoreOrganizationText(right);

  const preferLeftAsTitle = leftRoleScore + rightOrganizationScore;
  const preferRightAsTitle = rightRoleScore + leftOrganizationScore;

  if (preferRightAsTitle > preferLeftAsTitle + 0.5) {
    return {
      title: right,
      organization: left,
    };
  }

  return {
    title: left,
    organization: right,
  };
}

function parseRoleAndOrganization(firstLine: string): { title: string; organization: string } {
  const cleaned = sanitizeRoleOrganizationLine(firstLine);
  if (!cleaned) {
    return {
      title: 'Imported Experience',
      organization: 'Organization not specified',
    };
  }

  const dashMatch = cleaned.match(/^(.{2,120}?)\s+(?:\||–|-|—)\s+(.{2,160})$/);
  if (dashMatch) {
    return parseRoleOrganizationPair(dashMatch[1], dashMatch[2]);
  }

  const atMatch = cleaned.match(/^(.+?)\s+(?:at|@)\s+(.+)$/i);
  if (atMatch) {
    return {
      title: normalizeSpace(atMatch[1]),
      organization: normalizeSpace(atMatch[2]),
    };
  }

  const commaMatch = cleaned.match(/^([^,]{2,120}),\s*(.{2,120})$/);
  if (commaMatch) {
    return parseRoleOrganizationPair(commaMatch[1], commaMatch[2]);
  }

  return {
    title: cleaned.slice(0, 120) || 'Imported Experience',
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

function splitBlockContentLines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => normalizeSpace(line.replace(/^[-•]\s*/g, '')))
    .filter(Boolean);
}

function isLikelyDateLine(line: string): boolean {
  return DATE_RANGE_PATTERN.test(line);
}

function clipDisplayText(value: string, maxChars = SUMMARY_MAX_CHARS): string {
  const normalized = normalizeSpace(value);
  if (!normalized) {
    return '';
  }
  if (normalized.length <= maxChars) {
    return normalized;
  }
  return `${normalized.slice(0, maxChars - 1).trimEnd()}…`;
}

function splitLearningBlockLines(blockText: string): string[] {
  const lines = splitBlockContentLines(blockText);
  return lines.flatMap((line) => {
    if (!/[•·▪]/.test(line)) {
      return [line];
    }

    const parts = line
      .split(/\s+[•·▪]\s+/)
      .map((part) => normalizeSpace(part))
      .filter(Boolean);

    return parts.length > 0 ? parts : [line];
  });
}

function shouldStartNewLearningEntry(current: string[], nextLine: string): boolean {
  if (current.length === 0) {
    return false;
  }

  const currentHasDate = current.some((line) => isLikelyDateLine(line));
  const currentHasInstitution = current.some((line) => INSTITUTION_PATTERN.test(line));
  const currentHasDegree = current.some((line) => DEGREE_PATTERN.test(line));

  const nextHasDate = isLikelyDateLine(nextLine);
  const nextHasInstitution = INSTITUTION_PATTERN.test(nextLine);
  const nextHasDegree = DEGREE_PATTERN.test(nextLine);

  if (nextHasDate && currentHasDate && current.length >= 2) {
    return true;
  }

  if (nextHasInstitution && (currentHasDate || currentHasDegree || currentHasInstitution)) {
    return true;
  }

  if (nextHasDegree && currentHasDegree && current.length >= 2) {
    return true;
  }

  return false;
}

function splitLearningEntries(blockText: string): string[][] {
  const lines = splitLearningBlockLines(blockText);
  if (lines.length === 0) {
    return [];
  }

  const entries: string[][] = [];
  let current: string[] = [];

  for (const line of lines) {
    if (shouldStartNewLearningEntry(current, line)) {
      entries.push(current);
      current = [line];
      continue;
    }

    current.push(line);
  }

  if (current.length > 0) {
    entries.push(current);
  }

  return entries;
}

function parseInstitutionAndDegreeFromLine(
  line: string
): { institution: string; degree: string } | null {
  const cleaned = sanitizeRoleOrganizationLine(line);
  if (!cleaned) {
    return null;
  }

  const separatorMatch = cleaned.match(/^(.+?)\s+(?:\||–|-|—)\s+(.+)$/);
  if (!separatorMatch) {
    return null;
  }

  const left = normalizeSpace(separatorMatch[1]);
  const right = normalizeSpace(separatorMatch[2]);

  if (!left || !right) {
    return null;
  }

  if (INSTITUTION_PATTERN.test(left) || DEGREE_PATTERN.test(right)) {
    return {
      institution: left,
      degree: right,
    };
  }

  if (INSTITUTION_PATTERN.test(right) || DEGREE_PATTERN.test(left)) {
    return {
      institution: right,
      degree: left,
    };
  }

  return {
    institution: left,
    degree: right,
  };
}

function buildConciseSummaryFromBlock(text: string, fallback: string): string {
  const normalized = normalizeSpace(text.replace(/^[-•]\s*/gm, ''));
  if (!normalized) {
    return clipDisplayText(fallback);
  }

  const lines = splitBlockContentLines(normalized);
  const sentenceLikeLine =
    lines.find(
      (line) =>
        line.length >= 24 &&
        !isLikelyDateLine(line) &&
        /\b(built|designed|led|delivered|implemented|optimized|improved|managed|launched)\b/i.test(
          line
        )
    ) || lines.find((line) => line.length >= 24 && !isLikelyDateLine(line));

  return clipDisplayText(sentenceLikeLine || normalized || fallback);
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
      const blockLines = splitBlockContentLines(block.text);
      const detailLines = blockLines.filter(
        (line, lineIndex) => lineIndex > 0 && !isLikelyDateLine(line)
      );
      const durationSource = blockLines.slice(0, 3).join(' ');
      const duration = extractDuration(durationSource || block.text);
      const summarySeed =
        detailLines.find((line) =>
          /\b(built|designed|led|delivered|implemented|optimized|improved|managed|launched)\b/i.test(
            line
          )
        ) ||
        detailLines[0] ||
        firstLine;
      const summary = buildConciseSummaryFromBlock(summarySeed, firstLine);
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

  const learningEntries = blocks.flatMap((block) => {
    const entries = splitLearningEntries(block.text);
    if (entries.length === 0) {
      return [{ lines: splitBlockContentLines(block.text), block }];
    }

    return entries.map((entryLines) => ({
      lines: entryLines,
      block,
    }));
  });

  return learningEntries
    .slice(0, MAX_ITEMS_PER_ENTITY)
    .reduce<
      CvImportWizardSuggestResponse['documents'][number]['learning_experiences']
    >((acc, entry, index) => {
      const linesInBlock = entry.lines;
      const firstLine = linesInBlock[0] || '';
      if (!firstLine) {
        return acc;
      }

      const inlineParsed = parseInstitutionAndDegreeFromLine(firstLine);
      const institutionLine =
        inlineParsed?.institution ||
        linesInBlock.find((line) => INSTITUTION_PATTERN.test(line)) ||
        linesInBlock.find((line) => !DEGREE_PATTERN.test(line) && !isLikelyDateLine(line)) ||
        firstLine;
      const degreeLine =
        inlineParsed?.degree ||
        linesInBlock.find((line) => DEGREE_PATTERN.test(line) && line !== institutionLine) ||
        linesInBlock.find((line, lineIndex) => lineIndex > 0 && line.length > 5) ||
        firstLine;
      const duration = extractDuration(linesInBlock.join(' '));
      const detailLines = linesInBlock.filter(
        (line) =>
          line !== institutionLine &&
          line !== degreeLine &&
          !isLikelyDateLine(line) &&
          line.length > 4
      );
      const skillsLine =
        detailLines.find((line) =>
          /\b(skill|technology|tool|coursework|focus|specialization|stack)\b/i.test(line)
        ) ||
        detailLines[0] ||
        '';
      const projectsLine =
        detailLines.find((line) =>
          /\b(project|thesis|capstone|research|assignment|portfolio)\b/i.test(line)
        ) ||
        detailLines[1] ||
        '';

      const evidenceSnippets = buildEvidenceSnippet(text, entry.block.start, entry.block.end);
      if (evidenceSnippets.length === 0) {
        return acc;
      }

      acc.push({
        item_id: `learning-${index}`,
        institution: clipDisplayText(institutionLine, 180) || 'Institution not specified',
        degree: clipDisplayText(degreeLine, 180) || 'Degree not specified',
        duration,
        skills: clipDisplayText(skillsLine, 220) || 'Not specified',
        projects: clipDisplayText(projectsLine, 220) || 'Not specified',
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
      const blockLines = splitBlockContentLines(block.text);
      const detailLines = blockLines.filter(
        (line, lineIndex) => lineIndex > 0 && !isLikelyDateLine(line)
      );
      const causeLine =
        detailLines.find((line) =>
          /\b(cause|community|charity|nonprofit|mission|support|youth|education|health|environment)\b/i.test(
            line
          )
        ) ||
        detailLines[0] ||
        '';
      const impactLine =
        detailLines.find((line) =>
          /\b(built|delivered|helped|improved|coordinated|organized|raised|launched|mentored)\b/i.test(
            line
          )
        ) ||
        detailLines[1] ||
        '';
      const skillsLine =
        detailLines.find((line) =>
          /\b(skill|tool|technology|mentoring|teaching|leadership|analysis|development)\b/i.test(
            line
          )
        ) ||
        detailLines[2] ||
        '';
      const whyLine =
        detailLines.find((line) =>
          /\b(why|because|motivated|passion|care|believe|purpose)\b/i.test(line)
        ) || '';
      const evidenceSnippets = buildEvidenceSnippet(text, block.start, block.end);

      if (evidenceSnippets.length === 0) {
        return acc;
      }

      acc.push({
        item_id: `volunteering-${index}`,
        title: clipDisplayText(parsed.title, 140) || 'Volunteer',
        organization: clipDisplayText(parsed.organization, 160) || 'Organization not specified',
        duration,
        cause: clipDisplayText(causeLine, 220) || 'Not specified',
        impact: clipDisplayText(impactLine, 220) || 'Not specified',
        skills_deployed: clipDisplayText(skillsLine, 220) || 'Not specified',
        personal_why: clipDisplayText(whyLine, 220) || 'Not specified',
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
    return [contextSnippet.slice(0, EVIDENCE_MAX_CHARS)];
  }

  const escaped = rawText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = new RegExp(escaped, 'i').exec(text);
  if (!match || typeof match.index !== 'number') {
    return [];
  }

  const snippetStart = Math.max(0, match.index - EVIDENCE_CONTEXT_WINDOW);
  const snippetEnd = Math.min(text.length, match.index + match[0].length + EVIDENCE_CONTEXT_WINDOW);
  const snippet = normalizeSpace(text.slice(snippetStart, snippetEnd));

  return snippet.length > 0 ? [snippet.slice(0, EVIDENCE_MAX_CHARS)] : [];
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

  const deterministicCandidates = extractLocalSkillCandidates(text, {
    maxCandidates: FALLBACK_MAX_SKILL_CANDIDATES,
  });
  for (const deterministic of deterministicCandidates) {
    const normalized = normalizeFallbackText(deterministic.raw_skill_text);
    if (!normalized) {
      continue;
    }
    const existing = candidateMap.get(normalized);
    if (!existing || deterministic.confidence > existing.confidence) {
      candidateMap.set(normalized, {
        candidate_id: `fallback-${candidateMap.size + 1}`,
        raw_skill_text: deterministic.raw_skill_text,
        category: deterministic.category,
        evidence_snippets: deterministic.evidence_snippets.slice(0, 3),
        confidence: deterministic.confidence,
        suggestions: [],
        unmapped_candidate: true,
      });
      continue;
    }

    existing.evidence_snippets = Array.from(
      new Set([...existing.evidence_snippets, ...deterministic.evidence_snippets])
    ).slice(0, 3);
    existing.confidence = Math.max(
      existing.confidence,
      Math.min(0.96, deterministic.confidence * 0.45 + existing.confidence * 0.55)
    );
  }

  return Array.from(candidateMap.values())
    .map((candidate) => {
      const evidenceQuality = computeEvidenceQuality(
        candidate.raw_skill_text,
        candidate.evidence_snippets
      );
      return {
        ...candidate,
        confidence: Math.min(0.98, candidate.confidence * 0.84 + evidenceQuality * 0.16),
      };
    })
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
