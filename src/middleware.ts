import { NextResponse, type NextRequest } from 'next/server';
import { nanoid } from 'nanoid';
import { csrfProtection, getOrGenerateCSRFToken, setCSRFTokenCookie } from '@/lib/csrf';
import { getArchivedApiPolicy, getArchivedPagePolicy } from '@/lib/launch/surface-policy';
import {
  checkRateLimit,
  getRateLimitHeaders,
  getRateLimitProfileForPathname,
} from '@/lib/rate-limit/index';
import { sendDebugIngest } from '@/lib/debug-ingest';

const TRUE_ENV_VALUES = new Set(['1', 'true', 'yes', 'on']);

function isEnabled(value: string | undefined): boolean {
  return value ? TRUE_ENV_VALUES.has(value.trim().toLowerCase()) : false;
}

function shouldSendHstsHeader(): boolean {
  const explicitHstsSetting = process.env.PROOFOUND_ENABLE_HSTS ?? process.env.ENABLE_HSTS;

  if (explicitHstsSetting !== undefined) {
    return isEnabled(explicitHstsSetting);
  }

  return process.env.VERCEL_ENV === 'production';
}

function generateCspNonce(): string {
  return btoa(crypto.randomUUID());
}

function buildContentSecurityPolicy(nonce?: string): string {
  const isDev = process.env.NODE_ENV === 'development' && process.env.VERCEL_ENV !== 'production';
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseOrigin = (() => {
    try {
      return supabaseUrl ? new URL(supabaseUrl).origin : null;
    } catch {
      return null;
    }
  })();

  // Note: Next dev uses eval-like codepaths (React Refresh / Webpack runtime). If CSP blocks
  // unsafe-eval in development, the app may never hydrate, breaking interactive flows.
  const scriptSrc = isDev
    ? "script-src 'self' 'unsafe-inline' 'unsafe-eval' https:"
    : ["script-src 'self'", nonce ? `'nonce-${nonce}'` : null, nonce ? "'strict-dynamic'" : null]
        .filter(Boolean)
        .join(' ');

  const connectSrc = isDev
    ? "connect-src 'self' https: wss: ws:"
    : ["connect-src 'self'", supabaseOrigin, 'https://*.supabase.co', 'wss://*.supabase.co']
        .filter(Boolean)
        .join(' ');

  return [
    "default-src 'self'",
    scriptSrc,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    [
      "img-src 'self' data: blob:",
      supabaseOrigin,
      'https://*.supabase.co',
      'https://images.unsplash.com',
    ]
      .filter(Boolean)
      .join(' '),
    "font-src 'self' data: https://fonts.gstatic.com",
    connectSrc,
    "frame-src 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ');
}

function getMiddlewareErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return 'unknown';
}

function writeMiddlewareDiagnostic(
  event: string,
  requestId: string,
  pathname: string,
  error: unknown,
  meta: Record<string, unknown> = {}
) {
  console.error(
    JSON.stringify({
      level: 'error',
      event,
      requestId,
      path: pathname,
      error: getMiddlewareErrorMessage(error),
      ...meta,
    })
  );
}

function buildNonceRequestHeaders(request: NextRequest, nonce: string): Headers {
  const requestHeaders = new Headers(request.headers);
  const csp = buildContentSecurityPolicy(nonce);

  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', csp);

  return requestHeaders;
}

function buildNextResponseForPage(request: NextRequest, nonce: string): NextResponse {
  return NextResponse.next({
    request: {
      headers: buildNonceRequestHeaders(request, nonce),
    },
  });
}

function shouldIssuePageCsrfCookie(pathname: string): boolean {
  return pathname === '/onboarding' || pathname.startsWith('/app/');
}

function isServerActionRequest(request: NextRequest): boolean {
  return request.headers.has('next-action');
}

const CSRF_COOKIE_SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

function shouldIssueApiCsrfCookie(request: NextRequest): boolean {
  return !CSRF_COOKIE_SAFE_METHODS.has(request.method.toUpperCase());
}

function setCSRFTokenCookieIfChanged(
  request: NextRequest,
  response: NextResponse,
  csrfToken: string
) {
  if (request.cookies.get('csrf_token')?.value === csrfToken) {
    return;
  }

  setCSRFTokenCookie(response, csrfToken);
}

