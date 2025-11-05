/**
 * Interviews List API
 * GET /api/interviews
 *
 * Implements PRD Gap 1: List interviews for current user
 *
 * Query parameters:
 * - status: Filter by status (scheduled, completed, cancelled, no_show)
 * - applicationId: Filter by application ID
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { interviews, applications, assignments } from '@/lib/db/schema';
import { eq, and, or, inArray } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status');
    const applicationIdFilter = searchParams.get('applicationId');

    // Build query
    let query = db
      .select({
        interview: interviews,
        application: applications,
        assignment: assignments,
      })
      .from(interviews)
      .leftJoin(applications, eq(interviews.applicationId, applications.id))
      .leftJoin(assignments, eq(applications.assignmentId, assignments.id));

    // Filter by user (host or participant)
    const userInterviews = await db
      .select()
      .from(interviews)
      .where(
        or(
          eq(interviews.hostUserId, user.id)
          // Note: participantUserIds is an array, need to check if user.id is in it
          // This requires a custom SQL condition
        )
      );

    // For now, fetch all and filter in memory (will optimize later)
    const allInterviews = await query;

    const filteredInterviews = allInterviews.filter((row) => {
      const interview = row.interview;

      // Check user is involved
      const isInvolved =
        interview.hostUserId === user.id || interview.participantUserIds.includes(user.id);

      if (!isInvolved) return false;

      // Apply status filter
      if (statusFilter && interview.status !== statusFilter) return false;

      // Apply application filter
      if (applicationIdFilter && interview.applicationId !== applicationIdFilter) return false;

      return true;
    });

    // Sort by scheduled time (upcoming first)
    filteredInterviews.sort((a, b) => {
      return (
        new Date(a.interview.scheduledAt).getTime() - new Date(b.interview.scheduledAt).getTime()
      );
    });

    // Get participant details
    const allParticipantIds = Array.from(
      new Set(filteredInterviews.flatMap((row) => row.interview.participantUserIds))
    );

    const { data: participants } = await supabase
      .from('profiles')
      .select('id, display_name, avatar_url, email')
      .in('id', allParticipantIds);

    const participantsMap = new Map(participants?.map((p: any) => [p.id, p]) || []);

    // Format response
    const formattedInterviews = filteredInterviews.map((row) => ({
      id: row.interview.id,
      applicationId: row.interview.applicationId,
      scheduledAt: row.interview.scheduledAt,
      durationMinutes: row.interview.durationMinutes,
      platform: row.interview.platform,
      meetingLink: row.interview.meetingLink,
      status: row.interview.status,
      rescheduled: row.interview.rescheduled,
      notes: row.interview.notes,
      createdAt: row.interview.createdAt,

      // Application & assignment details
      application: row.application
        ? {
            id: row.application.id,
            profileId: row.application.profileId,
            status: row.application.status,
          }
        : null,

      assignment: row.assignment
        ? {
            id: row.assignment.id,
            role: row.assignment.role,
            orgId: row.assignment.orgId,
          }
        : null,

      // Participants
      host: participantsMap.get(row.interview.hostUserId),
      participants: row.interview.participantUserIds
        .map((id) => participantsMap.get(id))
        .filter(Boolean),

      // User's role in this interview
      isHost: row.interview.hostUserId === user.id,
    }));

    return NextResponse.json({
      interviews: formattedInterviews,
      total: formattedInterviews.length,
    });
  } catch (error: any) {
    console.error('Failed to fetch interviews:', error);
    return NextResponse.json({ error: 'Failed to fetch interviews' }, { status: 500 });
  }
}
