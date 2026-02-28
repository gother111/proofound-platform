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
import { requireApiAuthContext } from '@/lib/auth';
import {
  buildOAuthCallbackHtml,
  resolveIntegrationReturnPath,
  resolveOAuthRedirectUri,
} from '@/lib/integrations/oauth-helpers';

export async function GET(request: NextRequest) {
  const redirectBasePath = resolveIntegrationReturnPath(
    request.cookies.get('zoom_oauth_return_to')?.value
  );
  const buildHtmlResponse = (params: {
    success?: string;
    error?: string;
    message?: string;
    defaultType: string;
  }) => {
    const response = new NextResponse(
      buildOAuthCallbackHtml({
        ...params,
        redirectBasePath,
      }),
      { headers: { 'Content-Type': 'text/html' } }
    );
    response.cookies.set('zoom_oauth_state', '', { maxAge: 0, path: '/' });
    response.cookies.set('zoom_oauth_return_to', '', { maxAge: 0, path: '/' });
    return response;
  };

  try {
    const authContext = await requireApiAuthContext();
    if (!authContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { user } = authContext;

    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Check for OAuth error
    if (error) {
      log.warn('zoom.oauth.error', { error });
      return buildHtmlResponse({
        error: 'zoom_auth_failed',
        message: error,
        defaultType: 'zoom_oauth',
      });
    }

    if (!code || !state) {
      return buildHtmlResponse({
        error: 'zoom_auth_failed',
        message: 'Missing authorization code or state',
        defaultType: 'zoom_oauth',
      });
    }

    const expectedState = request.cookies.get('zoom_oauth_state')?.value;
    if (!expectedState || expectedState !== state) {
      log.warn('zoom.oauth.state_mismatch', { userId: user.id });
      return buildHtmlResponse({
        error: 'zoom_auth_failed',
        message: 'Invalid or expired OAuth state. Please try connecting again.',
        defaultType: 'zoom_oauth',
      });
    }

    // Exchange code for tokens
    const redirectUri = resolveOAuthRedirectUri(
      request,
      process.env.ZOOM_REDIRECT_URI,
      request.nextUrl.pathname
    );
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

    return buildHtmlResponse({
      success: 'zoom_connected',
      defaultType: 'zoom_oauth',
    });
  } catch (error) {
    log.error('zoom.oauth.callback.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return buildHtmlResponse({
      error: 'zoom_auth_failed',
      message: error instanceof Error ? error.message : 'Failed to connect Zoom',
      defaultType: 'zoom_oauth',
    });
  }
}
