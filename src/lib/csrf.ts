import { NextRequest, NextResponse } from 'next/server';

/**
 * CSRF Protection Utility
 *
 * Implements double-submit cookie pattern for CSRF protection.
 * Works alongside Next.js SameSite cookie defaults.
 */

const CSRF_TOKEN_HEADER = 'x-csrf-token';
const CSRF_TOKEN_COOKIE = 'csrf_token';
const TOKEN_LENGTH = 32;

/**
 * Generate a cryptographically secure CSRF token
 */
export function generateCSRFToken(): string {
  // Use Web Crypto (Edge/Browser/Node 18+) to avoid Node crypto in middleware
  const bytes = new Uint8Array(TOKEN_LENGTH);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Verify CSRF token from request
 *
 * @param request - The incoming request
 * @returns true if token is valid, false otherwise
 */
export function verifyCSRFToken(request: NextRequest): boolean {
  // GET, HEAD, OPTIONS requests don't need CSRF protection
  const method = request.method.toUpperCase();
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    return true;
  }

  // Get token from header
  const headerToken = request.headers.get(CSRF_TOKEN_HEADER);
  if (!headerToken) {
    return false;
  }

  // Get token from cookie
  const cookieToken = request.cookies.get(CSRF_TOKEN_COOKIE)?.value;
  if (!cookieToken) {
    return false;
  }

  // Compare tokens directly (double-submit cookie pattern)
  return headerToken === cookieToken;
}

/**
 * Middleware to check CSRF tokens on mutating requests
 */
export function csrfProtection(request: NextRequest): NextResponse | null {
  // Skip CSRF check for safe methods
  const method = request.method.toUpperCase();
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    return null;
  }

  // Skip CSRF check for webhook endpoints (they use other auth)
  const pathname = request.nextUrl.pathname;
  if (pathname.includes('/webhook') || pathname.includes('/cron')) {
    return null;
  }

  // Skip CSRF for internal authenticated API routes
  // These routes are called from authenticated pages and protected by session cookies
  // The Supabase session cookie with SameSite=Lax provides CSRF protection.
  const internalAuthRoutes = [
    '/api/match/',
    '/api/core/matching/',
    '/api/assignments',
    '/api/interviews/',
    '/api/analytics/',
    '/api/messages/',
    '/api/goals/',
    '/api/skill-gaps/',
    '/api/dashboard/layout',
  ];

  const hasSupabaseSession = request.cookies
    .getAll()
    .some(({ name }) => /^sb-[a-z0-9]+-auth-token(?:\.\d+)?$/i.test(name));

  if (hasSupabaseSession && internalAuthRoutes.some((route) => pathname.startsWith(route))) {
    return null;
  }

  // Verify CSRF token
  if (!verifyCSRFToken(request)) {
    return NextResponse.json(
      {
        error: 'CSRF validation failed',
        message: 'Invalid or missing CSRF token',
      },
      { status: 403 }
    );
  }

  return null; // Token is valid, continue
}

/**
 * Get CSRF token from request or generate a new one
 */
export function getOrGenerateCSRFToken(request: NextRequest): string {
  const existingToken = request.cookies.get(CSRF_TOKEN_COOKIE)?.value;
  return existingToken || generateCSRFToken();
}

/**
 * Set CSRF token cookie in response
 */
export function setCSRFTokenCookie(response: NextResponse, token: string): void {
  response.cookies.set(CSRF_TOKEN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24, // 24 hours
  });
}

/**
 * API route helper to validate CSRF token
 */
export async function requireValidCSRF(request: NextRequest): Promise<void> {
  if (!verifyCSRFToken(request)) {
    throw new Error('CSRF token validation failed');
  }
}
