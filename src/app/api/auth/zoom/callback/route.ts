import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { exchangeZoomCode } from '@/lib/video/zoom';
import { db } from '@/db';
import { userIntegrations } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

/**
 * GET /api/auth/zoom/callback
 *
 * Handles Zoom OAuth callback
 * Called by Zoom after user authorizes the app
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);

    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Check for errors from Zoom
    if (error) {
      console.error('Zoom OAuth error:', error);
      return NextResponse.redirect(
        new URL(
          `/app/i/settings/integrations?error=zoom_auth_failed&message=${encodeURIComponent(error)}`,
          request.url
        )
      );
    }

    // Verify code exists
    if (!code) {
      return NextResponse.redirect(
        new URL(
          '/app/i/settings/integrations?error=zoom_auth_failed&message=No authorization code received',
          request.url
        )
      );
    }

    // Exchange code for tokens
    const tokens = await exchangeZoomCode(code);

    // Check if integration already exists
    const [existing] = await db
      .select()
      .from(userIntegrations)
      .where(and(eq(userIntegrations.userId, user.id), eq(userIntegrations.provider, 'zoom')))
      .limit(1);

    if (existing) {
      // Update existing integration
      await db
        .update(userIntegrations)
        .set({
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          tokenExpiry: new Date(Date.now() + tokens.expiresIn * 1000),
          updatedAt: new Date(),
        })
        .where(eq(userIntegrations.id, existing.id));
    } else {
      // Create new integration
      await db.insert(userIntegrations).values({
        userId: user.id,
        provider: 'zoom',
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        tokenExpiry: new Date(Date.now() + tokens.expiresIn * 1000),
      });
    }

    // Redirect to settings page with success message
    return NextResponse.redirect(
      new URL('/app/i/settings/integrations?success=zoom_connected', request.url)
    );
  } catch (error) {
    console.error('Error handling Zoom OAuth callback:', error);
    return NextResponse.redirect(
      new URL(
        `/app/i/settings/integrations?error=zoom_auth_failed&message=${encodeURIComponent(
          error instanceof Error ? error.message : 'Unknown error'
        )}`,
        request.url
      )
    );
  }
}
