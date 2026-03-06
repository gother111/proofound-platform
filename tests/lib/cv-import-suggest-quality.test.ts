import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockSelect = vi.fn();
const mockExecute = vi.fn();

vi.mock('@/db', () => ({
  db: {
    select: (...args: unknown[]) => mockSelect(...args),
    execute: (...args: unknown[]) => mockExecute(...args),
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

const taxonomyRows = [
  {
    code: 'skill_react',
    nameI18n: { en: 'React' },
    aliasesI18n: [{ en: 'ReactJS' }],
    embedding: null,
  },
  {
    code: 'skill_typescript',
    nameI18n: { en: 'TypeScript' },
    aliasesI18n: [{ en: 'TS' }],
    embedding: null,
  },
  {
    code: 'skill_nodejs',
    nameI18n: { en: 'Node.js' },
    aliasesI18n: [{ en: 'NodeJS' }, { en: 'Node' }],
    embedding: null,
  },
  {
    code: 'skill_nextjs',
    nameI18n: { en: 'Next.js' },
    aliasesI18n: [{ en: 'NextJS' }],
    embedding: null,
  },
  {
    code: 'skill_python',
    nameI18n: { en: 'Python' },
    aliasesI18n: [{ en: 'Python3' }],
    embedding: null,
  },
  {
    code: 'skill_jupyter_notebook',
    nameI18n: { en: 'Jupyter Notebook' },
    aliasesI18n: [{ en: 'Jupyter' }, { en: 'Google Colab' }, { en: 'Colab' }, { en: 'ipynb' }],
    embedding: null,
  },
  {
    code: 'skill_c_plus_plus',
    nameI18n: { en: 'C++' },
    aliasesI18n: [{ en: 'cpp' }, { en: 'c plus plus' }],
    embedding: null,
  },
  {
    code: 'skill_c_sharp',
    nameI18n: { en: 'C#' },
    aliasesI18n: [{ en: 'csharp' }, { en: '.net' }],
    embedding: null,
  },
  {
    code: 'skill_ci_cd',
    nameI18n: { en: 'CI/CD' },
    aliasesI18n: [
      { en: 'cicd' },
      { en: 'continuous integration' },
      { en: 'continuous deployment' },
    ],
    embedding: null,
  },
  {
    code: 'skill_github_actions',
    nameI18n: { en: 'GitHub Actions' },
    aliasesI18n: [{ en: 'gh actions' }],
    embedding: null,
  },
  {
    code: 'skill_docker',
    nameI18n: { en: 'Docker' },
    aliasesI18n: [{ en: 'containers' }],
    embedding: null,
  },
  {
    code: 'skill_kubernetes',
    nameI18n: { en: 'Kubernetes' },
    aliasesI18n: [{ en: 'k8s' }],
    embedding: null,
  },
  {
    code: 'skill_communication',
    nameI18n: { en: 'Communication' },
    aliasesI18n: [{ en: 'communication skills' }],
    embedding: null,
  },
  {
    code: 'skill_leadership',
    nameI18n: { en: 'Leadership' },
    aliasesI18n: [{ en: 'leading teams' }],
    embedding: null,
  },
];

function mockTaxonomyQuery(rows = taxonomyRows) {
  mockSelect.mockReturnValue({
    from: () => ({
      where: async () => rows,
    }),
  });

  mockExecute.mockResolvedValue([
    { skill_code: 'skill_react', alias: 'ReactJS', alias_norm: 'reactjs', confidence: 0.98 },
    {
      skill_code: 'skill_typescript',
      alias: 'TS',
      alias_norm: 'ts',
      confidence: 0.92,
    },
    { skill_code: 'skill_nodejs', alias: 'Node.js', alias_norm: 'nodejs', confidence: 1 },
    { skill_code: 'skill_nodejs', alias: 'NodeJS', alias_norm: 'nodejs', confidence: 0.98 },
    { skill_code: 'skill_nextjs', alias: 'NextJS', alias_norm: 'nextjs', confidence: 0.98 },
    { skill_code: 'skill_python', alias: 'Python3', alias_norm: 'python3', confidence: 0.94 },
    {
      skill_code: 'skill_jupyter_notebook',
      alias: 'Google Colab',
      alias_norm: 'google colab',
      confidence: 0.94,
    },
    { skill_code: 'skill_c_plus_plus', alias: 'C++', alias_norm: 'cplusplus', confidence: 1 },
    { skill_code: 'skill_c_sharp', alias: 'C#', alias_norm: 'csharp', confidence: 1 },
    { skill_code: 'skill_ci_cd', alias: 'CI/CD', alias_norm: 'cicd', confidence: 1 },
  ]);
}

function collectSuggestedIds(
  candidates: Array<{ suggestions: Array<{ skill_id: string }> }>
): Set<string> {
  const ids = new Set<string>();
  for (const candidate of candidates) {
    for (const suggestion of candidate.suggestions) {
      ids.add(suggestion.skill_id);
    }
  }
  return ids;
}

function normalizeCandidateText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9+#]+/g, '')
    .trim();
}

describe('cv-import-suggest quality benchmark', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    mockTaxonomyQuery();
  });

  it('maps diverse CV text snippets to expected taxonomy skill_ids with evidence', async () => {
    const { suggestSkillsForDocuments } = await import('@/lib/expertise/cv-import-suggest');

    const inputs = [
      {
        document_id: 'cv-frontend',
        file_name: 'frontend.pdf',
        text: 'Senior engineer building React and Next.js products in TypeScript and Node.js for SaaS apps.',
        expectedIds: ['skill_react', 'skill_nextjs', 'skill_typescript', 'skill_nodejs'],
      },
      {
        document_id: 'cv-ml',
        file_name: 'ml.pdf',
        text: 'Built ML pipelines in Python using Jupyter Notebook and Google Colab for model iteration.',
        expectedIds: ['skill_python', 'skill_jupyter_notebook'],
      },
      {
        document_id: 'cv-devops',
        file_name: 'devops.pdf',
        text: 'Implemented CI/CD with GitHub Actions and deployed C++ and C# services to Docker and Kubernetes.',
        expectedIds: [
          'skill_ci_cd',
          'skill_github_actions',
          'skill_c_plus_plus',
          'skill_c_sharp',
          'skill_docker',
          'skill_kubernetes',
        ],
      },
      {
        document_id: 'cv-soft',
        file_name: 'soft.pdf',
        text: 'Strong communication and leadership skills while mentoring cross-functional engineering teams.',
        expectedIds: ['skill_communication', 'skill_leadership'],
      },
    ];

    const response = await suggestSkillsForDocuments(
      {
        documents: inputs.map((input) => ({
          document_id: input.document_id,
          file_name: input.file_name,
          text: input.text,
          context: 'cv' as const,
        })),
      },
      {
        maxDocuments: 10,
        maxCharsPerDocument: 30000,
        maxTotalChars: 100000,
      },
      {
        semanticEnabled: false,
        fuzzyThreshold: 0.7,
      }
    );

    for (const input of inputs) {
      const result = response.documents.find((item) => item.document_id === input.document_id);
      expect(result, `missing document result for ${input.document_id}`).toBeDefined();
      const suggestions = collectSuggestedIds(result!.candidates);

      for (const expectedId of input.expectedIds) {
        expect(suggestions.has(expectedId), `expected ${expectedId} for ${input.document_id}`).toBe(
          true
        );
      }

      for (const candidate of result!.candidates) {
        expect(candidate.evidence_snippets.length).toBeGreaterThan(0);
        for (const snippet of candidate.evidence_snippets) {
          expect(input.text.toLowerCase()).toContain(snippet.toLowerCase());
        }
      }
    }

    const devopsResult = response.documents.find((item) => item.document_id === 'cv-devops');
    const cPlusPlusCandidate = devopsResult?.candidates.find((candidate) =>
      normalizeCandidateText(candidate.raw_skill_text).includes('c++')
    );
    const cSharpCandidate = devopsResult?.candidates.find((candidate) =>
      normalizeCandidateText(candidate.raw_skill_text).includes('c#')
    );

    expect(cPlusPlusCandidate?.suggestions[0]?.skill_id).toBe('skill_c_plus_plus');
    expect(cPlusPlusCandidate?.suggestions[0]?.skill_id).not.toBe('skill_c_sharp');
    expect(cSharpCandidate?.suggestions[0]?.skill_id).toBe('skill_c_sharp');
    expect(cSharpCandidate?.suggestions[0]?.skill_id).not.toBe('skill_c_plus_plus');

    const frontendResult = response.documents.find((item) => item.document_id === 'cv-frontend');
    const nodeCandidate = frontendResult?.candidates.find((candidate) =>
      normalizeCandidateText(candidate.raw_skill_text).includes('nodejs')
    );

    expect(nodeCandidate?.suggestions[0]?.skill_id).toBe('skill_nodejs');
  });

  it('keeps unmapped candidates excluded from suggestions until manually mapped', async () => {
    const { suggestSkillsForDocuments } = await import('@/lib/expertise/cv-import-suggest');

    const response = await suggestSkillsForDocuments(
      {
        documents: [
          {
            document_id: 'cv-unmapped',
            file_name: 'unmapped.pdf',
            text: 'Designed low-latency engines in Rust and optimized performance profiling workflows.',
            context: 'cv',
          },
        ],
      },
      {
        maxDocuments: 5,
        maxCharsPerDocument: 30000,
        maxTotalChars: 50000,
      },
      {
        semanticEnabled: false,
        fuzzyThreshold: 0.8,
      }
    );

    const rustCandidate = response.documents[0].candidates.find((candidate) =>
      candidate.raw_skill_text.toLowerCase().includes('rust')
    );

    expect(rustCandidate).toBeDefined();
    expect(rustCandidate?.unmapped_candidate).toBe(true);
    expect(rustCandidate?.suggestions).toHaveLength(0);
  });

  it('remains deterministic across repeated runs with the same multi-CV payload', async () => {
    const { suggestSkillsForDocuments } = await import('@/lib/expertise/cv-import-suggest');
    const request = {
      documents: [
        {
          document_id: 'repeat-1',
          file_name: 'repeat-1.pdf',
          text: 'React, TypeScript, Node.js and Next.js were used in production projects.',
          context: 'cv' as const,
        },
        {
          document_id: 'repeat-2',
          file_name: 'repeat-2.pdf',
          text: 'Built CI/CD with GitHub Actions and containerized workloads with Docker.',
          context: 'cv' as const,
        },
      ],
    };

    const runSignatures: string[] = [];

    for (let run = 0; run < 8; run++) {
      const response = await suggestSkillsForDocuments(
        request,
        {
          maxDocuments: 5,
          maxCharsPerDocument: 30000,
          maxTotalChars: 50000,
        },
        {
          semanticEnabled: false,
          fuzzyThreshold: 0.72,
        }
      );

      const signature = JSON.stringify(
        response.documents.map((document) => ({
          document_id: document.document_id,
          candidates: document.candidates.map((candidate) => ({
            raw_skill_text: candidate.raw_skill_text,
            suggestion_ids: candidate.suggestions.map((suggestion) => suggestion.skill_id),
            unmapped_candidate: candidate.unmapped_candidate,
          })),
        }))
      );

      runSignatures.push(signature);
    }

    const first = runSignatures[0];
    for (const signature of runSignatures.slice(1)) {
      expect(signature).toBe(first);
    }
  });

  it('passes precision fixture scenarios for include and exclude candidate text', async () => {
    const { suggestSkillsForDocuments } = await import('@/lib/expertise/cv-import-suggest');
    const fixturePath = join(
      process.cwd(),
      'tests',
      'fixtures',
      'cv-import',
      'precision-scenarios.json'
    );
    const fixture = JSON.parse(readFileSync(fixturePath, 'utf8')) as {
      scenarios: Array<{
        id: string;
        text: string;
        must_include: string[];
        must_exclude: string[];
      }>;
    };

    for (const scenario of fixture.scenarios) {
      const response = await suggestSkillsForDocuments(
        {
          documents: [
            {
              document_id: scenario.id,
              file_name: `${scenario.id}.pdf`,
              text: scenario.text,
              context: 'cv',
            },
          ],
        },
        {
          maxDocuments: 5,
          maxCharsPerDocument: 30000,
          maxTotalChars: 50000,
        },
        {
          semanticEnabled: false,
          fuzzyThreshold: 0.76,
        }
      );

      const rawCandidates = new Set(
        response.documents[0].candidates.map((candidate) => candidate.raw_skill_text.toLowerCase())
      );
      const normalizedCandidates = Array.from(rawCandidates).map((value) =>
        normalizeCandidateText(value)
      );

      for (const mustInclude of scenario.must_include) {
        const expected = normalizeCandidateText(mustInclude);
        expect(
          normalizedCandidates.some((value) => value.includes(expected)),
          `expected include "${mustInclude}" in scenario "${scenario.id}"`
        ).toBe(true);
      }

      for (const mustExclude of scenario.must_exclude) {
        const unexpected = normalizeCandidateText(mustExclude);
        expect(
          normalizedCandidates.some((value) => value.includes(unexpected)),
          `expected exclude "${mustExclude}" in scenario "${scenario.id}"`
        ).toBe(false);
      }
    }
  });
});
