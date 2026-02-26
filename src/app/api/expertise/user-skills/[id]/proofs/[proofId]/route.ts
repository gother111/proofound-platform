import { requireApiAuthContext } from '@/lib/auth';
import { NextResponse, NextRequest } from 'next/server';
import { emitSkillProofDeletedAsync } from '@/lib/analytics/events';

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
    const authContext = await requireApiAuthContext();
    if (!authContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { user, supabase } = authContext;
    const { id: skillId, proofId } = await params;

    // Verify proof belongs to user and is for this skill
    // Also fetch title and type for analytics
    const { data: proof, error: proofError } = await supabase
      .from('skill_proofs')
      .select('id, skill_id, profile_id, title, proof_type, file_path')
      .eq('id', proofId)
      .eq('skill_id', skillId)
      .eq('profile_id', user.id)
      .single();

    if (proofError || !proof) {
      return NextResponse.json({ error: 'Proof not found' }, { status: 404 });
    }

    // Delete the proof
    const { error: deleteError } = await supabase.from('skill_proofs').delete().eq('id', proofId);

    if (deleteError) {
      console.error('Error deleting proof:', deleteError);
      return NextResponse.json({ error: 'Failed to delete proof' }, { status: 500 });
    }

    // Best-effort cleanup for uploaded documents. Never fail DELETE because of storage cleanup.
    if (proof.file_path && proof.file_path.includes(user.id)) {
      const { error: storageDeleteError } = await supabase.storage
        .from('user-uploads')
        .remove([proof.file_path]);
      if (storageDeleteError) {
        console.warn('Failed to delete proof file from storage:', storageDeleteError);
      }
    }

    // Emit analytics event for proof deletion (PRD F3)
    emitSkillProofDeletedAsync(user.id, skillId, proofId, {
      skill_name: proof.title || 'Unknown',
      proof_type: proof.proof_type || 'unknown',
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('Proof DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
