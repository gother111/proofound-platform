import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockSuggestSkillsForDocuments = vi.fn();

vi.mock('@/lib/expertise/cv-import-suggest', async () => {
  const actual = await vi.importActual<typeof import('@/lib/expertise/cv-import-suggest')>(
    '@/lib/expertise/cv-import-suggest'
  );

  return {
    ...actual,
    suggestSkillsForDocuments: (...args: unknown[]) => mockSuggestSkillsForDocuments(...args),
  };
});

describe('cv-import wizard extractor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSuggestSkillsForDocuments.mockResolvedValue({
      documents: [
        {
          document_id: 'doc-1',
          file_name: 'cv.pdf',
          context: 'cv',
          candidate_count: 1,
          candidates: [
            {
              candidate_id: 'candidate-1',
              raw_skill_text: 'React',
              category: 'technical',
              evidence_snippets: ['Built React products'],
              confidence: 0.82,
              suggestions: [
                {
                  skill_id: 'skill_react',
                  skill_name: 'React',
                  match_method: 'exact',
                  score: 0.98,
                },
              ],
              unmapped_candidate: false,
            },
          ],
        },
      ],
      metadata: {
        semantic_used: false,
        semantic_fallback_triggered: false,
        unmapped_candidates_count: 0,
        limits: {
          max_documents: 5,
          max_chars_per_document: 30000,
          max_total_chars: 90000,
        },
      },
    });
  });

  it('extracts wizard entities with evidence and maps languages to CEFR levels', async () => {
    const { suggestWizardForDocuments } = await import(
      '@/lib/expertise/cv-import-wizard-extractor'
    );

    const response = await suggestWizardForDocuments(
      {
        documents: [
          {
            document_id: 'doc-1',
            file_name: 'cv.pdf',
            context: 'cv',
            text: [
              'Experience',
              'Senior Engineer at Acme',
              '2021 - Present',
              'Built React products for enterprise customers.',
              '',
              'Education',
              'Stockholm University',
              'Bachelor of Computer Science',
              '2017 - 2020',
              'Coursework in distributed systems.',
              '',
              'Volunteering',
              'Mentor at Code Club',
              '2019 - 2021',
              'Helped students build web applications.',
              '',
              'Languages',
              'English - Native',
              'Swedish - Conversational',
            ].join('\n'),
          },
        ],
      },
      {
        maxDocuments: 5,
        maxCharsPerDocument: 30000,
        maxTotalChars: 90000,
      },
      {
        semanticEnabled: false,
      }
    );

    const document = response.documents[0];
    expect(document.work_experiences.length).toBeGreaterThan(0);
    expect(document.learning_experiences.length).toBeGreaterThan(0);
    expect(document.volunteering.length).toBeGreaterThan(0);
    expect(document.languages.length).toBeGreaterThan(0);
    expect(document.skill_candidates.length).toBeGreaterThan(0);

    for (const section of [
      ...document.work_experiences,
      ...document.learning_experiences,
      ...document.volunteering,
      ...document.languages,
    ]) {
      expect(section.evidence_snippets.length).toBeGreaterThan(0);
    }

    const english = document.languages.find((entry) => entry.language_code === 'en');
    const swedish = document.languages.find((entry) => entry.language_code === 'sv');

    expect(english?.level).toBe('C2');
    expect(swedish).toBeDefined();
    expect(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']).toContain(swedish?.level);
  });

  it('rejects non-cv context for wizard suggest route', async () => {
    const { suggestWizardForDocuments } = await import(
      '@/lib/expertise/cv-import-wizard-extractor'
    );

    await expect(
      suggestWizardForDocuments(
        {
          documents: [
            {
              document_id: 'doc-2',
              file_name: 'job-description.txt',
              context: 'jd' as any,
              text: 'Need React and TypeScript',
            },
          ],
        },
        {
          maxDocuments: 5,
          maxCharsPerDocument: 30000,
          maxTotalChars: 90000,
        }
      )
    ).rejects.toThrow('Invalid literal value');
  });
});
