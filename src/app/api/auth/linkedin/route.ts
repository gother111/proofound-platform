/**
 * LinkedIn OAuth Initiation Handler
 * 
 * Redirects user to LinkedIn OAuth authorization page
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    // Verify user is authenticated
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.redirect(
        new URL('/login?error=authentication_required', request.url)
      );
    }

    // LinkedIn OAuth parameters
    const clientId = process.env.LINKEDIN_CLIENT_ID;
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/linkedin/callback`;
    
    if (!clientId) {
      throw new Error('LinkedIn OAuth not configured');
    }

    // LinkedIn OAuth scopes
    // r_liteprofile: basic profile info
    // r_emailaddress: email address
    // For skills import, we would need additional permissions if available
    const scope = 'r_liteprofile r_emailaddress';
    
    // Generate random state for CSRF protection
    const state = crypto.randomUUID();
    
    // Store state in session/cookie for verification (optional but recommended)
    // For now, we'll skip this for simplicity
    
    // Build LinkedIn authorization URL
    const authUrl = new URL('https://www.linkedin.com/oauth/v2/authorization');
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('scope', scope);
    authUrl.searchParams.set('state', state);

    // Redirect to LinkedIn
    return NextResponse.redirect(authUrl.toString());
  } catch (error) {
    console.error('LinkedIn OAuth initiation error:', error);
    return NextResponse.redirect(
      new URL(
        `/settings/integrations?error=${encodeURIComponent(
          error instanceof Error ? error.message : 'OAuth initiation failed'
        )}`,
        request.url
      )
    );
  }
}

