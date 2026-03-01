/**
 * Zoom OAuth Connect Endpoint
 *
 * Initiates Zoom OAuth flow
 * GET /api/integrations/zoom/connect
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuthContext } from '@/lib/auth';
import { log } from '@/lib/log';

export async function GET(request: NextRequest) {
  try {
    const authContext = await requireApiAuthContext();
    if (!authContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { user } = authContext;

    log.info('zoom.oauth.blocked.coming_soon', { userId: user.id });

    return NextResponse.json(
      {
        error: 'Zoom integration is coming soon',
        code: 'ZOOM_COMING_SOON',
        message: 'Zoom is temporarily unavailable. Please use Google Meet or manual links.',
      },
      { status: 400 }
    );
  } catch (error) {
    log.error('zoom.oauth.connect.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json({ error: 'Failed to initiate Zoom OAuth' }, { status: 500 });
  }
}
