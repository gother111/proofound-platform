import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockSelect = vi.fn();

vi.mock('@/db', () => ({
  db: {
    select: (...args: unknown[]) => mockSelect(...args),
  },
}));

vi.mock('@/db/schema', () => ({
  skillsTaxonomy: {
    code: 'code',
    nameI18n: 'nameI18n',
    aliasesI18n: 'aliasesI18n',
    embedding: 'embedding',
    status: 'status',
  },
}));

interface BenchmarkSkill {
  skill_id: string;
  name: string;
  aliases: string[];
  type: 'technical' | 'soft';
}

interface BenchmarkCase {
  document_id: string;
  file_name: string;
  text: string;
  expected_skill_ids: Set<string>;
  includes_unmapped: boolean;
  difficulty: 'easy' | 'medium' | 'hard';
}

const BENCHMARK_SKILLS: BenchmarkSkill[] = [
  {
    skill_id: 'skill_javascript',
    name: 'JavaScript',
    aliases: ['js', 'ecmascript'],
    type: 'technical',
  },
  { skill_id: 'skill_typescript', name: 'TypeScript', aliases: ['ts'], type: 'technical' },
  { skill_id: 'skill_react', name: 'React', aliases: ['reactjs', 'react.js'], type: 'technical' },
  { skill_id: 'skill_nextjs', name: 'Next.js', aliases: ['nextjs', 'next'], type: 'technical' },
  { skill_id: 'skill_nodejs', name: 'Node.js', aliases: ['nodejs', 'node'], type: 'technical' },
  { skill_id: 'skill_python', name: 'Python', aliases: ['python3', 'py'], type: 'technical' },
  { skill_id: 'skill_java', name: 'Java', aliases: ['jvm'], type: 'technical' },
  {
    skill_id: 'skill_postgresql',
    name: 'PostgreSQL',
    aliases: ['postgres', 'psql'],
    type: 'technical',
  },
  { skill_id: 'skill_mongodb', name: 'MongoDB', aliases: ['mongo'], type: 'technical' },
  { skill_id: 'skill_redis', name: 'Redis', aliases: [], type: 'technical' },
  { skill_id: 'skill_aws', name: 'AWS', aliases: ['amazon web services'], type: 'technical' },
  { skill_id: 'skill_docker', name: 'Docker', aliases: ['containers'], type: 'technical' },
  { skill_id: 'skill_kubernetes', name: 'Kubernetes', aliases: ['k8s', 'kube'], type: 'technical' },
  {
    skill_id: 'skill_github_actions',
    name: 'GitHub Actions',
    aliases: ['gh actions'],
    type: 'technical',
  },
  {
    skill_id: 'skill_ci_cd',
    name: 'CI/CD',
    aliases: ['cicd', 'continuous integration', 'continuous deployment'],
    type: 'technical',
  },
  {
    skill_id: 'skill_c_plus_plus',
    name: 'C++',
    aliases: ['cpp', 'c plus plus'],
    type: 'technical',
  },
  { skill_id: 'skill_c_sharp', name: 'C#', aliases: ['csharp', '.net'], type: 'technical' },
  {
    skill_id: 'skill_jupyter_notebook',
    name: 'Jupyter Notebook',
    aliases: ['jupyter', 'google colab', 'colab', 'ipynb'],
    type: 'technical',
  },
  {
    skill_id: 'skill_machine_learning',
    name: 'Machine Learning',
    aliases: ['ml', 'deep learning'],
    type: 'technical',
  },
  {
    skill_id: 'skill_data_analysis',
    name: 'Data Analysis',
    aliases: ['data analytics'],
    type: 'technical',
  },
  { skill_id: 'skill_jira', name: 'Jira', aliases: ['atlassian jira'], type: 'technical' },
  { skill_id: 'skill_figma', name: 'Figma', aliases: [], type: 'technical' },
  {
    skill_id: 'skill_communication',
    name: 'Communication',
    aliases: ['communication skills'],
    type: 'soft',
  },
  {
    skill_id: 'skill_leadership',
    name: 'Leadership',
    aliases: ['leading teams', 'team lead'],
    type: 'soft',
  },
  {
    skill_id: 'skill_problem_solving',
    name: 'Problem Solving',
    aliases: ['problem-solving', 'analytical'],
    type: 'soft',
  },
  {
    skill_id: 'skill_teamwork',
    name: 'Teamwork',
    aliases: ['collaboration', 'team player'],
    type: 'soft',
  },
];

const UNMAPPED_TERMS = ['rust', 'elixir', 'haskell', 'zig', 'sveltekit'];

