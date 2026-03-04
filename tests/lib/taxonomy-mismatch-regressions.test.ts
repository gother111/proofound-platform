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

  it('keeps ambiguous short tokens unmapped without explicit disambiguation evidence', async () => {
    const { suggestSkillsForDocuments } = await import('@/lib/expertise/cv-import-suggest');

    const response = await suggestSkillsForDocuments(
      {
        documents: [
          {
            document_id: 'ambiguous-short',
            file_name: 'ambiguous-short.pdf',
            text: ['Skills', 'Go, R, PM', 'Experience', 'Worked with distributed teams.'].join(
              '\n'
            ),
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

    const ambiguousCandidates = response.documents[0].candidates.filter((candidate) =>
      ['go', 'r', 'pm'].includes(normalize(candidate.raw_skill_text))
    );

    expect(ambiguousCandidates.length).toBeGreaterThan(0);
    for (const candidate of ambiguousCandidates) {
      expect(candidate.unmapped_candidate).toBe(true);
      expect(candidate.suggestions).toHaveLength(0);
    }
  });

  it('maps ambiguous tokens when explicit disambiguating evidence is present', async () => {
    const { suggestSkillsForDocuments } = await import('@/lib/expertise/cv-import-suggest');

    const response = await suggestSkillsForDocuments(
      {
        documents: [
          {
            document_id: 'disambiguated-go',
            file_name: 'disambiguated-go.pdf',
            text: 'Built backend microservices in Go language and optimized goroutine throughput.',
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

    const goCandidate = response.documents[0].candidates.find((candidate) =>
      normalize(candidate.raw_skill_text).includes('go')
    );
    expect(goCandidate).toBeDefined();
    expect(goCandidate?.unmapped_candidate).toBe(false);
    expect(goCandidate?.suggestions[0]?.skill_id).toBe('skill_go');
  });

  it('prioritizes React Native over React for React Native phrases', async () => {
    const { suggestSkillsForDocuments } = await import('@/lib/expertise/cv-import-suggest');

    const response = await suggestSkillsForDocuments(
      {
        documents: [
          {
            document_id: 'react-native',
            file_name: 'react-native.pdf',
            text: 'Built React Native mobile applications with Expo and TypeScript.',
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

    const reactNativeCandidate = response.documents[0].candidates.find((candidate) =>
      candidate.suggestions.some((suggestion) => suggestion.skill_id === 'skill_react_native')
    );

    expect(reactNativeCandidate).toBeDefined();
    expect(reactNativeCandidate?.suggestions[0]?.skill_id).toBe('skill_react_native');
    expect(reactNativeCandidate?.suggestions[0]?.match_method).toMatch(/exact|synonym/);
  });
});
