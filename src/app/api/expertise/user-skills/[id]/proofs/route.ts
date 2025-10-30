import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth';
import { NextResponse, NextRequest } from 'next/server';
import { z } from 'zod';

const CreateProofSchema = z.object({
  type: z.enum(['project', 'certification', 'media', 'reference']),
  title: z.string().min(1, 'Title is required'),
  url: z.string().url().optional(),
  date: z.string().optional(),
  notes: z.string().optional(),
});

/**
 * POST /api/expertise/user-skills/[id]/proofs
 * 
 * Add a proof to a user's skill.
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
    const validated = CreateProofSchema.parse(body);
    
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
    
    // TODO: Store proofs in a separate table once the schema is ready
    // For now, return success (proofs will be stored in a future phase)
    
    return NextResponse.json({
      message: 'Proof functionality coming soon',
      proof: validated,
    }, { status: 201 });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }
    console.error('Proof POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * GET /api/expertise/user-skills/[id]/proofs
 * 
 * Get all proofs for a user's skill.
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
    
    // TODO: Fetch proofs from a separate table once the schema is ready
    // For now, return empty array
    
    return NextResponse.json({
      proofs: [],
    });
    
  } catch (error) {
    console.error('Proof GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

