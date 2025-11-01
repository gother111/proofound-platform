import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth';
import { NextResponse, NextRequest } from 'next/server';

/**
 * GET /api/expertise/verifications/incoming
 * 
 * Fetch all incoming verification requests for the current user.
 * Query params:
 * - status: 'all' | 'pending' | 'accepted' | 'declined' (default: 'all')
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status') || 'all';
    
    // Get current user's email
    const { data: authUser } = await supabase.auth.getUser();
    const userEmail = authUser.user?.email;
    
    if (!userEmail) {
      return NextResponse.json(
        { error: 'User email not found' },
        { status: 400 }
      );
    }
    
    // Build query for verification requests where this user is the verifier
    let query = supabase
      .from('skill_verification_requests')
      .select(`
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
        skills:skill_id (
          id,
          skill_code,
          competency_level,
          name_i18n,
          skills_taxonomy (
            id,
            name_i18n,
            skills_l3 (
              id,
              name_i18n,
              skills_subcategories (
                id,
                name_i18n,
                skills_categories (
                  id,
                  name_i18n
                )
              )
            )
          )
        ),
        profiles:requester_profile_id (
          id,
          display_name,
          handle,
          avatar_url
        )
      `)
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
      return NextResponse.json(
        { error: 'Failed to fetch verification requests' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ requests: requests || [] });
    
  } catch (error) {
    console.error('Verification incoming error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

