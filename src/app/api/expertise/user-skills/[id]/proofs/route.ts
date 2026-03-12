import { requireApiAuthContext } from '@/lib/auth';
import { NextResponse, NextRequest } from 'next/server';
import { z } from 'zod';
import { emitSkillProofAddedAsync } from '@/lib/analytics/events';
import { MAX_PROOFS_PER_SKILL } from '@/lib/proofs/constants';
import { upsertCanonicalSkillProof } from '@/lib/canonical/repository';
import { attachUploadedFile } from '@/lib/uploads/lifecycle';
import { revalidatePublicPortfolioByProfileId } from '@/lib/portfolio/public-invalidation';
import { listCanonicalSkillProofRowsForOwnerSkill } from '@/lib/proofs/canonical-pack';

type ApiAuthContext = NonNullable<Awaited<ReturnType<typeof requireApiAuthContext>>>;

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
    primaryAnchor: z.object({
      type: z.enum(['experience', 'education', 'volunteering']),
      id: z.string().uuid(),
    }),
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

const ANCHOR_TABLES = {
  experience: 'experiences',
  education: 'education',
  volunteering: 'volunteering',
} as const;

async function validateOwnedPrimaryAnchor(
  supabase: ApiAuthContext['supabase'],
  userId: string,
  anchor: z.infer<typeof CreateProofSchema>['primaryAnchor']
) {
  const { data, error } = await supabase
    .from(ANCHOR_TABLES[anchor.type])
    .select('id, user_id')
    .eq('id', anchor.id)
    .single();

  return !error && Boolean(data) && data.user_id === userId;
}

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
    const hasValidPrimaryAnchor = await validateOwnedPrimaryAnchor(
      supabase as any,
      user.id,
      validated.primaryAnchor
    );

    if (!hasValidPrimaryAnchor) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          message: 'A valid primary anchor context is required for every new proof.',
        },
        { status: 400 }
      );
    }

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

    let canonicalProof;
    try {
      canonicalProof = await upsertCanonicalSkillProof({
        skillId,
        profileId: user.id,
        primaryAnchor: validated.primaryAnchor,
        proofType: validated.proofType,
        title: proofTitle,
        description: validated.description?.trim() || null,
        url: validated.url || null,
        filePath: resolvedFilePath,
        uploadedFileId: validated.uploadedFileId ?? null,
        issuedDate: validated.issuedDate || null,
        expiresDate: validated.expiresDate || null,
        metadata: {
          visibility: 'match-only',
          uploadedFileId: validated.uploadedFileId ?? null,
          primaryAnchorType: validated.primaryAnchor.type,
          primaryAnchorId: validated.primaryAnchor.id,
          ...(validated.metadata || {}),
        },
        importedFrom: validated.uploadedFileId ? 'skill-proof-upload' : 'skill-proof-form',
      });
    } catch (proofError) {
      console.error('Error creating canonical proof:', proofError);
      return NextResponse.json({ error: 'Failed to create proof' }, { status: 500 });
    }

    // Emit analytics event for proof addition (PRD F3)
    emitSkillProofAddedAsync(user.id, skillId, canonicalProof.artifact.id, {
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
          ...canonicalProof.legacyProof,
          canonicalArtifactId: canonicalProof.artifact.id,
          canonicalPackId: canonicalProof.pack.id,
          canonicalPackTitle: canonicalProof.pack.title,
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
