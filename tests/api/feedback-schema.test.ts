import { describe, expect, it } from 'vitest';
import { SubmitPayloadSchema } from '../../src/lib/feedback/schema';

describe('SubmitPayloadSchema', () => {
  it('rejects payloads with no answers', () => {
    expect(() =>
      SubmitPayloadSchema.parse({
        interviewId: '00000000-0000-0000-0000-000000000000',
        direction: 'candidate_to_org',
        answers: [],
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
});
