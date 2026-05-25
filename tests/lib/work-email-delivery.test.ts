import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { originalResendApiKey, resendSendMock } = vi.hoisted(() => {
  const originalResendApiKey = process.env.RESEND_API_KEY;
  process.env.RESEND_API_KEY = 'test-resend-key';

  return {
    originalResendApiKey,
    resendSendMock: vi.fn(),
  };
});

vi.mock('resend', () => ({
  Resend: class Resend {
    emails = {
      send: resendSendMock,
    };
  },
}));

import { sendWorkEmailVerification } from '@/lib/email';

const ORIGINAL_NEXT_PUBLIC_SITE_URL = process.env.NEXT_PUBLIC_SITE_URL;
const ORIGINAL_SITE_URL = process.env.SITE_URL;
const ORIGINAL_VERCEL_ENV = process.env.VERCEL_ENV;

function restoreEnv(name: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[name];
  } else {
    process.env[name] = value;
  }
}

describe('sendWorkEmailVerification delivery handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.RESEND_API_KEY = 'test-resend-key';
    process.env.NEXT_PUBLIC_SITE_URL = 'https://proofound.io';
    restoreEnv('SITE_URL', ORIGINAL_SITE_URL);
    restoreEnv('VERCEL_ENV', ORIGINAL_VERCEL_ENV);
  });

  afterEach(() => {
    restoreEnv('RESEND_API_KEY', originalResendApiKey);
    restoreEnv('NEXT_PUBLIC_SITE_URL', ORIGINAL_NEXT_PUBLIC_SITE_URL);
    restoreEnv('SITE_URL', ORIGINAL_SITE_URL);
    restoreEnv('VERCEL_ENV', ORIGINAL_VERCEL_ENV);
  });

  it('throws when resend returns an error payload without throwing', async () => {
    resendSendMock.mockResolvedValueOnce({
      error: { message: 'proofound.com domain is not verified' },
    });

    await expect(
      sendWorkEmailVerification('worker@example.com', 'token-123', 'Worker')
    ).rejects.toThrow('Failed to send work email verification');
  });

  it('resolves when resend returns a successful response payload', async () => {
    resendSendMock.mockResolvedValueOnce({ id: 're_123' });

    await expect(
      sendWorkEmailVerification('worker@example.com', 'token-123', 'Worker')
    ).resolves.toBeUndefined();
  });

  it('uses the canonical server-side SITE_URL fallback for token-bearing links', async () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    process.env.SITE_URL = 'https://proofound.io/';
    resendSendMock.mockResolvedValueOnce({ id: 're_123' });

    await expect(
      sendWorkEmailVerification('worker@example.com', 'token-123', 'Worker')
    ).resolves.toBeUndefined();

    const payload = resendSendMock.mock.calls[0]?.[0];
    const renderedEmail = JSON.stringify(payload?.react);
    expect(renderedEmail).toContain('https://proofound.io/verify-work-email?token=token-123');
    expect(renderedEmail).not.toContain('undefined/verify-work-email');
  });

  it('fails closed before sending token-bearing links when production site url is unavailable', async () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    delete process.env.SITE_URL;
    process.env.VERCEL_ENV = 'production';

    await expect(
      sendWorkEmailVerification('worker@example.com', 'token-123', 'Worker')
    ).rejects.toThrow('Failed to send work email verification');

    expect(resendSendMock).not.toHaveBeenCalled();
  });
});
