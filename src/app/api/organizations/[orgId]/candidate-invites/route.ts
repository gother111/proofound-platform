import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { and, desc, eq, inArray, lt } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '@/db';
import { orgCandidateInvites, organizationMembers, organizations, profiles } from '@/db/schema';
import {
  buildCandidateInviteUrl,
  CANDIDATE_INVITE_EXPIRY_DAYS,
  CANDIDATE_INVITE_FLOW_TYPE,
  CANDIDATE_INVITE_STATUS,
  normalizeInviteEmail,
} from '@/lib/candidate-invites';
import { sendCandidateInviteEmail } from '@/lib/email';
import { emitAnalyticsEventAsync } from '@/lib/analytics/events';
import {
  CAPABILITY_BINDINGS,
  CAPABILITY_TOKEN_CLASSES,
  issueCapabilityToken,
} from '@/lib/security/capability-tokens';
import { resolveCandidateInvitePolicyContext } from '@/lib/candidate-invite-policy';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const createCandidateInvitesSchema = z
  .object({
    email: z.string().email().optional(),
    emails: z.array(z.string().email()).optional(),
    expiryDays: z.number().int().min(1).max(30).optional(),
    flowType: z
      .enum([CANDIDATE_INVITE_FLOW_TYPE.PROOF_CARD, CANDIDATE_INVITE_FLOW_TYPE.TEST_MATCH])
      .optional(),
    assignmentId: z.string().uuid().optional(),
  })
  .superRefine((value, ctx) => {
    if (!value.email && (!value.emails || value.emails.length === 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Provide at least one valid email address.',
        path: ['emails'],
      });
    }

    if (
      value.flowType === CANDIDATE_INVITE_FLOW_TYPE.TEST_MATCH &&
      (!value.assignmentId || value.assignmentId.length === 0)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'assignmentId is required for test_match invites.',
        path: ['assignmentId'],
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
      trustStatus: organizations.trustStatus,
      orgTrustTier: organizations.orgTrustTier,
      verified: organizations.verified,
    })
    .from(organizations)
    .where(eq(organizations.id, orgId))
    .limit(1);

  return org ?? null;
}

async function getProfileFlags(userId: string) {
  const [profile] = await db
    .select({
      isBetaTesting: profiles.isBetaTesting,
    })
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1);

  return profile ?? null;
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

