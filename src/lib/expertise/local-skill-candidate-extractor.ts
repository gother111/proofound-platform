import { extractSkillPhrases, getSkillVariations } from '@/lib/ai/nlp-extractor';
import { isAmbiguousTokenWithoutDisambiguation } from '@/lib/expertise/skill-confidence';

export type LocalSkillCategory =
  | 'technical'
  | 'soft_skills'
  | 'tools_technologies'
  | 'languages'
  | 'certifications'
  | 'other';

export type LocalSkillCandidate = {
  raw_skill_text: string;
  category: LocalSkillCategory;
  evidence_snippets: string[];
  confidence: number;
};

const SKILLS_HEADING_PATTERN =
  /^(skills?|core\s+skills?|technical\s+skills?|technologies?|tools?|tooling|competenc(?:y|ies)|tech\s+stack)\s*:?\s*$/i;
const INLINE_SKILLS_PATTERN =
  /^(skills?|core\s+skills?|technical\s+skills?|technologies?|tools?|tooling|competenc(?:y|ies)|tech\s+stack)\s*:\s*(.+)$/i;
const SECTION_BREAK_PATTERN =
  /^(experience|work\s+experience|professional\s+experience|employment|education|projects?|summary|profile|about|volunteer(?:ing)?|awards?|publications?|references?)\s*:?\s*$/i;
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
  'project',
  'projects',
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
const NOISE_PATTERN =
  /\b(responsible\s+for|worked\s+on|worked\s+with|team|stakeholders?|company|location|based\s+in|graduated|university|college|school)\b/i;
const EVIDENCE_CONTEXT_WINDOW = 80;
const EVIDENCE_MAX = 3;
const SHORT_TOKEN_ALLOWLIST = new Set(['ai', 'ml', 'ui', 'ux', 'qa', 'ci', 'cd', 'js', 'ts']);
const SKILL_CONTEXT_PATTERN =
  /\b(skills?|core\s+skills?|technical\s+skills?|technologies?|tools?|tooling|competenc(?:y|ies)|tech\s+stack)\b/i;

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

function splitCandidateTokens(raw: string): string[] {
  return raw
    .split(/\s*(?:,|;|\||•|·|▪|\band\b|\bor\b)\s*/gi)
    .map((part) => part.trim())
    .filter(Boolean);
}

function sanitizeCandidateText(raw: string): string {
  return raw
    .replace(/^\d+\+?\s*(?:years?|months?)\s+of\s+experience\s+(?:in|with)\s+/i, '')
    .replace(/^(?:of\s+experience|experience)\s+(?:in|with)\s+/i, '')
    .replace(/\s+for\s+side\s+projects?$/i, '')
    .replace(/\s+in\s+side\s+projects?$/i, '')
    .replace(/^[\-•*]+\s*/, '')
    .replace(/[.,;:]+$/g, '')
    .trim();
}

function looksLikeSkillCandidate(raw: string): boolean {
  const normalized = normalizeText(raw);
  if (!normalized || normalized.length < 2 || normalized.length > 80) {
    return false;
  }

  if (GENERIC_CANDIDATE_PHRASES.has(normalized)) {
    return false;
  }

  if (NOISE_PATTERN.test(raw)) {
    return false;
  }

  const tokens = normalized.split(' ').filter(Boolean);
  if (tokens.length === 0 || tokens.length > 8) {
    return false;
  }

  const compact = normalized.replace(/\s+/g, '');
  if (tokens.length === 1 && compact.length <= 2) {
    if (!SHORT_TOKEN_ALLOWLIST.has(compact) && compact !== 'c#' && compact !== 'c++') {
      return false;
    }
  }

  if (!/[a-z]/i.test(normalized)) {
    return false;
  }

  return true;
}

function inferCategory(skillText: string): LocalSkillCategory {
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

  if (normalized.includes('engineering') || normalized.includes('development')) {
    return 'technical';
  }

  return 'other';
}

