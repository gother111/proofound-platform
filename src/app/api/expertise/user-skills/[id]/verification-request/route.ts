import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth';
import { NextResponse, NextRequest } from 'next/server';
import { z } from 'zod';

const CreateVerificationRequestSchema = z.object({
  verifierSource: z.enum(['peer', 'manager', 'external']),
  verifierEmail: z.string().email('Valid email is required'),
  message: z.string().optional(),
});

/**
 * POST /api/expertise/user-skills/[id]/verification-request
 * 
 * Request verification for a user's skill.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const supabase = await createClient();
    const body = await request.json();
    const { id: skillId } = await params;
    
    // Validate input
    const validated = CreateVerificationRequestSchema.parse(body);
    
    // Verify skill belongs to user
    const { data: skill, error: skillError } = await supabase
      .from('skills')
      .select('id, profile_id, skill_code')
      .eq('id', skillId)
      .single();
    
    if (skillError || !skill || skill.profile_id !== user.id) {
      return NextResponse.json(
        { error: 'Skill not found' },
        { status: 404 }
      );
    }
    
    // Create verification request
    const { data: verificationRequest, error: createError } = await supabase
      .from('skill_verification_requests')
      .insert({
        skill_id: skillId,
        requester_profile_id: user.id,
        verifier_email: validated.verifierEmail,
        verifier_source: validated.verifierSource,
        message: validated.message || null,
      })
      .select()
      .single();
    
    if (createError) {
      console.error('Error creating verification request:', createError);
      return NextResponse.json(
        { error: 'Failed to create verification request' },
        { status: 500 }
      );
    }
    
    // TODO: Send email notification to verifier (optional for MVP)
    
    return NextResponse.json({
      request: verificationRequest,
    }, { status: 201 });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }
    console.error('Verification request POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * GET /api/expertise/user-skills/[id]/verification-request
 * 
 * Get verification status for a user's skill.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const supabase = await createClient();
    const { id: skillId } = await params;
    
    // Verify skill belongs to user
    const { data: skill, error: skillError } = await supabase
      .from('skills')
      .select('id, profile_id')
      .eq('id', skillId)
      .single();
    
    if (skillError || !skill || skill.profile_id !== user.id) {
      return NextResponse.json(
        { error: 'Skill not found' },
        { status: 404 }
      );
    }
    
    // Fetch verification requests for this skill
    const { data: requests, error: requestsError } = await supabase
      .from('skill_verification_requests')
      .select('*')
      .eq('skill_id', skillId)
      .eq('requester_profile_id', user.id)
      .order('created_at', { ascending: false });
    
    if (requestsError) {
      console.error('Error fetching verification requests:', requestsError);
      return NextResponse.json(
        { error: 'Failed to fetch verification requests' },
        { status: 500 }
      );
    }
    
    // Determine overall verification status
    const hasAccepted = requests?.some(r => r.status === 'accepted');
    const verification_status = hasAccepted ? 'verified' : 'pending';
    
    return NextResponse.json({
      verification_status,
      requests: requests || [],
    });
    
  } catch (error) {
    console.error('Verification GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

