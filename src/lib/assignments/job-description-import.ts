export type ImportedEngagementType =
  | 'full_time'
  | 'part_time'
  | 'contract_consulting'
  | 'fractional_project';

export type ImportedAssignmentSkill = {
  id: string;
  label: string;
  level: number;
  linkedToBV?: boolean;
  linkedToTO?: boolean;
};

export type ImportedAssignmentOutcome = {
  metric: string;
  target: string;
  timeframe: '30d' | '90d' | '6mo' | '12mo';
};

export type ImportedAssignmentDraft = {
  role: string;
  engagementType: ImportedEngagementType;
  businessValue: string;
  description: string;
  expectedImpact: string;
  outcomes: ImportedAssignmentOutcome[];
  mustHaveSkills: ImportedAssignmentSkill[];
  niceToHaveSkills: ImportedAssignmentSkill[];
  locationMode: 'onsite' | 'hybrid' | 'remote';
  city?: string;
  country?: string;
  compMin?: number;
  compMax?: number;
  currency: string;
  hoursMin?: number;
  hoursMax?: number;
  missingFields: string[];
};

export type JobDescriptionImportResult =
  | {
      ok: true;
      draft: ImportedAssignmentDraft;
      guidance: string[];
      sourceStats: {
        wordCount: number;
        usefulLineCount: number;
      };
    }
  | {
      ok: false;
      error: string;
      guidance: string[];
      sourceStats: {
        wordCount: number;
        usefulLineCount: number;
      };
    };

type SectionKey =
  | 'overview'
  | 'responsibilities'
  | 'outcomes'
  | 'mustHave'
  | 'niceToHave'
  | 'constraints'
  | 'proof';

