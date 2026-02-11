/**
 * Google OAuth Callback Endpoint
 *
 * Handles Google OAuth callback and stores tokens
 * GET /api/integrations/google/callback?code=...&state=...
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';
import { exchangeGoogleCode } from '@/lib/integrations/google-meet';
import { log } from '@/lib/log';
import { requireAuth } from '@/lib/auth';
import { buildOAuthCallbackHtml, resolveOAuthRedirectUri } from '@/lib/integrations/oauth-helpers';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();

    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Check for OAuth error
    if (error) {
      log.warn('google.oauth.error', { error });
      return new NextResponse(
        buildOAuthCallbackHtml({
          error: 'google_auth_failed',
          message: error,
          defaultType: 'google_oauth',
        }),
        { headers: { 'Content-Type': 'text/html' } }
      );
    }

    if (!code || !state) {
      return new NextResponse(
        buildOAuthCallbackHtml({
          error: 'google_auth_failed',
          message: 'Missing authorization code or state',
          defaultType: 'google_oauth',
        }),
        { headers: { 'Content-Type': 'text/html' } }
      );
    }

    const expectedState = request.cookies.get('google_oauth_state')?.value;
    if (!expectedState || expectedState !== state) {
      log.warn('google.oauth.state_mismatch', { userId: user.id });
      return new NextResponse(
        buildOAuthCallbackHtml({
          error: 'google_auth_failed',
          message: 'Invalid or expired OAuth state. Please try connecting again.',
          defaultType: 'google_oauth',
        }),
        { headers: { 'Content-Type': 'text/html' } }
      );
    }

    // Exchange code for tokens
    const redirectUri = resolveOAuthRedirectUri(
      request,
      process.env.GOOGLE_REDIRECT_URI,
      request.nextUrl.pathname
    );
    const tokens = await exchangeGoogleCode(code, redirectUri);

    // Calculate token expiry
    const tokenExpiry = new Date(Date.now() + tokens.expires_in * 1000);

    // Store tokens in database
    await db.execute(sql`
      INSERT INTO user_video_integrations (user_id, provider, access_token, refresh_token, token_expiry, scope)
      VALUES (${user.id}, 'google_meet', ${tokens.access_token}, ${tokens.refresh_token}, ${tokenExpiry.toISOString()}, ${tokens.scope})
      ON CONFLICT (user_id, provider)
      DO UPDATE SET
        access_token = EXCLUDED.access_token,
        refresh_token = EXCLUDED.refresh_token,
        token_expiry = EXCLUDED.token_expiry,
        scope = EXCLUDED.scope,
        updated_at = NOW()
    `);

    log.info('google.oauth.connected', { userId: user.id });

    const res = new NextResponse(
      buildOAuthCallbackHtml({
        success: 'google_connected',
        defaultType: 'google_oauth',
      }),
      { headers: { 'Content-Type': 'text/html' } }
    );
    res.cookies.set('google_oauth_state', '', { maxAge: 0, path: '/' });
    return res;
  } catch (error) {
    log.error('google.oauth.callback.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return new NextResponse(
      buildOAuthCallbackHtml({
        error: 'google_auth_failed',
        message: error instanceof Error ? error.message : 'Failed to connect Google',
        defaultType: 'google_oauth',
      }),
      { headers: { 'Content-Type': 'text/html' } }
    );
  }
}
