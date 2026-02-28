import { NextRequest, NextResponse } from 'next/server';
import { eq, sql } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '@/db';
import { orgCandidateInvites } from '@/db/schema';
import { getRows } from '@/lib/db/rows';
import {
  CANDIDATE_INVITE_FLOW_TYPE,
  CANDIDATE_INVITE_STATUS,
  hashCandidateInviteToken,
  isInviteExpired,
} from '@/lib/candidate-invites';
import { buildPublicProfileURL } from '@/lib/profile/snippet-generator';
import { emitAnalyticsEventAsync } from '@/lib/analytics/events';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const submitProofCardSchema = z
  .object({
    shareToken: z.string().min(6).max(200).optional(),
    snippetId: z.string().uuid().optional(),
  })
  .superRefine((value, ctx) => {
    if (!value.shareToken && !value.snippetId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Either shareToken or snippetId must be provided.',
      });
    }
  });

async function getAuthenticatedUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { token } = await params;
    const tokenHash = hashCandidateInviteToken(token);
    const body = await request.json();
    const parsed = submitProofCardSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid proof card payload', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const [invite] = await db
      .select({
        id: orgCandidateInvites.id,
        orgId: orgCandidateInvites.orgId,
        flowType: orgCandidateInvites.flowType,
        status: orgCandidateInvites.status,
        expiresAt: orgCandidateInvites.expiresAt,
        claimedByProfileId: orgCandidateInvites.claimedByProfileId,
      })
      .from(orgCandidateInvites)
      .where(eq(orgCandidateInvites.tokenHash, tokenHash))
      .limit(1);

    if (!invite || invite.status === CANDIDATE_INVITE_STATUS.REVOKED) {
      return NextResponse.json({ error: 'Invite not found' }, { status: 404 });
    }

    if (invite.flowType !== CANDIDATE_INVITE_FLOW_TYPE.PROOF_CARD) {
      return NextResponse.json(
        { error: 'Proof Card submission is not required for this invite.' },
        { status: 409 }
      );
    }

    if (isInviteExpired(invite.expiresAt)) {
      if (invite.status !== CANDIDATE_INVITE_STATUS.EXPIRED) {
        await db
          .update(orgCandidateInvites)
          .set({
            status: CANDIDATE_INVITE_STATUS.EXPIRED,
            updatedAt: new Date(),
          })
          .where(eq(orgCandidateInvites.id, invite.id));
      }
      return NextResponse.json({ error: 'Invite has expired' }, { status: 410 });
    }

    if (!invite.claimedByProfileId || invite.claimedByProfileId !== user.id) {
      return NextResponse.json({ error: 'Invite must be claimed first.' }, { status: 403 });
    }

    if (
      invite.status !== CANDIDATE_INVITE_STATUS.CLAIMED &&
      invite.status !== CANDIDATE_INVITE_STATUS.PROOF_SUBMITTED
    ) {
      return NextResponse.json({ error: 'Invite is not in a submittable state.' }, { status: 409 });
    }

    const snippetResult = await db.execute(sql`
      SELECT id, share_token
      FROM profile_snippets
      WHERE user_id = ${user.id}
        AND profile_type = 'individual'
        AND (
          (${parsed.data.shareToken ?? null} IS NOT NULL AND share_token = ${parsed.data.shareToken ?? null})
          OR (${parsed.data.snippetId ?? null} IS NOT NULL AND id = ${parsed.data.snippetId ?? null})
        )
        AND (expires_at IS NULL OR expires_at > NOW())
      LIMIT 1
    `);

    const [snippet] = getRows<{ id: string; share_token: string }>(snippetResult as any);
    if (!snippet) {
      return NextResponse.json({ error: 'Proof Card snippet not found.' }, { status: 404 });
    }

    await db
      .update(orgCandidateInvites)
      .set({
        status: CANDIDATE_INVITE_STATUS.PROOF_SUBMITTED,
        proofSnippetId: snippet.id,
        proofShareToken: snippet.share_token,
        proofSubmittedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(orgCandidateInvites.id, invite.id));

    emitAnalyticsEventAsync({
      eventType: 'candidate_proof_card_submitted',
      userId: user.id,
      organizationId: invite.orgId,
      entityType: 'profile',
      entityId: invite.id,
    });

    return NextResponse.json({
      success: true,
      status: CANDIDATE_INVITE_STATUS.PROOF_SUBMITTED,
      proofCardUrl: buildPublicProfileURL(snippet.share_token),
    });
  } catch (error) {
    console.error('Failed to submit proof card for invite:', error);
    return NextResponse.json({ error: 'Failed to submit Proof Card' }, { status: 500 });
  }
}
