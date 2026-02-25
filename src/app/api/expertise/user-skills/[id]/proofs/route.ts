import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth';
import { NextResponse, NextRequest } from 'next/server';
import { z } from 'zod';
import { emitSkillProofAddedAsync } from '@/lib/analytics/events';

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

const CreateProofSchema = z
  .object({
    proofType: z.enum(['project', 'certification', 'media', 'reference', 'link']),
    title: z.string().trim().optional(),
    description: z.string().optional(),
    url: z.string().url().optional().or(z.literal('')),
    issuedDate: z.string().optional(),
    metadata: z.record(z.any()).optional(),
  })
  .superRefine((data, ctx) => {
    const hasTitle = Boolean(data.title?.trim());
    const hasUrl = Boolean(data.url);

    if (!hasTitle && !hasUrl) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Title or URL is required',
        path: ['title'],
      });
    }
  });

/**
 * POST /api/expertise/user-skills/[id]/proofs
 *
 * Add a proof to a user's skill.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const supabase = await createClient();
    const body = await request.json();
    const { id: skillId } = await params;

    // Validate input
    const validated = CreateProofSchema.parse(body);
    const proofTitle = validated.title?.trim() || deriveProofTitleFromUrl(validated.url || '');

    // Verify skill belongs to user
    const { data: skill, error: skillError } = await supabase
      .from('skills')
      .select('id, profile_id')
      .eq('id', skillId)
      .single();

    if (skillError || !skill || skill.profile_id !== user.id) {
      return NextResponse.json({ error: 'Skill not found' }, { status: 404 });
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
        issued_date: validated.issuedDate || null,
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
