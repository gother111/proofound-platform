import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuthContext } from '@/lib/auth';
import { getZoomAuthUrl } from '@/lib/video/zoom';
import { getGoogleAuthUrl } from '@/lib/video/google-meet';
import { randomBytes } from 'crypto';

export const dynamic = 'force-dynamic';

/**
 * GET /api/integrations/[provider]/connect
 *
 * Initiates OAuth flow for the specified provider
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  try {
    const authContext = await requireApiAuthContext();
    if (!authContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { user } = authContext;
    const { provider } = await params;

    // Generate state for CSRF protection
    const state = randomBytes(32).toString('hex');

    let authUrl: string;

    switch (provider) {
      case 'zoom':
        try {
          authUrl = getZoomAuthUrl(state);
        } catch (error) {
          return NextResponse.json(
            {
              error: 'Zoom OAuth not configured',
              message: error instanceof Error ? error.message : 'Unknown error',
              setupGuide: 'See OAUTH_SETUP_GUIDE.md for setup instructions',
            },
            { status: 503 }
          );
        }
        break;

      case 'google':
        try {
          authUrl = getGoogleAuthUrl(state);
        } catch (error) {
          return NextResponse.json(
            {
              error: 'Google OAuth not configured',
              message: error instanceof Error ? error.message : 'Unknown error',
              setupGuide: 'See OAUTH_SETUP_GUIDE.md for setup instructions',
            },
            { status: 503 }
          );
        }
        break;

      default:
        return NextResponse.json({ error: 'Invalid provider' }, { status: 400 });
    }

    // TODO: Store state in session/database for verification in callback

    return NextResponse.json({
      authUrl,
      state,
    });
  } catch (error) {
    console.error('Error initiating OAuth:', error);
    return NextResponse.json({ error: 'Failed to initiate OAuth' }, { status: 500 });
  }
}
