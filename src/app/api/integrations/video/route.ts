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
      where: eq(userIntegrations.userId, user.id),
    });

    const integrations = videoIntegrations
      .filter((int) => ['zoom', 'google'].includes(int.provider))
      .map((int) => ({
        provider: int.provider,
        connected: true, // If record exists, it's connected
        email: null, // Could be added to schema if needed
        expiresAt: int.tokenExpiry?.toISOString() || null,
      }));

    // Add placeholders for non-connected services
    if (!integrations.find((i) => i.provider === 'zoom')) {
      integrations.push({ provider: 'zoom', connected: false, email: null, expiresAt: null });
    }
    if (!integrations.find((i) => i.provider === 'google')) {
      integrations.push({ provider: 'google', connected: false, email: null, expiresAt: null });
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

