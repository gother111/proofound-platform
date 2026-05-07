import { describe, it, expect, vi, beforeEach } from 'vitest';
import { requestPasswordReset, signUp, verifyEmail } from '@/actions/auth';
import { resolveCanonicalSiteUrl } from '@/lib/env';

// Mock dependencies
vi.mock('next/headers', () => ({
  headers: vi.fn(() => Promise.resolve(new Map([['origin', 'http://localhost']]))),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

vi.mock('@/lib/env', () => ({
  assertMockDatabaseAllowed: vi.fn(),
  getEnv: vi.fn(() => ({
    SUPABASE_URL: 'https://example.supabase.co',
    SUPABASE_ANON_KEY: 'anon-key',
    SUPABASE_SERVICE_ROLE_KEY: 'service-role-key',
    SITE_URL: 'http://localhost',
    DATABASE_URL: 'postgresql://localhost/proofound_test',
  })),
  isMockSupabaseEnabled: vi.fn(() => process.env.NEXT_PUBLIC_USE_MOCK_SUPABASE === 'true'),
  resolveCanonicalSiteUrl: vi.fn(() => 'http://localhost'),
  resolveSiteUrlFromHeaders: vi.fn(() => 'http://localhost'),
  normalizeSiteUrl: vi.fn(() => 'http://localhost'),
  stripTrailingSlash: vi.fn((url) => url),
}));

const mockSupabase = {
  auth: {
    signUp: vi.fn(),
    signInWithPassword: vi.fn(),
    resend: vi.fn(),
    resetPasswordForEmail: vi.fn(),
    verifyOtp: vi.fn(),
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

const generateLinkMock = vi.fn();

const mockAdminSupabase = {
  from: vi.fn(() => ({
    insert: vi.fn(() => Promise.resolve({ error: null })),
  })),
  auth: {
    admin: {
      generateLink: generateLinkMock,
    },
  },
};

const createAdminClientMock = vi.fn(() => mockAdminSupabase);

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: createAdminClientMock,
}));

vi.mock('@/lib/utils/privacy', () => ({
  anonymizeIP: vi.fn(() => 'hashed-ip'),
  anonymizeUserAgent: vi.fn(() => 'hashed-ua'),
}));

vi.mock('@/lib/analytics/events', () => ({
  emitUserSignup: vi.fn(),
}));

const sendEmailMock = vi.fn();

vi.mock('@/lib/email/sender', () => ({
  sendEmail: sendEmailMock,
}));

vi.mock('@/lib/launch/trace', () => ({
  startLaunchTrace: vi.fn(() => ({
    objectRefs: {},
    startedAtMs: 0,
  })),
  emitLaunchTrace: vi.fn(),
}));

describe('Auth Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_USE_MOCK_SUPABASE = 'false';
    mockSupabase.auth.resetPasswordForEmail.mockResolvedValue({ error: null });
    mockSupabase.auth.verifyOtp.mockResolvedValue({ error: null });
    mockSupabase.auth.resend.mockResolvedValue({ error: null });
    mockSupabase.auth.signInWithPassword.mockResolvedValue({
      error: { message: 'Invalid login credentials', status: 400 },
    });
    generateLinkMock.mockResolvedValue({
      data: {
        properties: {
          action_link: 'https://example.com/auth/v1/verify?token=test&type=signup',
        },
      },
      error: null,
    });
    sendEmailMock.mockResolvedValue({ success: true, id: 'email-1' });
  });

  describe('signIn', () => {
    it('does not log submitted auth form values', async () => {
      const { signIn } = await import('@/actions/auth');
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const formData = new FormData();
      formData.append('email', 'Sensitive.User@Example.com');
      formData.append('password', 'correct-horse-battery-staple');

      const result = await signIn(undefined, formData);

      expect(result).toEqual({ error: 'Email or password is incorrect.' });
      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'sensitive.user@example.com',
        password: 'correct-horse-battery-staple',
      });
      expect(consoleLogSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('signIn formData'),
        expect.anything()
      );

      consoleLogSpy.mockRestore();
    });
  });

  describe('signUp', () => {
    it('should sign up an organization member and create profile', async () => {
      process.env.NEXT_PUBLIC_USE_MOCK_SUPABASE = 'true';
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
          email: 'test@org.com',
          options: expect.objectContaining({
            emailRedirectTo: 'http://localhost/auth/callback',
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

    it('fails closed when the canonical public site url is unavailable', async () => {
      vi.mocked(resolveCanonicalSiteUrl).mockReturnValueOnce('');

      const formData = new FormData();
      formData.append('email', 'test@org.com');
      formData.append('password', 'password123');
      formData.append('persona', 'individual');
      formData.append('gdprConsent', 'true');
      formData.append('marketingOptIn', 'false');

      const result = await signUp(undefined, formData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unable to complete signup');
      expect(mockSupabase.auth.signUp).not.toHaveBeenCalled();
    });

    it('returns retry-safe error and keeps email verification semantics when signup is rate-limited', async () => {
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: null },
        error: { message: 'Over the email limit', status: 429 },
      });

      const formData = new FormData();
      formData.append('email', 'throttle@example.com');
      formData.append('password', 'password123');
      formData.append('persona', 'individual');
      formData.append('gdprConsent', 'true');
      formData.append('marketingOptIn', 'false');

      const result = await signUp(undefined, formData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('temporarily unable to send verification emails');
      expect(createAdminClientMock).not.toHaveBeenCalled();
    });

    it('falls back to admin generateLink + Resend API when Supabase cannot send confirmation email', async () => {
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: null },
        error: { message: 'Error sending confirmation email', status: 500 },
      });

      const formData = new FormData();
      formData.append('email', 'smtp-issue@example.com');
      formData.append('password', 'password123');
      formData.append('persona', 'individual');
      formData.append('gdprConsent', 'true');
      formData.append('marketingOptIn', 'false');

      const result = await signUp(undefined, formData);

      expect(result.success).toBe(true);
      expect(result.error).toBeNull();
      expect(createAdminClientMock).toHaveBeenCalled();
      expect(generateLinkMock).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'signup',
          email: 'smtp-issue@example.com',
          password: 'password123',
        })
      );
      expect(sendEmailMock).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'smtp-issue@example.com',
          subject: 'Verify your email - Proofound',
          html: expect.stringContaining('Verify your email'),
          text: expect.stringContaining('Verify email:'),
        })
      );
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
      expect(mockSupabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
        'valid@example.com',
        expect.objectContaining({
          redirectTo: 'http://localhost/auth/callback?next=%2Freset-password%2Fconfirm',
        })
      );
    });

    it('falls back to admin generateLink + Resend API when Supabase recovery send fails', async () => {
      mockSupabase.auth.resetPasswordForEmail.mockResolvedValue({
        error: { message: 'Error sending recovery email', status: 500 },
      });
      generateLinkMock.mockResolvedValue({
        data: {
          properties: {
            action_link: 'https://example.com/auth/v1/verify?token=recovery&type=recovery',
          },
        },
        error: null,
      });

      const formData = new FormData();
      formData.append('email', 'valid@example.com');

      const result = await requestPasswordReset(formData);

      expect(result).toEqual({ success: true });
      expect(createAdminClientMock).toHaveBeenCalled();
      expect(generateLinkMock).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'recovery',
          email: 'valid@example.com',
        })
      );
      expect(sendEmailMock).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'valid@example.com',
          subject: 'Reset your password - Proofound',
          html: expect.stringContaining('Reset your password'),
          text: expect.stringContaining('Reset password:'),
        })
      );
    });
  });

  describe('verifyEmail', () => {
    it('uses email verification type by default', async () => {
      const formData = new FormData();
      formData.append('token', 'email-token');

      const result = await verifyEmail(formData);

      expect(result).toEqual({ success: true });
      expect(mockSupabase.auth.verifyOtp).toHaveBeenCalledWith({
        token_hash: 'email-token',
        type: 'email',
      });
    });

    it('uses signup verification type when provided', async () => {
      const formData = new FormData();
      formData.append('token', 'signup-token');
      formData.append('type', 'signup');

      const result = await verifyEmail(formData);

      expect(result).toEqual({ success: true });
      expect(mockSupabase.auth.verifyOtp).toHaveBeenCalledWith({
        token_hash: 'signup-token',
        type: 'signup',
      });
    });
  });
});
