/**
 * Zoom OAuth Connect Endpoint
 *
 * Initiates Zoom OAuth flow
 * GET /api/integrations/zoom/connect
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getZoomAuthUrl } from '@/lib/integrations/zoom';
import { log } from '@/lib/log';
import { randomBytes } from 'crypto';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();

    // Get redirect URI
    const baseUrl = process.env.NEXT_PUBLIC_URL || request.nextUrl.origin;
    const configuredRedirect = process.env.ZOOM_REDIRECT_URI;
    const redirectUri = configuredRedirect
      ? configuredRedirect.startsWith('/')
        ? `${baseUrl}${configuredRedirect}`
        : configuredRedirect
      : `${baseUrl}/api/integrations/zoom/callback`;

    // CSRF protection: tie `state` to an httpOnly cookie (10 min window)
    const state = randomBytes(32).toString('hex');

    // Generate Zoom auth URL
    const authUrl = getZoomAuthUrl(redirectUri, state);

    log.info('zoom.oauth.initiated', { userId: user.id });

    // Redirect to Zoom OAuth
    const res = NextResponse.redirect(authUrl);
    res.cookies.set('zoom_oauth_state', state, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 10 * 60,
      path: '/',
    });
    return res;
  } catch (error) {
    log.error('zoom.oauth.connect.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json({ error: 'Failed to initiate Zoom OAuth' }, { status: 500 });
  }
}
