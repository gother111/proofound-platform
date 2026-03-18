/**
 * Video Integration Status Endpoint
 *
 * Returns connection status for the launch Google Meet provider
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
      google: {
        connected: false,
        expires_at: null as string | null,
        connected_at: null as string | null,
      },
    };

    for (const row of integrations as any[]) {
      if (row.provider !== 'google_meet') {
        continue;
      }
      const expiry = row.token_expiry ? new Date(row.token_expiry) : null;
      const isExpired = expiry ? expiry < new Date() : false;

      status.google = {
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
