import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth';
import { NextResponse, NextRequest } from 'next/server';

/**
 * DELETE /api/expertise/user-skills/[id]/proofs/[proofId]
 * 
 * Delete a proof from a user's skill.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; proofId: string }> }
) {
  try {
    const user = await requireAuth();
    const supabase = await createClient();
    const { id: skillId, proofId } = await params;
    
    // Verify proof belongs to user and is for this skill
    const { data: proof, error: proofError } = await supabase
      .from('skill_proofs')
      .select('id, skill_id, profile_id')
      .eq('id', proofId)
      .eq('skill_id', skillId)
      .eq('profile_id', user.id)
      .single();
    
    if (proofError || !proof) {
      return NextResponse.json(
        { error: 'Proof not found' },
        { status: 404 }
      );
    }
    
    // Delete the proof
    const { error: deleteError } = await supabase
      .from('skill_proofs')
      .delete()
      .eq('id', proofId);
    
    if (deleteError) {
      console.error('Error deleting proof:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete proof' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
    });
    
  } catch (error) {
    console.error('Proof DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


