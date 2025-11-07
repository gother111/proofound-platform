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
    const redirectUri = `${baseUrl}/api/integrations/zoom/callback`;

    // Generate Zoom auth URL
    const authUrl = getZoomAuthUrl(redirectUri, state);

    log.info('zoom.oauth.initiated', { userId: user.id });

    // Redirect to Zoom OAuth
    return NextResponse.redirect(authUrl);
  } catch (error) {
    log.error('zoom.oauth.connect.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json({ error: 'Failed to initiate Zoom OAuth' }, { status: 500 });
  }
}
