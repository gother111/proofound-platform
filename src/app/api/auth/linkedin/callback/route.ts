/**
 * LinkedIn OAuth Callback Handler
 *
 * GET /api/auth/linkedin/callback
 * Handles OAuth callback from LinkedIn, exchanges code for token,
 * and stores integration in database
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { userIntegrations } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import {
  exchangeLinkedInCode,
  fetchLinkedInProfile,
  constructLinkedInProfileUrl,
} from '@/lib/linkedin';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Check for OAuth errors
    if (error) {
      console.error('LinkedIn OAuth error:', error);
      return NextResponse.redirect(
        new URL(
          `/settings?error=${encodeURIComponent('LinkedIn connection cancelled or failed')}`,
          request.url
        )
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(new URL('/settings?error=invalid_oauth_response', request.url));
    }

    // Verify state parameter for CSRF protection
    const storedState = request.cookies.get('linkedin_oauth_state')?.value;
    const storedUserId = request.cookies.get('linkedin_oauth_user')?.value;

    if (!storedState || storedState !== state) {
      console.error('State mismatch in LinkedIn OAuth');
      return NextResponse.redirect(new URL('/settings?error=invalid_state', request.url));
    }

    // Verify user is still authenticated
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user || user.id !== storedUserId) {
      return NextResponse.redirect(new URL('/signin?error=unauthorized', request.url));
    }

    // Exchange authorization code for access token
    const tokenData = await exchangeLinkedInCode(
      code,
      `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/linkedin/callback`
    );

    // Fetch LinkedIn profile data
    const profileData = await fetchLinkedInProfile(tokenData.access_token);

    // Calculate token expiry time
    const tokenExpiry = new Date();
    tokenExpiry.setSeconds(tokenExpiry.getSeconds() + tokenData.expires_in);

    // Check if integration already exists
    const existingIntegration = await db
      .select()
      .from(userIntegrations)
      .where(and(eq(userIntegrations.userId, user.id), eq(userIntegrations.provider, 'linkedin')))
      .limit(1);

    // Store or update integration
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
        provider: 'linkedin',
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        tokenExpiry,
        scope: tokenData.scope?.split(' ') || [],
      });
    }

    // Clear OAuth cookies
    const response = NextResponse.redirect(
      new URL('/settings?success=linkedin_connected', request.url)
    );

    response.cookies.delete('linkedin_oauth_state');
    response.cookies.delete('linkedin_oauth_user');

    return response;
  } catch (error) {
    console.error('LinkedIn OAuth callback error:', error);

    // Clear OAuth cookies on error
    const response = NextResponse.redirect(
      new URL(
        `/settings?error=${encodeURIComponent(
          error instanceof Error ? error.message : 'LinkedIn connection failed'
        )}`,
        request.url
      )
    );

    response.cookies.delete('linkedin_oauth_state');
    response.cookies.delete('linkedin_oauth_user');

    return response;
  }
}
