/**
 * OAuth Initiation Endpoint
 *
 * Starts the OAuth flow for Zoom or Google Meet
 * Note: In production, this would redirect to actual OAuth providers
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest, { params }: { params: Promise<{ provider: string }> }) {
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;

    if (!appUrl) {
      return NextResponse.json(
        { error: 'Missing NEXT_PUBLIC_APP_URL. Set it to your site base URL (e.g., https://yourdomain.com).' },
        { status: 500 }
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { provider } = await params;

    if (!['zoom', 'google'].includes(provider)) {
      return NextResponse.json({ error: 'Invalid provider' }, { status: 400 });
    }

    let authUrl: string;

    if (provider === 'zoom') {
      const zoomClientId = process.env.ZOOM_CLIENT_ID;
      const zoomRedirectUri = process.env.ZOOM_REDIRECT_URI;

      if (!zoomClientId || !zoomRedirectUri) {
        return NextResponse.json(
          {
            error:
              'Zoom OAuth is not configured. Set ZOOM_CLIENT_ID, ZOOM_CLIENT_SECRET, ZOOM_REDIRECT_URI, and NEXT_PUBLIC_APP_URL.',
          },
          { status: 500 }
        );
      }

      authUrl = `https://zoom.us/oauth/authorize?response_type=code&client_id=${zoomClientId}&redirect_uri=${zoomRedirectUri}`;
    } else {
      const googleClientId = process.env.GOOGLE_CLIENT_ID;
      const redirectUri = `${appUrl}/api/integrations/video/${provider}/callback`;

      if (!googleClientId) {
        return NextResponse.json(
          {
            error: 'Google OAuth is not configured. Set GOOGLE_CLIENT_ID and NEXT_PUBLIC_APP_URL.',
          },
          { status: 500 }
        );
      }

      authUrl = `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${googleClientId}&redirect_uri=${redirectUri}&scope=https://www.googleapis.com/auth/calendar.events`;
    }

    return NextResponse.json({ authUrl });
  } catch (error) {
    console.error('OAuth initiation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
