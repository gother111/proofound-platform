/**
 * Video Integration API
 *
 * Fetches the launch interview provider state for Google Meet only
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
    const integrations = (rows ?? [])
      .filter((row: any) => row.provider === 'google_meet')
      .map((row: any) => {
        const expiresAt = row.token_expiry ?? null;
        const connected = expiresAt ? new Date(expiresAt) >= now : true;

        return {
          provider: 'google' as const,
          connected,
          connectedAt: row.created_at ?? null,
          email: null as string | null,
          expiresAt,
        };
      });

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
