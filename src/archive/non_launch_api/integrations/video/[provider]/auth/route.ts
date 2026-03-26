/**
 * OAuth Initiation Endpoint
 *
 * Starts the OAuth flow for the launch Google Meet provider
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { resolveIntegrationReturnPath } from '@/lib/integrations/oauth-helpers';

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

    if (provider !== 'google') {
      return NextResponse.json({ error: 'Invalid provider' }, { status: 400 });
    }

    const authPath = '/api/integrations/google/connect';
    const returnTo = resolveIntegrationReturnPath(req.nextUrl.searchParams.get('returnTo'));
    const query = new URLSearchParams({ returnTo }).toString();

    return NextResponse.json({ authUrl: `${authPath}?${query}` });
  } catch (error) {
    console.error('OAuth initiation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
