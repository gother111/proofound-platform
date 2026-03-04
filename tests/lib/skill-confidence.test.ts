import { describe, expect, it } from 'vitest';

import {
  calibrateCandidateConfidence,
  hasPrecisionAutoSelectSignal,
  shouldRejectWeakTopSuggestion,
} from '@/lib/expertise/skill-confidence';

describe('skill confidence policy', () => {
  it('auto-selects only strong exact or synonym matches with evidence', () => {
    const shouldAutoSelect = hasPrecisionAutoSelectSignal({
      raw_skill_text: 'React',
      confidence: 0.86,
      evidence_snippets: ['Built React features in production systems.'],
      suggestions: [
        {
          skill_id: 'skill_react',
          skill_name: 'React',
          match_method: 'exact',
          score: 0.97,
        },
      ],
    });

    expect(shouldAutoSelect).toBe(true);
  });

  it('rejects weak semantic top matches', () => {
    const shouldReject = shouldRejectWeakTopSuggestion({
      raw_skill_text: 'platform concept',
      confidence: 0.82,
      evidence_snippets: ['Platform concept workstream across teams.'],
      suggestions: [
        {
          skill_id: 'skill_kubernetes',
          skill_name: 'Kubernetes',
          match_method: 'semantic',
          score: 0.66,
        },
      ],
    });

    expect(shouldReject).toBe(true);
  });

  it('keeps calibrated confidence within bounds', () => {
    const score = calibrateCandidateConfidence({
      raw_skill_text: 'TypeScript',
      confidence: 0.7,
      evidence_snippets: ['Developed TypeScript services and tooling.'],
      suggestions: [
        {
          skill_id: 'skill_typescript',
          skill_name: 'TypeScript',
          match_method: 'exact',
          score: 0.95,
        },
      ],
    });

    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(1);
  });
});
