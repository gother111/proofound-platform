import { describe, expect, it } from 'vitest';
import { signUpSchema } from '@/actions/auth';

const basePayload = {
  email: 'user@example.com',
  persona: 'individual' as const,
  gdprConsent: true,
  marketingOptIn: false,
};

describe('signUpSchema', () => {
  it('accepts passwords with at least 8 characters', () => {
    const result = signUpSchema.safeParse({ ...basePayload, password: 'Abcdef12' });
    expect(result.success).toBe(true);
  });

  it('rejects passwords shorter than 8 characters', () => {
    const result = signUpSchema.safeParse({ ...basePayload, password: 'short7' });
    expect(result.success).toBe(false);
    if (!result.success) {
      const passwordIssue = result.error.issues.find((issue) => issue.path[0] === 'password');
      expect(passwordIssue?.message).toContain('8');
    }
  });
});
