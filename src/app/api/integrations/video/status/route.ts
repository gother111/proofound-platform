/**
 * Video Integration Status Endpoint
 *
 * Returns connection status for Zoom and Google Meet
 * GET /api/integrations/video/status
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuthContext } from '@/lib/auth';
import { db } from '@/db';
import { sql } from 'drizzle-orm';
import { log } from '@/lib/log';

export async function GET(request: NextRequest) {
  try {
    const authContext = await requireApiAuthContext();
    if (!authContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { user } = authContext;

    // Query video integrations
    const integrations = await db.execute(sql`
      SELECT provider, token_expiry, created_at
      FROM user_video_integrations
      WHERE user_id = ${user.id}
    `);

    const status = {
      zoom: {
        connected: false,
        expires_at: null as string | null,
        connected_at: null as string | null,
      },
      google: {
        connected: false,
        expires_at: null as string | null,
        connected_at: null as string | null,
      },
    };

    for (const row of integrations as any[]) {
      const key = row.provider === 'zoom' ? 'zoom' : 'google';
      const expiry = row.token_expiry ? new Date(row.token_expiry) : null;
      const isExpired = expiry ? expiry < new Date() : false;

      status[key] = {
        connected: !isExpired,
        expires_at: row.token_expiry,
        connected_at: row.created_at,
      };
    }

    return NextResponse.json(status);
  } catch (error) {
    log.error('video.status.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json({ error: 'Failed to check video status' }, { status: 500 });
  }
}
