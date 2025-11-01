import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth';
import { NextResponse, NextRequest } from 'next/server';
import { z } from 'zod';

const RespondSchema = z.object({
  action: z.enum(['accept', 'decline']),
  responseMessage: z.string().optional(),
});

/**
 * POST /api/expertise/verification/[requestId]/respond
 * 
 * Allow verifiers to accept or decline verification requests.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  try {
    const user = await requireAuth();
    const supabase = await createClient();
    const body = await request.json();
    const { requestId } = await params;
    
    const validated = RespondSchema.parse(body);
    
    // Fetch the verification request
    const { data: verificationRequest, error: fetchError } = await supabase
      .from('skill_verification_requests')
      .select('*')
      .eq('id', requestId)
      .single();
    
    if (fetchError || !verificationRequest) {
      return NextResponse.json(
        { error: 'Verification request not found' },
        { status: 404 }
      );
    }
    
    // Get current user's email
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single();
    
    const { data: authUser } = await supabase.auth.getUser();
    const userEmail = authUser.user?.email;
    
    // Check if user is authorized to respond
    // User must be the intended verifier (by email or profile ID)
    const isAuthorized = 
      verificationRequest.verifier_profile_id === user.id ||
      verificationRequest.verifier_email === userEmail;
    
    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'Not authorized to respond to this verification request' },
        { status: 403 }
      );
    }
    
    // Check if request is still pending
    if (verificationRequest.status !== 'pending') {
      return NextResponse.json(
        { error: `This verification request has already been ${verificationRequest.status}` },
        { status: 400 }
      );
    }
    
    // Update verification request
    const { data: updated, error: updateError } = await supabase
      .from('skill_verification_requests')
      .update({
        status: validated.action === 'accept' ? 'accepted' : 'declined',
        responded_at: new Date().toISOString(),
        response_message: validated.responseMessage || null,
        verifier_profile_id: user.id, // Link to user profile if they have one
      })
      .eq('id', requestId)
      .select()
      .single();
    
    if (updateError) {
      console.error('Error updating verification request:', updateError);
      return NextResponse.json(
        { error: 'Failed to update verification request' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      request: updated,
      message: `Verification request ${validated.action === 'accept' ? 'accepted' : 'declined'} successfully`,
    });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }
    console.error('Verification respond error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

