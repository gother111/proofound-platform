import { NextRequest, NextResponse } from 'next/server';
import { and, eq, inArray, lt } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '@/db';
import { orgCandidateInvites, organizationMembers, organizations } from '@/db/schema';
import {
  buildCandidateInviteUrl,
  CANDIDATE_INVITE_EXPIRY_DAYS,
  CANDIDATE_INVITE_STATUS,
} from '@/lib/candidate-invites';
import { sendCandidateInviteEmail } from '@/lib/email';
import { emitAnalyticsEventAsync } from '@/lib/analytics/events';
import { createClient } from '@/lib/supabase/server';
import {
  CAPABILITY_BINDINGS,
  CAPABILITY_TOKEN_CLASSES,
  issueCapabilityToken,
  revokeCapabilityTokenById,
} from '@/lib/security/capability-tokens';

export const dynamic = 'force-dynamic';

const updateCandidateInviteSchema = z.object({
  action: z.enum(['resend', 'revoke']),
});

async function getAuthenticatedUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

async function getMembership(orgId: string, userId: string) {
  const [membership] = await db
    .select({
      role: organizationMembers.role,
      status: organizationMembers.status,
    })
    .from(organizationMembers)
    .where(
      and(
        eq(organizationMembers.orgId, orgId),
        eq(organizationMembers.userId, userId),
        eq(organizationMembers.status, 'active')
      )
    )
    .limit(1);

  return membership ?? null;
}

async function getOrganization(orgId: string) {
  const [org] = await db
    .select({
      id: organizations.id,
      displayName: organizations.displayName,
      slug: organizations.slug,
    })
    .from(organizations)
    .where(eq(organizations.id, orgId))
    .limit(1);

  return org ?? null;
}

async function expireStaleInvites(orgId: string) {
  await db
    .update(orgCandidateInvites)
    .set({
      status: CANDIDATE_INVITE_STATUS.EXPIRED,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(orgCandidateInvites.orgId, orgId),
        inArray(orgCandidateInvites.status, [
          CANDIDATE_INVITE_STATUS.PENDING,
          CANDIDATE_INVITE_STATUS.CLAIMED,
        ]),
        lt(orgCandidateInvites.expiresAt, new Date())
      )
    );
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string; inviteId: string }> }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orgId, inviteId } = await params;
    const membership = await getMembership(orgId, user.id);

    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    await expireStaleInvites(orgId);

    const org = await getOrganization(orgId);
    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const body = await request.json();
    const parsed = updateCandidateInviteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid invite action' }, { status: 400 });
    }

    const [invite] = await db
      .select({
        id: orgCandidateInvites.id,
        orgId: orgCandidateInvites.orgId,
        inviteeEmail: orgCandidateInvites.inviteeEmail,
        status: orgCandidateInvites.status,
        capabilityTokenId: orgCandidateInvites.capabilityTokenId,
      })
      .from(orgCandidateInvites)
      .where(and(eq(orgCandidateInvites.id, inviteId), eq(orgCandidateInvites.orgId, orgId)))
      .limit(1);

    if (!invite) {
      return NextResponse.json({ error: 'Invite not found' }, { status: 404 });
    }

    if (parsed.data.action === 'revoke') {
      if (
        invite.status === CANDIDATE_INVITE_STATUS.REVOKED ||
        invite.status === CANDIDATE_INVITE_STATUS.PROOF_SUBMITTED
      ) {
        return NextResponse.json({ error: 'Invite can no longer be revoked' }, { status: 409 });
      }

      await db
        .update(orgCandidateInvites)
        .set({
          status: CANDIDATE_INVITE_STATUS.REVOKED,
          revokedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(orgCandidateInvites.id, invite.id));

      if (invite.capabilityTokenId) {
        await revokeCapabilityTokenById(invite.capabilityTokenId, {
          reason: 'candidate_invite_revoked',
          metadata: {
            inviteId: invite.id,
            orgId,
          },
        });
      }

      return NextResponse.json({ success: true, status: CANDIDATE_INVITE_STATUS.REVOKED });
    }

    if (invite.status !== CANDIDATE_INVITE_STATUS.PENDING) {
      return NextResponse.json({ error: 'Only pending invites can be resent.' }, { status: 409 });
    }

    const expiresAt = new Date(Date.now() + CANDIDATE_INVITE_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
    const issued = await issueCapabilityToken({
      tokenClass: CAPABILITY_TOKEN_CLASSES.CANDIDATE_INVITE_CLAIM,
      sourceTable: 'org_candidate_invites',
      sourceId: invite.id,
      actionScope: 'candidate_invite.claim',
      scopeKey: `candidate_invite:${orgId}:${invite.id}:${invite.inviteeEmail.toLowerCase()}`,
      subjectType: 'org_candidate_invite',
      subjectId: invite.id,
      actorBinding: CAPABILITY_BINDINGS.EMAIL_HASH,
      actorEmail: invite.inviteeEmail,
      expiresAt,
      singleUse: true,
      maxUses: 1,
      revokePriorActiveTokensForScope: true,
      metadata: {
        orgId,
        inviteId: invite.id,
        resend: true,
      },
    });
    const inviteUrl = buildCandidateInviteUrl(issued.rawToken);

    await db
      .update(orgCandidateInvites)
      .set({
        tokenHash: issued.tokenHash,
        capabilityTokenId: issued.token.id,
        expiresAt,
        updatedAt: new Date(),
      })
      .where(eq(orgCandidateInvites.id, invite.id));

    try {
      await sendCandidateInviteEmail(
        invite.inviteeEmail,
        org.displayName,
        inviteUrl,
        CANDIDATE_INVITE_EXPIRY_DAYS
      );
      emitAnalyticsEventAsync({
        eventType: 'candidate_invite_sent',
        userId: user.id,
        organizationId: orgId,
        entityType: 'profile',
        properties: {
          resent: true,
          recipient_domain: invite.inviteeEmail.split('@')[1] ?? null,
        },
      });
    } catch (error) {
      console.error('Failed to resend candidate invite:', error);
    }

    return NextResponse.json({ success: true, status: CANDIDATE_INVITE_STATUS.PENDING });
  } catch (error) {
    console.error('Failed to update candidate invite:', error);
    return NextResponse.json({ error: 'Failed to update candidate invite' }, { status: 500 });
  }
}