const SECTION_PATTERNS: Array<{ key: SectionKey; patterns: RegExp[] }> = [
  {
    key: 'responsibilities',
    patterns: [
      /^(responsibilities|what you'?ll do|what you will do|main workstreams?|duties|scope|the work)$/i,
    ],
  },
  {
    key: 'outcomes',
    patterns: [
      /^(outcomes?|deliverables?|success measures?|success looks like|first \d+ days|goals?)$/i,
    ],
  },
  {
    key: 'mustHave',
    patterns: [
      /^(must[- ]?have|requirements?|required qualifications?|qualifications|what you bring|skills required|core capabilities)$/i,
    ],
  },
  {
    key: 'niceToHave',
    patterns: [/^(nice[- ]?to[- ]?have|preferred|bonus|additional qualifications)$/i],
  },
  {
    key: 'constraints',
    patterns: [
      /^(location|work mode|compensation|salary|contract|employment type|hours|logistics|constraints)$/i,
    ],
  },
  {
    key: 'proof',
    patterns: [
      /^(proof|portfolio|work sample|case study|evidence|verification|examples of work)$/i,
    ],
  },
  {
    key: 'overview',
    patterns: [/^(about|about the role|overview|role purpose|why this role exists|summary)$/i],
  },
];

const LOW_QUALITY_GUIDANCE = [
  'Paste the full job description, including title, responsibilities, requirements, and practical constraints.',
  'Use a source with enough detail to separate role purpose, real work, proof expectations, and logistics.',
];

function normalizeSourceText(value: string) {
  return value
    .replace(/\r\n?/g, '\n')
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

function wordsIn(value: string) {
  return value.match(/[A-Za-z0-9][A-Za-z0-9'+-]*/g) ?? [];
}

function stripBulletPrefix(value: string) {
  return value
    .replace(/^\s*(?:[-*•]|[0-9]+[.)])\s+/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function stripHeadingSuffix(value: string) {
  return value.replace(/[:：]\s*$/, '').trim();
}

function cleanSentence(value: string) {
  return stripBulletPrefix(value)
    .replace(
      /^(responsibilities|requirements?|qualifications|skills|location|salary|compensation)\s*[:：-]\s*/i,
      ''
    )
    .replace(/\s+/g, ' ')
    .trim();
}

function sentenceCase(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return trimmed;
  return `${trimmed[0].toUpperCase()}${trimmed.slice(1)}`;
}

function splitSentences(value: string) {
  return value
    .split(/(?<=[.!?])\s+|\n+/)
    .map(cleanSentence)
    .filter((line) => line.length >= 18);
}

function classifyHeading(value: string): SectionKey | null {
  const cleaned = stripHeadingSuffix(stripBulletPrefix(value)).trim();
  if (!cleaned || cleaned.length > 90) return null;

  for (const section of SECTION_PATTERNS) {
    if (section.patterns.some((pattern) => pattern.test(cleaned))) {
      return section.key;
    }
  }

  return null;
}

function buildSections(lines: string[]) {
  const sections: Record<SectionKey, string[]> = {
    overview: [],
    responsibilities: [],
    outcomes: [],
    mustHave: [],
    niceToHave: [],
    constraints: [],
    proof: [],
  };
  let activeSection: SectionKey = 'overview';

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    const inlineHeading = line.match(/^([^:：]{2,72})[:：]\s+(.+)$/);
    if (inlineHeading) {
      const key = classifyHeading(inlineHeading[1]);
      if (key) {
        activeSection = key;
        sections[activeSection].push(cleanSentence(inlineHeading[2]));
        continue;
      }
    }

    const heading = classifyHeading(line);
    if (heading) {
      activeSection = heading;
      continue;
    }

    sections[activeSection].push(cleanSentence(line));
  }

  return sections;
}

function uniqueCleanLines(lines: string[], limit: number) {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const line of lines) {
    const cleaned = cleanSentence(line).replace(/[.;]\s*$/, '');
    const key = cleaned.toLowerCase();
    if (!cleaned || cleaned.length < 4 || seen.has(key)) continue;
    seen.add(key);
    result.push(cleaned);
    if (result.length >= limit) break;
  }

  return result;
}

function truncate(value: string, maxLength: number) {
  const trimmed = value.trim();
  if (trimmed.length <= maxLength) return trimmed;
  const sliced = trimmed.slice(0, maxLength - 1);
  const lastSpace = sliced.lastIndexOf(' ');
  return `${sliced.slice(0, lastSpace > 60 ? lastSpace : maxLength - 1).trim()}.`;
}

function extractRoleTitle(lines: string[], sourceText: string) {
  for (const rawLine of lines) {
    const line = stripBulletPrefix(rawLine);
    const match = line.match(/^(?:job\s*)?(?:title|role|position)\s*[:：-]\s*(.+)$/i);
    if (match?.[1]) return truncate(cleanSentence(match[1]), 90);
  }

  const firstTitleLikeLine = lines
    .map(stripBulletPrefix)
    .map((line) => line.replace(/^job description\s*[:：-]\s*/i, '').trim())
    .find((line) => {
      if (!line || line.length > 90) return false;
      if (classifyHeading(line)) return false;
      return wordsIn(line).length <= 9;
    });

  if (firstTitleLikeLine) return truncate(cleanSentence(firstTitleLikeLine), 90);

  const hiringMatch = sourceText.match(
    /(?:hiring|seeking|looking for)\s+(?:an?|the)?\s*([^.,\n]{3,80})/i
  );
  return hiringMatch?.[1] ? truncate(cleanSentence(hiringMatch[1]), 90) : '';
}

function inferEngagementType(sourceText: string): ImportedEngagementType {
  const text = sourceText.toLowerCase();
  if (/\b(contract|consulting|consultant|freelance|temporary)\b/.test(text)) {
    return 'contract_consulting';
  }
  if (/\b(part[- ]time|part time)\b/.test(text)) return 'part_time';
  if (/\b(fractional|project[- ]based|project based)\b/.test(text)) return 'fractional_project';
  return 'full_time';
}

function inferLocation(
  sourceText: string
): Pick<ImportedAssignmentDraft, 'locationMode' | 'city' | 'country'> {
  const text = sourceText.toLowerCase();
  const locationMode = /\bremote\b/.test(text)
    ? 'remote'
    : /\b(on[- ]?site|office-based|in office)\b/.test(text)
      ? 'onsite'
      : 'hybrid';

  const locationMatch = sourceText.match(/(?:location|based in)\s*[:：-]\s*([^\n.]+)/i);
  if (!locationMatch?.[1] || /\bremote\b/i.test(locationMatch[1])) {
    return { locationMode };
  }

  const parts = locationMatch[1]
    .split(/[,/|]/)
    .map((part) => part.trim())
    .filter(Boolean);

  return {
    locationMode,
    city: parts[0],
    country: parts[1],
  };
}

function inferCompensation(sourceText: string) {
  if (!/\b(salary|compensation|pay|range|usd|eur|gbp|sek|dkk|nok)\b|[$€£]/i.test(sourceText)) {
    return {};
  }

  const compensationLine =
    sourceText
      .split('\n')
      .find((line) => /\b(salary|compensation|pay|range|usd|eur|gbp)\b|[$€£]/i.test(line)) ??
    sourceText;
  const match = compensationLine.match(
    /(?:salary|compensation|pay|range)?[^0-9$€£]{0,24}([$€£]|USD|EUR|GBP)?\s*([0-9][0-9,.\s]{2,})(?:\s*(?:-|to|–)\s*([$€£]|USD|EUR|GBP)?\s*([0-9][0-9,.\s]{2,}))?/i
  );
  if (!match) return {};

  const parseAmount = (value?: string) => {
    if (!value) return undefined;
    const parsed = Number(value.replace(/[\s,]/g, ''));
    return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
  };
  const toCurrency = (value?: string) => {
    if (value === '$') return 'USD';
    if (value === '€') return 'EUR';
    if (value === '£') return 'GBP';
    return value?.toUpperCase();
  };

  const compMin = parseAmount(match[2]);
  const compMax = parseAmount(match[4]);
  return {
    compMin,
    compMax: compMax && compMin && compMax > compMin ? compMax : undefined,
    currency: toCurrency(match[1] || match[3]),
  };
}

function inferHours(sourceText: string) {
  const rangeMatch = sourceText.match(/(\d{1,2})\s*(?:-|to|–)\s*(\d{1,2})\s*(?:hours|hrs|h)\b/i);
  if (rangeMatch) {
    const min = Number(rangeMatch[1]);
    const max = Number(rangeMatch[2]);
    if (Number.isFinite(min) && Number.isFinite(max) && max > min) {
      return { hoursMin: min, hoursMax: Math.min(max, 40) };
    }
  }

  const singleMatch = sourceText.match(
    /(\d{1,2})\s*(?:hours|hrs|h)\s*(?:per week|\/week|weekly)?/i
  );
  if (singleMatch) {
    const hours = Number(singleMatch[1]);
    if (Number.isFinite(hours) && hours > 0) {
      return { hoursMin: Math.min(hours, 40), hoursMax: Math.min(Math.max(hours, 20), 40) };
    }
  }

  return {};
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
}

function toImportedSkill(
  label: string,
  index: number,
  linkedToTO = false
): ImportedAssignmentSkill {
  const cleaned = truncate(
    label
      .replace(/\b(\d\+?\s*years?|experience with|strong|excellent|proven|ability to)\b/gi, '')
      .replace(/\s+/g, ' ')
      .trim(),
    80
  );
  const fallbackLabel = cleaned || `Imported capability ${index + 1}`;
  return {
    id: `jd-${slugify(fallbackLabel) || index + 1}`,
    label: sentenceCase(fallbackLabel),
    level: 3,
    linkedToBV: index === 0,
    linkedToTO,
  };
}

function extractCapabilities(lines: string[], limit: number, linkedToTO = false) {
  const candidates = lines.flatMap((line) => {
    const cleaned = cleanSentence(line)
      .replace(/^(you have|you bring|must have|required|preferred|bonus)[:：\s-]*/i, '')
      .trim();

    if (!cleaned) return [];

    if (/^(skills|capabilities|requirements?)[:：]/i.test(line)) {
      return cleaned.split(/[,;]| and /i).map(cleanSentence);
    }

    return [cleaned];
  });

  return uniqueCleanLines(candidates, limit).map((line, index) =>
    toImportedSkill(line, index, linkedToTO)
  );
}

function inferTimeframe(value: string): ImportedAssignmentOutcome['timeframe'] {
  const text = value.toLowerCase();
  if (/\b(30 days|first month|one month)\b/.test(text)) return '30d';
  if (/\b(6 months|six months|half year)\b/.test(text)) return '6mo';
  if (/\b(12 months|year)\b/.test(text)) return '12mo';
  return '90d';
}

function toOutcome(line: string): ImportedAssignmentOutcome {
  const metric = truncate(line, 90);
  return {
    metric: sentenceCase(metric),
    target: 'Evidence that this outcome or deliverable is complete',
    timeframe: inferTimeframe(line),
  };
}

function buildRolePurpose(role: string, overviewLines: string[], responsibilityLines: string[]) {
  const explicit = uniqueCleanLines(overviewLines, 2)
    .filter((line) => line.toLowerCase() !== role.toLowerCase())
    .join(' ');

  if (explicit.length >= 30) return truncate(explicit, 600);

  const responsibility = responsibilityLines[0];
  if (role && responsibility) {
    return truncate(
      `This role exists to ${responsibility.charAt(0).toLowerCase()}${responsibility.slice(1)}.`,
      600
    );
  }

  return explicit ? truncate(explicit, 600) : '';
}

function buildDescription(responsibilityLines: string[], fallbackSentences: string[]) {
  const lines = uniqueCleanLines([...responsibilityLines, ...fallbackSentences], 5);
  return truncate(lines.map(sentenceCase).join('\n'), 1200);
}

function buildProofExpectations(proofLines: string[], mustHaveSkills: ImportedAssignmentSkill[]) {
  const explicit = uniqueCleanLines(proofLines, 3).join(' ');
  if (explicit.length >= 24) return truncate(explicit, 1200);

  const skillLabels = mustHaveSkills.map((skill) => skill.label).slice(0, 4);
  if (skillLabels.length) {
    return truncate(
      `Proof should show comparable work, clear ownership, and evidence for ${skillLabels.join(', ')}.`,
      1200
    );
  }

  return 'Proof should show comparable delivery evidence, clear ownership, and measurable outcomes for this assignment.';
}

function buildMissingFields(draft: Omit<ImportedAssignmentDraft, 'missingFields'>) {
  const missing: string[] = [];
  if (!draft.role) missing.push('Assignment / role title');
  if (!draft.businessValue) missing.push('Role purpose');
  if (!draft.description) missing.push('Main workstreams or responsibilities');
  if (draft.outcomes.length === 0) missing.push('Expected outcomes');
  if (draft.mustHaveSkills.length < 3) missing.push('At least three must-have capabilities');
  if (!draft.compMin || !draft.compMax) missing.push('Compensation range');
  if (draft.locationMode !== 'remote' && !draft.country) missing.push('Location constraint');
  return missing;
}

export function extractAssignmentDraftFromJobDescription(
  source: string
): JobDescriptionImportResult {
  const sourceText = normalizeSourceText(source);
  const rawLines = sourceText
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  const usefulLines = rawLines.map(stripBulletPrefix).filter((line) => wordsIn(line).length >= 3);
  const wordCount = wordsIn(sourceText).length;
  const sourceStats = { wordCount, usefulLineCount: usefulLines.length };

  if (!sourceText || sourceText.length < 140 || wordCount < 30) {
    return {
      ok: false,
      error: 'This looks too short to turn into a useful assignment draft.',
      guidance: LOW_QUALITY_GUIDANCE,
      sourceStats,
    };
  }

  const signalCount = [
    /responsibilit|what you'?ll do|deliverable|outcome/i,
    /requirement|qualification|must[- ]?have|skill/i,
    /location|remote|hybrid|onsite|salary|compensation|hours/i,
    /proof|portfolio|work sample|case study|evidence/i,
  ].filter((pattern) => pattern.test(sourceText)).length;

  if (usefulLines.length < 3 && signalCount < 2) {
    return {
      ok: false,
      error: 'This paste does not include enough recognizable role detail yet.',
      guidance: LOW_QUALITY_GUIDANCE,
      sourceStats,
    };
  }

  const sections = buildSections(rawLines);
  const role = extractRoleTitle(rawLines, sourceText);
  const fallbackSentences = splitSentences(sourceText)
    .filter((sentence) => !role || sentence.toLowerCase() !== role.toLowerCase())
    .slice(0, 5);
  const responsibilityLines = uniqueCleanLines(
    [...sections.responsibilities, ...sections.outcomes],
    6
  );
  const mustHaveSkills = extractCapabilities(sections.mustHave, 6, true);
  const niceToHaveSkills = extractCapabilities(sections.niceToHave, 4);
  const outcomes = uniqueCleanLines(
    [
      ...sections.outcomes,
      ...responsibilityLines.filter((line) =>
        /\b(deliver|own|launch|improve|reduce|increase|build|lead)\b/i.test(line)
      ),
    ],
    4
  ).map(toOutcome);

  const inferredCompensation = inferCompensation(sourceText);
  const draftWithoutMissing = {
    role,
    engagementType: inferEngagementType(sourceText),
    businessValue: buildRolePurpose(role, sections.overview, responsibilityLines),
    description: buildDescription(responsibilityLines, fallbackSentences),
    expectedImpact: buildProofExpectations(sections.proof, mustHaveSkills),
    outcomes,
    mustHaveSkills,
    niceToHaveSkills,
    ...inferLocation(sourceText),
    ...inferHours(sourceText),
    compMin: inferredCompensation.compMin,
    compMax: inferredCompensation.compMax,
    currency: inferredCompensation.currency ?? 'USD',
  };

  const draft: ImportedAssignmentDraft = {
    ...draftWithoutMissing,
    missingFields: buildMissingFields(draftWithoutMissing),
  };

  return {
    ok: true,
    draft,
    guidance: draft.missingFields.length
      ? [
          'Review the imported draft before saving. The pasted job description is source material only.',
          'Confirm missing or unclear fields before internal review.',
        ]
      : [
          'Review the imported draft before saving. The pasted job description is source material only.',
        ],
    sourceStats,
  };
}
