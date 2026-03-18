import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { buildVerificationStatusContract } from '@/lib/verification/status-contract';

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

    const { data: profile, error: profileError } = await supabase
      .from('individual_profiles')
      .select(
        'work_email, work_email_verified, work_email_verified_at, work_email_reverify_due_at, work_email_token, work_email_token_expires, linkedin_verification_status, linkedin_verification_level, linkedin_verified_at, linkedin_verification_data'
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
      const isNotFoundError =
        profileError.code === 'PGRST116' ||
        profileError.message?.toLowerCase().includes('not found') ||
        profileError.message?.toLowerCase().includes('no rows');

      if (!isNotFoundError) {
        return NextResponse.json(
          {
            error: 'Failed to fetch verification status',
            details: profileError.message || 'Database error',
          },
          { status: 500 }
        );
      }
      // If it's a "not found" error, continue to return default unverified status below
    }

    if (!profile) {
      return NextResponse.json(await buildVerificationStatusContract(user.id, null));
    }

    return NextResponse.json(
      await buildVerificationStatusContract(user.id, {
        workEmail: profile.work_email,
        workEmailVerified: profile.work_email_verified,
        workEmailVerifiedAt: profile.work_email_verified_at,
        workEmailReverifyDueAt: profile.work_email_reverify_due_at,
        workEmailToken: profile.work_email_token,
        workEmailTokenExpires: profile.work_email_token_expires,
        linkedinVerificationStatus: profile.linkedin_verification_status,
        linkedinVerificationLevel: profile.linkedin_verification_level,
        linkedinVerifiedAt: profile.linkedin_verified_at,
        linkedinVerificationData: profile.linkedin_verification_data,
      })
    );
  } catch (error) {
    console.error('Error in verification status API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
