import { readFileSync } from 'node:fs';
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

const taxonomyRows = [
  {
    code: 'skill_go',
    nameI18n: { en: 'Go' },
    aliasesI18n: [{ en: 'Golang' }, { en: 'Go language' }],
    embedding: null,
  },
  {
    code: 'skill_r',
    nameI18n: { en: 'R' },
    aliasesI18n: [{ en: 'R language' }, { en: 'RStudio' }],
    embedding: null,
  },
  {
    code: 'skill_project_management',
    nameI18n: { en: 'Project Management' },
    aliasesI18n: [{ en: 'PM' }, { en: 'Project Manager' }],
    embedding: null,
  },
  {
    code: 'skill_react',
    nameI18n: { en: 'React' },
    aliasesI18n: [{ en: 'ReactJS' }],
    embedding: null,
  },
  {
    code: 'skill_react_native',
    nameI18n: { en: 'React Native' },
    aliasesI18n: [{ en: 'RN' }],
    embedding: null,
  },
];

const scenarios = JSON.parse(
  readFileSync('tests/fixtures/cv-import/taxonomy-mismatch-scenarios.json', 'utf8')
) as {
  mustRemainUnmapped: Array<{
    id: string;
    file_name: string;
    text: string;
    expected_raw_tokens?: string[];
    forbidden_raw_tokens?: string[];
  }>;
  mustMap: Array<{
    id: string;
    file_name: string;
    text: string;
    raw_token: string;
    expected_skill_id: string;
  }>;
  mustNotMap: Array<{
    id: string;
    file_name: string;
    text: string;
    raw_token: string;
    forbidden_skill_id: string;
  }>;
};

function mockTaxonomyQuery(rows = taxonomyRows) {
  mockSelect.mockReturnValue({
    from: () => ({
      where: async () => rows,
    }),
  });
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9+#]+/g, '')
    .trim();
}

describe('taxonomy mismatch regressions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    mockTaxonomyQuery();
  });

  it('keeps ambiguous or noisy scenarios unresolved when required', async () => {
    const { suggestSkillsForDocuments } = await import('@/lib/expertise/cv-import-suggest');

    for (const scenario of scenarios.mustRemainUnmapped) {
      const response = await suggestSkillsForDocuments(
        {
          documents: [
            {
              document_id: scenario.id,
              file_name: scenario.file_name,
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
        }
      );

      if (scenario.expected_raw_tokens?.length) {
        const ambiguousCandidates = response.documents[0].candidates.filter((candidate) =>
          scenario.expected_raw_tokens?.includes(normalize(candidate.raw_skill_text))
        );

        expect(ambiguousCandidates.length).toBeGreaterThan(0);
        for (const candidate of ambiguousCandidates) {
          expect(candidate.unmapped_candidate).toBe(true);
          expect(candidate.suggestions.length).toBeGreaterThan(0);
        }
      }

      if (scenario.forbidden_raw_tokens?.length) {
        const allRawTokens = response.documents[0].candidates.map((candidate) =>
          normalize(candidate.raw_skill_text)
        );
        for (const forbidden of scenario.forbidden_raw_tokens) {
          expect(allRawTokens).not.toContain(normalize(forbidden));
        }
      }
    }
  });

  it('maps curated benchmark scenarios to the expected taxonomy target', async () => {
    const { suggestSkillsForDocuments } = await import('@/lib/expertise/cv-import-suggest');

    for (const scenario of scenarios.mustMap) {
      const response = await suggestSkillsForDocuments(
        {
          documents: [
            {
              document_id: scenario.id,
              file_name: scenario.file_name,
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
        }
      );

      const candidate = response.documents[0].candidates.find((entry) =>
        normalize(entry.raw_skill_text).includes(normalize(scenario.raw_token))
      );

      expect(candidate).toBeDefined();
      expect(candidate?.unmapped_candidate).toBe(false);
      expect(candidate?.suggestions[0]?.skill_id).toBe(scenario.expected_skill_id);
    }
  });

  it('does not map curated benchmark scenarios to the forbidden taxonomy target', async () => {
    const { suggestSkillsForDocuments } = await import('@/lib/expertise/cv-import-suggest');

    for (const scenario of scenarios.mustNotMap) {
      const response = await suggestSkillsForDocuments(
        {
          documents: [
            {
              document_id: scenario.id,
              file_name: scenario.file_name,
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
        }
      );

      const candidate = response.documents[0].candidates.find((entry) =>
        normalize(entry.raw_skill_text).includes(normalize(scenario.raw_token))
      );

      expect(candidate).toBeDefined();
      expect(candidate?.suggestions[0]?.skill_id).not.toBe(scenario.forbidden_skill_id);
    }
  });
});
