import { requireApiAuthContext } from '@/lib/auth';
import { NextResponse, NextRequest } from 'next/server';
import { emitSkillProofDeletedAsync } from '@/lib/analytics/events';
import {
  deleteCanonicalProofArtifactById,
  deleteCanonicalProofArtifactForSkillProof,
} from '@/lib/canonical/repository';
import { revalidatePublicPortfolioByProfileId } from '@/lib/portfolio/public-invalidation';
import { db } from '@/db';
import { proofArtifacts } from '@/db/schema';
import { and, eq, or } from 'drizzle-orm';
import { deleteUploadedFile, deleteUploadedFileByOwnedStoragePath } from '@/lib/uploads/lifecycle';
import { log } from '@/lib/log';

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

    const canonicalProof = await db.query.proofArtifacts.findFirst({
      where: and(
        eq(proofArtifacts.ownerType, 'individual_profile'),
        eq(proofArtifacts.ownerId, user.id),
        eq(proofArtifacts.subjectType, 'skill'),
        eq(proofArtifacts.subjectId, skillId),
        or(eq(proofArtifacts.id, proofId), eq(proofArtifacts.legacySourceId, proofId))
      ),
    });

    if (canonicalProof) {
      if (canonicalProof.uploadedFileId) {
        const uploadDeleted = await deleteUploadedFile(canonicalProof.uploadedFileId, user.id);
        if (!uploadDeleted) {
          return NextResponse.json({ error: 'Failed to delete uploaded file' }, { status: 500 });
        }
      }

      await deleteCanonicalProofArtifactById(canonicalProof.id);

      if (canonicalProof.legacySourceId) {
        const { error: legacyDeleteError } = await supabase
          .from('skill_proofs')
          .delete()
          .eq('id', canonicalProof.legacySourceId)
          .eq('skill_id', skillId)
          .eq('profile_id', user.id);

        if (legacyDeleteError) {
          log.warn('expertise.user_skill_proof.legacy_delete_failed', {
            error: legacyDeleteError,
          });
        }
      }

      if (!canonicalProof.uploadedFileId) {
        if (canonicalProof.storagePath) {
          await deleteUploadedFileByOwnedStoragePath(canonicalProof.storagePath, user.id);
        }
      }

      emitSkillProofDeletedAsync(user.id, skillId, canonicalProof.id, {
        skill_name: canonicalProof.title || 'Unknown',
        proof_type: canonicalProof.artifactKind || 'unknown',
      });

      await revalidatePublicPortfolioByProfileId(user.id);

      return NextResponse.json({ success: true });
    }

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

    const { error: deleteError } = await supabase.from('skill_proofs').delete().eq('id', proofId);

    if (deleteError) {
      log.error('expertise.user_skill_proof.delete_failed', { error: deleteError });
      return NextResponse.json({ error: 'Failed to delete proof' }, { status: 500 });
    }

    await deleteCanonicalProofArtifactForSkillProof(proofId);

    // Best-effort cleanup for uploaded documents. Never fail DELETE because of storage cleanup.
    if (proof.file_path) {
      await deleteUploadedFileByOwnedStoragePath(proof.file_path, user.id);
    }

    // Emit analytics event for proof deletion (PRD F3)
    emitSkillProofDeletedAsync(user.id, skillId, proofId, {
      skill_name: proof.title || 'Unknown',
      proof_type: proof.proof_type || 'unknown',
    });

    await revalidatePublicPortfolioByProfileId(user.id);

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    log.error('expertise.user_skill_proof.delete_route_failed', { error });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
