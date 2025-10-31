import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/verification/work-email/verify?token=xxx
 * 
 * Verifies a work email using the token from the email link.
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Verification token is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Find the profile with this token
    const { data: profile, error: findError } = await supabase
      .from('individual_profiles')
      .select('user_id, work_email, work_email_token_expires, work_email_org_id')
      .eq('work_email_token', token)
      .single();

    if (findError || !profile) {
      return NextResponse.json(
        { error: 'Invalid or expired verification token' },
        { status: 400 }
      );
    }

    // Check if token is expired
    if (
      profile.work_email_token_expires &&
      new Date(profile.work_email_token_expires) < new Date()
    ) {
      return NextResponse.json(
        { error: 'Verification token has expired. Please request a new one.' },
        { status: 400 }
      );
    }

    // Update profile: mark work email as verified and set overall verified status
    const { error: updateError } = await supabase
      .from('individual_profiles')
      .update({
        work_email_verified: true,
        verified: true,
        verification_method: 'work_email',
        verification_status: 'verified',
        verified_at: new Date().toISOString(),
        work_email_token: null, // Clear the token
        work_email_token_expires: null,
      })
      .eq('user_id', profile.user_id);

    if (updateError) {
      console.error('Error updating profile after work email verification:', updateError);
      return NextResponse.json(
        { error: 'Failed to verify work email' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Work email verified successfully',
      workEmail: profile.work_email,
    });
  } catch (error) {
    console.error('Error in work email verification:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

