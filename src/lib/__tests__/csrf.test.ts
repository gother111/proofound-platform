import { describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import {
  csrfProtection,
  generateCSRFToken,
  generateSignedCSRFToken,
  getOrGenerateCSRFToken,
  verifyCSRFToken,
} from '../csrf';

describe('CSRF Protection', () => {
  const sessionCookie = 'sb-localhost-auth-token=session-value';
  const otherSessionCookie = 'sb-localhost-auth-token=other-session-value';

  beforeEach(() => {
    process.env.CSRF_SECRET = 'csrf-signing-secret-value';
    delete process.env.INTERNAL_API_SECRET;
    delete process.env.CRON_SECRET;
    delete process.env.CRON_SECRET_PREVIEW;
  });

  describe('generateCSRFToken', () => {
    it('should generate a token of correct length', () => {
      const token = generateCSRFToken();
      expect(token).toBeDefined();
      expect(token.length).toBe(64); // 32 bytes * 2 (hex encoding)
    });

    it('should generate unique tokens', () => {
      const token1 = generateCSRFToken();
      const token2 = generateCSRFToken();
      expect(token1).not.toBe(token2);
    });
  });

  describe('verifyCSRFToken', () => {
    it('should allow GET requests without token', async () => {
      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'GET',
      });
      await expect(verifyCSRFToken(request)).resolves.toBe(true);
    });

    it('should allow HEAD requests without token', async () => {
      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'HEAD',
      });
      await expect(verifyCSRFToken(request)).resolves.toBe(true);
    });

    it('should allow OPTIONS requests without token', async () => {
      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'OPTIONS',
      });
      await expect(verifyCSRFToken(request)).resolves.toBe(true);
    });

    it('should reject POST requests without token', async () => {
      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
      });
      await expect(verifyCSRFToken(request)).resolves.toBe(false);
    });

    it('should reject POST requests with only header token', async () => {
      const token = generateCSRFToken();
      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        headers: {
          'x-csrf-token': token,
        },
      });
      await expect(verifyCSRFToken(request)).resolves.toBe(false);
    });

    it('should reject POST requests with mismatched tokens', async () => {
      const token1 = generateCSRFToken();
      const token2 = generateCSRFToken();
      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        headers: {
          'x-csrf-token': token1,
          Cookie: `csrf_token=${token2}`,
        },
      });
      await expect(verifyCSRFToken(request)).resolves.toBe(false);
    });

    it('should reject unsigned fixed tokens even when header and cookie match', async () => {
      const token = 'fixed-token';
      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        headers: {
          'x-csrf-token': token,
          Cookie: `csrf_token=${token}`,
        },
      });
      await expect(verifyCSRFToken(request)).resolves.toBe(false);
    });

    it('should accept POST requests with matching signed tokens', async () => {
      const token = await generateSignedCSRFToken(
        new NextRequest('http://localhost:3000/api/test', {
          headers: {
            Cookie: sessionCookie,
          },
        })
      );
      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        headers: {
          'x-csrf-token': token,
          Cookie: `csrf_token=${token}; ${sessionCookie}`,
        },
      });
      await expect(verifyCSRFToken(request)).resolves.toBe(true);
    });

    it('should accept PATCH requests with matching signed tokens', async () => {
      const token = await generateSignedCSRFToken(
        new NextRequest('http://localhost:3000/api/test', {
          headers: {
            Cookie: sessionCookie,
          },
        })
      );
      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'PATCH',
        headers: {
          'x-csrf-token': token,
          Cookie: `csrf_token=${token}; ${sessionCookie}`,
        },
      });
      await expect(verifyCSRFToken(request)).resolves.toBe(true);
    });

    it('should accept DELETE requests with matching signed tokens', async () => {
      const token = await generateSignedCSRFToken(
        new NextRequest('http://localhost:3000/api/test', {
          headers: {
            Cookie: sessionCookie,
          },
        })
      );
      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'DELETE',
        headers: {
          'x-csrf-token': token,
          Cookie: `csrf_token=${token}; ${sessionCookie}`,
        },
      });
      await expect(verifyCSRFToken(request)).resolves.toBe(true);
    });

    it('should reject session-mismatched tokens', async () => {
      const token = await generateSignedCSRFToken(
        new NextRequest('http://localhost:3000/api/test', {
          headers: {
            Cookie: sessionCookie,
          },
        })
      );
      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        headers: {
          'x-csrf-token': token,
          Cookie: `csrf_token=${token}; ${otherSessionCookie}`,
        },
      });

      await expect(verifyCSRFToken(request)).resolves.toBe(false);
    });

    it('should reject replayed tokens from a previous auth session', async () => {
      const firstSessionRequest = new NextRequest('http://localhost:3000/api/test', {
        headers: {
          Cookie: sessionCookie,
        },
      });
      const replayedToken = await generateSignedCSRFToken(firstSessionRequest);
      const secondSessionRequest = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        headers: {
          'x-csrf-token': replayedToken,
          Cookie: `csrf_token=${replayedToken}; ${otherSessionCookie}`,
        },
      });

      await expect(verifyCSRFToken(secondSessionRequest)).resolves.toBe(false);
    });

    it('should allow same-session token reuse for double-submit ergonomics', async () => {
      const token = await generateSignedCSRFToken(
        new NextRequest('http://localhost:3000/api/test', {
          headers: {
            Cookie: sessionCookie,
          },
        })
      );
      const firstRequest = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        headers: {
          'x-csrf-token': token,
          Cookie: `csrf_token=${token}; ${sessionCookie}`,
        },
      });
      const secondRequest = new NextRequest('http://localhost:3000/api/test', {
        method: 'PATCH',
        headers: {
          'x-csrf-token': token,
          Cookie: `csrf_token=${token}; ${sessionCookie}`,
        },
      });

      await expect(verifyCSRFToken(firstRequest)).resolves.toBe(true);
      await expect(verifyCSRFToken(secondRequest)).resolves.toBe(true);
    });

    it('should rotate stale tokens when auth cookies change', async () => {
      const staleToken = await generateSignedCSRFToken(
        new NextRequest('http://localhost:3000/api/test', {
          headers: {
            Cookie: sessionCookie,
          },
        })
      );
      const requestAfterAuthChange = new NextRequest('http://localhost:3000/api/test', {
        headers: {
          Cookie: `csrf_token=${staleToken}; ${otherSessionCookie}`,
        },
      });

      const rotatedToken = await getOrGenerateCSRFToken(requestAfterAuthChange);

      expect(rotatedToken).not.toBe(staleToken);
      const verifiedRequest = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        headers: {
          'x-csrf-token': rotatedToken,
          Cookie: `csrf_token=${rotatedToken}; ${otherSessionCookie}`,
        },
      });
      await expect(verifyCSRFToken(verifiedRequest)).resolves.toBe(true);
    });
  });

  describe('csrfProtection', () => {
    it('should return null for GET requests', async () => {
      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'GET',
      });
      await expect(csrfProtection(request)).resolves.toBeNull();
    });

    it('should return null for webhook endpoints', async () => {
      const request = new NextRequest('http://localhost:3000/api/webhook/test', {
        method: 'POST',
      });
      await expect(csrfProtection(request)).resolves.toBeNull();
    });

    it('should require a verified internal secret for cron endpoints', async () => {
      const request = new NextRequest('http://localhost:3000/api/cron/test', {
        method: 'POST',
      });
      const response = await csrfProtection(request);

      expect(response).not.toBeNull();
      expect(response?.status).toBe(403);
    });

    it('should return null for verified internal cron endpoints without cookie auth', async () => {
      process.env.CRON_SECRET = 'server-only-cron-secret';
      const request = new NextRequest('http://localhost:3000/api/cron/test', {
        method: 'POST',
        headers: {
          authorization: 'Bearer server-only-cron-secret',
        },
      });
      await expect(csrfProtection(request)).resolves.toBeNull();
    });

    it('should require CSRF when a cron request also has a browser auth cookie', async () => {
      process.env.CRON_SECRET = 'server-only-cron-secret';
      const request = new NextRequest('http://localhost:3000/api/cron/test', {
        method: 'POST',
        headers: {
          authorization: 'Bearer server-only-cron-secret',
          Cookie: 'sb-localhost-auth-token=session-value',
        },
      });
      const response = await csrfProtection(request);

      expect(response).not.toBeNull();
      expect(response?.status).toBe(403);
    });

    it('should return null for pure bearer-token mobile API requests', async () => {
      const request = new NextRequest('http://localhost:3000/api/mobile/v1/bootstrap', {
        method: 'POST',
        headers: {
          authorization: 'Bearer mobile-token',
        },
      });
      await expect(csrfProtection(request)).resolves.toBeNull();
    });

    it('should require CSRF for bearer API requests that also include browser auth cookies', async () => {
      const request = new NextRequest('http://localhost:3000/api/mobile/v1/bootstrap', {
        method: 'POST',
        headers: {
          authorization: 'Bearer mobile-token',
          Cookie: 'sb-localhost-auth-token=session-value',
        },
      });
      const response = await csrfProtection(request);

      expect(response).not.toBeNull();
      expect(response?.status).toBe(403);
    });

    it('should reject cookie-auth assignment mutations without CSRF', async () => {
      const request = new NextRequest('http://localhost:3000/api/assignments', {
        method: 'POST',
        headers: {
          Cookie: 'sb-localhost-auth-token=session-value',
        },
      });
      const response = await csrfProtection(request);

      expect(response).not.toBeNull();
      expect(response?.status).toBe(403);
    });

    it('should return 403 response for POST without token', async () => {
      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
      });
      const response = await csrfProtection(request);
      expect(response).not.toBeNull();
      expect(response?.status).toBe(403);
    });

    it('should return null for POST with valid signed token', async () => {
      const token = await generateSignedCSRFToken(
        new NextRequest('http://localhost:3000/api/test', {
          headers: {
            Cookie: sessionCookie,
          },
        })
      );
      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        headers: {
          'x-csrf-token': token,
          Cookie: `csrf_token=${token}; ${sessionCookie}`,
        },
      });
      await expect(csrfProtection(request)).resolves.toBeNull();
    });
  });
});
