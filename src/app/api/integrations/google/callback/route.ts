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

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Check for OAuth error
    if (error) {
      log.warn('google.oauth.error', { error });
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
    const redirectUri = `${baseUrl}/api/integrations/google/callback`;

    const tokens = await exchangeGoogleCode(code, redirectUri);

    // Calculate token expiry
    const tokenExpiry = new Date(Date.now() + tokens.expires_in * 1000);

    // Store tokens in database
    await db.execute(sql`
      INSERT INTO user_video_integrations (user_id, provider, access_token, refresh_token, token_expiry, scope)
      VALUES (${stateData.userId}, 'google_meet', ${tokens.access_token}, ${tokens.refresh_token}, ${tokenExpiry.toISOString()}, ${tokens.scope})
      ON CONFLICT (user_id, provider)
      DO UPDATE SET
        access_token = EXCLUDED.access_token,
        refresh_token = EXCLUDED.refresh_token,
        token_expiry = EXCLUDED.token_expiry,
        scope = EXCLUDED.scope,
        updated_at = NOW()
    `);

    log.info('google.oauth.connected', { userId: stateData.userId });

    // Close popup and redirect parent
    return new NextResponse(
      `<html><body><script>
        window.opener?.postMessage({ type: 'google_connected' }, '*');
        window.close();
      </script><p>Google Meet connected successfully! You can close this window.</p></body></html>`,
      {
        headers: { 'Content-Type': 'text/html' },
      }
    );
  } catch (error) {
    log.error('google.oauth.callback.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return new NextResponse(
      `<html><body><script>window.close();</script><p>Failed to connect Google Meet. Please try again.</p></body></html>`,
      {
        headers: { 'Content-Type': 'text/html' },
      }
    );
  }
}
