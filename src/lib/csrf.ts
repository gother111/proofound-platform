import { NextRequest, NextResponse } from 'next/server';
import { createHash, randomBytes } from 'crypto';

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
  return randomBytes(TOKEN_LENGTH).toString('hex');
}

/**
 * Hash a CSRF token for comparison (prevents timing attacks)
 */
function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
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

  // Compare hashed tokens to prevent timing attacks
  const headerHash = hashToken(headerToken);
  const cookieHash = hashToken(cookieToken);

  return headerHash === cookieHash;
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
  // The Supabase session cookie with SameSite=Lax provides CSRF protection
  const internalAuthRoutes = [
    '/api/match/',
    '/api/matching-profile',
    '/api/assignments',
    '/api/interviews/',
    '/api/analytics/',
    '/api/expertise/',
    '/api/profile/',
    '/api/taxonomy/',
    '/api/messages/',
    '/api/wellbeing/',
    '/api/notifications/',
    '/api/feedback/',
  ];

  const hasSupabaseSession =
    request.cookies.has('sb-cjpfrgmsxwxhuomnvciq-auth-token') ||
    request.cookies.has('sb-cjpfrgmsxwxhuomnvciq-auth-token.0') ||
    request.cookies.has('sb-cjpfrgmsxwxhuomnvciq-auth-token.1');

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
