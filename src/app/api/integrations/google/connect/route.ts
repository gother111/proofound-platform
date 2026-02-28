/**
 * Google OAuth Connect Endpoint
 *
 * Initiates Google OAuth flow for Calendar/Meet access
 * GET /api/integrations/google/connect
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuthContext } from '@/lib/auth';
import { getGoogleAuthUrl } from '@/lib/integrations/google-meet';
import { log } from '@/lib/log';
import { randomBytes } from 'crypto';
import {
  resolveIntegrationReturnPath,
  resolveOAuthRedirectUri,
} from '@/lib/integrations/oauth-helpers';

export async function GET(request: NextRequest) {
  try {
    const authContext = await requireApiAuthContext();
    if (!authContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { user } = authContext;
    const returnTo = resolveIntegrationReturnPath(request.nextUrl.searchParams.get('returnTo'));

    // Get redirect URI
    const redirectUri = resolveOAuthRedirectUri(
      request,
      process.env.GOOGLE_REDIRECT_URI,
      '/api/integrations/google/callback'
    );

    // CSRF protection: tie `state` to an httpOnly cookie (10 min window)
    const state = randomBytes(32).toString('hex');

    // Generate Google auth URL
    const authUrl = getGoogleAuthUrl(redirectUri, state);

    log.info('google.oauth.initiated', { userId: user.id });

    // Redirect to Google OAuth
    const res = NextResponse.redirect(authUrl);
    res.cookies.set('google_oauth_state', state, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 10 * 60,
      path: '/',
    });
    res.cookies.set('google_oauth_return_to', returnTo, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 10 * 60,
      path: '/',
    });
    return res;
  } catch (error) {
    log.error('google.oauth.connect.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json({ error: 'Failed to initiate Google OAuth' }, { status: 500 });
  }
}
