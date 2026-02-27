import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockExtractSkillPhrases = vi.fn();
const mockGetSkillVariations = vi.fn();
const mockGenerateEmbedding = vi.fn();
const mockCosineSimilarity = vi.fn();
const mockSelect = vi.fn();

vi.mock('@/lib/ai/nlp-extractor', () => ({
  extractSkillPhrases: (...args: unknown[]) => mockExtractSkillPhrases(...args),
  getSkillVariations: (...args: unknown[]) => mockGetSkillVariations(...args),
}));

vi.mock('@/lib/ai/embedding-service', () => ({
  generateEmbedding: (...args: unknown[]) => mockGenerateEmbedding(...args),
  cosineSimilarity: (...args: unknown[]) => mockCosineSimilarity(...args),
}));

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
    code: 'skill_react',
    nameI18n: { en: 'React' },
    aliasesI18n: [{ en: 'ReactJS' }],
    embedding: [0.2, 0.4],
  },
  {
    code: 'skill_typescript',
    nameI18n: { en: 'TypeScript' },
    aliasesI18n: [{ en: 'TS' }],
    embedding: [0.3, 0.5],
  },
];

function mockTaxonomyQuery(rows = taxonomyRows) {
  mockSelect.mockReturnValue({
    from: () => ({
      where: async () => rows,
    }),
  });
}

describe('cv-import-suggest service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    mockTaxonomyQuery();
    mockGetSkillVariations.mockReturnValue([]);
    mockGenerateEmbedding.mockResolvedValue([0.21, 0.39]);
    mockCosineSimilarity.mockReturnValue(0.8);
  });

  it('rejects extracted candidates when no exact evidence snippet exists in source text', async () => {
    mockExtractSkillPhrases.mockReturnValue({
      phrases: [{ text: 'Kubernetes', type: 'skill', confidence: 0.91 }],
    });

    const { suggestSkillsForDocuments } = await import('@/lib/expertise/cv-import-suggest');

    const response = await suggestSkillsForDocuments(
      {
        documents: [
          {
            document_id: 'doc-1',
            file_name: 'cv.pdf',
            text: 'This CV only mentions React and TypeScript.',
            context: 'cv',
          },
        ],
      },
      {
        maxDocuments: 5,
        maxCharsPerDocument: 10000,
        maxTotalChars: 20000,
      },
      {
        semanticEnabled: false,
      }
    );

    expect(response.documents[0].candidates).toHaveLength(0);
  });

  it('prioritizes exact matches ahead of lower-confidence methods', async () => {
    mockExtractSkillPhrases.mockReturnValue({
      phrases: [{ text: 'React', type: 'skill', confidence: 0.88 }],
    });

    const { suggestSkillsForDocuments } = await import('@/lib/expertise/cv-import-suggest');

    const response = await suggestSkillsForDocuments(
      {
        documents: [
          {
            document_id: 'doc-2',
            file_name: 'cv.pdf',
            text: 'I shipped multiple React and ReactJS dashboards.',
            context: 'cv',
          },
        ],
      },
      {
        maxDocuments: 5,
        maxCharsPerDocument: 10000,
        maxTotalChars: 20000,
      },
      {
        semanticEnabled: true,
        fuzzyThreshold: 0.5,
      }
    );

    const candidate = response.documents[0].candidates[0];

    expect(candidate).toBeDefined();
    expect(candidate.evidence_snippets.length).toBeGreaterThan(0);
    expect(candidate.suggestions[0].skill_id).toBe('skill_react');
    expect(candidate.suggestions[0].match_method).toBe('exact');
  });

  it('falls back to fuzzy-only suggestions when semantic scoring fails', async () => {
    mockExtractSkillPhrases.mockReturnValue({
      phrases: [{ text: 'Type script', type: 'skill', confidence: 0.79 }],
    });
    mockGenerateEmbedding.mockRejectedValue(new Error('semantic model unavailable'));

    const { suggestSkillsForDocuments } = await import('@/lib/expertise/cv-import-suggest');

    const response = await suggestSkillsForDocuments(
      {
        documents: [
          {
            document_id: 'doc-3',
            file_name: 'cv.pdf',
            text: 'Built backend services in Type script for analytics.',
            context: 'cv',
          },
        ],
      },
      {
        maxDocuments: 5,
        maxCharsPerDocument: 10000,
        maxTotalChars: 20000,
      },
      {
        semanticEnabled: true,
        fuzzyThreshold: 0.4,
      }
    );

    const candidate = response.documents[0].candidates[0];

    expect(response.metadata.semantic_used).toBe(true);
    expect(response.metadata.semantic_fallback_triggered).toBe(true);
    expect(candidate.suggestions.some((suggestion) => suggestion.match_method === 'fuzzy')).toBe(
      true
    );
  });
});
