import { describe, expect, it } from 'vitest';

import { rerankGeminiCandidates } from '@/lib/expertise/gemini/reranker';
import type { CvImportCandidate } from '@/lib/expertise/cv-import-suggest';

function candidate(input: Partial<CvImportCandidate>): CvImportCandidate {
  return {
    candidate_id: input.candidate_id || 'c-1',
    raw_skill_text: input.raw_skill_text || 'React',
    category: input.category || 'technical',
    evidence_snippets: input.evidence_snippets || ['React'],
    confidence: input.confidence ?? 0.5,
    suggestions: input.suggestions || [],
    unmapped_candidate: input.unmapped_candidate ?? false,
  };
}

describe('rerankGeminiCandidates', () => {
  it('drops candidates without verbatim evidence in source text', () => {
    const result = rerankGeminiCandidates({
      text: 'Built web apps using React and TypeScript.',
      candidates: [
        candidate({
          candidate_id: 'ok',
          raw_skill_text: 'React',
          evidence_snippets: ['React and TypeScript'],
          confidence: 0.7,
          suggestions: [
            {
              skill_id: 'react',
              skill_name: 'React',
              match_method: 'exact',
              score: 0.95,
            },
          ],
        }),
        candidate({
          candidate_id: 'bad',
          raw_skill_text: 'Kubernetes',
          evidence_snippets: ['Container orchestration expertise'],
          confidence: 0.8,
          suggestions: [
            {
              skill_id: 'kubernetes',
              skill_name: 'Kubernetes',
              match_method: 'exact',
              score: 0.91,
            },
          ],
        }),
      ],
    });

    expect(result.candidates).toHaveLength(1);
    expect(result.candidates[0].raw_skill_text).toBe('React');
    expect(result.metrics.inputCandidateCount).toBe(2);
    expect(result.metrics.candidateCount).toBe(1);
  });

  it('keeps highest confidence for duplicate canonical skill mapping', () => {
    const result = rerankGeminiCandidates({
      text: 'Skills: React, React Native, TypeScript.',
      candidates: [
        candidate({
          candidate_id: 'react-a',
          raw_skill_text: 'React',
          evidence_snippets: ['React'],
          confidence: 0.55,
          suggestions: [
            {
              skill_id: 'react',
              skill_name: 'React',
              match_method: 'exact',
              score: 0.96,
            },
          ],
        }),
        candidate({
          candidate_id: 'react-b',
          raw_skill_text: 'React',
          evidence_snippets: ['React Native'],
          confidence: 0.82,
          suggestions: [
            {
              skill_id: 'react',
              skill_name: 'React',
              match_method: 'synonym',
              score: 0.84,
            },
          ],
        }),
      ],
    });

    expect(result.candidates).toHaveLength(1);
    expect(result.candidates[0].confidence).toBeGreaterThan(0.75);
    expect(result.metrics.highConfidenceCount).toBe(1);
    expect(result.metrics.confidenceTiers.high).toBe(1);
  });
});
