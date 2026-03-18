import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuthContext } from '@/lib/auth';
import { db } from '@/db';
import { sql } from 'drizzle-orm';
import { exchangeZoomCode } from '@/lib/integrations/zoom';
import { resolveOAuthRedirectUri } from '@/lib/integrations/oauth-helpers';

export const dynamic = 'force-dynamic';

/**
 * GET /api/auth/zoom/callback
 *
 * Handles Zoom OAuth callback
 * Called by Zoom after user authorizes the app
 */
export async function GET(request: NextRequest) {
  try {
    const authContext = await requireApiAuthContext();
    if (!authContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { user } = authContext;
    const { searchParams } = new URL(request.url);

    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Check for errors from Zoom
    if (error) {
      console.error('Zoom OAuth error:', error);
      return NextResponse.redirect(
        new URL(
          `/app/i/settings?tab=interviews&error=zoom_auth_failed&message=${encodeURIComponent(error)}`,
          request.url
        )
      );
    }

    const expectedState = request.cookies.get('zoom_oauth_state')?.value;
    if (!state || !expectedState || state !== expectedState) {
      return NextResponse.redirect(
        new URL(
          '/app/i/settings?tab=interviews&error=zoom_auth_failed&message=Invalid%20or%20expired%20OAuth%20state.%20Please%20try%20connecting%20again.',
          request.url
        )
      );
    }

    // Verify code exists
    if (!code) {
      return NextResponse.redirect(
        new URL(
          '/app/i/settings?tab=interviews&error=zoom_auth_failed&message=No authorization code received',
          request.url
        )
      );
    }

    const redirectUri = resolveOAuthRedirectUri(
      request,
      process.env.ZOOM_REDIRECT_URI,
      request.nextUrl.pathname
    );

    const tokens = await exchangeZoomCode(code, redirectUri);
    const tokenExpiry = new Date(Date.now() + tokens.expires_in * 1000);

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

    // Redirect to settings page with success message
    const res = NextResponse.redirect(
      new URL('/app/i/settings?tab=interviews&success=zoom_connected', request.url)
    );
    res.cookies.set('zoom_oauth_state', '', { maxAge: 0, path: '/' });
    return res;
  } catch (error) {
    console.error('Error handling Zoom OAuth callback:', error);
    return NextResponse.redirect(
      new URL(
        `/app/i/settings?tab=interviews&error=zoom_auth_failed&message=${encodeURIComponent(
          error instanceof Error ? error.message : 'Unknown error'
        )}`,
        request.url
      )
    );
  }
}
