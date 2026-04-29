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
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
const MIN_INTERNAL_SECRET_LENGTH = 16;
const INVALID_INTERNAL_SECRET_VALUES = new Set(['undefined', 'null']);
const SUPABASE_SESSION_COOKIE_PATTERN = /^sb-[a-z0-9]+-auth-token(?:\.\d+)?$/i;

function normalizeInternalSecret(value: string | undefined): string | null {
  const secret = value?.trim();
  if (!secret) return null;
  if (INVALID_INTERNAL_SECRET_VALUES.has(secret.toLowerCase())) return null;
  if (secret.length < MIN_INTERNAL_SECRET_LENGTH) return null;
  return secret;
}

function getConfiguredInternalSecrets(): string[] {
  return [
    process.env.INTERNAL_API_SECRET,
    process.env.CRON_SECRET,
    process.env.CRON_SECRET_PREVIEW,
  ].flatMap((value) => {
    const secret = normalizeInternalSecret(value);
    return secret ? [secret] : [];
  });
}

function constantTimeEquals(left: string, right: string): boolean {
  if (left.length !== right.length) {
    return false;
  }

  let diff = 0;
  for (let index = 0; index < left.length; index += 1) {
    diff |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return diff === 0;
}

function getPresentedInternalSecrets(request: NextRequest): string[] {
  const authorization = request.headers.get('authorization')?.trim();
  const bearerToken = authorization?.match(/^Bearer\s+(.+)$/i)?.[1]?.trim();
  const internalApiKey = request.headers.get('x-internal-api-key')?.trim();

  return [bearerToken, internalApiKey].flatMap((value) => (value ? [value] : []));
}

function isVerifiedInternalServerRequest(request: NextRequest): boolean {
  const configuredSecrets = getConfiguredInternalSecrets();
  if (configuredSecrets.length === 0) {
    return false;
  }

  const presentedSecrets = getPresentedInternalSecrets(request);
  return configuredSecrets.some((configuredSecret) =>
    presentedSecrets.some((presentedSecret) =>
      constantTimeEquals(presentedSecret, configuredSecret)
    )
  );
}

function hasBearerAuthorization(request: NextRequest): boolean {
  return /^Bearer\s+\S+/i.test(request.headers.get('authorization')?.trim() ?? '');
}

function hasCookieAuthenticatedSession(request: NextRequest): boolean {
  return request.cookies.getAll().some(({ name }) => SUPABASE_SESSION_COOKIE_PATTERN.test(name));
}

function isPureBearerTokenApiRequest(request: NextRequest): boolean {
  const pathname = request.nextUrl.pathname;
  return (
    pathname.startsWith('/api/mobile/') &&
    hasBearerAuthorization(request) &&
    !hasCookieAuthenticatedSession(request)
  );
}

function isExternalNonCookieCallback(request: NextRequest): boolean {
  const pathname = request.nextUrl.pathname;
  return pathname.includes('/webhook') && !hasCookieAuthenticatedSession(request);
}

function isVerifiedInternalNonCookieRequest(request: NextRequest): boolean {
  const pathname = request.nextUrl.pathname;
  return (
    pathname.includes('/cron') &&
    isVerifiedInternalServerRequest(request) &&
    !hasCookieAuthenticatedSession(request)
  );
}

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
  if (SAFE_METHODS.has(method)) {
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
  if (SAFE_METHODS.has(method)) {
    return null;
  }

  // Pure bearer-token API flows do not use browser cookies for authentication.
  if (isPureBearerTokenApiRequest(request)) {
    return null;
  }

  // Internal server-to-server jobs must prove the configured internal secret.
  if (isVerifiedInternalNonCookieRequest(request)) {
    return null;
  }

  // External callbacks are authenticated by their own signature/token scheme and do not use
  // Proofound browser session cookies. Cookie-authenticated webhook-like routes still need CSRF.
  if (isExternalNonCookieCallback(request)) {
    return null;
  }

  // Verify CSRF token
  if (!verifyCSRFToken(request)) {
    return NextResponse.json(
      {
        error: 'CSRF validation failed',
        message: 'Request blocked',
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
