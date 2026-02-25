import { beforeEach, describe, expect, it, vi } from 'vitest';

const resendSendMock = vi.hoisted(() => vi.fn());

vi.mock('resend', () => ({
  Resend: class Resend {
    emails = {
      send: resendSendMock,
    };
  },
}));

import { sendWorkEmailVerification } from '@/lib/email';

describe('sendWorkEmailVerification delivery handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SITE_URL = 'https://proofound.io';
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
});
