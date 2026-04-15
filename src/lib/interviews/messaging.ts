import { eq, sql } from 'drizzle-orm';

import { db, matches, messages } from '@/db';
import { isActiveOrgMember } from '@/lib/api/auth';
import { getRows } from '@/lib/db/rows';
import { toIsoOrNull as toIso } from '@/lib/datetime/normalize';
import { log } from '@/lib/log';
import { ensureConversationForMatch as ensureCanonicalConversationForMatch } from '@/lib/messaging/conversation-access';
import { createClient } from '@/lib/supabase/server';

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export type InterviewMessageAction = 'scheduled' | 'edited' | 'cancelled';

export interface InterviewSnapshot {
  scheduledAt?: string | Date | null;
  platform?: string | null;
  meetingUrl?: string | null;
  timezone?: string | null;
}

export interface InterviewAccessContext {
  interviewId: string;
  matchId: string;
  orgId: string;
  candidateId: string;
  status: string | null;
  scheduledAt: Date | null;
  platform: string | null;
  meetingUrl: string | null;
  timezone: string | null;
  rescheduleCount: number;
}

interface PostInterviewUpdateMessageParams {
  action: InterviewMessageAction;
  actorUserId: string;
  interviewId: string;
  matchId: string;
  reason?: string | null;
  previous?: InterviewSnapshot;
  next?: InterviewSnapshot;
}

function formatSnapshot(snapshot?: InterviewSnapshot): string {
  if (!snapshot) return 'n/a';

  const parts: string[] = [];
  const when = toIso(snapshot.scheduledAt ?? null);
  if (when) parts.push(`time=${when}`);
  if (snapshot.timezone) parts.push(`timezone=${snapshot.timezone}`);
  if (snapshot.platform) parts.push(`platform=${snapshot.platform}`);
  if (snapshot.meetingUrl) parts.push(`meeting_url=${snapshot.meetingUrl}`);

  return parts.length > 0 ? parts.join(', ') : 'n/a';
}

function formatInterviewUpdateMessage(params: PostInterviewUpdateMessageParams): string {
  const lines: string[] = [
    '[Interview update]',
    `action=${params.action}`,
    `interview_id=${params.interviewId}`,
    `actor_user_id=${params.actorUserId}`,
  ];

  if (params.previous) {
    lines.push(`previous=${formatSnapshot(params.previous)}`);
  }

  if (params.next) {
    lines.push(`new=${formatSnapshot(params.next)}`);
  }

  if (params.reason?.trim()) {
    lines.push(`reason=${params.reason.trim()}`);
  }

  return lines.join('\n');
}

export async function getInterviewAccessContext(
  interviewId: string
): Promise<InterviewAccessContext | null> {
  const result = await db.execute(sql`
    SELECT
      i.id AS interview_id,
      i.match_id,
      a.org_id,
      m.profile_id AS candidate_id,
      i.status,
      i.scheduled_at,
      COALESCE(i.reschedule_count, 0) AS reschedule_count,
      NULLIF(to_jsonb(i)->>'platform', '') AS platform,
      COALESCE(
        NULLIF(to_jsonb(i)->>'meeting_link', ''),
        NULLIF(to_jsonb(i)->>'meeting_url', '')
      ) AS meeting_url,
      NULLIF(to_jsonb(i)->>'timezone', '') AS timezone
    FROM interviews i
    INNER JOIN matches m ON m.id = i.match_id
    INNER JOIN assignments a ON a.id = m.assignment_id
    WHERE i.id = ${interviewId}
    LIMIT 1
  `);

  const rows = getRows(result) as Array<{
    interview_id: string;
    match_id: string;
    org_id: string;
    candidate_id: string;
    status: string | null;
    scheduled_at: Date | null;
    reschedule_count: number | null;
    platform: string | null;
    meeting_url: string | null;
    timezone: string | null;
  }>;

  const row = rows[0];
  if (!row) return null;

  return {
    interviewId: row.interview_id,
    matchId: row.match_id,
    orgId: row.org_id,
    candidateId: row.candidate_id,
    status: row.status,
    scheduledAt: row.scheduled_at,
    platform: row.platform,
    meetingUrl: row.meeting_url,
    timezone: row.timezone,
    rescheduleCount: row.reschedule_count ?? 0,
  };
}

export async function canManageInterviewAsOrgAdmin(
  supabase: SupabaseServerClient,
  userId: string,
  interviewId: string
): Promise<{ allowed: boolean; context: InterviewAccessContext | null }> {
  const context = await getInterviewAccessContext(interviewId);
  if (!context) {
    return { allowed: false, context: null };
  }

  const allowed = await isActiveOrgMember(supabase, userId, context.orgId, [
    'org_owner',
    'org_manager',
  ]);
  return { allowed, context };
}

export async function ensureConversationForMatch(
  matchId: string,
  actorOrgUserId: string
): Promise<{
  id: string;
  participantOneId: string;
  participantTwoId: string;
}> {
  const result = await ensureCanonicalConversationForMatch(matchId, {
    preferredOrgUserId: actorOrgUserId,
  });
  return result.conversation;
}

export async function postInterviewUpdateMessage(
  params: PostInterviewUpdateMessageParams
): Promise<{
  conversationId: string;
  messageId: string;
}> {
  const conversation = await ensureConversationForMatch(params.matchId, params.actorUserId);

  const [match] = await db
    .select({ candidateId: matches.profileId })
    .from(matches)
    .where(eq(matches.id, params.matchId))
    .limit(1);

  if (!match) {
    throw new Error(`Match ${params.matchId} not found`);
  }

  const isActorParticipant =
    conversation.participantOneId === params.actorUserId ||
    conversation.participantTwoId === params.actorUserId;

  const orgParticipantId =
    conversation.participantOneId === match.candidateId
      ? conversation.participantTwoId
      : conversation.participantOneId;

  const senderId = isActorParticipant ? params.actorUserId : orgParticipantId;
  const content = formatInterviewUpdateMessage(params);

  const [message] = await db
    .insert(messages)
    .values({
      conversationId: conversation.id,
      senderId,
      content,
      status: 'sent',
    })
    .returning({
      id: messages.id,
    });

  if (!message) {
    throw new Error(`Failed to create interview message for interview ${params.interviewId}`);
  }

  return {
    conversationId: conversation.id,
    messageId: message.id,
  };
}

export async function postInterviewUpdateMessageBestEffort(
  params: PostInterviewUpdateMessageParams
): Promise<void> {
  try {
    await postInterviewUpdateMessage(params);
  } catch (error) {
    log.error('interview.messaging.failed', {
      action: params.action,
      interviewId: params.interviewId,
      matchId: params.matchId,
      actorUserId: params.actorUserId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
