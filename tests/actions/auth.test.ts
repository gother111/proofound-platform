import { describe, it, expect, vi, beforeEach } from 'vitest';
import { requestPasswordReset, signUp } from '@/actions/auth';

// Mock dependencies
vi.mock('next/headers', () => ({
  headers: vi.fn(() => Promise.resolve(new Map([['origin', 'http://localhost']]))),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

vi.mock('@/lib/env', () => ({
  resolveSiteUrlFromHeaders: vi.fn(() => 'http://localhost'),
  normalizeSiteUrl: vi.fn(() => 'http://localhost'),
  stripTrailingSlash: vi.fn((url) => url),
}));

const mockSupabase = {
  auth: {
    signUp: vi.fn(),
    resend: vi.fn(),
    resetPasswordForEmail: vi.fn(),
  },
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        maybeSingle: vi.fn(() => Promise.resolve({ data: null })), // Simulate missing profile to trigger fallback
      })),
    })),
    insert: vi.fn(() => Promise.resolve({ error: null })),
  })),
};

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabase)),
}));

const mockAdminSupabase = {
  from: vi.fn(() => ({
    insert: vi.fn(() => Promise.resolve({ error: null })),
  })),
};

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(() => mockAdminSupabase),
}));

vi.mock('@/lib/utils/privacy', () => ({
  anonymizeIP: vi.fn(() => 'hashed-ip'),
  anonymizeUserAgent: vi.fn(() => 'hashed-ua'),
}));

vi.mock('@/lib/analytics/events', () => ({
  emitUserSignup: vi.fn(),
}));

describe('Auth Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase.auth.resetPasswordForEmail.mockResolvedValue({ error: null });
  });

  describe('signUp', () => {
    it('should sign up an organization member and create profile', async () => {
      // Mock successful auth signup
      mockSupabase.auth.signUp.mockResolvedValue({
        data: {
          user: {
            id: 'new-user-id',
            email: 'test@org.com',
            identities: [{ id: 'identity-id', provider: 'email' }],
          },
        },
        error: null,
      });

      const formData = new FormData();
      formData.append('email', 'test@org.com');
      formData.append('password', 'password123');
      formData.append('persona', 'organization');
      formData.append('gdprConsent', 'true');
      formData.append('marketingOptIn', 'false');

      const result = await signUp(undefined, formData);

      expect(result.success).toBe(true);
      expect(result.error).toBeNull();

      // Verify auth.signUp called with correct persona
      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith(
        expect.objectContaining({
          options: expect.objectContaining({
            data: { persona: 'org_member' },
          }),
        })
      );

      // Verify fallback profile creation
      expect(mockSupabase.from).toHaveBeenCalledWith('profiles');
      // The insert call is on the result of from(), which is a mock function returning an object with insert
      // We can't easily check the arguments of the chained call without more complex mocking or capturing the return value
      // But we can check that 'profiles' table was accessed
    });

    it('should return error for invalid input', async () => {
      const formData = new FormData();
      formData.append('email', 'invalid-email');
      // Provide the other required fields so we specifically exercise the email validation path.
      formData.append('password', 'password123');
      formData.append('persona', 'individual');
      formData.append('gdprConsent', 'true');
      formData.append('marketingOptIn', 'false');

      const result = await signUp(undefined, formData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('valid email');
    });
  });

  describe('requestPasswordReset', () => {
    it('returns validation error for malformed email', async () => {
      const formData = new FormData();
      formData.append('email', 'invalid-email');

      const result = await requestPasswordReset(formData);

      expect(result).toEqual({ error: 'Invalid email' });
      expect(mockSupabase.auth.resetPasswordForEmail).not.toHaveBeenCalled();
    });

    it('returns success even when provider reset call errors', async () => {
      mockSupabase.auth.resetPasswordForEmail.mockResolvedValue({
        error: { message: 'Too many requests', status: 429 },
      });

      const formData = new FormData();
      formData.append('email', 'valid@example.com');

      const result = await requestPasswordReset(formData);

      expect(result).toEqual({ success: true });
      expect(mockSupabase.auth.resetPasswordForEmail).toHaveBeenCalledOnce();
    });

    it('returns success when provider reset call succeeds', async () => {
      const formData = new FormData();
      formData.append('email', 'valid@example.com');

      const result = await requestPasswordReset(formData);

      expect(result).toEqual({ success: true });
      expect(mockSupabase.auth.resetPasswordForEmail).toHaveBeenCalledOnce();
    });
  });
});
