import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import crypto from 'crypto';

/**
 * POST /api/verification/veriff/session
 * 
 * Creates a Veriff verification session for the logged-in user.
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

    // Check if Veriff credentials are configured
    const apiKey = process.env.VERIFF_API_KEY;
    const apiSecret = process.env.VERIFF_API_SECRET;
    const baseUrl = process.env.VERIFF_BASE_URL || 'https://stationapi.veriff.com';

    if (!apiKey || !apiSecret) {
      console.error('Veriff API credentials not configured');
      return NextResponse.json(
        { error: 'Verification service not configured. Please contact support.' },
        { status: 500 }
      );
    }

    // Fetch user profile to get name
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', user.id)
      .single();

    // Create Veriff session
    const sessionData = {
      verification: {
        callback: `${process.env.NEXT_PUBLIC_SITE_URL}/api/verification/veriff/webhook`,
        person: {
          givenName: profile?.display_name?.split(' ')[0] || 'User',
          lastName: profile?.display_name?.split(' ').slice(1).join(' ') || '',
        },
        vendorData: user.id, // Store user ID to identify later
        timestamp: new Date().toISOString(),
      },
    };

    // Sign the request
    const payload = JSON.stringify(sessionData);
    const signature = crypto
      .createHmac('sha256', apiSecret)
      .update(payload)
      .digest('hex');

    // Call Veriff API to create session
    const veriffResponse = await fetch(`${baseUrl}/v1/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-AUTH-CLIENT': apiKey,
        'X-HMAC-SIGNATURE': signature,
      },
      body: payload,
    });

    if (!veriffResponse.ok) {
      const errorData = await veriffResponse.json().catch(() => ({}));
      console.error('Veriff API error:', errorData);
      return NextResponse.json(
        { error: 'Failed to create verification session' },
        { status: 500 }
      );
    }

    const veriffData = await veriffResponse.json();

    // Update individual profile with session ID and set status to pending
    const { error: updateError } = await supabase
      .from('individual_profiles')
      .update({
        veriff_session_id: veriffData.verification.id,
        verification_status: 'pending',
      })
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Error updating profile with session ID:', updateError);
    }

    return NextResponse.json({
      sessionUrl: veriffData.verification.url,
      sessionId: veriffData.verification.id,
      apiKey: apiKey,
      vendorData: user.id,
    });
  } catch (error) {
    console.error('Error creating Veriff session:', error);
    return NextResponse.json(
      { error: 'Failed to create verification session' },
      { status: 500 }
    );
  }
}

