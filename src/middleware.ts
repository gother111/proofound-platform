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
  const escapeHtml = (value: string) =>
    value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

  const escapedSurface = escapeHtml(surface);
  const escapedDetail = escapeHtml(detail);
  const response = new NextResponse(
    `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="robots" content="noindex, nofollow">
    <title>Not found | Proofound</title>
    <style>
      :root { color-scheme: light; }
      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        background: #f3f0e8;
        color: #3f3f3f;
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }
      main {
        width: min(92vw, 34rem);
        padding: 2rem;
        border: 1px solid #d5caba;
        border-radius: 1rem;
        background: #e6e4e0;
      }
      h1 {
        margin: 0 0 0.75rem;
        color: #303030;
        font-size: clamp(1.75rem, 4vw, 2.25rem);
        line-height: 1.1;
      }
      p { margin: 0; line-height: 1.6; }
      .surface { margin-top: 1rem; font-weight: 600; }
    </style>
  </head>
  <body>
    <main>
      <h1>Not found</h1>
      <p>This page is outside the locked launch MVP corridor.</p>
      <p class="surface">${escapedSurface}: ${escapedDetail}</p>
    </main>
  </body>
</html>`,
    {
      status,
      headers: {
        'content-type': 'text/html; charset=utf-8',
      },
    }
  );
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
        /\.(ico|png|jpg|jpeg|gif|svg|css|js|webp|mp4|m4v|webm|mov|woff2?|ttf|otf|map|txt|xml|webmanifest)$/
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

    const nonLaunchPagePolicy = getArchivedPagePolicy(pathname);
    if (nonLaunchPagePolicy) {
      return buildArchivedPageResponse(
        request,
        requestId,
        nonLaunchPagePolicy.surfaceLabel,
        nonLaunchPagePolicy.detail
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
