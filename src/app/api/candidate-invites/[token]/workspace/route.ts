import { NextRequest, NextResponse } from 'next/server';
import { and, desc, eq, isNull } from 'drizzle-orm';

import { db } from '@/db';
import { orgCandidateInvites, proofPacks } from '@/db/schema';
import {
  CANDIDATE_INVITE_FLOW_TYPE,
  CANDIDATE_INVITE_STATUS,
  isInviteExpired,
} from '@/lib/candidate-invites';
import { CAPABILITY_TOKEN_CLASSES, inspectCapabilityToken } from '@/lib/security/capability-tokens';
import { createClient } from '@/lib/supabase/server';
import { log } from '@/lib/log';

export const dynamic = 'force-dynamic';

const PRIVATE_PROOF_WORKSPACE_URL = '/app/i/profile?profileView=full&tab=proof_packs';
const PROFILE_VISIBILITY_URL = '/app/i/profile?profileView=full&tab=visibility';
const PRIVACY_DATA_CONTROLS_URL = '/app/i/settings/privacy';
const VERIFICATION_WORKSPACE_URL = '/app/i/verifications';

function buildAssignmentReviewUrl(conversationId: string | null | undefined) {
  return conversationId
    ? `/app/i/communications?section=messages&conversation=${encodeURIComponent(conversationId)}`
    : '/app/i/matching';
}

async function getAuthenticatedUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { token } = await params;
    const inspectedInviteToken = await inspectCapabilityToken(token, {
      tokenClass: CAPABILITY_TOKEN_CLASSES.CANDIDATE_INVITE_CLAIM,
      actor: {
        email: user.email ?? null,
        profileId: user.id,
        principalType: 'user_account',
        ip: request.headers.get('x-forwarded-for'),
        userAgent: request.headers.get('user-agent'),
      },
      metadata: { surface: 'candidate_invite.workspace' },
    });

    if (!inspectedInviteToken.ok) {
      return NextResponse.json({ error: 'Invite not found' }, { status: 404 });
    }

    const [invite] = await db
      .select({
        id: orgCandidateInvites.id,
        flowType: orgCandidateInvites.flowType,
        status: orgCandidateInvites.status,
        claimedByProfileId: orgCandidateInvites.claimedByProfileId,
        assignmentId: orgCandidateInvites.assignmentId,
        matchId: orgCandidateInvites.matchId,
        conversationId: orgCandidateInvites.conversationId,
        expiresAt: orgCandidateInvites.expiresAt,
      })
      .from(orgCandidateInvites)
      .where(eq(orgCandidateInvites.capabilityTokenId, inspectedInviteToken.token.id))
      .limit(1);

    if (!invite || invite.status === CANDIDATE_INVITE_STATUS.REVOKED) {
      return NextResponse.json({ error: 'Invite not found' }, { status: 404 });
    }

    if (isInviteExpired(invite.expiresAt) || invite.status === CANDIDATE_INVITE_STATUS.EXPIRED) {
      return NextResponse.json({ error: 'Invite not found' }, { status: 404 });
    }

    if (invite.flowType !== CANDIDATE_INVITE_FLOW_TYPE.PROOF_CARD) {
      return NextResponse.json(
        { error: 'Private proof record submission is not required for this invite.' },
        { status: 409 }
      );
    }

    if (!invite.claimedByProfileId || invite.claimedByProfileId !== user.id) {
      return NextResponse.json({ error: 'Invite must be claimed first.' }, { status: 403 });
    }

    const privateProofPacks = await db
      .select({
        id: proofPacks.id,
        title: proofPacks.title,
        summary: proofPacks.summary,
        roleContext: proofPacks.roleContext,
        visibility: proofPacks.visibility,
        revealGate: proofPacks.revealGate,
        verificationStatus: proofPacks.verificationStatus,
        freshnessState: proofPacks.freshnessState,
        updatedAt: proofPacks.updatedAt,
      })
      .from(proofPacks)
      .where(
        and(
          eq(proofPacks.ownerType, 'individual_profile'),
          eq(proofPacks.ownerId, user.id),
          eq(proofPacks.visibility, 'owner_only'),
          eq(proofPacks.revealGate, 'none'),
          isNull(proofPacks.publishedAt),
          isNull(proofPacks.deletedAt)
        )
      )
      .orderBy(desc(proofPacks.updatedAt))
      .limit(10);

    return NextResponse.json({
      proofPacks: privateProofPacks,
      accountSave: {
        state:
          invite.status === CANDIDATE_INVITE_STATUS.PROOF_SUBMITTED
            ? 'saved_private_workspace'
            : 'ready_to_save_private_workspace',
        accountId: user.id,
        assignmentReviewState: {
          inviteId: invite.id,
          assignmentId: invite.assignmentId ?? null,
          matchId: invite.matchId ?? null,
          conversationId: invite.conversationId ?? null,
        },
        controls: {
          proofWorkspaceUrl: PRIVATE_PROOF_WORKSPACE_URL,
          profileVisibilityUrl: PROFILE_VISIBILITY_URL,
          privacyDataControlsUrl: PRIVACY_DATA_CONTROLS_URL,
          verificationWorkspaceUrl: VERIFICATION_WORKSPACE_URL,
          assignmentReviewUrl: buildAssignmentReviewUrl(invite.conversationId),
        },
        publication: {
          publicPageChanged: false,
          publicDirectoryEntryCreated: false,
          defaultVisibility: 'owner_only',
        },
      },
    });
  } catch (error) {
    log.error('candidate_invite.workspace.fetch_failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: 'Failed to fetch submission workspace' }, { status: 500 });
  }
}
