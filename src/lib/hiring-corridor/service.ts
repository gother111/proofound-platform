import { sql } from 'drizzle-orm';

import { db } from '@/db';
import { getRows } from '@/lib/db/rows';
import { listEngagementVerificationsByInterviewIds } from '@/lib/engagement-verifications/service';
import type { HiringCorridorSource } from '@/lib/hiring-corridor/snapshot';

type CorridorBaseRow = Omit<HiringCorridorSource, 'engagementVerification'> & {
  latestActivityAt: Date | null;
};

const interviewDurationMinutesSql = sql`
  COALESCE(
    NULLIF(to_jsonb(i)->>'duration_minutes', '')::integer,
    NULLIF(to_jsonb(i)->>'duration', '')::integer
  )
`;

const interviewMeetingUrlSql = sql`
  COALESCE(
    NULLIF(to_jsonb(i)->>'meeting_url', ''),
    NULLIF(to_jsonb(i)->>'meeting_link', '')
  )
`;

function getCorridorRowsFromResult(result: unknown) {
  return getRows(result as any) as Array<{
    match_id: string;
    assignment_title: string | null;
    organization_name: string | null;
    candidate_display_name: string | null;
    candidate_profile_id: string | null;
    review_stage: string | null;
    reveal_scope: string | null;
    shortlisted_at: Date | null;
    full_identity_unlocked_at: Date | null;
    intro_id: string | null;
    intro_state: string | null;
    intro_updated_at: Date | null;
    intro_last_activity_at: Date | null;
    conversation_id: string | null;
    conversation_stage: 'masked' | 'revealed' | null;
    participant_one_id: string | null;
    participant_two_id: string | null;
    participant_one_wants_reveal: boolean | null;
    participant_two_wants_reveal: boolean | null;
    participant_one_reveal_requested_at: Date | null;
    participant_two_reveal_requested_at: Date | null;
    revealed_at: Date | null;
    masked_handle_one: string | null;
    masked_handle_two: string | null;
    interview_id: string | null;
    interview_status: string | null;
    interview_scheduled_at: Date | null;
    interview_duration_minutes: number | null;
    interview_platform: string | null;
    interview_meeting_url: string | null;
    interview_manual_meeting_provider: string | null;
    interview_reschedule_count: number | null;
    interview_completed_at: Date | null;
    interview_cancelled_at: Date | null;
    interview_no_show_at: Date | null;
    decision_id: string | null;
    decision_state: string | null;
    decision_updated_at: Date | null;
    decision_hold_until: Date | null;
    latest_activity_at: Date | null;
  }>;
}

function toSourceRow(row: ReturnType<typeof getCorridorRowsFromResult>[number]): CorridorBaseRow {
  return {
    matchId: row.match_id,
    assignmentTitle: row.assignment_title,
    organizationName: row.organization_name,
    candidateDisplayName: row.candidate_display_name,
    candidateProfileId: row.candidate_profile_id,
    reviewStage: row.review_stage,
    revealScope: row.reveal_scope,
    shortlistedAt: row.shortlisted_at,
    fullIdentityUnlockedAt: row.full_identity_unlocked_at,
    introId: row.intro_id,
    introState: row.intro_state,
    introUpdatedAt: row.intro_updated_at,
    introLastActivityAt: row.intro_last_activity_at,
    conversationId: row.conversation_id,
    conversationStage: row.conversation_stage,
    participantOneId: row.participant_one_id,
    participantTwoId: row.participant_two_id,
    participantOneWantsReveal: row.participant_one_wants_reveal,
    participantTwoWantsReveal: row.participant_two_wants_reveal,
    participantOneRevealRequestedAt: row.participant_one_reveal_requested_at,
    participantTwoRevealRequestedAt: row.participant_two_reveal_requested_at,
    revealedAt: row.revealed_at,
    maskedHandleOne: row.masked_handle_one,
    maskedHandleTwo: row.masked_handle_two,
    interviewId: row.interview_id,
    interviewStatus: row.interview_status,
    interviewScheduledAt: row.interview_scheduled_at,
    interviewDurationMinutes: row.interview_duration_minutes,
    interviewPlatform: row.interview_platform,
    interviewMeetingUrl: row.interview_meeting_url,
    interviewManualMeetingProvider: row.interview_manual_meeting_provider,
    interviewRescheduleCount: row.interview_reschedule_count,
    interviewCompletedAt: row.interview_completed_at,
    interviewCancelledAt: row.interview_cancelled_at,
    interviewNoShowAt: row.interview_no_show_at,
    decisionId: row.decision_id,
    decisionState: row.decision_state,
    decisionUpdatedAt: row.decision_updated_at,
    decisionHoldUntil: row.decision_hold_until,
    latestActivityAt: row.latest_activity_at,
  };
}

