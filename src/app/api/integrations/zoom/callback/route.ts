/**
 * Zoom OAuth Callback Endpoint
 *
 * Handles Zoom OAuth callback and stores tokens
 * GET /api/integrations/zoom/callback?code=...&state=...
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';
import { exchangeZoomCode } from '@/lib/integrations/zoom';
import { log } from '@/lib/log';
import { requireAuth } from '@/lib/auth';

function buildCallbackHtml(opts: { success?: string; error?: string; message?: string }) {
  const params = new URLSearchParams();
  if (opts.success) params.set('success', opts.success);
  if (opts.error) params.set('error', opts.error);
  if (opts.message) params.set('message', opts.message);

  const redirectPath = `/app/i/settings/integrations?${params.toString()}`;

  // Supports both popup-based flows (close) and full-page flows (redirect).
  return `<!doctype html>
<html>
  <head><meta charset="utf-8" /><meta name="referrer" content="no-referrer" /></head>
  <body>
    <script>
      (function () {
        try {
          if (window.opener && !window.opener.closed) {
            window.opener.postMessage({ type: ${JSON.stringify(opts.success || opts.error || 'zoom_oauth')} }, '*');
            window.close();
            return;
          }
        } catch (e) {}
        window.location.assign(${JSON.stringify(redirectPath)});
      })();
    </script>
    <p>Returning to Proofound...</p>
  </body>
</html>`;
}

function resolveRedirectUri(request: NextRequest): string {
  const baseUrl = process.env.NEXT_PUBLIC_URL || request.nextUrl.origin;
  const configured = process.env.ZOOM_REDIRECT_URI;
  if (configured) {
    return configured.startsWith('/') ? `${baseUrl}${configured}` : configured;
  }
  return `${baseUrl}${request.nextUrl.pathname}`;
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();

    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Check for OAuth error
    if (error) {
      log.warn('zoom.oauth.error', { error });
      return new NextResponse(buildCallbackHtml({ error: 'zoom_auth_failed', message: error }), {
        headers: { 'Content-Type': 'text/html' },
      });
    }

    if (!code || !state) {
      return new NextResponse(
        buildCallbackHtml({
          error: 'zoom_auth_failed',
          message: 'Missing authorization code or state',
        }),
        { headers: { 'Content-Type': 'text/html' } }
      );
    }

    const expectedState = request.cookies.get('zoom_oauth_state')?.value;
    if (!expectedState || expectedState !== state) {
      log.warn('zoom.oauth.state_mismatch', { userId: user.id });
      return new NextResponse(
        buildCallbackHtml({
          error: 'zoom_auth_failed',
          message: 'Invalid or expired OAuth state. Please try connecting again.',
        }),
        { headers: { 'Content-Type': 'text/html' } }
      );
    }

    // Exchange code for tokens
    const redirectUri = resolveRedirectUri(request);
    const tokens = await exchangeZoomCode(code, redirectUri);

    // Calculate token expiry
    const tokenExpiry = new Date(Date.now() + tokens.expires_in * 1000);

    // Store tokens in database
    await db.execute(sql`
      INSERT INTO user_video_integrations (user_id, provider, access_token, refresh_token, token_expiry)
      VALUES (${user.id}, 'zoom', ${tokens.access_token}, ${tokens.refresh_token}, ${tokenExpiry.toISOString()})
      ON CONFLICT (user_id, provider)
      DO UPDATE SET
        access_token = EXCLUDED.access_token,
        refresh_token = EXCLUDED.refresh_token,
        token_expiry = EXCLUDED.token_expiry,
        updated_at = NOW()
    `);

    log.info('zoom.oauth.connected', { userId: user.id });

    const res = new NextResponse(buildCallbackHtml({ success: 'zoom_connected' }), {
      headers: { 'Content-Type': 'text/html' },
    });
    res.cookies.set('zoom_oauth_state', '', { maxAge: 0, path: '/' });
    return res;
  } catch (error) {
    log.error('zoom.oauth.callback.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return new NextResponse(
      buildCallbackHtml({
        error: 'zoom_auth_failed',
        message: error instanceof Error ? error.message : 'Failed to connect Zoom',
      }),
      { headers: { 'Content-Type': 'text/html' } }
    );
  }
}
