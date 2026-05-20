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

import { sendSkillVerificationRequest } from '@/lib/email';

function restoreEnv(name: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[name];
  } else {
    process.env[name] = value;
  }
}

describe('sendSkillVerificationRequest links', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.RESEND_API_KEY = 'test-resend-key';
    process.env.NEXT_PUBLIC_SITE_URL = 'https://proofound.io';
  });

  afterEach(() => {
    restoreEnv('RESEND_API_KEY', originalResendApiKey);
  });

  it('uses the canonical verification route for both review actions', async () => {
    resendSendMock.mockResolvedValueOnce({ id: 're_123' });

    await expect(
      sendSkillVerificationRequest(
        'verifier@example.com',
        'Alice',
        'alice',
        'Structured Feedback',
        'token-123',
        'Please review this proof pack.'
      )
    ).resolves.toBeUndefined();

    expect(resendSendMock).toHaveBeenCalledTimes(1);
    const payload = resendSendMock.mock.calls[0]?.[0];
    const renderedEmail = JSON.stringify(payload?.react);

    expect(payload).toEqual(
      expect.objectContaining({
        to: 'verifier@example.com',
      })
    );
    expect(renderedEmail).toContain('https://proofound.io/verify/token-123');
    expect(renderedEmail).not.toContain('/verify-skill');
  });
});
