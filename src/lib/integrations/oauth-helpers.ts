import type { NextRequest } from 'next/server';
import { sanitizeReturnPath } from '@/lib/navigation/sanitize-return-path';

export const DEFAULT_INTEGRATIONS_RETURN_PATH = '/app/i/settings?tab=integrations';

function toInlineScriptJson(value: string): string {
  return JSON.stringify(value)
    .replace(/</g, '\\u003C')
    .replace(/>/g, '\\u003E')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

interface OAuthCallbackHtmlOptions {
  success?: string;
  error?: string;
  message?: string;
  defaultType: string;
  redirectBasePath?: string;
}

/**
 * Shared HTML for OAuth popup/full-page callback handling in integration routes.
 */
export function buildOAuthCallbackHtml({
  success,
  error,
  message,
  defaultType,
  redirectBasePath = DEFAULT_INTEGRATIONS_RETURN_PATH,
}: OAuthCallbackHtmlOptions): string {
  const [basePath, baseQuery = ''] = redirectBasePath.split('?');
  const params = new URLSearchParams(baseQuery);
  if (success) params.set('success', success);
  if (error) params.set('error', error);
  if (message) params.set('message', message);

  const query = params.toString();
  const redirectPath = query ? `${basePath}?${query}` : basePath;
  const postMessageType = success || error || defaultType;
  const safePostMessageType = toInlineScriptJson(postMessageType);
  const safeRedirectPath = toInlineScriptJson(redirectPath);

  return `<!doctype html>
<html>
  <head><meta charset="utf-8" /><meta name="referrer" content="no-referrer" /></head>
  <body>
    <script>
      (function () {
        try {
          if (window.opener && !window.opener.closed) {
            window.opener.postMessage({ type: ${safePostMessageType} }, '*');
            window.close();
            return;
          }
        } catch (e) {}
        window.location.assign(${safeRedirectPath});
      })();
    </script>
    <p>Returning to Proofound settings...</p>
  </body>
</html>`;
}

/**
 * Resolve and sanitize an internal return path for integration OAuth flows.
 */
export function resolveIntegrationReturnPath(value: unknown, fallback?: string): string {
  return sanitizeReturnPath(value, fallback ?? DEFAULT_INTEGRATIONS_RETURN_PATH);
}

/**
 * Resolve provider callback redirect URI with consistent base URL precedence:
 * NEXT_PUBLIC_SITE_URL -> NEXT_PUBLIC_URL -> request origin.
 */
export function resolveOAuthRedirectUri(
  request: Pick<NextRequest, 'nextUrl'>,
  configuredRedirect: string | undefined,
  fallbackPath: string,
  options?: {
    preferRequestOrigin?: boolean;
  }
): string {
  const envBaseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_URL;
  const baseUrl = options?.preferRequestOrigin
    ? request.nextUrl.origin || envBaseUrl
    : envBaseUrl || request.nextUrl.origin;

  if (configuredRedirect) {
    return configuredRedirect.startsWith('/')
      ? `${baseUrl}${configuredRedirect}`
      : configuredRedirect;
  }

  return `${baseUrl}${fallbackPath}`;
}
