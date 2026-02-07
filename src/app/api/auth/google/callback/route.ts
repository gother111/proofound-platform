import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/db';
import { sql } from 'drizzle-orm';
import { exchangeGoogleCode } from '@/lib/integrations/google-meet';

export const dynamic = 'force-dynamic';

/**
 * GET /api/auth/google/callback
 *
 * Handles Google OAuth callback
 * Called by Google after user authorizes the app
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);

    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Check for errors from Google
    if (error) {
      console.error('Google OAuth error:', error);
      return NextResponse.redirect(
        new URL(
          `/app/i/settings/integrations?error=google_auth_failed&message=${encodeURIComponent(error)}`,
          request.url
        )
      );
    }

    const expectedState = request.cookies.get('google_oauth_state')?.value;
    if (!state || !expectedState || state !== expectedState) {
      return NextResponse.redirect(
        new URL(
          '/app/i/settings/integrations?error=google_auth_failed&message=Invalid%20or%20expired%20OAuth%20state.%20Please%20try%20connecting%20again.',
          request.url
        )
      );
    }

    // Verify code exists
    if (!code) {
      return NextResponse.redirect(
        new URL(
          '/app/i/settings/integrations?error=google_auth_failed&message=No authorization code received',
          request.url
        )
      );
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_URL || request.nextUrl.origin;
    const configuredRedirect = process.env.GOOGLE_REDIRECT_URI;
    const redirectUri = configuredRedirect
      ? configuredRedirect.startsWith('/')
        ? `${baseUrl}${configuredRedirect}`
        : configuredRedirect
      : `${baseUrl}${request.nextUrl.pathname}`;

    const tokens = await exchangeGoogleCode(code, redirectUri);
    const tokenExpiry = new Date(Date.now() + tokens.expires_in * 1000);

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

    // Redirect to settings page with success message
    const res = NextResponse.redirect(
      new URL('/app/i/settings/integrations?success=google_connected', request.url)
    );
    res.cookies.set('google_oauth_state', '', { maxAge: 0, path: '/' });
    return res;
  } catch (error) {
    console.error('Error handling Google OAuth callback:', error);
    return NextResponse.redirect(
      new URL(
        `/app/i/settings/integrations?error=google_auth_failed&message=${encodeURIComponent(
          error instanceof Error ? error.message : 'Unknown error'
        )}`,
        request.url
      )
    );
  }
}
