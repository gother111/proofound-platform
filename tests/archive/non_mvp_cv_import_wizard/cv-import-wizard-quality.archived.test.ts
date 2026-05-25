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

function buildSkillResponse(documentIds: string[]) {
  return {
    documents: documentIds.map((documentId) => ({
      document_id: documentId,
      file_name: `${documentId}.pdf`,
      context: 'cv',
      candidate_count: 1,
      candidates: [
        {
          candidate_id: `${documentId}-skill-1`,
          raw_skill_text: 'React',
          category: 'technical',
          evidence_snippets: ['Built React products'],
          confidence: 0.8,
          suggestions: [
            {
              skill_id: 'skill_react',
              skill_name: 'React',
              match_method: 'exact',
              score: 0.99,
            },
          ],
          unmapped_candidate: false,
        },
      ],
    })),
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
  };
}

describe('cv-import wizard quality', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('extracts multi-entity suggestions with evidence from diverse CV inputs', async () => {
    const { suggestWizardForDocuments } = await import(
      '@/archive/non_launch_cv_import_wizard/lib/expertise/cv-import-wizard-extractor'
    );

    const inputs = [
      {
        document_id: 'wizard-frontend',
        file_name: 'frontend.pdf',
        context: 'cv' as const,
        text: [
          'Experience',
          'Frontend Engineer at Acme',
          '2020 - Present',
          'Built React and TypeScript products for web users.',
          '',
          'Education',
          'KTH Royal Institute of Technology',
          'Bachelor of Computer Science',
          '2016 - 2019',
          '',
          'Volunteering',
          'Mentor at Girls Who Code',
          '2019 - 2021',
          '',
          'Languages',
          'English - Fluent',
          'Swedish - Conversational',
        ].join('\n'),
      },
      {
        document_id: 'wizard-data',
        file_name: 'data.pdf',
        context: 'cv' as const,
        text: [
          'Professional Experience',
          'Data Scientist at Northwind',
          '2018 - Present',
          'Created ML experiments in Python and Jupyter Notebook.',
          '',
          'Education',
          'Stockholm University',
          'Master in Data Science',
          '2015 - 2017',
          '',
          'Volunteer',
          'Volunteer Analyst at Open Data Collective',
          '2017 - 2018',
          '',
          'Languages',
          'English - Native',
          'Spanish - Basic',
        ].join('\n'),
      },
    ];

    mockSuggestSkillsForDocuments.mockResolvedValue(
      buildSkillResponse(inputs.map((item) => item.document_id))
    );

    const response = await suggestWizardForDocuments(
      { documents: inputs },
      {
        maxDocuments: 5,
        maxCharsPerDocument: 30000,
        maxTotalChars: 90000,
      },
      {
        semanticEnabled: false,
      }
    );

    expect(response.documents).toHaveLength(2);

    for (const document of response.documents) {
      expect(document.skill_candidates.length).toBeGreaterThan(0);
      expect(document.work_experiences.length).toBeGreaterThan(0);
      expect(document.learning_experiences.length).toBeGreaterThan(0);
      expect(document.volunteering.length).toBeGreaterThan(0);
      expect(document.languages.length).toBeGreaterThan(0);

      for (const section of [
        ...document.work_experiences,
        ...document.learning_experiences,
        ...document.volunteering,
        ...document.languages,
      ]) {
        expect(section.evidence_snippets.length).toBeGreaterThan(0);
      }
    }
  });

  it('returns deterministic wizard extraction for repeated identical input', async () => {
    const { suggestWizardForDocuments } = await import(
      '@/archive/non_launch_cv_import_wizard/lib/expertise/cv-import-wizard-extractor'
    );

    const request = {
      documents: [
        {
          document_id: 'wizard-repeat',
          file_name: 'repeat.pdf',
          context: 'cv' as const,
          text: [
            'Experience',
            'Platform Engineer at Acme',
            '2021 - Present',
            'Built React systems.',
            '',
            'Education',
            'KTH',
            'Bachelor of Engineering',
            '2017 - 2020',
            '',
            'Volunteering',
            'Mentor at Community Coding Club',
            '2020 - 2022',
            '',
            'Languages',
            'English - Fluent',
          ].join('\n'),
        },
      ],
    };

    mockSuggestSkillsForDocuments.mockResolvedValue(buildSkillResponse(['wizard-repeat']));

    const signatures: string[] = [];

    for (let i = 0; i < 5; i += 1) {
      const response = await suggestWizardForDocuments(
        request,
        {
          maxDocuments: 5,
          maxCharsPerDocument: 30000,
          maxTotalChars: 90000,
        },
        {
          semanticEnabled: false,
        }
      );

      signatures.push(JSON.stringify(response.documents[0]));
    }

    expect(new Set(signatures).size).toBe(1);
  });
});
