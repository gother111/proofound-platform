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
import { exchangeLinkedInCode } from '@/lib/linkedin';
import { resolveOAuthRedirectUri } from '@/lib/integrations/oauth-helpers';
import {
  parseLinkedInOAuthContext,
  type LinkedInOAuthContext,
} from '@/lib/integrations/linkedin-oauth-context';

function buildSettingsRedirect(
  request: NextRequest,
  context: LinkedInOAuthContext,
  params: Record<string, string>
) {
  const tab = 'account';
  const search = new URLSearchParams({ tab, ...params });
  return NextResponse.redirect(new URL(`/app/i/settings?${search.toString()}`, request.url));
}

function buildSettingsErrorParams(
  context: LinkedInOAuthContext,
  message: string
): Record<string, string> {
  const params: Record<string, string> = { message };

  if (context === 'verification') {
    params.verification_error = 'linkedin_auth_failed';
    return params;
  }

  params.error = 'linkedin_auth_failed';
  return params;
}

function buildSettingsSuccessParams(context: LinkedInOAuthContext): Record<string, string> {
  if (context === 'verification') {
    return { verification: 'linkedin_connected' };
  }

  return { success: 'linkedin_connected' };
}

function clearOAuthCookies(response: NextResponse) {
  response.cookies.delete('linkedin_oauth_state');
  response.cookies.delete('linkedin_oauth_user');
  response.cookies.delete('linkedin_oauth_context');
  return response;
}

export async function GET(request: NextRequest) {
  const context = parseLinkedInOAuthContext(
    request.cookies.get('linkedin_oauth_context')?.value ?? null
  );

  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Check for OAuth errors
    if (error) {
      console.error('LinkedIn OAuth error:', error);
      return clearOAuthCookies(
        buildSettingsRedirect(
          request,
          context,
          buildSettingsErrorParams(context, 'LinkedIn connection cancelled or failed')
        )
      );
    }

    if (!code || !state) {
      return clearOAuthCookies(
        buildSettingsRedirect(
          request,
          context,
          buildSettingsErrorParams(context, 'Invalid OAuth response')
        )
      );
    }

    // Verify state parameter for CSRF protection
    const storedState = request.cookies.get('linkedin_oauth_state')?.value;
    const storedUserId = request.cookies.get('linkedin_oauth_user')?.value;

    if (!storedState || storedState !== state) {
      console.error('State mismatch in LinkedIn OAuth');
      return clearOAuthCookies(
        buildSettingsRedirect(
          request,
          context,
          buildSettingsErrorParams(
            context,
            'Invalid or expired OAuth state. Please try connecting again.'
          )
        )
      );
    }

    // Verify user is still authenticated
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user || user.id !== storedUserId) {
      return clearOAuthCookies(
        NextResponse.redirect(new URL('/login?error=unauthorized', request.url))
      );
    }

    const redirectUri = resolveOAuthRedirectUri(
      request,
      process.env.LINKEDIN_REDIRECT_URI,
      '/api/auth/linkedin/callback',
      { preferRequestOrigin: true }
    );

    // Exchange authorization code for access token
    const tokenData = await exchangeLinkedInCode(code, redirectUri);

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
    return clearOAuthCookies(
      buildSettingsRedirect(request, context, buildSettingsSuccessParams(context))
    );
  } catch (error) {
    console.error('LinkedIn OAuth callback error:', error);

    return clearOAuthCookies(
      buildSettingsRedirect(
        request,
        context,
        buildSettingsErrorParams(
          context,
          error instanceof Error ? error.message : 'LinkedIn connection failed'
        )
      )
    );
  }
}
