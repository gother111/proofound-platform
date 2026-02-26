import { requireApiAuthContext } from '@/lib/auth';
import { NextResponse, NextRequest } from 'next/server';
import { z } from 'zod';
import { emitSkillProofAddedAsync } from '@/lib/analytics/events';
import { MAX_PROOFS_PER_SKILL } from '@/lib/proofs/constants';

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
    filePath: z.string().trim().optional().or(z.literal('')),
    issuedDate: z.string().optional(),
    expiresDate: z.string().optional(),
    metadata: z.record(z.any()).optional(),
  })
  .superRefine((data, ctx) => {
    const hasTitle = Boolean(data.title?.trim());
    const hasUrl = Boolean(data.url);
    const hasFilePath = Boolean(data.filePath?.trim());

    if (!hasTitle && !hasUrl && !hasFilePath) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Title, URL, or uploaded file is required',
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
    const proofTitle =
      validated.title?.trim() ||
      (validated.url ? deriveProofTitleFromUrl(validated.url) : '') ||
      (validated.filePath ? deriveProofTitleFromFilePath(validated.filePath) : '') ||
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

    const { data: existingProofs, error: existingProofsError } = await supabase
      .from('skill_proofs')
      .select('id')
      .eq('skill_id', skillId)
      .eq('profile_id', user.id);

    if (existingProofsError) {
      console.error('Error checking proof limit:', existingProofsError);
      return NextResponse.json({ error: 'Failed to validate proof limit' }, { status: 500 });
    }

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
        file_path: validated.filePath || null,
        issued_date: validated.issuedDate || null,
        expires_date: validated.expiresDate || null,
        metadata: {
          visibility: 'match-only', // default privacy guardrail
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

    // Emit analytics event for proof addition (PRD F3)
    emitSkillProofAddedAsync(user.id, skillId, proof.id, {
      skill_name: proofTitle,
      proof_type: validated.proofType,
    });

    return NextResponse.json(
      {
        proof,
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

    // Fetch proofs for this skill
    const { data: proofs, error: proofsError } = await supabase
      .from('skill_proofs')
      .select('*')
      .eq('skill_id', skillId)
      .eq('profile_id', user.id)
      .order('created_at', { ascending: false });

    if (proofsError) {
      console.error('Error fetching proofs:', proofsError);
      return NextResponse.json({ error: 'Failed to fetch proofs' }, { status: 500 });
    }

    return NextResponse.json({
      proofs: proofs || [],
    });
  } catch (error) {
    console.error('Proof GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
