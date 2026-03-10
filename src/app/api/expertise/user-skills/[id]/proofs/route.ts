import { requireApiAuthContext } from '@/lib/auth';
import { NextResponse, NextRequest } from 'next/server';
import { z } from 'zod';
import { emitSkillProofAddedAsync } from '@/lib/analytics/events';
import { MAX_PROOFS_PER_SKILL } from '@/lib/proofs/constants';
import {
  CANONICAL_PROOFS_WRITE_ENABLED,
  upsertCanonicalProofArtifactFromSkillProof,
} from '@/lib/canonical/repository';
import { attachUploadedFile } from '@/lib/uploads/lifecycle';
import { revalidatePublicPortfolioByProfileId } from '@/lib/portfolio/public-invalidation';
import { listCanonicalSkillProofRowsForOwnerSkill } from '@/lib/proofs/canonical-pack';

function deriveProofTitleFromUrl(rawUrl: string): string {
  try {
    const parsed = new URL(rawUrl);
    const pathname = parsed.pathname.replace(/\/+$/, '');
    const lastSegment = pathname.split('/').filter(Boolean).pop();

    if (lastSegment) {
      const decoded = decodeURIComponent(lastSegment).replace(/[-_]+/g, ' ').trim();
      if (decoded.length > 0) return decoded.slice(0, 80);
    }

    return parsed.hostname || 'Proof Link';
  } catch {
    return 'Proof Link';
  }
}

function deriveProofTitleFromFilePath(rawPath: string): string {
  const normalized = rawPath.trim().replace(/\/+$/, '');
  if (!normalized) return 'Uploaded Document';

  const lastSegment = normalized.split('/').filter(Boolean).pop();
  if (!lastSegment) return 'Uploaded Document';

  return decodeURIComponent(lastSegment).replace(/[-_]+/g, ' ').slice(0, 80) || 'Uploaded Document';
}

const CreateProofSchema = z
  .object({
    proofType: z.enum(['project', 'certification', 'media', 'reference', 'link', 'document']),
    title: z.string().trim().optional(),
    description: z.string().optional(),
    url: z.string().url().optional().or(z.literal('')),
    uploadedFileId: z.string().uuid().optional(),
    issuedDate: z.string().optional(),
    expiresDate: z.string().optional(),
    metadata: z.record(z.any()).optional(),
  })
  .superRefine((data, ctx) => {
    const hasTitle = Boolean(data.title?.trim());
    const hasUrl = Boolean(data.url);
    const hasUploadedFile = Boolean(data.uploadedFileId);

    if (!hasTitle && !hasUrl && !hasUploadedFile) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Title, URL, or uploaded file id is required',
        path: ['title'],
      });
    }

    if (data.issuedDate && data.expiresDate) {
      const issuedAt = new Date(data.issuedDate).getTime();
      const expiresAt = new Date(data.expiresDate).getTime();
      if (Number.isFinite(issuedAt) && Number.isFinite(expiresAt) && expiresAt < issuedAt) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Expiration date must be on or after issued date',
          path: ['expiresDate'],
        });
      }
    }
  });

