/**
 * LinkedIn OAuth Initiation
 * 
 * GET /api/auth/linkedin
 * Initiates LinkedIn OAuth flow and redirects to LinkedIn authorization
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateLinkedInAuthUrl } from '@/lib/linkedin';
import { randomBytes } from 'crypto';

export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.redirect(
        new URL('/signin?error=unauthorized', request.url)
      );
    }

    // Generate state parameter for CSRF protection
    const state = randomBytes(32).toString('hex');

    // Store state in cookie for verification on callback
    const response = NextResponse.redirect(
      generateLinkedInAuthUrl(
        state,
        `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/linkedin/callback`
      )
    );

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

    return response;
  } catch (error) {
    console.error('LinkedIn OAuth initiation error:', error);
    return NextResponse.redirect(
      new URL(
        `/settings?error=${encodeURIComponent('Failed to initiate LinkedIn connection')}`,
        request.url
      )
    );
  }
}
