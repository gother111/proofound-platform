import { describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { generateCSRFToken, verifyCSRFToken, csrfProtection } from '../csrf';

describe('CSRF Protection', () => {
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
    it('should allow GET requests without token', () => {
      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'GET',
      });
      expect(verifyCSRFToken(request)).toBe(true);
    });

    it('should allow HEAD requests without token', () => {
      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'HEAD',
      });
      expect(verifyCSRFToken(request)).toBe(true);
    });

    it('should allow OPTIONS requests without token', () => {
      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'OPTIONS',
      });
      expect(verifyCSRFToken(request)).toBe(true);
    });

    it('should reject POST requests without token', () => {
      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
      });
      expect(verifyCSRFToken(request)).toBe(false);
    });

    it('should reject POST requests with only header token', () => {
      const token = generateCSRFToken();
      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        headers: {
          'x-csrf-token': token,
        },
      });
      expect(verifyCSRFToken(request)).toBe(false);
    });

    it('should reject POST requests with mismatched tokens', () => {
      const token1 = generateCSRFToken();
      const token2 = generateCSRFToken();
      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        headers: {
          'x-csrf-token': token1,
          Cookie: `csrf_token=${token2}`,
        },
      });
      expect(verifyCSRFToken(request)).toBe(false);
    });

    it('should accept POST requests with matching tokens', () => {
      const token = generateCSRFToken();
      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        headers: {
          'x-csrf-token': token,
          Cookie: `csrf_token=${token}`,
        },
      });
      expect(verifyCSRFToken(request)).toBe(true);
    });

    it('should accept PATCH requests with matching tokens', () => {
      const token = generateCSRFToken();
      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'PATCH',
        headers: {
          'x-csrf-token': token,
          Cookie: `csrf_token=${token}`,
        },
      });
      expect(verifyCSRFToken(request)).toBe(true);
    });

    it('should accept DELETE requests with matching tokens', () => {
      const token = generateCSRFToken();
      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'DELETE',
        headers: {
          'x-csrf-token': token,
          Cookie: `csrf_token=${token}`,
        },
      });
      expect(verifyCSRFToken(request)).toBe(true);
    });
  });

  describe('csrfProtection', () => {
    it('should return null for GET requests', () => {
      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'GET',
      });
      expect(csrfProtection(request)).toBeNull();
    });

    it('should return null for webhook endpoints', () => {
      const request = new NextRequest('http://localhost:3000/api/webhook/test', {
        method: 'POST',
      });
      expect(csrfProtection(request)).toBeNull();
    });

    it('should return null for cron endpoints', () => {
      const request = new NextRequest('http://localhost:3000/api/cron/test', {
        method: 'POST',
      });
      expect(csrfProtection(request)).toBeNull();
    });

    it('should return 403 response for POST without token', () => {
      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
      });
      const response = csrfProtection(request);
      expect(response).not.toBeNull();
      expect(response?.status).toBe(403);
    });

    it('should return null for POST with valid token', () => {
      const token = generateCSRFToken();
      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        headers: {
          'x-csrf-token': token,
          Cookie: `csrf_token=${token}`,
        },
      });
      expect(csrfProtection(request)).toBeNull();
    });
  });
});