function dedupeEmails(input: { email?: string; emails?: string[] }): string[] {
  const normalized = new Set<string>();

  if (input.email) {
    normalized.add(normalizeInviteEmail(input.email));
  }

  (input.emails ?? []).forEach((email) => {
    normalized.add(normalizeInviteEmail(email));
  });

  return Array.from(normalized);
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orgId } = await params;
    const membership = await getMembership(orgId, user.id);

    if (!membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    await expireStaleInvites(orgId);

    const rows = await db
      .select({
        id: orgCandidateInvites.id,
        inviteeEmail: orgCandidateInvites.inviteeEmail,
        status: orgCandidateInvites.status,
        flowType: orgCandidateInvites.flowType,
        assignmentId: orgCandidateInvites.assignmentId,
        expiresAt: orgCandidateInvites.expiresAt,
        invitedBy: orgCandidateInvites.invitedBy,
        claimedByProfileId: orgCandidateInvites.claimedByProfileId,
        claimedAt: orgCandidateInvites.claimedAt,
        acceptedByProfileId: orgCandidateInvites.acceptedByProfileId,
        acceptedAt: orgCandidateInvites.acceptedAt,
        matchId: orgCandidateInvites.matchId,
        conversationId: orgCandidateInvites.conversationId,
        proofSnippetId: orgCandidateInvites.proofSnippetId,
        proofSubmittedAt: orgCandidateInvites.proofSubmittedAt,
        revokedAt: orgCandidateInvites.revokedAt,
        createdAt: orgCandidateInvites.createdAt,
        updatedAt: orgCandidateInvites.updatedAt,
        claimedProfileHandle: profiles.handle,
        claimedProfileName: profiles.displayName,
      })
      .from(orgCandidateInvites)
      .leftJoin(profiles, eq(profiles.id, orgCandidateInvites.claimedByProfileId))
      .where(eq(orgCandidateInvites.orgId, orgId))
      .orderBy(desc(orgCandidateInvites.createdAt));

    return NextResponse.json({
      invites: rows,
      permissions: {
        canManage: membership.role === 'owner' || membership.role === 'admin',
      },
    });
  } catch (error) {
    console.error('Failed to list candidate invites:', error);
    return NextResponse.json({ error: 'Failed to load candidate invites' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orgId } = await params;
    const membership = await getMembership(orgId, user.id);

    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const org = await getOrganization(orgId);
    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const body = await request.json();
    const parsed = createCandidateInvitesSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Invalid invite payload',
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const flowType = parsed.data.flowType ?? CANDIDATE_INVITE_FLOW_TYPE.PROOF_CARD;
    const assignmentId =
      flowType === CANDIDATE_INVITE_FLOW_TYPE.TEST_MATCH
        ? (parsed.data.assignmentId ?? null)
        : null;

    if (flowType === CANDIDATE_INVITE_FLOW_TYPE.TEST_MATCH) {
      const inviterProfile = await getProfileFlags(user.id);
      if (!inviterProfile) {
        return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
      }

      if (!inviterProfile.isBetaTesting) {
        return NextResponse.json({ error: 'Beta testing access is required.' }, { status: 403 });
      }
    }

    const { assignment, policyEvaluation } = await resolveCandidateInvitePolicyContext(
      orgId,
      assignmentId
    );

    if (flowType === CANDIDATE_INVITE_FLOW_TYPE.TEST_MATCH && assignmentId && !assignment) {
      return NextResponse.json(
        { error: 'Assignment not found for this organization.' },
        { status: 404 }
      );
    }

    if (policyEvaluation.decision === 'blocked') {
      return NextResponse.json(
        {
          error: 'CANDIDATE_INVITE_BLOCKED',
          message: 'Invite creation is blocked by organization or assignment policy.',
          details: {
            decision: policyEvaluation.decision,
            orgTrustTier: policyEvaluation.orgTrustTier,
            reasons: policyEvaluation.reasons.map((reason) => reason.code),
          },
        },
        { status: 403 }
      );
    }

    if (policyEvaluation.decision === 'hold') {
      return NextResponse.json(
        {
          error: 'CANDIDATE_INVITE_ON_HOLD',
          message: 'Invite creation is on hold pending policy review.',
          details: {
            decision: policyEvaluation.decision,
            orgTrustTier: policyEvaluation.orgTrustTier,
            reasons: policyEvaluation.reasons.map((reason) => reason.code),
          },
        },
        { status: 409 }
      );
    }

    const normalizedEmails = dedupeEmails(parsed.data);
    if (normalizedEmails.length === 0) {
      return NextResponse.json({ error: 'No valid emails provided' }, { status: 400 });
    }

    const existingConditions = [
      eq(orgCandidateInvites.orgId, orgId),
      eq(orgCandidateInvites.flowType, flowType),
      inArray(orgCandidateInvites.inviteeEmailNormalized, normalizedEmails),
      inArray(orgCandidateInvites.status, [
        CANDIDATE_INVITE_STATUS.PENDING,
        CANDIDATE_INVITE_STATUS.CLAIMED,
      ]),
    ];
    if (assignmentId) {
      existingConditions.push(eq(orgCandidateInvites.assignmentId, assignmentId));
    }

    const existing = await db
      .select({
        inviteeEmailNormalized: orgCandidateInvites.inviteeEmailNormalized,
        assignmentId: orgCandidateInvites.assignmentId,
      })
      .from(orgCandidateInvites)
      .where(and(...existingConditions));

    const existingSet = new Set(
      existing.map((item) =>
        flowType === CANDIDATE_INVITE_FLOW_TYPE.TEST_MATCH
          ? `${item.inviteeEmailNormalized}:${item.assignmentId ?? ''}`
          : item.inviteeEmailNormalized
      )
    );
    const duplicateEmails = normalizedEmails.filter((email) => {
      const key =
        flowType === CANDIDATE_INVITE_FLOW_TYPE.TEST_MATCH
          ? `${email}:${assignmentId ?? ''}`
          : email;
      return existingSet.has(key);
    });
    const creatableEmails = normalizedEmails.filter((email) => {
      const key =
        flowType === CANDIDATE_INVITE_FLOW_TYPE.TEST_MATCH
          ? `${email}:${assignmentId ?? ''}`
          : email;
      return !existingSet.has(key);
    });

    if (creatableEmails.length === 0) {
      return NextResponse.json(
        {
          error: 'All recipients already have active invites.',
          duplicates: duplicateEmails,
        },
        { status: 409 }
      );
    }

    const expiryDays = parsed.data.expiryDays ?? CANDIDATE_INVITE_EXPIRY_DAYS;
    const expiresAt = new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000);
    const tokenMaterial = await Promise.all(
      creatableEmails.map(async (email) => {
        const inviteId = crypto.randomUUID();
        const issued = await issueCapabilityToken({
          tokenClass: CAPABILITY_TOKEN_CLASSES.CANDIDATE_INVITE_CLAIM,
          sourceTable: 'org_candidate_invites',
          sourceId: inviteId,
          actionScope: 'candidate_invite.claim',
          scopeKey: `candidate_invite:${orgId}:${flowType}:${assignmentId ?? 'none'}:${email}`,
          subjectType: 'org_candidate_invite',
          subjectId: inviteId,
          actorBinding: CAPABILITY_BINDINGS.EMAIL_HASH,
          actorEmail: email,
          expiresAt,
          singleUse: true,
          maxUses: 1,
          revokePriorActiveTokensForScope: true,
          metadata: {
            orgId,
            flowType,
            assignmentId: assignmentId ?? null,
          },
        });

        return {
          inviteId,
          email,
          rawToken: issued.rawToken,
          tokenHash: issued.tokenHash,
          capabilityTokenId: issued.token.id,
          inviteUrl: buildCandidateInviteUrl(issued.rawToken),
        };
      })
    );

    await db.insert(orgCandidateInvites).values(
      tokenMaterial.map((item) => ({
        id: item.inviteId,
        orgId,
        inviteeEmail: item.email,
        inviteeEmailNormalized: item.email,
        tokenHash: item.tokenHash,
        capabilityTokenId: item.capabilityTokenId,
        status: CANDIDATE_INVITE_STATUS.PENDING,
        flowType,
        assignmentId,
        expiresAt,
        invitedBy: user.id,
      }))
    );

    await Promise.all(
      tokenMaterial.map(async (item) => {
        try {
          await sendCandidateInviteEmail(item.email, org.displayName, item.inviteUrl, expiryDays);
          emitAnalyticsEventAsync({
            eventType: 'candidate_invite_sent',
            userId: user.id,
            organizationId: orgId,
            entityType: 'profile',
            properties: {
              recipient_domain: item.email.split('@')[1] ?? null,
              expiry_days: expiryDays,
              flow_type: flowType,
              assignment_id: assignmentId,
            },
          });
        } catch (error) {
          console.error('Candidate invite email send failed:', error);
        }
      })
    );

    return NextResponse.json({
      success: true,
      createdCount: tokenMaterial.length,
      duplicates: duplicateEmails,
      flowType,
      assignmentId,
    });
  } catch (error) {
    console.error('Failed to create candidate invites:', error);
    return NextResponse.json({ error: 'Failed to create candidate invites' }, { status: 500 });
  }
}
