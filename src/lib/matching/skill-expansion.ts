import { normalizePhrase, phraseVariants } from '@/lib/matching/normalize';
import type { SkillRelationStrength, SkillSignal } from '@/lib/matching/types';

type AdjacentSeed = {
  phrase: string;
  strength: Exclude<SkillRelationStrength, 'direct' | 'alias'>;
};

type SkillSeed = {
  canonical: string;
  aliases: string[];
  adjacent: AdjacentSeed[];
};

const SKILL_SEEDS: SkillSeed[] = [
  {
    canonical: 'user research',
    aliases: [
      'customer interviews',
      'customer interview',
      'user interviews',
      'customer discovery',
      'research interviews',
      'discovery interviews',
    ],
    adjacent: [
      { phrase: 'product discovery', strength: 'near' },
      { phrase: 'ux research', strength: 'near' },
      { phrase: 'customer insights', strength: 'moderate' },
    ],
  },
  {
    canonical: 'frontend',
    aliases: ['front end', 'front-end', 'frontend engineering', 'front end engineering'],
    adjacent: [
      { phrase: 'react', strength: 'near' },
      { phrase: 'web interface', strength: 'moderate' },
      { phrase: 'ui implementation', strength: 'moderate' },
    ],
  },
  {
    canonical: 'javascript',
    aliases: ['js', 'java script', 'ecmascript'],
    adjacent: [
      { phrase: 'typescript', strength: 'near' },
      { phrase: 'frontend', strength: 'moderate' },
      { phrase: 'node', strength: 'moderate' },
    ],
  },
  {
    canonical: 'product operations',
    aliases: ['product ops', 'product operation', 'product operating model'],
    adjacent: [
      { phrase: 'workflow design', strength: 'near' },
      { phrase: 'operations design', strength: 'near' },
      { phrase: 'process design', strength: 'moderate' },
      { phrase: 'program operations', strength: 'moderate' },
      { phrase: 'project operations', strength: 'weak' },
    ],
  },
  {
    canonical: 'workflow design',
    aliases: ['operations design', 'process design', 'workflow redesign'],
    adjacent: [
      { phrase: 'product operations', strength: 'near' },
      { phrase: 'service design', strength: 'moderate' },
      { phrase: 'program operations', strength: 'moderate' },
    ],
  },
  {
    canonical: 'onboarding',
    aliases: ['user onboarding', 'customer onboarding', 'new user activation'],
    adjacent: [
      { phrase: 'support operations', strength: 'moderate' },
      { phrase: 'customer success', strength: 'moderate' },
      { phrase: 'knowledge base', strength: 'weak' },
    ],
  },
  {
    canonical: 'support operations',
    aliases: ['support ops', 'customer support operations', 'support workflow'],
    adjacent: [
      { phrase: 'onboarding', strength: 'moderate' },
      { phrase: 'customer success', strength: 'near' },
      { phrase: 'operations design', strength: 'moderate' },
    ],
  },
];

type ExpansionEntry = {
  phrase: string;
  normalized: string;
  canonical: string;
  relationStrength: SkillRelationStrength;
};

function seedEntries(seed: SkillSeed): ExpansionEntry[] {
  const canonical = normalizePhrase(seed.canonical);
  const entries: ExpansionEntry[] = [
    {
      phrase: seed.canonical,
      normalized: canonical,
      canonical,
      relationStrength: 'direct',
    },
  ];

  for (const alias of seed.aliases) {
    for (const variant of phraseVariants(alias)) {
      entries.push({
        phrase: alias,
        normalized: variant,
        canonical,
        relationStrength: 'alias',
      });
    }
  }

  for (const adjacent of seed.adjacent) {
    for (const variant of phraseVariants(adjacent.phrase)) {
      entries.push({
        phrase: adjacent.phrase,
        normalized: variant,
        canonical,
        relationStrength: adjacent.strength,
      });
    }
  }

  return entries;
}

const EXPANSION_ENTRIES = SKILL_SEEDS.flatMap(seedEntries);

export function expandSkillPhrase(input: string | null | undefined): SkillSignal[] {
  const normalizedInput = normalizePhrase(input);
  if (!normalizedInput) return [];

  const signals = new Map<string, SkillSignal>();
  const add = (signal: SkillSignal) => {
    const key = `${signal.normalized}:${signal.relationStrength ?? signal.source}`;
    if (!signals.has(key)) {
      signals.set(key, signal);
    }
  };

  add({
    raw: input ?? '',
    normalized: normalizedInput,
    source: 'canonical_skill',
    canonical: normalizedInput,
    relationStrength: 'direct',
  });

  for (const variant of phraseVariants(input)) {
    add({
      raw: input ?? '',
      normalized: variant,
      source: 'canonical_skill',
      canonical: normalizedInput,
      relationStrength: 'direct',
    });
  }

  const matchingSeed =
    EXPANSION_ENTRIES.find(
      (entry) => entry.normalized === normalizedInput && entry.relationStrength === 'direct'
    ) ?? EXPANSION_ENTRIES.find((entry) => entry.normalized === normalizedInput);
  const canonical = matchingSeed?.canonical ?? normalizedInput;
  for (const entry of EXPANSION_ENTRIES) {
    if (entry.canonical !== canonical && entry.normalized !== normalizedInput) {
      continue;
    }
    const relationStrength =
      matchingSeed &&
      matchingSeed.relationStrength !== 'direct' &&
      matchingSeed.relationStrength !== 'alias'
        ? matchingSeed.relationStrength
        : matchingSeed &&
            matchingSeed.relationStrength === 'alias' &&
            entry.relationStrength === 'direct'
          ? 'alias'
          : entry.relationStrength;

    add({
      raw: entry.phrase,
      normalized: entry.normalized,
      source:
        relationStrength === 'direct'
          ? 'canonical_skill'
          : relationStrength === 'alias'
            ? 'alias'
            : 'adjacent_skill',
      canonical: entry.canonical,
      relationStrength,
    });
  }

  return [...signals.values()].sort((left, right) =>
    `${left.relationStrength}:${left.normalized}`.localeCompare(
      `${right.relationStrength}:${right.normalized}`
    )
  );
}

export function expandSkillSignals(signals: SkillSignal[]): SkillSignal[] {
  const expanded = new Map<string, SkillSignal>();
  for (const signal of signals) {
    for (const variant of expandSkillPhrase(signal.raw || signal.normalized)) {
      const key = `${variant.normalized}:${variant.relationStrength ?? variant.source}`;
      expanded.set(key, {
        ...variant,
        evidenceRef: signal.evidenceRef ?? variant.evidenceRef,
      });
    }
  }
  return [...expanded.values()];
}

export function relationWeight(strength: SkillRelationStrength | undefined): number {
  switch (strength) {
    case 'direct':
      return 40;
    case 'alias':
      return 32;
    case 'near':
      return 22;
    case 'moderate':
      return 14;
    case 'weak':
      return 8;
    default:
      return 4;
  }
}
