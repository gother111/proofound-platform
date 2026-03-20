import { NextResponse, type NextRequest } from 'next/server';
import { nanoid } from 'nanoid';
import { csrfProtection, getOrGenerateCSRFToken, setCSRFTokenCookie } from '@/lib/csrf';
import { getArchivedApiPolicy, getArchivedPagePolicy } from '@/lib/launch/surface-policy';
import { checkRateLimit, getRateLimitHeaders } from '@/lib/rate-limit/index';
import { sendDebugIngest } from '@/lib/debug-ingest';

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

function buildArchivedApiResponse(
  request: NextRequest,
  requestId: string,
  surface: string,
  detail: string,
  status = 410
) {
  const response = NextResponse.json(
    {
      error: `${surface} is not part of the launch MVP corridor.`,
      message: detail,
      surface,
      launchState: 'non_launch',
    },
    { status }
  );
  response.headers.set('x-request-id', requestId);
  applySecurityHeaders(response, request);
  return response;
}

function buildArchivedPageResponse(
  request: NextRequest,
  requestId: string,
  surface: string,
  detail: string,
  status = 404
) {
  const response = new NextResponse(`Not found\n\n${surface}: ${detail}`, {
    status,
    headers: {
      'content-type': 'text/plain; charset=utf-8',
    },
  });
  response.headers.set('x-request-id', requestId);
  applySecurityHeaders(response, request);
  return response;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const requestId = request.headers.get('x-request-id') || nanoid(12);

  try {
    const isDev = process.env.NODE_ENV !== 'production';
    const isStaticAsset =
      pathname.startsWith('/_next') ||
      pathname.match(
        /\.(ico|png|jpg|jpeg|gif|svg|css|js|webp|woff2?|ttf|otf|map|txt|xml|webmanifest)$/
      );

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

    if (isDev) {
      sendDebugIngest({
        sessionId: 'debug-session',
        runId: 'launch-readiness',
        hypothesisId: 'H-edge',
        location: 'middleware.ts:entry',
        message: 'Middleware entry',
        data: { path: pathname, method: request.method, isApi: pathname.startsWith('/api') },
      });
    }

    // CSRF protection for API routes (allowlist some public endpoints)
    if (pathname.startsWith('/api')) {
      const archivedApiPolicy = getArchivedApiPolicy(pathname);
      if (archivedApiPolicy) {
        return buildArchivedApiResponse(
          request,
          requestId,
          archivedApiPolicy.surfaceLabel,
          archivedApiPolicy.detail
        );
      }

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

      // `/api/csrf-token` route is the canonical source for CSRF token issuance.
      // Avoid issuing a second token in middleware to prevent token mismatch races.
      if (pathname === '/api/csrf-token') {
        const response = NextResponse.next();
        response.headers.set('x-request-id', requestId);
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

      if (isDev) {
        sendDebugIngest({
          sessionId: 'debug-session',
          runId: 'launch-readiness',
          hypothesisId: 'H-edge',
          location: 'middleware.ts:api',
          message: 'API middleware pass-through',
          data: { path: pathname },
        });
      }

      return response;
    }

    if (isStaticAsset) {
      const response = NextResponse.next();
      response.headers.set('x-request-id', requestId);
      attachRateLimitHeaders(response);
      applySecurityHeaders(response, request);
      return response;
    }

    const archivedPagePolicy = getArchivedPagePolicy(pathname);
    if (archivedPagePolicy) {
      return buildArchivedPageResponse(
        request,
        requestId,
        archivedPagePolicy.surfaceLabel,
        archivedPagePolicy.detail
      );
    }

    const csrfToken = getOrGenerateCSRFToken(request);
    const response = NextResponse.next();
    response.headers.set('x-request-id', requestId);
    setCSRFTokenCookie(response, csrfToken);
    attachRateLimitHeaders(response);
    applySecurityHeaders(response, request);
    return response;
  } catch (error) {
    console.error('[middleware] unexpected error', error);
    const response = NextResponse.next();
    response.headers.set('x-request-id', requestId);
    applySecurityHeaders(response, request);
    return response;
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