/**
 * POST /api/expertise/user-skills/[id]/proofs
 *
 * Add a proof to a user's skill.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authContext = await requireApiAuthContext();
    if (!authContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { user, supabase } = authContext;
    const body = await request.json();
    const { id: skillId } = await params;

    // Validate input
    const validated = CreateProofSchema.parse(body);
    const attachedUpload = validated.uploadedFileId
      ? await attachUploadedFile(validated.uploadedFileId, user.id, 'skill_proof', skillId)
      : null;

    if (validated.uploadedFileId && !attachedUpload) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          message: 'Uploaded file is still quarantined or failed checks',
        },
        { status: 409 }
      );
    }

    const resolvedFilePath =
      attachedUpload?.quarantine_path ||
      attachedUpload?.durable_path ||
      attachedUpload?.public_path ||
      null;
    const proofTitle =
      validated.title?.trim() ||
      (validated.url ? deriveProofTitleFromUrl(validated.url) : '') ||
      (resolvedFilePath ? deriveProofTitleFromFilePath(resolvedFilePath) : '') ||
      'Proof Link';

    // Verify skill belongs to user
    const { data: skill, error: skillError } = await supabase
      .from('skills')
      .select('id, profile_id')
      .eq('id', skillId)
      .single();

    if (skillError || !skill || skill.profile_id !== user.id) {
      return NextResponse.json({ error: 'Skill not found' }, { status: 404 });
    }

    const existingProofs = await listCanonicalSkillProofRowsForOwnerSkill(user.id, skillId);

    if ((existingProofs || []).length >= MAX_PROOFS_PER_SKILL) {
      return NextResponse.json(
        {
          error: 'Proof limit reached',
          message: `A maximum of ${MAX_PROOFS_PER_SKILL} proofs can be attached to a skill.`,
        },
        { status: 409 }
      );
    }

    // Create proof
    const { data: proof, error: proofError } = await supabase
      .from('skill_proofs')
      .insert({
        skill_id: skillId,
        profile_id: user.id,
        proof_type: validated.proofType,
        title: proofTitle,
        description: validated.description?.trim() || null,
        url: validated.url || null,
        file_path: resolvedFilePath,
        issued_date: validated.issuedDate || null,
        expires_date: validated.expiresDate || null,
        metadata: {
          visibility: 'match-only', // default privacy guardrail
          uploadedFileId: validated.uploadedFileId ?? null,
          ...(validated.metadata || {}),
        },
      })
      .select()
      .single();

    if (proofError) {
      console.error('Error creating proof:', proofError);
      return NextResponse.json(
        { error: 'Failed to create proof', message: proofError.message },
        { status: 500 }
      );
    }

    const canonicalProof =
      CANONICAL_PROOFS_WRITE_ENABLED && proof
        ? await upsertCanonicalProofArtifactFromSkillProof({
            id: proof.id,
            skillId,
            profileId: user.id,
            proofType: validated.proofType,
            title: proof.title,
            description: proof.description,
            url: proof.url,
            filePath: proof.file_path,
            issuedDate: proof.issued_date,
            expiresDate: proof.expires_date,
            metadata:
              proof.metadata && typeof proof.metadata === 'object'
                ? (proof.metadata as Record<string, unknown>)
                : {},
            createdAt: proof.created_at,
            updatedAt: proof.updated_at,
          })
        : null;

    // Emit analytics event for proof addition (PRD F3)
    emitSkillProofAddedAsync(user.id, skillId, proof.id, {
      skill_name: proofTitle,
      proof_type: validated.proofType,
    });

    void import('@/lib/readiness/analytics')
      .then(({ syncReadinessMilestones }) =>
        syncReadinessMilestones(user.id, { source: 'proof_added' })
      )
      .catch((readinessError) => {
        console.error('Failed to sync readiness milestones after proof creation:', readinessError);
      });

    await revalidatePublicPortfolioByProfileId(user.id);

    return NextResponse.json(
      {
        proof: {
          ...proof,
          canonicalArtifactId: canonicalProof?.id ?? null,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      const message = error.issues[0]?.message || 'Invalid proof payload';
      return NextResponse.json(
        { error: 'Validation failed', message, details: error.issues },
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
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authContext = await requireApiAuthContext();
    if (!authContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { user, supabase } = authContext;
    const { id: skillId } = await params;

    // Verify skill belongs to user
    const { data: skill, error: skillError } = await supabase
      .from('skills')
      .select('id, profile_id')
      .eq('id', skillId)
      .single();

    if (skillError || !skill || skill.profile_id !== user.id) {
      return NextResponse.json({ error: 'Skill not found' }, { status: 404 });
    }

    const proofs = await listCanonicalSkillProofRowsForOwnerSkill(user.id, skillId);

    return NextResponse.json({ proofs });
  } catch (error) {
    console.error('Proof GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
