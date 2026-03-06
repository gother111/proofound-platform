import { describe, expect, it } from 'vitest';

import { fuseSkillCandidates } from '@/lib/expertise/skill-candidate-fusion';

describe('skill candidate fusion', () => {
  it('prefers stronger gemini mapping and merges local evidence', () => {
    const localCandidates = [
      {
        candidate_id: 'local-1',
        raw_skill_text: 'React.js',
        category: 'technical' as const,
        evidence_snippets: ['Built React.js dashboards for analytics teams.'],
        confidence: 0.71,
        suggestions: [
          {
            skill_id: 'skill_react',
            skill_name: 'React',
            match_method: 'fuzzy' as const,
            score: 0.82,
          },
        ],
        unmapped_candidate: false,
      },
    ];

    const geminiCandidates = [
      {
        candidate_id: 'gemini-1',
        raw_skill_text: 'React',
        category: 'technical' as const,
        evidence_snippets: ['Led delivery of React features in production.'],
        confidence: 0.88,
        suggestions: [
          {
            skill_id: 'skill_react',
            skill_name: 'React',
            match_method: 'exact' as const,
            score: 0.97,
          },
        ],
        unmapped_candidate: false,
      },
    ];

    const fused = fuseSkillCandidates({
      localCandidates,
      geminiCandidates,
    });

    expect(fused).toHaveLength(1);
    expect(fused[0].suggestions[0]?.match_method).toBe('exact');
    expect(fused[0].evidence_snippets.length).toBeGreaterThan(1);
  });

  it('keeps unmapped candidate when semantic top suggestion is weak', () => {
    const fused = fuseSkillCandidates({
      localCandidates: [],
      geminiCandidates: [
        {
          candidate_id: 'gemini-2',
          raw_skill_text: 'platform orchestration concept',
          category: 'technical' as const,
          evidence_snippets: ['Contributed across teams on platform orchestration concept.'],
          confidence: 0.76,
          suggestions: [
            {
              skill_id: 'skill_kubernetes',
              skill_name: 'Kubernetes',
              match_method: 'semantic' as const,
              score: 0.63,
            },
          ],
          unmapped_candidate: false,
        },
      ],
    });

    expect(fused).toHaveLength(1);
    expect(fused[0].unmapped_candidate).toBe(true);
    expect(fused[0].suggestions).toHaveLength(1);
    expect(fused[0].suggestions[0]?.skill_id).toBe('skill_kubernetes');
  });

  it('does not collapse distinct raw candidates that map to the same taxonomy skill', () => {
    const fused = fuseSkillCandidates({
      localCandidates: [
        {
          candidate_id: 'local-1',
          raw_skill_text: 'React',
          category: 'technical' as const,
          evidence_snippets: ['Built React web applications.'],
          confidence: 0.83,
          suggestions: [
            {
              skill_id: 'skill_react',
              skill_name: 'React',
              match_method: 'exact' as const,
              score: 0.97,
            },
          ],
          unmapped_candidate: false,
        },
        {
          candidate_id: 'local-2',
          raw_skill_text: 'React Native',
          category: 'technical' as const,
          evidence_snippets: ['Built React Native mobile applications.'],
          confidence: 0.81,
          suggestions: [
            {
              skill_id: 'skill_react',
              skill_name: 'React',
              match_method: 'synonym' as const,
              score: 0.91,
            },
          ],
          unmapped_candidate: false,
        },
      ],
      geminiCandidates: [],
    });

    expect(fused).toHaveLength(2);
    expect(fused.map((item) => item.raw_skill_text).sort()).toEqual(['React', 'React Native']);
  });

  it('forces unresolved output when local and gemini top mappings disagree without strong evidence', () => {
    const fused = fuseSkillCandidates({
      localCandidates: [
        {
          candidate_id: 'local-1',
          raw_skill_text: 'PM',
          category: 'other' as const,
          evidence_snippets: ['Worked with PM stakeholders across projects.'],
          confidence: 0.66,
          suggestions: [
            {
              skill_id: 'skill_project_management',
              skill_name: 'Project Management',
              match_method: 'fuzzy' as const,
              score: 0.88,
            },
          ],
          unmapped_candidate: false,
        },
      ],
      geminiCandidates: [
        {
          candidate_id: 'gemini-1',
          raw_skill_text: 'PM',
          category: 'other' as const,
          evidence_snippets: ['Worked with PM stakeholders across projects.'],
          confidence: 0.69,
          suggestions: [
            {
              skill_id: 'skill_product_management',
              skill_name: 'Product Management',
              match_method: 'semantic' as const,
              score: 0.9,
            },
          ],
          unmapped_candidate: false,
        },
      ],
    });

    expect(fused).toHaveLength(1);
    expect(fused[0].unmapped_candidate).toBe(true);
    expect(fused[0].suggestions).toHaveLength(0);
  });
});
