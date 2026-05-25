import { describe, expect, it } from 'vitest';
import { SubmitPayloadSchema } from '../../src/lib/feedback/schema';

describe('SubmitPayloadSchema', () => {
  it('rejects payloads with no answers', () => {
    expect(() =>
      SubmitPayloadSchema.parse({
        interviewId: '00000000-0000-0000-0000-000000000000',
        direction: 'candidate_to_org',
      })
    ).toThrow();
  });

  it('accepts a valid minimal payload', () => {
    const parsed = SubmitPayloadSchema.parse({
      interviewId: '00000000-0000-0000-0000-000000000001',
      direction: 'org_to_candidate',
      answers: [
        {
          questionId: '00000000-0000-0000-0000-000000000010',
          score: 4,
        },
      ],
    });

    expect(parsed.direction).toBe('org_to_candidate');
    expect(parsed.answers[0].questionId).toBeDefined();
  });

  it('accepts structured feedback without answer rows', () => {
    const parsed = SubmitPayloadSchema.parse({
      interviewId: '00000000-0000-0000-0000-000000000001',
      direction: 'candidate_to_org',
      structuredFeedback: {
        decisionState: 'not_now',
        audienceVariant: 'candidate',
        reasonCode: 'verification_pending',
        personalizedNote:
          'Your portfolio is credible, but the strongest verification check is still pending.',
        suggestedNextStep:
          'Complete the pending verification request and keep your proof links current.',
        authorRole: 'organization_member',
      },
    });

    expect(parsed.structuredFeedback?.reasonCode).toBe('verification_pending');
  });

  it('rejects audience and reason-code mismatches', () => {
    expect(() =>
      SubmitPayloadSchema.parse({
        interviewId: '00000000-0000-0000-0000-000000000001',
        direction: 'candidate_to_org',
        structuredFeedback: {
          decisionState: 'not_now',
          audienceVariant: 'candidate',
          reasonCode: 'assignment_scope_too_narrow',
          personalizedNote:
            'This note is intentionally long enough to pass the personalized note length check.',
          suggestedNextStep: 'Keep your portfolio updated.',
          authorRole: 'organization_member',
        },
      })
    ).toThrow(/participant-facing reason code/i);
  });
});
