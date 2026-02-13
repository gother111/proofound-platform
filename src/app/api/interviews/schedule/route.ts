/**
 * Interview Scheduling API
 * GET /api/interviews/schedule - List scheduled interviews for current user
 * POST /api/interviews/schedule - Create interview with Zoom or Google Meet
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { db } from '@/db';
import { sql } from 'drizzle-orm';
import { getRows } from '@/lib/db/rows';
import { isActiveOrgMember } from '@/lib/api/auth';

export const dynamic = 'force-dynamic';

function isMissingColumnError(error: { code?: string; message?: string } | null, column: string) {
  return Boolean(error?.code === 'PGRST204' && error?.message?.includes(`'${column}'`));
}

/**
 * GET /api/interviews/schedule
 * Returns scheduled interviews where the current user is candidate or org member.
 */
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
    const status = searchParams.get('status');
    const matchId = searchParams.get('matchId');

    // Match-level access keeps org admin visibility even when interviews were created by another admin.
    const accessMatchesResult = await db.execute(sql`
      SELECT DISTINCT m.id
      FROM matches m
      INNER JOIN assignments a ON a.id = m.assignment_id
      LEFT JOIN organization_members om
        ON om.org_id = a.org_id
        AND om.user_id = ${user.id}
        AND om.status = 'active'
        AND om.role IN ('owner', 'admin')
      WHERE m.profile_id = ${user.id}
         OR om.user_id IS NOT NULL
    `);

    const accessMatchRows = getRows(accessMatchesResult) as Array<{ id: string }>;
    const accessibleMatchIds = Array.from(new Set(accessMatchRows.map((row) => row.id)));

    const modernAccessFilters = [
      `host_user_id.eq.${user.id}`,
      `participant_user_ids.cs.{${user.id}}`,
    ];
    if (accessibleMatchIds.length > 0) {
      modernAccessFilters.push(`match_id.in.(${accessibleMatchIds.join(',')})`);
    }

    let query = supabase
      .from('interviews')
      .select('*')
      .or(modernAccessFilters.join(','))
      .order('scheduled_at', { ascending: true });

    if (status) {
      query = query.eq('status', status);
    }

    if (matchId) {
      query = query.eq('match_id', matchId);
    }

    const { data: modernInterviews, error: modernInterviewsError } = await query;

    let interviews = modernInterviews;

    if (modernInterviewsError) {
      const missingModernAccessColumns =
        isMissingColumnError(modernInterviewsError, 'host_user_id') ||
        isMissingColumnError(modernInterviewsError, 'participant_user_ids');

      if (!missingModernAccessColumns) {
        throw modernInterviewsError;
      }

      if (accessibleMatchIds.length === 0) {
        interviews = [];
      } else {
        let legacyQuery = supabase
          .from('interviews')
          .select('*')
          .in('match_id', accessibleMatchIds)
          .order('scheduled_at', { ascending: true });

        if (status) {
          legacyQuery = legacyQuery.eq('status', status);
        }

        if (matchId) {
          legacyQuery = legacyQuery.eq('match_id', matchId);
        }

        const { data: legacyInterviews, error: legacyInterviewsError } = await legacyQuery;
        if (legacyInterviewsError) {
          throw legacyInterviewsError;
        }

        interviews = legacyInterviews;
      }
    }

    const transformedInterviews = (interviews ?? []).map((interview: any) => ({
      id: interview.id,
      matchId: interview.match_id,
      scheduledAt: interview.scheduled_at,
      duration: interview.duration_minutes ?? interview.duration ?? 30,
      platform: interview.platform,
      meetingUrl: interview.meeting_link ?? interview.meeting_url ?? 'pending',
      status: interview.status,
      matchAgreedAt: interview.match_agreed_at ?? null,
      candidateName: interview.candidate_name || 'Candidate',
      assignmentTitle: interview.assignment_title || 'Assignment',
      organizationName: interview.organization_name || 'Organization',
    }));

    return NextResponse.json({
      interviews: transformedInterviews,
      count: transformedInterviews.length,
    });
  } catch (error: any) {
    console.error('Failed to fetch interviews:', error);
    return NextResponse.json({ error: 'Failed to fetch interviews' }, { status: 500 });
  }
}

