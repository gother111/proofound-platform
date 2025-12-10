import { NextResponse, type NextRequest } from 'next/server';
import { nanoid } from 'nanoid';
import { csrfProtection, getOrGenerateCSRFToken, setCSRFTokenCookie } from '@/lib/csrf';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const requestId = request.headers.get('x-request-id') || nanoid(12);

  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/381d9e33-65b3-4af0-9925-b21521306aaa', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: 'debug-session',
      runId: 'pre-fix-1',
      hypothesisId: 'H-edge',
      location: 'middleware.ts:entry',
      message: 'Middleware entry',
      data: { path: pathname, method: request.method, isApi: pathname.startsWith('/api') },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion

  // CSRF protection for API routes
  if (pathname.startsWith('/api')) {
    const csrfError = csrfProtection(request);
    if (csrfError) {
      csrfError.headers.set('x-request-id', requestId);
      return csrfError;
    }

    const csrfToken = getOrGenerateCSRFToken(request);
    const response = NextResponse.next();
    response.headers.set('x-request-id', requestId);
    setCSRFTokenCookie(response, csrfToken);

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/381d9e33-65b3-4af0-9925-b21521306aaa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: 'debug-session',
        runId: 'pre-fix-1',
        hypothesisId: 'H-edge',
        location: 'middleware.ts:api',
        message: 'API middleware pass-through',
        data: { path: pathname },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion

    return response;
  }

  // Allow public/static routes without extra checks
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/auth') ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/signup') ||
    pathname.startsWith('/reset-password') ||
    pathname.startsWith('/verify-email') ||
    pathname.startsWith('/onboarding') ||
    pathname.startsWith('/cookies') ||
    pathname === '/' ||
    pathname === '/403' ||
    pathname.match(/\.(ico|png|jpg|jpeg|gif|svg|css|js)$/)
  ) {
    const csrfToken = getOrGenerateCSRFToken(request);
    const response = NextResponse.next();
    response.headers.set('x-request-id', requestId);
    setCSRFTokenCookie(response, csrfToken);
    return response;
  }

  const csrfToken = getOrGenerateCSRFToken(request);
  const response = NextResponse.next();
  response.headers.set('x-request-id', requestId);
  setCSRFTokenCookie(response, csrfToken);
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
