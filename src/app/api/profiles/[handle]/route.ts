import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  fetchCompleteRedactedProfile,
  validateProfileLinkToken,
  isViewerMatchedWithProfile,
} from '@/lib/privacy/profile-fetcher';

export const dynamic = 'force-dynamic';

/**
 * GET /api/profiles/[handle]
 *
 * Fetch a profile by handle with automatic privacy redaction
 *
 * Query parameters:
 * - token: Profile link token for link_only access
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ handle: string }> }
) {
  try {
    const { handle } = await params;
    const supabase = await createClient();

    // Get viewer's ID if authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const viewerId = user?.id;

    // Find profile by handle
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('handle', handle)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const profileId = profile.id;

    // Check for profile link token
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get('token');
    const hasValidToken = token ? await validateProfileLinkToken(profileId, token) : false;

    // Check if viewer is matched with this profile
    const isMatched =
      viewerId && viewerId !== profileId
        ? await isViewerMatchedWithProfile(viewerId, profileId)
        : false;

    // Fetch redacted profile
    const redactedProfile = await fetchCompleteRedactedProfile(profileId, {
      viewerId,
      hasProfileLink: hasValidToken,
      isMatchedOrg: isMatched,
    });

    if (!redactedProfile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Add metadata about viewer context
    const response = {
      ...redactedProfile,
      _meta: {
        viewerContext:
          viewerId === profileId
            ? 'self'
            : isMatched
              ? 'matched'
              : hasValidToken
                ? 'link_holder'
                : 'public',
        isOwner: viewerId === profileId,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