const ScheduleInterviewSchema = z.object({
  matchId: z.string().uuid(),
  scheduledAt: z.string().datetime(),
  platform: z.enum(['zoom', 'google_meet', 'manual']),
  participantUserIds: z.array(z.string().uuid()).optional().default([]),
  timezone: z.string().optional().default('UTC'),
  manualMeetingLink: z.string().url().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const data = ScheduleInterviewSchema.parse(body);

    // 1. Verify match exists and org access is valid.
    const matchResult = await db.execute(sql`
      SELECT
        m.id,
        m.created_at,
        m.profile_id,
        a.id AS assignment_id,
        a.role,
        a.org_id
      FROM matches m
      INNER JOIN assignments a ON a.id = m.assignment_id
      WHERE m.id = ${data.matchId}
      LIMIT 1
    `);

    const matchRows = getRows(matchResult) as Array<{
      id: string;
      created_at: string;
      profile_id: string;
      assignment_id: string;
      role: string | null;
      org_id: string;
    }>;

    const match = matchRows[0];

    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    const canScheduleForOrg = await isActiveOrgMember(supabase, user.id, match.org_id, [
      'owner',
      'admin',
    ]);

    if (!canScheduleForOrg) {
      return NextResponse.json(
        { error: 'Only organization owners/admins can schedule interviews' },
        { status: 403 }
      );
    }

    // 2. Check if interview already exists for this match (only 1 per match).
    const { data: existingInterview } = await supabase
      .from('interviews')
      .select('id')
      .eq('match_id', data.matchId)
      .maybeSingle();

    if (existingInterview) {
      return NextResponse.json(
        { error: 'Interview already exists for this match' },
        { status: 400 }
      );
    }

    // 3. Validate scheduling window (within 7 days from now).
    const scheduledDate = new Date(data.scheduledAt);
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    if (scheduledDate < now || scheduledDate > sevenDaysFromNow) {
      return NextResponse.json(
        { error: 'Interview must be scheduled within 7 days' },
        { status: 400 }
      );
    }

    // 4. Handle meeting link based on platform.
    let meetingLink = '';
    let meetingId = '';

    if (data.platform === 'manual') {
      if (!data.manualMeetingLink) {
        return NextResponse.json(
          { error: 'Meeting link is required when using manual platform' },
          { status: 400 }
        );
      }
      meetingLink = data.manualMeetingLink;
      meetingId = `manual-${Date.now()}`;
    } else {
      const provider = data.platform === 'google_meet' ? 'google_meet' : 'zoom';

      const { data: videoIntegration, error: integrationError } = await supabase
        .from('user_video_integrations')
        .select('access_token, refresh_token, token_expiry')
        .eq('user_id', user.id)
        .eq('provider', provider)
        .single();

      if (integrationError || !videoIntegration) {
        return NextResponse.json(
          {
            error: `${data.platform === 'zoom' ? 'Zoom' : 'Google Meet'} not connected. Please connect your account first, or use "manual" to provide your own meeting link.`,
          },
          { status: 400 }
        );
      }

      let accessToken = videoIntegration.access_token;
      if (new Date(videoIntegration.token_expiry) < new Date()) {
        if (data.platform === 'zoom') {
          const { refreshZoomToken } = await import('@/lib/integrations/zoom');
          const newTokens = await refreshZoomToken(videoIntegration.refresh_token);
          accessToken = newTokens.access_token;

          await supabase
            .from('user_video_integrations')
            .update({
              access_token: newTokens.access_token,
              token_expiry: new Date(Date.now() + newTokens.expires_in * 1000).toISOString(),
            })
            .eq('user_id', user.id)
            .eq('provider', 'zoom');
        } else {
          const { refreshGoogleToken } = await import('@/lib/integrations/google-meet');
          const newTokens = await refreshGoogleToken(videoIntegration.refresh_token);
          accessToken = newTokens.access_token;

          await supabase
            .from('user_video_integrations')
            .update({
              access_token: newTokens.access_token,
              token_expiry: new Date(Date.now() + newTokens.expires_in * 1000).toISOString(),
            })
            .eq('user_id', user.id)
            .eq('provider', 'google_meet');
        }
      }

      if (data.platform === 'zoom') {
        const { createZoomMeeting } = await import('@/lib/integrations/zoom');
        const meeting = await createZoomMeeting(accessToken, {
          topic: `Interview - ${match.role || 'Proofound Match'}`,
          start_time: data.scheduledAt,
          duration: 30,
          timezone: data.timezone,
          agenda: 'Interview session via Proofound',
        });
        meetingLink = meeting.join_url;
        meetingId = meeting.id;
      } else {
        const { createGoogleMeet } = await import('@/lib/integrations/google-meet');

        const participantSet = new Set<string>([
          match.profile_id,
          user.id,
          ...data.participantUserIds,
        ]);
        const participantEmails: string[] = [];

        for (const participantId of participantSet) {
          const { data: profile } = await supabase.auth.admin.getUserById(participantId);
          if (profile.user?.email) {
            participantEmails.push(profile.user.email);
          }
        }

        const meeting = await createGoogleMeet(accessToken, {
          summary: `Interview - ${match.role || 'Proofound Match'}`,
          start_time: data.scheduledAt,
          duration: 30,
          timezone: data.timezone,
          description: 'Interview session via Proofound',
          attendees: participantEmails,
        });
        meetingLink = meeting.hangoutLink;
        meetingId = meeting.id;
      }
    }

    // 5. Create interview record.
    const persistedPlatform = data.platform;

    const participantUserIds = Array.from(
      new Set<string>([match.profile_id, user.id, ...data.participantUserIds])
    );

    const baseInterviewInsert = {
      match_id: data.matchId,
      scheduled_at: data.scheduledAt,
      platform: persistedPlatform,
      meeting_id: meetingId,
      timezone: data.timezone,
      status: 'scheduled',
      host_user_id: user.id,
      participant_user_ids: participantUserIds,
    };

    let interview: any = null;

    const modernInsert = await supabase
      .from('interviews')
      .insert({
        ...baseInterviewInsert,
        duration_minutes: 30,
        meeting_link: meetingLink,
      })
      .select()
      .single();

    if (modernInsert.error) {
      const shouldFallbackToLegacyShape =
        isMissingColumnError(modernInsert.error, 'duration_minutes') ||
        isMissingColumnError(modernInsert.error, 'meeting_link') ||
        isMissingColumnError(modernInsert.error, 'host_user_id') ||
        isMissingColumnError(modernInsert.error, 'participant_user_ids');

      if (!shouldFallbackToLegacyShape) {
        throw modernInsert.error;
      }

      const legacyPlatform = persistedPlatform === 'google_meet' ? 'google' : 'zoom';

      const legacyInsert = await supabase
        .from('interviews')
        .insert({
          match_id: data.matchId,
          scheduled_at: data.scheduledAt,
          platform: legacyPlatform,
          meeting_id: meetingId,
          timezone: data.timezone,
          status: 'scheduled',
          duration: 30,
          meeting_url: meetingLink,
        })
        .select()
        .single();

      if (legacyInsert.error) {
        throw legacyInsert.error;
      }

      interview = legacyInsert.data;
    } else {
      interview = modernInsert.data;
    }

    try {
      const { emitInterviewScheduledAsync } = await import('@/lib/analytics/events');

      const matchDate = new Date(match.created_at);
      const interviewDate = new Date(data.scheduledAt);
      const daysSinceMatch = Math.floor(
        (interviewDate.getTime() - matchDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      emitInterviewScheduledAsync(user.id, interview.id, {
        interview_id: interview.id,
        assignment_id: match.assignment_id,
        match_id: data.matchId,
        duration_minutes: 30,
        platform: persistedPlatform,
        days_since_match: daysSinceMatch,
      });
    } catch (analyticsError) {
      console.error('Failed to emit interview_scheduled event:', analyticsError);
    }

    return NextResponse.json({
      success: true,
      interview,
      message: 'Interview scheduled successfully',
    });
  } catch (error: any) {
    console.error('Failed to schedule interview:', error);

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Failed to schedule interview' }, { status: 500 });
  }
}