const taxonomyRows = BENCHMARK_SKILLS.map((skill) => ({
  code: skill.skill_id,
  nameI18n: { en: skill.name },
  aliasesI18n: skill.aliases.map((alias) => ({ en: alias })),
  embedding: null,
}));

function mockTaxonomyQuery(rows = taxonomyRows) {
  mockSelect.mockReturnValue({
    from: () => ({
      where: async () => rows,
    }),
  });
}

function createSeededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function pickOne<T>(items: T[], random: () => number): T {
  const index = Math.floor(random() * items.length);
  return items[index];
}

function pickManyDistinct<T>(items: T[], count: number, random: () => number): T[] {
  const copy = [...items];
  const picks: T[] = [];

  while (picks.length < count && copy.length > 0) {
    const index = Math.floor(random() * copy.length);
    const [selected] = copy.splice(index, 1);
    picks.push(selected);
  }

  return picks;
}

function maybeTypo(
  term: string,
  random: () => number,
  difficulty: BenchmarkCase['difficulty']
): string {
  if (difficulty !== 'hard' || term.length < 5 || random() >= 0.25) {
    return term;
  }

  // Single-character omission typo for robustness checks.
  const omitIndex = Math.max(1, Math.floor(random() * (term.length - 1)));
  return `${term.slice(0, omitIndex)}${term.slice(omitIndex + 1)}`;
}

function chooseMention(
  skill: BenchmarkSkill,
  random: () => number,
  difficulty: BenchmarkCase['difficulty']
): string {
  const pool = [skill.name, ...skill.aliases];
  const mention = pickOne(pool, random);
  return maybeTypo(mention, random, difficulty);
}

function buildCvText(
  skillMentions: string[],
  includesUnmapped: boolean,
  random: () => number
): string {
  const introTemplates = [
    'Senior engineer with extensive product delivery experience.',
    'Hands-on practitioner with multi-industry project background.',
    'Professional profile focused on scalable systems and measurable outcomes.',
    'Cross-functional specialist delivering measurable business outcomes.',
  ];

  const bulletPrefixTemplates = [
    'Core stack',
    'Tools and technologies',
    'Applied strengths',
    'Delivery toolkit',
  ];

  const mappedSentence = `Delivered projects using ${skillMentions.join(', ')} across production environments.`;
  const mappedBullets = [
    `${pickOne(bulletPrefixTemplates, random)}: ${skillMentions.join(', ')}`,
    `Experience with ${skillMentions.slice(0, Math.max(1, Math.ceil(skillMentions.length / 2))).join(', ')}`,
    `Worked on initiatives involving ${skillMentions.slice(-Math.max(1, Math.ceil(skillMentions.length / 2))).join(', ')}`,
  ];

  const unmappedTerm = includesUnmapped ? pickOne(UNMAPPED_TERMS, random) : null;
  const unmappedLine = unmappedTerm
    ? `2 years of experience in ${unmappedTerm} for side projects.`
    : '';

  return [
    pickOne(introTemplates, random),
    mappedSentence,
    ...mappedBullets.map((bullet) => `- ${bullet}`),
    unmappedLine,
  ]
    .filter(Boolean)
    .join('\n');
}

function buildBenchmarkCases(total: number, seed = 42): BenchmarkCase[] {
  const random = createSeededRandom(seed);
  const cases: BenchmarkCase[] = [];

  for (let index = 0; index < total; index++) {
    const roll = random();
    const difficulty: BenchmarkCase['difficulty'] =
      roll < 0.55 ? 'easy' : roll < 0.85 ? 'medium' : 'hard';
    const skillCount = difficulty === 'easy' ? 3 : difficulty === 'medium' ? 4 : 5;
    const selectedSkills = pickManyDistinct(BENCHMARK_SKILLS, skillCount, random);
    const includesUnmapped = difficulty === 'hard' && random() < 0.6;
    const mentions = selectedSkills.map((skill) => chooseMention(skill, random, difficulty));
    const text = buildCvText(mentions, includesUnmapped, random);

    cases.push({
      document_id: `bench-${index + 1}`,
      file_name: `bench-${index + 1}.pdf`,
      text,
      expected_skill_ids: new Set(selectedSkills.map((skill) => skill.skill_id)),
      includes_unmapped: includesUnmapped,
      difficulty,
    });
  }

  return cases;
}