function extractEvidenceSnippets(text: string, rawSkillText: string): string[] {
  const variations = [rawSkillText, ...getSkillVariations(rawSkillText)].slice(0, 16);
  const snippets = new Set<string>();

  for (const variation of variations) {
    const escaped = variation.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(?<![a-z0-9])${escaped}(?![a-z0-9])`, 'gi');
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      const start = Math.max(0, match.index - EVIDENCE_CONTEXT_WINDOW);
      const end = Math.min(text.length, match.index + match[0].length + EVIDENCE_CONTEXT_WINDOW);
      const snippet = text.slice(start, end).trim();
      if (!snippet) {
        continue;
      }
      snippets.add(snippet);
      if (snippets.size >= EVIDENCE_MAX) {
        return Array.from(snippets);
      }
    }
  }

  return Array.from(snippets);
}

function extractSkillsSectionEntries(text: string): Set<string> {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const sectionEntries = new Set<string>();
  let inSkillsSection = false;

  for (const line of lines) {
    if (SKILLS_HEADING_PATTERN.test(line)) {
      inSkillsSection = true;
      continue;
    }

    const inlineMatch = line.match(INLINE_SKILLS_PATTERN);
    if (inlineMatch) {
      for (const token of splitCandidateTokens(inlineMatch[2])) {
        const normalized = normalizeText(sanitizeCandidateText(token));
        if (normalized) {
          sectionEntries.add(normalized);
        }
      }
      continue;
    }

    if (SECTION_BREAK_PATTERN.test(line)) {
      inSkillsSection = false;
      continue;
    }

    if (!inSkillsSection) {
      continue;
    }

    for (const token of splitCandidateTokens(line)) {
      const normalized = normalizeText(sanitizeCandidateText(token));
      if (normalized) {
        sectionEntries.add(normalized);
      }
    }
  }

  return sectionEntries;
}

function deterministicSort(left: LocalSkillCandidate, right: LocalSkillCandidate): number {
  if (right.confidence !== left.confidence) {
    return right.confidence - left.confidence;
  }
  return left.raw_skill_text.localeCompare(right.raw_skill_text);
}

function hasExplicitSkillContext(value: string): boolean {
  return SKILL_CONTEXT_PATTERN.test(value);
}

export function extractLocalSkillCandidates(
  text: string,
  options: {
    maxCandidates: number;
  }
): LocalSkillCandidate[] {
  const sectionEntries = extractSkillsSectionEntries(text);
  const phraseResult = extractSkillPhrases(text);
  const byNormalized = new Map<string, LocalSkillCandidate>();

  for (const phrase of phraseResult.phrases) {
    if (phrase.type !== 'skill' && phrase.type !== 'experience') {
      continue;
    }

    const splitCandidates = splitCandidateTokens(sanitizeCandidateText(phrase.text));
    for (const part of splitCandidates) {
      const raw = sanitizeCandidateText(part);
      if (!looksLikeSkillCandidate(raw)) {
        continue;
      }

      const normalized = normalizeText(raw);
      if (!normalized) {
        continue;
      }

      const evidence = extractEvidenceSnippets(text, raw);
      if (evidence.length === 0) {
        continue;
      }

      const category = inferCategory(raw);
      const fromSkillsSection =
        sectionEntries.has(normalized) ||
        hasExplicitSkillContext(phrase.context || '') ||
        evidence.some((snippet) => hasExplicitSkillContext(snippet));

      if (!fromSkillsSection && phrase.confidence < 0.5) {
        continue;
      }

      if (!fromSkillsSection && category === 'other' && phrase.confidence < 0.68) {
        continue;
      }

      const sectionBoost = sectionEntries.has(normalized) ? 0.14 : 0;
      const noisePenalty = NOISE_PATTERN.test(phrase.context || '') ? 0.08 : 0;
      const ambiguityPenalty = isAmbiguousTokenWithoutDisambiguation({
        rawSkillText: raw,
        evidenceSnippets: evidence,
      })
        ? 0.22
        : 0;
      const base = typeof phrase.confidence === 'number' ? phrase.confidence : 0.5;
      const confidence = clamp(base + sectionBoost - noisePenalty - ambiguityPenalty);

      const existing = byNormalized.get(normalized);
      const candidate: LocalSkillCandidate = {
        raw_skill_text: raw,
        category,
        evidence_snippets: evidence,
        confidence,
      };

      if (!existing || candidate.confidence > existing.confidence) {
        byNormalized.set(normalized, candidate);
      } else if (existing) {
        existing.evidence_snippets = Array.from(
          new Set([...existing.evidence_snippets, ...candidate.evidence_snippets])
        ).slice(0, EVIDENCE_MAX);
      }
    }
  }

  return Array.from(byNormalized.values()).sort(deterministicSort).slice(0, options.maxCandidates);
}
