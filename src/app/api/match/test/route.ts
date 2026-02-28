import { NextRequest, NextResponse } from 'next/server';
import { and, desc, eq, or } from 'drizzle-orm';

import { db } from '@/db';
import { assignments, conversations, matches, organizations, profiles } from '@/db/schema';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

async function getAuthenticatedUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function GET(_request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [profile] = await db
      .select({
        id: profiles.id,
      })
      .from(profiles)
      .where(eq(profiles.id, user.id))
      .limit(1);

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const rows = await db
      .select({
        matchId: matches.id,
        assignmentId: assignments.id,
        assignmentRole: assignments.role,
        assignmentStatus: assignments.status,
        orgId: organizations.id,
        orgSlug: organizations.slug,
        orgDisplayName: organizations.displayName,
        conversationId: conversations.id,
        createdAt: matches.createdAt,
      })
      .from(matches)
      .innerJoin(assignments, eq(assignments.id, matches.assignmentId))
      .innerJoin(organizations, eq(organizations.id, assignments.orgId))
      .leftJoin(
        conversations,
        and(
          eq(conversations.matchId, matches.id),
          or(
            eq(conversations.participantOneId, user.id),
            eq(conversations.participantTwoId, user.id)
          )
        )
      )
      .where(and(eq(matches.profileId, user.id), eq(matches.isTestMatch, true)))
      .orderBy(desc(matches.createdAt));

    return NextResponse.json({
      items: rows,
    });
  } catch (error) {
    console.error('Failed to load individual test matches:', error);
    return NextResponse.json({ error: 'Failed to load test matches' }, { status: 500 });
  }
}
