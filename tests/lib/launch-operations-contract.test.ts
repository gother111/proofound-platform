import { describe, expect, it } from 'vitest';

import {
  FALLBACK_COPY,
  FEATURE_FLAG_TAXONOMY_VALUES,
  OPERATIONAL_FALLBACK_MODE_VALUES,
  StructuredFeedbackSchema,
} from '../../src/lib/contracts/launch-operations';

describe('launch operations contract', () => {
  it('defines copy for every fallback mode', () => {
    for (const mode of OPERATIONAL_FALLBACK_MODE_VALUES) {
      expect(FALLBACK_COPY[mode]).toBeDefined();
      expect(FALLBACK_COPY[mode].individual.nextActions).toHaveLength(3);
      expect(FALLBACK_COPY[mode].organization.nextActions).toHaveLength(3);
    }
  });

  it('keeps fallback copy away from public directory or profile-theater language', () => {
    const serialized = JSON.stringify(FALLBACK_COPY);

    expect(serialized).not.toMatch(/searchable/i);
    expect(serialized).not.toMatch(/public directory/i);
    expect(serialized).not.toMatch(/profile remains/i);
  });

  it('keeps organization fallback copy review-scoped instead of candidate-set scoped', () => {
    const serialized = JSON.stringify(FALLBACK_COPY);

    expect(FALLBACK_COPY.trust_pending_verification.organization.title).toBe(
      'Verification is still in progress for this review set.'
    );
    expect(serialized).not.toMatch(/candidate set/i);
  });

  it('keeps the canonical feature-flag taxonomy stable', () => {
    expect(FEATURE_FLAG_TAXONOMY_VALUES).toEqual([
      'default_on',
      'hidden_behind_flag',
      'pilot_only',
      'admin_operator_only',
      'post_mvp',
      'emergency_kill_switch',
    ]);
  });

  it('requires a canonical structured feedback payload', () => {
    const parsed = StructuredFeedbackSchema.parse({
      decisionState: 'closed',
      audienceVariant: 'organization',
      reasonCode: 'candidate_proof_coverage_insufficient',
      personalizedNote:
        'The portfolio had relevant signals, but the strongest candidate evidence was still too thin for a confident introduction.',
      suggestedNextStep:
        'Request one stronger proof artifact or verification step before reopening this candidate for intro review.',
      authorRole: 'platform_operator',
    });

    expect(parsed.rubricVersion).toBe('structured-feedback/v1');
  });
});
