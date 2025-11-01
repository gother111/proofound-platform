import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import crypto from 'crypto';

/**
 * POST /api/verification/veriff/webhook
 * 
 * Receives verification decisions from Veriff.
 * This endpoint is called by Veriff when a verification is completed.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-hmac-signature');
    const webhookSecret = process.env.VERIFF_WEBHOOK_SECRET || process.env.VERIFF_API_SECRET;

    if (!webhookSecret) {
      console.error('Veriff webhook secret not configured');
      return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
    }

    // Verify webhook signature
    if (signature) {
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(body)
        .digest('hex');

      if (signature !== expectedSignature) {
        console.error('Invalid webhook signature');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    const data = JSON.parse(body);
    
    // Extract verification data
    const {
      id: sessionId,
      status,
      vendorData, // This is the user ID we stored
      code,
    } = data.verification || data;

    if (!sessionId || !vendorData) {
      console.error('Invalid webhook payload:', data);
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const userId = vendorData;

    // Create Supabase client with service role to bypass RLS
    const supabase = await createClient();

    // Determine verification status based on Veriff status
    let verificationStatus: 'verified' | 'failed' | 'pending' = 'pending';
    let verified = false;

    // Veriff status codes:
    // - 9001: approved
    // - 9102: resubmission requested
    // - 9103: declined
    // - 9104: expired
    // - 7001-7002: review in progress

    if (status === 'approved' || code === 9001) {
      verificationStatus = 'verified';
      verified = true;
    } else if (
      status === 'declined' ||
      code === 9103 ||
      code === 9104 ||
      status === 'resubmission_requested' ||
      code === 9102
    ) {
      verificationStatus = 'failed';
      verified = false;
    } else {
      // Still in review
      verificationStatus = 'pending';
    }

    // Update individual profile
    const updateData: any = {
      verification_status: verificationStatus,
      verified: verified,
    };

    if (verificationStatus === 'verified') {
      updateData.verification_method = 'veriff';
      updateData.verified_at = new Date().toISOString();
    }

    const { error: updateError } = await supabase
      .from('individual_profiles')
      .update(updateData)
      .eq('user_id', userId)
      .eq('veriff_session_id', sessionId);

    if (updateError) {
      console.error('Error updating profile after verification:', updateError);
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      );
    }

    console.log(`Verification ${sessionId} for user ${userId}: ${verificationStatus}`);

    return NextResponse.json({ success: true, status: verificationStatus });
  } catch (error) {
    console.error('Error processing Veriff webhook:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