// Apply consistent security headers for both page and API responses.
const applySecurityHeaders = (response: NextResponse, request: NextRequest, nonce?: string) => {
  response.headers.set('Content-Security-Policy', buildContentSecurityPolicy(nonce));
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Permissions-Policy',
    'accelerometer=(), autoplay=(), camera=(), display-capture=(), encrypted-media=(), fullscreen=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), midi=(), payment=(), picture-in-picture=(), publickey-credentials-get=(), screen-wake-lock=(), sync-xhr=(), usb=()'
  );

  if (shouldSendHstsHeader()) {
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

function buildFailClosedApiResponse(request: NextRequest, requestId: string) {
  const response = NextResponse.json(
    {
      error: 'Internal server error',
      message: 'Request failed',
      requestId,
    },
    { status: 500 }
  );
  response.headers.set('x-request-id', requestId);
  applySecurityHeaders(response, request);
  return response;
}

function buildRateLimitUnavailableResponse(
  request: NextRequest,
  requestId: string,
  rateLimitHeaders: Record<string, string>,
  retryAfter: number
) {
  const response = NextResponse.json(
    {
      error: 'Service temporarily unavailable',
      message: 'Request protection is temporarily unavailable. Please try again shortly.',
      retryAfter,
    },
    {
      status: 503,
      headers: {
        ...rateLimitHeaders,
        'Retry-After': retryAfter.toString(),
      },
    }
  );
  response.headers.set('x-request-id', requestId);
  applySecurityHeaders(response, request);
  return response;
}

function buildRateLimitedResponse(
  request: NextRequest,
  requestId: string,
  rateLimitHeaders: Record<string, string>,
  retryAfter: number
) {
  const response = NextResponse.json(
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
  response.headers.set('x-request-id', requestId);
  applySecurityHeaders(response, request);
  return response;
}

function buildArchivedApiResponse(
  request: NextRequest,
  requestId: string,
  surface: string,
  detail: string,
  status = 410
) {
  const response = NextResponse.json(
    {
      error: `${surface} is unavailable in the launch MVP corridor.`,
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
        box-sizing: border-box;
        overflow-x: hidden;
        min-height: 100vh;
        display: grid;
        place-items: center;
        background: #f3f0e8;
        color: #3f3f3f;
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }
      *, *::before, *::after { box-sizing: inherit; }
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
      .surface {
        margin-top: 1rem;
        overflow-wrap: anywhere;
        font-weight: 600;
      }
      @media (max-width: 480px) {
        main {
          padding: 1.5rem;
          border-radius: 1.5rem;
        }
      }
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
  const isApiRoute = pathname.startsWith('/api');
  const isStaticAsset =
    pathname.startsWith('/_next') ||
    pathname.match(
      /\.(ico|png|jpg|jpeg|gif|svg|css|js|webp|mp4|m4v|webm|mov|woff2?|ttf|otf|map|txt|xml|webmanifest)$/
    );
  const isServerAction = isServerActionRequest(request);
  const pageNonce =
    !isApiRoute && !isStaticAsset && !isServerAction ? generateCspNonce() : undefined;

  try {
    const isDev = process.env.NODE_ENV !== 'production';

    // Short-circuit obvious scanner paths before heavier logic.
    if (SUSPICIOUS_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
      const blocked = NextResponse.json({ error: 'Not found' }, { status: 404 });
      blocked.headers.set('x-request-id', requestId);
      applySecurityHeaders(blocked, request);
      return blocked;
    }

    if (isApiRoute) {
      const archivedApiPolicy = getArchivedApiPolicy(pathname);
      if (archivedApiPolicy) {
        return buildArchivedApiResponse(
          request,
          requestId,
          archivedApiPolicy.surfaceLabel,
          archivedApiPolicy.detail
        );
      }
    }

    let rateLimitHeaders: Record<string, string> | null = null;
    if (!isStaticAsset) {
      try {
        const rateLimitConfig = getRateLimitProfileForPathname(pathname, request.method);

        if (rateLimitConfig) {
          const { allowed, result } = await checkRateLimit(request, rateLimitConfig);
          rateLimitHeaders = getRateLimitHeaders(result);

          if (!allowed) {
            const retryAfter = Math.max(1, Math.ceil((result.reset - Date.now()) / 1000));

            if (result.unavailable) {
              return buildRateLimitUnavailableResponse(
                request,
                requestId,
                rateLimitHeaders,
                retryAfter
              );
            }

            return buildRateLimitedResponse(request, requestId, rateLimitHeaders, retryAfter);
          }
        }
      } catch (error) {
        if (isApiRoute) {
          writeMiddlewareDiagnostic(
            'middleware.rate_limit_check_failed',
            requestId,
            pathname,
            error,
            { failMode: 'api_fail_closed' }
          );
          return buildFailClosedApiResponse(request, requestId);
        }

        writeMiddlewareDiagnostic(
          'middleware.rate_limit_check_failed',
          requestId,
          pathname,
          error,
          {
            failMode: 'page_continue_without_throttle',
          }
        );
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
        data: { path: pathname, method: request.method, isApi: isApiRoute },
      });
    }

    // CSRF protection for API routes (allowlist some public endpoints)
    if (isApiRoute) {
      // Allow anonymous web-vitals posts without CSRF blocking
      if (pathname.startsWith('/api/analytics/web-vitals')) {
        const response = NextResponse.next();
        response.headers.set('x-request-id', requestId);
        attachRateLimitHeaders(response);
        applySecurityHeaders(response, request);
        return response;
      }

      const csrfError = await csrfProtection(request);
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

      const response = NextResponse.next();
      response.headers.set('x-request-id', requestId);
      if (shouldIssueApiCsrfCookie(request)) {
        const csrfToken = await getOrGenerateCSRFToken(request);
        setCSRFTokenCookieIfChanged(request, response, csrfToken);
      }
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

    const response = pageNonce ? buildNextResponseForPage(request, pageNonce) : NextResponse.next();
    response.headers.set('x-request-id', requestId);
    if (!isServerAction && shouldIssuePageCsrfCookie(pathname)) {
      const csrfToken = await getOrGenerateCSRFToken(request);
      setCSRFTokenCookieIfChanged(request, response, csrfToken);
    }
    attachRateLimitHeaders(response);
    applySecurityHeaders(response, request, pageNonce);
    return response;
  } catch (error) {
    writeMiddlewareDiagnostic('middleware.unexpected_error', requestId, pathname, error, {
      failMode: isApiRoute ? 'api_fail_closed' : 'page_continue_with_security_headers',
    });

    if (isApiRoute) {
      return buildFailClosedApiResponse(request, requestId);
    }

    const response = pageNonce ? buildNextResponseForPage(request, pageNonce) : NextResponse.next();
    response.headers.set('x-request-id', requestId);
    applySecurityHeaders(response, request, pageNonce);
    return response;
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
