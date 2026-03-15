import { and, eq, sql } from 'drizzle-orm';
import { NextRequest } from 'next/server';
import { z } from 'zod';

import { db } from '@/db';
import { assignments, interviews, matches } from '@/db/schema';
import { isActiveOrgMember, requireMobileAuth } from '@/lib/api/mobile/auth';
import { mobileError, mobileSuccess } from '@/lib/api/mobile/response';
import { getRows } from '@/lib/db/rows';

export const dynamic = 'force-dynamic';

const CreateInterviewSchema = z.object({
  matchId: z.string().uuid(),
  scheduledAt: z.string().datetime(),
  duration: z.number().int().min(15).max(180).default(30),
  platform: z.enum(['zoom', 'google']),
  meetingUrl: z.string().url(),
  timezone: z.string().default('UTC'),
});

export async function GET(request: NextRequest) {
  try {
    const auth = await requireMobileAuth(request);
    if ('status' in auth) {
      return auth;
    }

    const status = request.nextUrl.searchParams.get('status');
    const whereStatus = status ? sql`AND i.status = ${status}` : sql``;

    const result = await db.execute(sql`
      SELECT
        i.id,
        i.match_id,
        i.scheduled_at,
        COALESCE(
          NULLIF(to_jsonb(i)->>'duration', '')::integer,
          NULLIF(to_jsonb(i)->>'duration_minutes', '')::integer,
          30
        ) AS duration,
        i.platform,
        COALESCE(
          NULLIF(to_jsonb(i)->>'meeting_url', ''),
          NULLIF(to_jsonb(i)->>'meeting_link', ''),
          ''
        ) AS meeting_url,
        i.status,
        i.created_at,
        a.role AS assignment_title,
        o.display_name AS organization_name
      FROM interviews i
      INNER JOIN matches m ON m.id = i.match_id
      INNER JOIN assignments a ON a.id = m.assignment_id
      INNER JOIN organizations o ON o.id = a.org_id
      WHERE (
        m.profile_id = ${auth.user.id}
        OR EXISTS (
          SELECT 1
          FROM organization_members om
          WHERE om.org_id = a.org_id
            AND om.user_id = ${auth.user.id}
            AND om.status = 'active'
        )
      )
      ${whereStatus}
      ORDER BY i.scheduled_at ASC
    `);

    const rows = getRows(result) as Array<{
      id: string;
      match_id: string;
      scheduled_at: string;
      duration: number;
      platform: string;
      meeting_url: string;
      status: string;
      created_at: string;
      assignment_title: string | null;
      organization_name: string | null;
    }>;

    return mobileSuccess({
      items: rows.map((row) => ({
        id: row.id,
        matchId: row.match_id,
        scheduledAt: row.scheduled_at,
        duration: row.duration,
        platform: row.platform,
        meetingUrl: row.meeting_url,
        status: row.status,
        createdAt: row.created_at,
        assignmentTitle: row.assignment_title,
        organizationName: row.organization_name,
      })),
      count: rows.length,
    });
  } catch (error) {
    console.error('[mobile.interviews.get] failed', error);
    return mobileError('internal_error', 'Failed to load interviews', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireMobileAuth(request);
    if ('status' in auth) {
      return auth;
    }

    const parsed = CreateInterviewSchema.safeParse(await request.json());
    if (!parsed.success) {
      return mobileError(
        'validation_error',
        'Invalid interview payload',
        400,
        parsed.error.flatten()
      );
    }

    const [matchRow] = await db
      .select({
        id: matches.id,
        assignmentId: matches.assignmentId,
      })
      .from(matches)
      .where(eq(matches.id, parsed.data.matchId))
      .limit(1);

    if (!matchRow) {
      return mobileError('not_found', 'Match not found', 404);
    }

    const [assignment] = await db
      .select({
        orgId: assignments.orgId,
      })
      .from(assignments)
      .where(eq(assignments.id, matchRow.assignmentId))
      .limit(1);

    if (!assignment) {
      return mobileError('not_found', 'Assignment not found', 404);
    }

    const canSchedule = await isActiveOrgMember(auth.user.id, assignment.orgId, [
      'org_owner',
      'org_manager',
    ]);
    if (!canSchedule) {
      return mobileError(
        'forbidden',
        'Only organization owners/managers can schedule interviews',
        403
      );
    }

    const [existing] = await db
      .select({ id: interviews.id })
      .from(interviews)
      .where(eq(interviews.matchId, parsed.data.matchId))
      .limit(1);

    if (existing) {
      return mobileError('conflict', 'Interview already exists for this match', 409);
    }

    const [created] = await db
      .insert(interviews)
      .values({
        matchId: parsed.data.matchId,
        scheduledAt: new Date(parsed.data.scheduledAt),
        duration: parsed.data.duration,
        platform: parsed.data.platform,
        meetingId: `mobile-${Date.now()}`,
        meetingUrl: parsed.data.meetingUrl,
        timezone: parsed.data.timezone,
        status: 'scheduled',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return mobileSuccess({ interview: created }, 201);
  } catch (error) {
    console.error('[mobile.interviews.post] failed', error);
    return mobileError('internal_error', 'Failed to schedule interview', 500);
  }
}
