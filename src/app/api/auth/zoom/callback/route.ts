/**
 * Zoom OAuth Callback Handler
 * 
 * Handles OAuth redirect from Zoom after user authorization
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { userIntegrations } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const state = searchParams.get('state'); // Use for CSRF protection

  // Handle authorization denial
  if (error) {
    console.error('Zoom OAuth error:', error);
    return NextResponse.redirect(
      new URL(`/settings/integrations?error=${encodeURIComponent(error)}`, request.url)
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL('/settings/integrations?error=missing_code', request.url)
    );
  }

  try {
    // Get authenticated user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error('User not authenticated');
    }

    // Exchange code for access token
    const tokenUrl = 'https://zoom.us/oauth/token';
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/zoom/callback`,
    });

    const credentials = Buffer.from(
      `${process.env.ZOOM_CLIENT_ID}:${process.env.ZOOM_CLIENT_SECRET}`
    ).toString('base64');

    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${credentials}`,
      },
      body: params.toString(),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      throw new Error(`Zoom token exchange failed: ${JSON.stringify(errorData)}`);
    }

    const tokenData = await tokenResponse.json();

    // Calculate token expiry (Zoom tokens typically last 1 hour)
    const expiresIn = tokenData.expires_in || 3600; // seconds
    const tokenExpiry = new Date(Date.now() + expiresIn * 1000);

    // Store or update integration
    const existingIntegration = await db
      .select()
      .from(userIntegrations)
      .where(
        and(
          eq(userIntegrations.userId, user.id),
          eq(userIntegrations.provider, 'zoom')
        )
      )
      .limit(1);

    if (existingIntegration.length > 0) {
      // Update existing integration
      await db
        .update(userIntegrations)
        .set({
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token,
          tokenExpiry,
          scope: tokenData.scope?.split(' ') || [],
          updatedAt: new Date(),
        })
        .where(eq(userIntegrations.id, existingIntegration[0].id));
    } else {
      // Create new integration
      await db.insert(userIntegrations).values({
        userId: user.id,
        provider: 'zoom',
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        tokenExpiry,
        scope: tokenData.scope?.split(' ') || [],
      });
    }

    // Redirect back to settings with success message
    return NextResponse.redirect(
      new URL('/settings/integrations?success=zoom_connected', request.url)
    );
  } catch (error) {
    console.error('Zoom OAuth callback error:', error);
    return NextResponse.redirect(
      new URL(
        `/settings/integrations?error=${encodeURIComponent(
          error instanceof Error ? error.message : 'Unknown error'
        )}`,
        request.url
      )
    );
  }
}