async function hydrateEngagementVerification(rows: CorridorBaseRow[]) {
  const interviewIds = rows
    .map((row) => row.interviewId)
    .filter((value): value is string => typeof value === 'string');
  const engagementVerificationMap = await listEngagementVerificationsByInterviewIds(interviewIds);

  return rows.map((row) => ({
    ...row,
    engagementVerification: row.interviewId
      ? (engagementVerificationMap.get(row.interviewId) ?? null)
      : null,
  }));
}

export async function getHiringCorridorRecordForMatch(matchId: string) {
  const result = await db.execute(sql`
    SELECT
      m.id AS match_id,
      a.role AS assignment_title,
      o.display_name AS organization_name,
      cp.display_name AS candidate_display_name,
      m.profile_id AS candidate_profile_id,
      mrs.review_stage,
      mrs.reveal_scope,
      mrs.shortlisted_at,
      mrs.full_identity_unlocked_at,
      iw.id AS intro_id,
      iw.state AS intro_state,
      iw.updated_at AS intro_updated_at,
      iw.last_activity_at AS intro_last_activity_at,
      c.id AS conversation_id,
      c.stage AS conversation_stage,
      c.participant_one_id,
      c.participant_two_id,
      c.participant_one_wants_reveal,
      c.participant_two_wants_reveal,
      c.participant_one_reveal_requested_at,
      c.participant_two_reveal_requested_at,
      c.revealed_at,
      c.masked_handle_one,
      c.masked_handle_two,
      i.id AS interview_id,
      i.status AS interview_status,
      i.scheduled_at AS interview_scheduled_at,
      ${interviewDurationMinutesSql} AS interview_duration_minutes,
      i.platform AS interview_platform,
      ${interviewMeetingUrlSql} AS interview_meeting_url,
      i.manual_meeting_provider AS interview_manual_meeting_provider,
      i.reschedule_count AS interview_reschedule_count,
      i.completed_at AS interview_completed_at,
      i.cancelled_at AS interview_cancelled_at,
      i.no_show_at AS interview_no_show_at,
      d.id AS decision_id,
      d.state AS decision_state,
      d.updated_at AS decision_updated_at,
      d.hold_until AS decision_hold_until,
      COALESCE(i.updated_at, d.updated_at, c.updated_at, iw.updated_at, mrs.updated_at, m.created_at) AS latest_activity_at
    FROM matches m
    INNER JOIN assignments a ON a.id = m.assignment_id
    INNER JOIN organizations o ON o.id = a.org_id
    LEFT JOIN profiles cp ON cp.id = m.profile_id
    LEFT JOIN match_review_states mrs ON mrs.match_id = m.id
    LEFT JOIN LATERAL (
      SELECT *
      FROM intro_workflows iw
      WHERE iw.match_id = m.id
      ORDER BY iw.updated_at DESC
      LIMIT 1
    ) iw ON true
    LEFT JOIN LATERAL (
      SELECT *
      FROM conversations c
      WHERE c.match_id = m.id
      ORDER BY c.updated_at DESC
      LIMIT 1
    ) c ON true
    LEFT JOIN LATERAL (
      SELECT *
      FROM interviews i
      WHERE i.match_id = m.id
      ORDER BY
        CASE
          WHEN i.status = 'scheduled' THEN 0
          WHEN i.status = 'completed' THEN 1
          WHEN i.status = 'no_show' THEN 2
          WHEN i.status = 'cancelled' THEN 3
          ELSE 4
        END,
        COALESCE(i.updated_at, i.created_at) DESC
      LIMIT 1
    ) i ON true
    LEFT JOIN LATERAL (
      SELECT *
      FROM decisions d
      WHERE d.assignment_id = a.id
        AND d.candidate_profile_id = m.profile_id
      ORDER BY d.updated_at DESC
      LIMIT 1
    ) d ON true
    WHERE m.id = ${matchId}
    LIMIT 1
  `);

  const row = getCorridorRowsFromResult(result)[0];
  if (!row) {
    return null;
  }

  const [hydrated] = await hydrateEngagementVerification([toSourceRow(row)]);
  return hydrated ?? null;
}

