/**
 * Video Integration API
 *
 * GET - Fetch user's video integrations (Zoom, Google Meet)
 * Handles OAuth connection status and token management
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: rows, error } = await supabase
      .from('user_video_integrations')
      .select('provider, token_expiry, created_at')
      .eq('user_id', user.id);

    if (error) {
      console.error('Fetch video integrations error:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    const now = new Date();
    const integrations = (rows ?? []).map((row: any) => {
      const provider = row.provider === 'google_meet' ? 'google' : row.provider;
      const expiresAt = row.token_expiry ?? null;
      const connected = expiresAt ? new Date(expiresAt) >= now : true;

      return {
        provider,
        connected,
        connectedAt: row.created_at ?? null,
        email: null as string | null,
        expiresAt,
      };
    });

    // Add placeholders for non-connected services
    if (!integrations.find((i) => i.provider === 'zoom')) {
      integrations.push({
        provider: 'zoom',
        connected: false,
        connectedAt: null,
        email: null,
        expiresAt: null,
      });
    }
    if (!integrations.find((i) => i.provider === 'google')) {
      integrations.push({
        provider: 'google',
        connected: false,
        connectedAt: null,
        email: null,
        expiresAt: null,
      });
    }

    return NextResponse.json({ integrations });
  } catch (error) {
    console.error('Fetch video integrations error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
