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

    // In production, generate OAuth URLs:
    // Zoom: https://zoom.us/oauth/authorize
    // Google: https://accounts.google.com/o/oauth2/v2/auth

    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/video/${provider}/callback`;

    let authUrl: string;

    if (provider === 'zoom') {
      authUrl = `https://zoom.us/oauth/authorize?response_type=code&client_id=${process.env.ZOOM_CLIENT_ID}&redirect_uri=${redirectUri}`;
    } else {
      authUrl = `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${redirectUri}&scope=https://www.googleapis.com/auth/calendar.events`;
    }

    return NextResponse.json({ authUrl });
  } catch (error) {
    console.error('OAuth initiation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