export async function listAccessibleHiringCorridorRecords(userId: string) {
  const accessMatchesResult = await db.execute(sql`
    SELECT DISTINCT m.id
    FROM matches m
    INNER JOIN assignments a ON a.id = m.assignment_id
    LEFT JOIN organization_members om
      ON om.org_id = a.org_id
      AND om.user_id = ${userId}
      AND om.status = 'active'
      AND om.role IN ('org_owner', 'org_manager')
    WHERE m.profile_id = ${userId}
       OR om.user_id IS NOT NULL
  `);

  const accessMatchRows = getRows(accessMatchesResult) as Array<{ id: string }>;
  const accessibleMatchIds = Array.from(new Set(accessMatchRows.map((row) => row.id)));

  if (accessibleMatchIds.length === 0) {
    return [];
  }

  const accessibleMatchIdSql =
    accessibleMatchIds.length > 0
      ? sql.join(
          accessibleMatchIds.map((matchId) => sql`${matchId}`),
          sql`, `
        )
      : sql``;

  const result = await db.execute(sql`
    SELECT
      m.id AS match_id,
      a.role AS assignment_title,
      o.display_name AS organization_name,
      cp.display_name AS candidate_display_name,
      m.profile_id AS candidate_profile_id,
      mrs.review_stage,
      mrs.reveal_scope,
      mrs.shortlisted_at,
      mrs.full_identity_unlocked_at,
      iw.id AS intro_id,
      iw.state AS intro_state,
      iw.updated_at AS intro_updated_at,
      iw.last_activity_at AS intro_last_activity_at,
      c.id AS conversation_id,
      c.stage AS conversation_stage,
      c.participant_one_id,
      c.participant_two_id,
      c.participant_one_wants_reveal,
      c.participant_two_wants_reveal,
      c.participant_one_reveal_requested_at,
      c.participant_two_reveal_requested_at,
      c.revealed_at,
      c.masked_handle_one,
      c.masked_handle_two,
      i.id AS interview_id,
      i.status AS interview_status,
      i.scheduled_at AS interview_scheduled_at,
      ${interviewDurationMinutesSql} AS interview_duration_minutes,
      i.platform AS interview_platform,
      ${interviewMeetingUrlSql} AS interview_meeting_url,
      i.manual_meeting_provider AS interview_manual_meeting_provider,
      i.reschedule_count AS interview_reschedule_count,
      i.completed_at AS interview_completed_at,
      i.cancelled_at AS interview_cancelled_at,
      i.no_show_at AS interview_no_show_at,
      d.id AS decision_id,
      d.state AS decision_state,
      d.updated_at AS decision_updated_at,
      d.hold_until AS decision_hold_until,
      COALESCE(i.updated_at, d.updated_at, c.updated_at, iw.updated_at, mrs.updated_at, m.created_at) AS latest_activity_at
    FROM matches m
    INNER JOIN assignments a ON a.id = m.assignment_id
    INNER JOIN organizations o ON o.id = a.org_id
    LEFT JOIN profiles cp ON cp.id = m.profile_id
    LEFT JOIN match_review_states mrs ON mrs.match_id = m.id
    LEFT JOIN LATERAL (
      SELECT *
      FROM intro_workflows iw
      WHERE iw.match_id = m.id
      ORDER BY iw.updated_at DESC
      LIMIT 1
    ) iw ON true
    LEFT JOIN LATERAL (
      SELECT *
      FROM conversations c
      WHERE c.match_id = m.id
      ORDER BY c.updated_at DESC
      LIMIT 1
    ) c ON true
    LEFT JOIN LATERAL (
      SELECT *
      FROM interviews i
      WHERE i.match_id = m.id
      ORDER BY
        CASE
          WHEN i.status = 'scheduled' THEN 0
          WHEN i.status = 'completed' THEN 1
          WHEN i.status = 'no_show' THEN 2
          WHEN i.status = 'cancelled' THEN 3
          ELSE 4
        END,
        COALESCE(i.updated_at, i.created_at) DESC
      LIMIT 1
    ) i ON true
    LEFT JOIN LATERAL (
      SELECT *
      FROM decisions d
      WHERE d.assignment_id = a.id
        AND d.candidate_profile_id = m.profile_id
      ORDER BY d.updated_at DESC
      LIMIT 1
    ) d ON true
    WHERE m.id IN (${accessibleMatchIdSql})
      AND (
        COALESCE(mrs.review_stage, 'blind_review') = 'shortlisted'
        OR iw.id IS NOT NULL
        OR c.id IS NOT NULL
        OR i.id IS NOT NULL
        OR d.id IS NOT NULL
      )
    ORDER BY COALESCE(i.updated_at, d.updated_at, c.updated_at, iw.updated_at, mrs.updated_at, m.created_at) DESC
  `);

  const rows = getCorridorRowsFromResult(result).map(toSourceRow);
  return hydrateEngagementVerification(rows);
}
