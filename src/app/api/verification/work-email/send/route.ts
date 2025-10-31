import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendWorkEmailVerification } from '@/lib/email';
import crypto from 'crypto';
import { z } from 'zod';

const SendWorkEmailVerificationSchema = z.object({
  workEmail: z.string().email('Invalid email address'),
  orgId: z.string().uuid().optional().nullable(),
});

/**
 * POST /api/verification/work-email/send
 * 
 * Sends a work email verification email to the user.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate request body
    const body = await request.json();
    const validation = SendWorkEmailVerificationSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { workEmail, orgId } = validation.data;
    const normalizedEmail = workEmail.toLowerCase();

    // Quick check for better UX (database constraint is the real protection)
    // This check prevents unnecessary token generation if email is already verified
    const { data: existingProfile } = await supabase
      .from('individual_profiles')
      .select('user_id, work_email_verified')
      .eq('work_email', normalizedEmail)
      .eq('work_email_verified', true)
      .maybeSingle();

    if (existingProfile && existingProfile.user_id !== user.id) {
      return NextResponse.json(
        { error: 'This work email is already verified by another account' },
        { status: 400 }
      );
    }

    // Generate verification token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Update or create individual profile with work email and token
    // Note: We set work_email_verified = false here, so it won't trigger the unique constraint
    // The constraint only applies when work_email_verified = true
    const { error: updateError } = await supabase
      .from('individual_profiles')
      .upsert(
        {
          user_id: user.id,
          work_email: normalizedEmail,
          work_email_token: token,
          work_email_token_expires: expiresAt.toISOString(),
          work_email_org_id: orgId || null,
          work_email_verified: false, // Not verified yet, so unique constraint doesn't apply
        },
        {
          onConflict: 'user_id',
        }
      );

    if (updateError) {
      console.error('Error updating profile with work email:', updateError);
      
      // Check if this is a unique constraint violation (shouldn't happen here since verified=false, but handle it anyway)
      if (updateError.code === '23505' || updateError.message?.includes('unique')) {
        return NextResponse.json(
          { error: 'This work email is already verified by another account' },
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        { error: 'Failed to save work email' },
        { status: 500 }
      );
    }

    // Get user's display name
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', user.id)
      .single();

    const userName = profile?.display_name || 'there';

    // Send verification email
    try {
      await sendWorkEmailVerification(workEmail, token, userName);
    } catch (emailError) {
      console.error('Error sending verification email:', emailError);
      return NextResponse.json(
        { error: 'Failed to send verification email' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Verification email sent',
      expiresAt: expiresAt.toISOString(),
    });
  } catch (error) {
    console.error('Error in work email verification send:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

