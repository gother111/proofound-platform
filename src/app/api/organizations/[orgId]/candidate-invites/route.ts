import { NextRequest, NextResponse } from 'next/server';
import { and, desc, eq, inArray, lt } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '@/db';
import { orgCandidateInvites, organizationMembers, organizations, profiles } from '@/db/schema';
import {
  buildCandidateInviteUrl,
  CANDIDATE_INVITE_EXPIRY_DAYS,
  CANDIDATE_INVITE_STATUS,
  generateCandidateInviteToken,
  hashCandidateInviteToken,
  normalizeInviteEmail,
} from '@/lib/candidate-invites';
import { sendCandidateInviteEmail } from '@/lib/email';
import { emitAnalyticsEventAsync } from '@/lib/analytics/events';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const createCandidateInvitesSchema = z
  .object({
    email: z.string().email().optional(),
    emails: z.array(z.string().email()).optional(),
    expiryDays: z.number().int().min(1).max(30).optional(),
  })
  .superRefine((value, ctx) => {
    if (!value.email && (!value.emails || value.emails.length === 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Provide at least one valid email address.',
        path: ['emails'],
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
        expiresAt: orgCandidateInvites.expiresAt,
        invitedBy: orgCandidateInvites.invitedBy,
        claimedByProfileId: orgCandidateInvites.claimedByProfileId,
        claimedAt: orgCandidateInvites.claimedAt,
        proofSnippetId: orgCandidateInvites.proofSnippetId,
        proofShareToken: orgCandidateInvites.proofShareToken,
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

    const normalizedEmails = dedupeEmails(parsed.data);
    if (normalizedEmails.length === 0) {
      return NextResponse.json({ error: 'No valid emails provided' }, { status: 400 });
    }

    const existing = await db
      .select({
        inviteeEmailNormalized: orgCandidateInvites.inviteeEmailNormalized,
      })
      .from(orgCandidateInvites)
      .where(
        and(
          eq(orgCandidateInvites.orgId, orgId),
          inArray(orgCandidateInvites.inviteeEmailNormalized, normalizedEmails),
          inArray(orgCandidateInvites.status, [
            CANDIDATE_INVITE_STATUS.PENDING,
            CANDIDATE_INVITE_STATUS.CLAIMED,
          ])
        )
      );

    const existingSet = new Set(existing.map((item) => item.inviteeEmailNormalized));
    const duplicateEmails = normalizedEmails.filter((email) => existingSet.has(email));
    const creatableEmails = normalizedEmails.filter((email) => !existingSet.has(email));

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
    const tokenMaterial = creatableEmails.map((email) => {
      const rawToken = generateCandidateInviteToken();
      return {
        email,
        rawToken,
        tokenHash: hashCandidateInviteToken(rawToken),
        inviteUrl: buildCandidateInviteUrl(rawToken),
      };
    });

    await db.insert(orgCandidateInvites).values(
      tokenMaterial.map((item) => ({
        orgId,
        inviteeEmail: item.email,
        inviteeEmailNormalized: item.email,
        tokenHash: item.tokenHash,
        status: CANDIDATE_INVITE_STATUS.PENDING,
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
    });
  } catch (error) {
    console.error('Failed to create candidate invites:', error);
    return NextResponse.json({ error: 'Failed to create candidate invites' }, { status: 500 });
  }
}
