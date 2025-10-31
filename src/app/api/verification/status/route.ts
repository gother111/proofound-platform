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
    const { data: profile, error: profileError } = await supabase
      .from('individual_profiles')
      .select(
        'verified, verification_method, verification_status, verified_at, work_email, work_email_verified'
      )
      .eq('user_id', user.id)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      return NextResponse.json(
        { error: 'Failed to fetch verification status' },
        { status: 500 }
      );
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

