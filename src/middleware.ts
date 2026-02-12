import { NextResponse, type NextRequest } from 'next/server';
import { nanoid } from 'nanoid';
import { csrfProtection, getOrGenerateCSRFToken, setCSRFTokenCookie } from '@/lib/csrf';
import { checkRateLimit, getRateLimitHeaders } from '@/lib/rate-limit/index';

// Apply consistent security headers for both page and API responses.
const applySecurityHeaders = (response: NextResponse, request: NextRequest) => {
  const host = request.headers.get('host') || '';
  const isProd = host.includes('proofound.io');
  const isDev = process.env.NODE_ENV !== 'production';
  const pathname = request.nextUrl.pathname;
  const isSnippetEmbedRoute = /^\/p\/[^/]+\/embed\/?$/.test(pathname);

  // Note: Next dev uses eval-like codepaths (React Refresh / Webpack runtime). If CSP blocks
  // unsafe-eval in development, the app may never hydrate, breaking interactive flows.
  const scriptSrc = isDev
    ? "script-src 'self' 'unsafe-inline' 'unsafe-eval' https:"
    : "script-src 'self' 'unsafe-inline' https:";

  const connectSrc = isDev
    ? "connect-src 'self' https: wss: ws:"
    : "connect-src 'self' https: wss:";

  const cspDirectives = [
    "default-src 'self' https:",
    // Allow inline boot scripts from Next.js; safer nonce/hashes could be added later.
    scriptSrc,
    "style-src 'self' 'unsafe-inline' https:",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data: https:",
    connectSrc,
    "frame-src 'self' https:",
    "object-src 'none'",
    isSnippetEmbedRoute ? 'frame-ancestors *' : "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ');

  response.headers.set('Content-Security-Policy', cspDirectives);
  if (isSnippetEmbedRoute) {
    response.headers.delete('X-Frame-Options');
  } else {
    response.headers.set('X-Frame-Options', 'DENY');
  }
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Permissions-Policy',
    'accelerometer=(), ambient-light-sensor=(), autoplay=(), battery=(), camera=(), display-capture=(), encrypted-media=(), fullscreen=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), midi=(), payment=(), picture-in-picture=(), publickey-credentials-get=(), screen-wake-lock=(), sync-xhr=(), usb=()'
  );

  if (isProd) {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=63072000; includeSubDomains; preload'
    );
  }

  return response;
};

const SUSPICIOUS_PREFIXES = [
  '/wp-',
  '/wp/',
  '/php',
  '/phpmyadmin',
  '/.git',
  '/.env',
  '/server-status',
  '/cgi-bin',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const requestId = request.headers.get('x-request-id') || nanoid(12);

  try {
    const isDev = process.env.NODE_ENV !== 'production';
    const isStaticAsset =
      pathname.startsWith('/_next') ||
      pathname.match(/\.(ico|png|jpg|jpeg|gif|svg|css|js|webp|woff2?|ttf|otf|map)$/);

    // Short-circuit obvious scanner paths before heavier logic.
    if (SUSPICIOUS_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
      const blocked = NextResponse.json({ error: 'Not found' }, { status: 404 });
      blocked.headers.set('x-request-id', requestId);
      applySecurityHeaders(blocked, request);
      return blocked;
    }

    // Skip edge rate limiting if Vercel KV is not configured to avoid runtime errors.
    const kvReady =
      Boolean(process.env.KV_REST_API_URL) &&
      (Boolean(process.env.KV_REST_API_TOKEN) || Boolean(process.env.KV_REST_API_READ_ONLY_TOKEN));

    // Gentle edge rate limiting to slow down bursts without affecting normal users.
    let rateLimitHeaders: Record<string, string> | null = null;
    if (!isStaticAsset && kvReady) {
      try {
        const rateLimitConfig = pathname.startsWith('/api')
          ? { limit: 120, windowSeconds: 60, identifier: 'edge-api' }
          : { limit: 240, windowSeconds: 60, identifier: 'edge-site' };

        const { allowed, result } = await checkRateLimit(request, rateLimitConfig);
        rateLimitHeaders = getRateLimitHeaders(result);

        if (!allowed) {
          const retryAfter = Math.max(1, Math.ceil((result.reset - Date.now()) / 1000));
          const limited = NextResponse.json(
            {
              error: 'Too many requests',
              message: 'Please slow down and try again shortly.',
              retryAfter,
            },
            {
              status: 429,
              headers: {
                ...rateLimitHeaders,
                'Retry-After': retryAfter.toString(),
              },
            }
          );
          limited.headers.set('x-request-id', requestId);
          applySecurityHeaders(limited, request);
          return limited;
        }
      } catch (error) {
        console.error('[middleware] rate limit check failed; continuing without throttle', error);
      }
    }

    const attachRateLimitHeaders = (response: NextResponse) => {
      if (rateLimitHeaders) {
        Object.entries(rateLimitHeaders).forEach(([key, value]) => {
          response.headers.set(key, value);
        });
      }
      return response;
    };

    // #region agent log
    if (isDev) {
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
    }
    // #endregion

    // CSRF protection for API routes (allowlist some public endpoints)
    if (pathname.startsWith('/api')) {
      // Allow anonymous web-vitals posts without CSRF blocking
      if (pathname.startsWith('/api/analytics/web-vitals')) {
        const response = NextResponse.next();
        response.headers.set('x-request-id', requestId);
        attachRateLimitHeaders(response);
        applySecurityHeaders(response, request);
        return response;
      }

      const csrfError = csrfProtection(request);
      if (csrfError) {
        csrfError.headers.set('x-request-id', requestId);
        attachRateLimitHeaders(csrfError);
        applySecurityHeaders(csrfError, request);
        return csrfError;
      }

      const csrfToken = getOrGenerateCSRFToken(request);
      const response = NextResponse.next();
      response.headers.set('x-request-id', requestId);
      setCSRFTokenCookie(response, csrfToken);
      attachRateLimitHeaders(response);
      applySecurityHeaders(response, request);

      // #region agent log
      if (isDev) {
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
      }
      // #endregion

      return response;
    }

    // Allow public/static routes without extra checks
    if (
      pathname.startsWith('/auth') ||
      pathname.startsWith('/login') ||
      pathname.startsWith('/signup') ||
      pathname.startsWith('/reset-password') ||
      pathname.startsWith('/verify-email') ||
      pathname.startsWith('/onboarding') ||
      pathname.startsWith('/cookies') ||
      pathname === '/' ||
      pathname === '/403' ||
      isStaticAsset
    ) {
      const csrfToken = getOrGenerateCSRFToken(request);
      const response = NextResponse.next();
      response.headers.set('x-request-id', requestId);
      setCSRFTokenCookie(response, csrfToken);
      attachRateLimitHeaders(response);
      applySecurityHeaders(response, request);
      return response;
    }

    const csrfToken = getOrGenerateCSRFToken(request);
    const response = NextResponse.next();
    response.headers.set('x-request-id', requestId);
    setCSRFTokenCookie(response, csrfToken);
    attachRateLimitHeaders(response);
    applySecurityHeaders(response, request);
    return response;
  } catch (error) {
    console.error('[middleware] unexpected failure; failing open', {
      path: request.nextUrl.pathname,
      error,
    });
    const fallback = NextResponse.next();
    fallback.headers.set('x-request-id', requestId);
    applySecurityHeaders(fallback, request);
    return fallback;
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
