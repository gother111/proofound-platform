/**
 * Org Shortlist API
 * GET /api/org/[slug]/shortlist
 *
 * Returns shortlist entries (interest expressed) for assignments in the org.
 * PRD tie-in: pipeline visibility (shortlist stage).
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuthContext } from '@/lib/auth';
import { db } from '@/db';
import {
  assignments,
  matchInterest,
  matches,
  organizations,
  organizationMembers,
  profiles,
} from '@/db/schema';
import { and, desc, eq, isNull, sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

async function getOrgWithAccess(orgIdOrSlug: string, userId: string) {
  const orgs = await db
    .select({
      id: organizations.id,
      slug: organizations.slug,
      displayName: organizations.displayName,
    })
    .from(organizations)
    .where(
      sql`${organizations.id}::text = ${orgIdOrSlug} OR ${organizations.slug} = ${orgIdOrSlug}`
    )
    .limit(1);

  if (orgs.length === 0) {
    return { org: null, membership: null };
  }

  const org = orgs[0];

  const memberships = await db
    .select({ role: organizationMembers.role, status: organizationMembers.status })
    .from(organizationMembers)
    .where(
      and(
        eq(organizationMembers.orgId, org.id),
        eq(organizationMembers.userId, userId),
        eq(organizationMembers.status, 'active')
      )
    )
    .limit(1);

  return {
    org,
    membership: memberships.length > 0 ? memberships[0] : null,
  };
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authContext = await requireApiAuthContext();
    if (!authContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { user } = authContext;
    const { id } = await params;

    const { org, membership } = await getOrgWithAccess(id, user.id);

    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    if (!membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const shortlist = await db
      .select({
        id: matchInterest.id,
        assignmentId: assignments.id,
        assignmentRole: assignments.role,
        assignmentStatus: assignments.status,
        candidateId: profiles.id,
        candidateName: profiles.displayName,
        candidateEmail: profiles.handle, // profiles table does not store email; use handle as identifier
        score: matches.score,
        createdAt: matchInterest.createdAt,
      })
      .from(matchInterest)
      .innerJoin(assignments, eq(matchInterest.assignmentId, assignments.id))
      .leftJoin(
        matches,
        and(
          eq(matches.assignmentId, assignments.id),
          eq(matches.profileId, matchInterest.actorProfileId)
        )
      )
      .leftJoin(profiles, eq(matchInterest.actorProfileId, profiles.id))
      .where(and(eq(assignments.orgId, org.id), isNull(matchInterest.targetProfileId)))
      .orderBy(desc(matchInterest.createdAt))
      .limit(100);

    return NextResponse.json({ items: shortlist });
  } catch (error) {
    console.error('Error fetching shortlist:', error);
    return NextResponse.json({ error: 'Failed to fetch shortlist' }, { status: 500 });
  }
}
