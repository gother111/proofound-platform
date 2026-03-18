/**
 * LinkedIn OAuth Initiation
 *
 * GET /api/auth/linkedin
 * Initiates LinkedIn OAuth flow and redirects to LinkedIn authorization
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateLinkedInAuthUrl, getLinkedInAuthScopes } from '@/lib/linkedin';
import { randomBytes } from 'crypto';
import { resolveOAuthRedirectUri } from '@/lib/integrations/oauth-helpers';
import {
  parseLinkedInOAuthContext,
  type LinkedInOAuthContext,
} from '@/lib/integrations/linkedin-oauth-context';

function buildFailureRedirect(request: NextRequest, context: LinkedInOAuthContext): URL {
  if (context === 'verification') {
    return new URL(
      `/app/i/settings?tab=account&verification_error=linkedin_auth_failed&message=${encodeURIComponent(
        'Failed to initiate LinkedIn connection'
      )}`,
      request.url
    );
  }

  return new URL(
    `/app/i/settings?tab=account&error=linkedin_auth_failed&message=${encodeURIComponent(
      'Failed to initiate LinkedIn connection'
    )}`,
    request.url
  );
}

export async function GET(request: NextRequest) {
  const context = parseLinkedInOAuthContext(request.nextUrl.searchParams.get('context'));

  try {
    // Check if user is authenticated
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.redirect(new URL('/login?error=unauthorized', request.url));
    }

    // Generate state parameter for CSRF protection
    const state = randomBytes(32).toString('hex');

    const redirectUri = resolveOAuthRedirectUri(
      request,
      process.env.LINKEDIN_REDIRECT_URI,
      '/api/auth/linkedin/callback',
      { preferRequestOrigin: true }
    );

    // Store state in cookie for verification on callback
    const scopes = getLinkedInAuthScopes(context);
    const response = NextResponse.redirect(generateLinkedInAuthUrl(state, redirectUri, scopes));

    response.cookies.set('linkedin_oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600, // 10 minutes
      path: '/',
    });

    // Store user ID for callback verification
    response.cookies.set('linkedin_oauth_user', user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600, // 10 minutes
      path: '/',
    });

    response.cookies.set('linkedin_oauth_context', context, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600, // 10 minutes
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('LinkedIn OAuth initiation error:', error);
    return NextResponse.redirect(buildFailureRedirect(request, context));
  }
}
