/**
 * OAuth Integration Management
 *
 * DELETE - Disconnect a video integration
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
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

    const { error: deleteError } = await supabase
      .from('user_video_integrations')
      .delete()
      .eq('user_id', user.id)
      .eq('provider', 'google_meet');

    if (deleteError) {
      console.error('Disconnect integration error:', deleteError);
      return NextResponse.json({ error: 'Failed to disconnect integration' }, { status: 500 });
    }

    // Log analytics
    await supabase.from('analytics_events').insert({
      user_id: user.id,
      event_type: 'integration_disconnected',
      event_data: { provider },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Disconnect integration error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
