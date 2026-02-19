import type { NextRequest } from 'next/server';

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
  redirectBasePath = '/app/i/settings?tab=integrations',
}: OAuthCallbackHtmlOptions): string {
  const [basePath, baseQuery = ''] = redirectBasePath.split('?');
  const params = new URLSearchParams(baseQuery);
  if (success) params.set('success', success);
  if (error) params.set('error', error);
  if (message) params.set('message', message);

  const query = params.toString();
  const redirectPath = query ? `${basePath}?${query}` : basePath;
  const postMessageType = success || error || defaultType;

  return `<!doctype html>
<html>
  <head><meta charset="utf-8" /><meta name="referrer" content="no-referrer" /></head>
  <body>
    <script>
      (function () {
        try {
          if (window.opener && !window.opener.closed) {
            window.opener.postMessage({ type: ${JSON.stringify(postMessageType)} }, '*');
            window.close();
            return;
          }
        } catch (e) {}
        window.location.assign(${JSON.stringify(redirectPath)});
      })();
    </script>
    <p>Returning to Proofound settings...</p>
  </body>
</html>`;
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
