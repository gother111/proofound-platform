import { requireApiAuthContext } from '@/lib/auth';
import { NextResponse, NextRequest } from 'next/server';
import { normalizeEmail } from '@/lib/verification/integrity';

/**
 * GET /api/expertise/verifications/incoming
 *
 * Fetch all incoming verification requests for the current user.
 * Query params:
 * - status: 'all' | 'pending' | 'accepted' | 'declined' (default: 'all')
 */
export async function GET(request: NextRequest) {
  try {
    const authContext = await requireApiAuthContext();
    if (!authContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { user, supabase } = authContext;
    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status') || 'all';

    // Get current user's email
    const { data: authUser } = await supabase.auth.getUser();
    const userEmail = normalizeEmail(authUser.user?.email || null);

    if (!userEmail) {
      return NextResponse.json({ error: 'User email not found' }, { status: 400 });
    }

    // Build query for verification requests where this user is the verifier
    let query = supabase
      .from('skill_verification_requests')
      .select(
        `
        id,
        skill_id,
        requester_profile_id,
        verifier_email,
        verifier_source,
        message,
        status,
        created_at,
        responded_at,
        response_message,
        expires_at,
        skills:skills!skill_verification_requests_skill_id_fkey (
          id,
          competency_level:level,
          skills_taxonomy:skills_taxonomy!skills_skill_code_fkey (
            name_i18n,
            skills_l3:skills_l3!skills_taxonomy_cat_id_subcat_id_l3_id_fkey (
              name_i18n,
              skills_subcategories:skills_subcategories!skills_l3_cat_id_subcat_id_fkey (
                name_i18n,
                skills_categories:skills_categories!skills_subcategories_cat_id_fkey (
                  name_i18n
                )
              )
            )
          )
        ),
        profiles:profiles!skill_verification_requests_requester_profile_id_fkey (
          id,
          display_name,
          handle,
          avatar_url
        )
      `
      )
      .eq('verifier_email', userEmail);

    // Apply status filter
    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    // Order by most recent first
    query = query.order('created_at', { ascending: false });

    const { data: requests, error } = await query;

    if (error) {
      console.error('Error fetching verification requests:', error);
      return NextResponse.json({ error: 'Failed to fetch verification requests' }, { status: 500 });
    }

    return NextResponse.json({ requests: requests || [] });
  } catch (error) {
    console.error('Verification incoming error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
