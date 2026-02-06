/**
 * Google OAuth Connect Endpoint
 *
 * Initiates Google OAuth flow for Calendar/Meet access
 * GET /api/integrations/google/connect
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getGoogleAuthUrl } from '@/lib/integrations/google-meet';
import { log } from '@/lib/log';
import { randomBytes } from 'crypto';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();

    // Get redirect URI
    const baseUrl = process.env.NEXT_PUBLIC_URL || request.nextUrl.origin;
    const configuredRedirect = process.env.GOOGLE_REDIRECT_URI;
    const redirectUri = configuredRedirect
      ? configuredRedirect.startsWith('/')
        ? `${baseUrl}${configuredRedirect}`
        : configuredRedirect
      : `${baseUrl}/api/integrations/google/callback`;

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
    return res;
  } catch (error) {
    log.error('google.oauth.connect.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json({ error: 'Failed to initiate Google OAuth' }, { status: 500 });
  }
}
