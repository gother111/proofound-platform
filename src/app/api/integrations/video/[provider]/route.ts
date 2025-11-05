/**
 * OAuth Integration Management
 *
 * DELETE - Disconnect a video integration
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { userIntegrations } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

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
    const integrationType = provider === 'google' ? 'google_meet' : provider;

    // Delete integration
    await db
      .delete(userIntegrations)
      .where(
        and(
          eq(userIntegrations.userId, user.id),
          eq(userIntegrations.provider, provider as 'zoom' | 'google' | 'linkedin')
        )
      );

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
