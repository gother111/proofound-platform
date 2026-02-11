/**
 * Admin LinkedIn Verification Review
 *
 * POST /api/admin/verification/linkedin/[userId]/review
 *
 * Allows admin to approve or reject a LinkedIn verification request
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendVerificationApprovedEmail, sendVerificationRejectedEmail } from '@/lib/email';
import { requirePlatformAdminJson } from '@/lib/api/route-helpers';

interface ReviewRequest {
  decision: 'approved' | 'rejected';
  notes?: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const adminUser = await requirePlatformAdminJson();
    if (adminUser instanceof NextResponse) return adminUser;

    const { userId } = await params;
    const supabase = await createClient();

    // 2. Parse request body
    const body: ReviewRequest = await request.json();
    const { decision, notes } = body;

    if (!decision || !['approved', 'rejected'].includes(decision)) {
      return NextResponse.json(
        { error: 'Invalid decision. Must be "approved" or "rejected"' },
        { status: 400 }
      );
    }

    // 3. Get current verification data
    const { data: currentProfile, error: fetchError } = await supabase
      .from('individual_profiles')
      .select('linkedin_verification_data, verification_status')
      .eq('user_id', userId)
      .single();

    if (fetchError || !currentProfile) {
      return NextResponse.json({ error: 'Verification request not found' }, { status: 404 });
    }

    // 4. Update verification data with admin review
    const verificationData = currentProfile.linkedin_verification_data as any;
    const updatedVerificationData = {
      ...verificationData,
      adminReviewed: true,
      adminNotes: notes || null,
      adminDecision: decision,
      reviewedAt: new Date().toISOString(),
      reviewedBy: adminUser.userId,
    };

    // 5. Update profile with decision
    const updateData: any = {
      linkedin_verification_data: updatedVerificationData,
    };

    if (decision === 'approved') {
      updateData.verification_status = 'verified';
      updateData.verification_method = 'linkedin';
      updateData.verified = true;
      updateData.verified_at = new Date().toISOString();
    } else {
      updateData.verification_status = 'failed';
      updateData.verified = false;
    }

    const { error: updateError } = await supabase
      .from('individual_profiles')
      .update(updateData)
      .eq('user_id', userId);

    if (updateError) {
      console.error('Error updating verification:', updateError);
      return NextResponse.json({ error: 'Failed to update verification status' }, { status: 500 });
    }

    // 6. Send notification email to user
    try {
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', userId)
        .maybeSingle();

      const adminClient = createAdminClient();
      const { data: authData } = await adminClient.auth.admin.getUserById(userId);
      const userEmail = authData?.user?.email;
      const userName =
        userProfile?.display_name ||
        (authData?.user?.user_metadata?.full_name as string | undefined) ||
        'User';

      if (userEmail) {
        if (decision === 'approved') {
          await sendVerificationApprovedEmail(userEmail, userName, 'linkedin', userId);
        } else {
          await sendVerificationRejectedEmail(userEmail, userName, 'linkedin', notes);
        }
      }
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      // Don't fail the request if email fails
    }

    console.log(
      `LinkedIn verification ${decision} for user ${userId} by admin ${adminUser.userId}`
    );

    return NextResponse.json({
      success: true,
      decision,
      message: `Verification ${decision} successfully`,
    });
  } catch (error) {
    console.error('Error reviewing LinkedIn verification:', error);
    return NextResponse.json(
      {
        error: 'Failed to process review',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
