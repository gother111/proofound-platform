import { beforeEach, describe, expect, it, vi } from 'vitest';

const resendSendMock = vi.hoisted(() => vi.fn());

vi.mock('resend', () => ({
  Resend: class Resend {
    emails = {
      send: resendSendMock,
    };
  },
}));

import { sendSkillVerificationRequest } from '@/lib/email';

describe('sendSkillVerificationRequest links', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SITE_URL = 'https://proofound.io';
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
