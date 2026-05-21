import { and, eq, inArray } from 'drizzle-orm';
import { nanoid } from 'nanoid';

import { db } from '@/db';
import { assignments, conversations, matches, organizationMembers, profiles } from '@/db/schema';
import { isActiveMembershipState, normalizeAuthorizedOrgRole } from '@/lib/authz';

type ConversationParticipantRecord = {
  userId: string;
  role: string | null | undefined;
  state?: string | null | undefined;
};

export class ConversationAccessError extends Error {
  constructor(
    public readonly code: 'MATCH_NOT_FOUND' | 'ORG_REP_NOT_FOUND',
    message: string
  ) {
    super(message);
    this.name = 'ConversationAccessError';
  }
}

export function makeMaskedHandleForPersona(persona: string | null | undefined): string {
  if (persona === 'individual') {
    return `Submission #${nanoid(6).toUpperCase()}`;
  }

  return `Organization #${nanoid(6).toUpperCase()}`;
}

export function pickPrioritizedOrgRepresentative<T extends ConversationParticipantRecord>(
  members: readonly T[],
  preferredUserId?: string | null
): string | null {
  const eligibleMembers = members.filter((member) => {
    const role = normalizeAuthorizedOrgRole(member.role ?? null);
    const isActive = isActiveMembershipState(member.state ?? null);

    return isActive && (role === 'org_owner' || role === 'org_manager');
  });

  if (eligibleMembers.length === 0) {
    return null;
  }

  return (
    (preferredUserId &&
      eligibleMembers.find((member) => member.userId === preferredUserId)?.userId) ||
    eligibleMembers.find(
      (member) => normalizeAuthorizedOrgRole(member.role ?? null) === 'org_owner'
    )?.userId ||
    eligibleMembers[0]?.userId ||
    null
  );
}

export type MatchConversationParticipants = {
  matchId: string;
  assignmentId: string | null;
  orgId: string;
  candidateId: string;
  orgParticipantId: string;
  maskedHandleOne: string;
  maskedHandleTwo: string;
};

export async function resolveConversationParticipantsForMatch(
  matchId: string,
  preferredOrgUserId?: string | null
): Promise<MatchConversationParticipants> {
  const [matchRecord] = await db
    .select({
      matchId: matches.id,
      assignmentId: matches.assignmentId,
      candidateId: matches.profileId,
      orgId: assignments.orgId,
    })
    .from(matches)
    .innerJoin(assignments, eq(assignments.id, matches.assignmentId))
    .where(eq(matches.id, matchId))
    .limit(1);

  if (!matchRecord) {
    throw new ConversationAccessError('MATCH_NOT_FOUND', `Match ${matchId} not found`);
  }

  const orgMembers = await db
    .select({
      userId: organizationMembers.userId,
      role: organizationMembers.role,
      state: organizationMembers.state,
    })
    .from(organizationMembers)
    .where(
      and(eq(organizationMembers.orgId, matchRecord.orgId), eq(organizationMembers.state, 'active'))
    );

  const orgParticipantId = pickPrioritizedOrgRepresentative(orgMembers, preferredOrgUserId);
  if (!orgParticipantId) {
    throw new ConversationAccessError(
      'ORG_REP_NOT_FOUND',
      `No active organization owner or manager found for org ${matchRecord.orgId}`
    );
  }

  const relatedProfiles = await db
    .select({
      id: profiles.id,
      persona: profiles.persona,
    })
    .from(profiles)
    .where(inArray(profiles.id, [matchRecord.candidateId, orgParticipantId]));

  const personaById = new Map(relatedProfiles.map((profile) => [profile.id, profile.persona]));

  return {
    matchId: matchRecord.matchId,
    assignmentId: matchRecord.assignmentId,
    orgId: matchRecord.orgId,
    candidateId: matchRecord.candidateId,
    orgParticipantId,
    maskedHandleOne: makeMaskedHandleForPersona(personaById.get(matchRecord.candidateId)),
    maskedHandleTwo: makeMaskedHandleForPersona(personaById.get(orgParticipantId)),
  };
}

export async function ensureConversationForMatch(
  matchId: string,
  options: {
    preferredOrgUserId?: string | null;
  } = {}
): Promise<{
  conversation: {
    id: string;
    participantOneId: string;
    participantTwoId: string;
  };
  created: boolean;
}> {
  const [existingConversation] = await db
    .select({
      id: conversations.id,
      participantOneId: conversations.participantOneId,
      participantTwoId: conversations.participantTwoId,
    })
    .from(conversations)
    .where(eq(conversations.matchId, matchId))
    .limit(1);

  if (existingConversation) {
    return {
      conversation: existingConversation,
      created: false,
    };
  }

  const participantContext = await resolveConversationParticipantsForMatch(
    matchId,
    options.preferredOrgUserId
  );

  const [createdConversation] = await db
    .insert(conversations)
    .values({
      matchId: participantContext.matchId,
      assignmentId: participantContext.assignmentId,
      participantOneId: participantContext.candidateId,
      participantTwoId: participantContext.orgParticipantId,
      stage: 'masked',
      maskedHandleOne: participantContext.maskedHandleOne,
      maskedHandleTwo: participantContext.maskedHandleTwo,
      lastMessageAt: new Date(),
    })
    .returning({
      id: conversations.id,
      participantOneId: conversations.participantOneId,
      participantTwoId: conversations.participantTwoId,
    });

  if (!createdConversation) {
    throw new Error(`Failed to create conversation for match ${matchId}`);
  }

  return {
    conversation: createdConversation,
    created: true,
  };
}
