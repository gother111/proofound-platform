import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth';
import { NextResponse, NextRequest } from 'next/server';
import { z } from 'zod';

const CreateVerificationRequestSchema = z.object({
  verifier_type: z.enum(['peer', 'manager', 'external']),
  verifier_email: z.string().email('Valid email is required'),
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
    
    // TODO: Send verification request email and store in database
    // This will be implemented in a future phase when we have the verification schema
    
    return NextResponse.json({
      message: 'Verification request functionality coming soon',
      request: {
        skill_id: skillId,
        verifier_type: validated.verifier_type,
        verifier_email: validated.verifier_email,
        message: validated.message,
        status: 'pending',
      },
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
    
    // TODO: Fetch verification requests from database
    // For now, return default status
    
    return NextResponse.json({
      verification_status: 'none',
      requests: [],
    });
    
  } catch (error) {
    console.error('Verification GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

