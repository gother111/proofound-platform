/**
 * Video Integration API
 *
 * GET - Fetch user's video integrations (Zoom, Google Meet)
 * Handles OAuth connection status and token management
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { userIntegrations } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

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

    // Fetch video integrations
    const videoIntegrations = await db.query.userIntegrations.findMany({
      where: and(
        eq(userIntegrations.userId, user.id),
        // Only return video conferencing integrations
      ),
    });

    const integrations = videoIntegrations
      .filter((int) => ['zoom', 'google_meet'].includes(int.integrationType))
      .map((int) => ({
        provider: int.integrationType === 'google_meet' ? 'google' : int.integrationType,
        connected: int.connected,
        email: int.integrationData?.email,
        expiresAt: int.integrationData?.expiresAt,
      }));

    // Add placeholders for non-connected services
    if (!integrations.find((i) => i.provider === 'zoom')) {
      integrations.push({ provider: 'zoom' as const, connected: false });
    }
    if (!integrations.find((i) => i.provider === 'google')) {
      integrations.push({ provider: 'google' as const, connected: false });
    }

    return NextResponse.json({ integrations });
  } catch (error) {
    console.error('Fetch video integrations error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

