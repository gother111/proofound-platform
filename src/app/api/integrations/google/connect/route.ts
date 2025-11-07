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

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();

    // Generate state token for CSRF protection
    const state = Buffer.from(
      JSON.stringify({
        userId: user.id,
        timestamp: Date.now(),
      })
    ).toString('base64');

    // Get redirect URI
    const baseUrl = process.env.NEXT_PUBLIC_URL || request.nextUrl.origin;
    const redirectUri = `${baseUrl}/api/integrations/google/callback`;

    // Generate Google auth URL
    const authUrl = getGoogleAuthUrl(redirectUri, state);

    log.info('google.oauth.initiated', { userId: user.id });

    // Redirect to Google OAuth
    return NextResponse.redirect(authUrl);
  } catch (error) {
    log.error('google.oauth.connect.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json({ error: 'Failed to initiate Google OAuth' }, { status: 500 });
  }
}