describe('cv-import-suggest 1000-case benchmark', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    mockTaxonomyQuery();
  });

  it('achieves high precision and strong recall across 1000 diverse CV-like documents', async () => {
    const { suggestSkillsForDocuments } = await import('@/lib/expertise/cv-import-suggest');

    const benchmarkCases = buildBenchmarkCases(1000);

    const response = await suggestSkillsForDocuments(
      {
        documents: benchmarkCases.map((item) => ({
          document_id: item.document_id,
          file_name: item.file_name,
          text: item.text,
          context: 'cv' as const,
        })),
      },
      {
        maxDocuments: 1200,
        maxCharsPerDocument: 8000,
        maxTotalChars: 8_000_000,
      },
      {
        semanticEnabled: false,
        fuzzyThreshold: 0.8,
        suggestionsLimit: 8,
      }
    );

    const docsById = new Map(
      response.documents.map((document) => [document.document_id, document])
    );

    let truePositive = 0;
    let falsePositive = 0;
    let falseNegative = 0;
    let evidenceCandidates = 0;
    let candidatesWithEvidence = 0;
    let unmappedHardCases = 0;
    let unmappedHandled = 0;
    const falsePositiveSkillCounts = new Map<string, number>();
    const falsePositiveExamples: Array<{
      document_id: string;
      skill_id: string;
      raw_skill_text: string;
    }> = [];

    for (const benchmarkCase of benchmarkCases) {
      const result = docsById.get(benchmarkCase.document_id);
      expect(result).toBeDefined();

      const predictedIds = new Set<string>();
      for (const candidate of result!.candidates) {
        evidenceCandidates += 1;
        if (candidate.evidence_snippets.length > 0) {
          candidatesWithEvidence += 1;
        }
        for (const suggestion of candidate.suggestions) {
          predictedIds.add(suggestion.skill_id);
          if (!benchmarkCase.expected_skill_ids.has(suggestion.skill_id)) {
            falsePositiveSkillCounts.set(
              suggestion.skill_id,
              (falsePositiveSkillCounts.get(suggestion.skill_id) || 0) + 1
            );
            if (falsePositiveExamples.length < 20) {
              falsePositiveExamples.push({
                document_id: benchmarkCase.document_id,
                skill_id: suggestion.skill_id,
                raw_skill_text: candidate.raw_skill_text,
              });
            }
          }
        }
      }

      for (const skillId of predictedIds) {
        if (benchmarkCase.expected_skill_ids.has(skillId)) {
          truePositive += 1;
        } else {
          falsePositive += 1;
        }
      }

      for (const skillId of benchmarkCase.expected_skill_ids) {
        if (!predictedIds.has(skillId)) {
          falseNegative += 1;
        }
      }

      if (benchmarkCase.includes_unmapped) {
        unmappedHardCases += 1;
        const hasUnmappedCandidate = result!.candidates.some(
          (candidate) => candidate.unmapped_candidate
        );
        if (hasUnmappedCandidate) {
          unmappedHandled += 1;
        }
      }
    }

    const precision = truePositive / Math.max(truePositive + falsePositive, 1);
    const recall = truePositive / Math.max(truePositive + falseNegative, 1);
    const f1 = (2 * precision * recall) / Math.max(precision + recall, Number.EPSILON);
    const evidenceCoverage = candidatesWithEvidence / Math.max(evidenceCandidates, 1);
    const unmappedHandlingRate = unmappedHandled / Math.max(unmappedHardCases, 1);
    const topFalsePositiveSkills = Array.from(falsePositiveSkillCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    // Report metrics in test output for transparent tracking.
    console.log(
      JSON.stringify(
        {
          benchmark_size: benchmarkCases.length,
          precision: Number(precision.toFixed(4)),
          recall: Number(recall.toFixed(4)),
          f1: Number(f1.toFixed(4)),
          evidence_coverage: Number(evidenceCoverage.toFixed(4)),
          unmapped_handling_rate: Number(unmappedHandlingRate.toFixed(4)),
          totals: {
            true_positive: truePositive,
            false_positive: falsePositive,
            false_negative: falseNegative,
            unmapped_hard_cases: unmappedHardCases,
          },
          top_false_positive_skills: topFalsePositiveSkills,
          false_positive_examples: falsePositiveExamples,
        },
        null,
        2
      )
    );

    expect(precision).toBeGreaterThanOrEqual(0.85);
    expect(recall).toBeGreaterThanOrEqual(0.8);
    expect(f1).toBeGreaterThanOrEqual(0.82);
    expect(evidenceCoverage).toBe(1);
    expect(unmappedHandlingRate).toBeGreaterThanOrEqual(0.75);
  });
});
