import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/verification/status
 * 
 * Returns the current verification status for the logged-in user.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch individual profile with verification status
    // Use maybeSingle() to handle case where profile doesn't exist yet
    const { data: profile, error: profileError } = await supabase
      .from('individual_profiles')
      .select(
        'verified, verification_method, verification_status, verified_at, work_email, work_email_verified'
      )
      .eq('user_id', user.id)
      .maybeSingle();

    // Handle errors - maybeSingle() typically returns null data and no error if not found
    // But if there's an error, log it and only fail on real database errors
    if (profileError) {
      // Log the full error for debugging
      console.error('Error fetching individual profile:', {
        code: profileError.code,
        message: profileError.message,
        details: profileError.details,
        hint: profileError.hint,
      });
      
      // PGRST116 = "not found" (PostgREST error code), which is expected when profile doesn't exist
      // Most Supabase clients return null without error for maybeSingle(), but some may return this code
      // Only treat as error if it's a real database error (not "not found")
      const isNotFoundError = profileError.code === 'PGRST116' || 
                               profileError.message?.toLowerCase().includes('not found') ||
                               profileError.message?.toLowerCase().includes('no rows');
      
      if (!isNotFoundError) {
        return NextResponse.json(
          { 
            error: 'Failed to fetch verification status',
            details: profileError.message || 'Database error'
          },
          { status: 500 }
        );
      }
      // If it's a "not found" error, continue to return default unverified status below
    }

    if (!profile) {
      // If no individual profile exists, return default unverified status
      return NextResponse.json({
        verified: false,
        verificationMethod: null,
        verificationStatus: 'unverified',
        verifiedAt: null,
        workEmail: null,
        workEmailVerified: false,
      });
    }

    return NextResponse.json({
      verified: profile.verified || false,
      verificationMethod: profile.verification_method,
      verificationStatus: profile.verification_status || 'unverified',
      verifiedAt: profile.verified_at,
      workEmail: profile.work_email,
      workEmailVerified: profile.work_email_verified || false,
    });
  } catch (error) {
    console.error('Error in verification status API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

