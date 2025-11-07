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

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Check for OAuth error
    if (error) {
      log.warn('zoom.oauth.error', { error });
      return new NextResponse(
        `<html><body><script>window.close();</script><p>Authorization cancelled or failed. You can close this window.</p></body></html>`,
        {
          headers: { 'Content-Type': 'text/html' },
        }
      );
    }

    if (!code || !state) {
      return NextResponse.json({ error: 'Missing code or state' }, { status: 400 });
    }

    // Decode and verify state
    let stateData: { userId: string; timestamp: number };
    try {
      stateData = JSON.parse(Buffer.from(state, 'base64').toString());
    } catch {
      return NextResponse.json({ error: 'Invalid state' }, { status: 400 });
    }

    // Check timestamp (state should be less than 10 minutes old)
    if (Date.now() - stateData.timestamp > 10 * 60 * 1000) {
      return NextResponse.json({ error: 'State expired' }, { status: 400 });
    }

    // Exchange code for tokens
    const baseUrl = process.env.NEXT_PUBLIC_URL || request.nextUrl.origin;
    const redirectUri = `${baseUrl}/api/integrations/zoom/callback`;

    const tokens = await exchangeZoomCode(code, redirectUri);

    // Calculate token expiry
    const tokenExpiry = new Date(Date.now() + tokens.expires_in * 1000);

    // Store tokens in database
    await db.execute(sql`
      INSERT INTO user_video_integrations (user_id, provider, access_token, refresh_token, token_expiry)
      VALUES (${stateData.userId}, 'zoom', ${tokens.access_token}, ${tokens.refresh_token}, ${tokenExpiry.toISOString()})
      ON CONFLICT (user_id, provider)
      DO UPDATE SET
        access_token = EXCLUDED.access_token,
        refresh_token = EXCLUDED.refresh_token,
        token_expiry = EXCLUDED.token_expiry,
        updated_at = NOW()
    `);

    log.info('zoom.oauth.connected', { userId: stateData.userId });

    // Close popup and redirect parent
    return new NextResponse(
      `<html><body><script>
        window.opener?.postMessage({ type: 'zoom_connected' }, '*');
        window.close();
      </script><p>Zoom connected successfully! You can close this window.</p></body></html>`,
      {
        headers: { 'Content-Type': 'text/html' },
      }
    );
  } catch (error) {
    log.error('zoom.oauth.callback.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return new NextResponse(
      `<html><body><script>window.close();</script><p>Failed to connect Zoom. Please try again.</p></body></html>`,
      {
        headers: { 'Content-Type': 'text/html' },
      }
    );
  }
}
