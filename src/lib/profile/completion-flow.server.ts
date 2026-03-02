import { and, count, eq } from 'drizzle-orm';

import { db } from '@/db';
import {
  individualProfiles,
  profiles,
  skillProofs,
  skills,
  skillVerificationRequests,
} from '@/db/schema';
import {
  evaluateIndividualProfileCompletion,
  type IndividualProfileCompletionState,
} from './completion-flow';

function countItems(value: unknown): number {
  return Array.isArray(value) ? value.length : 0;
}

export async function getIndividualProfileCompletionState(
  userId: string
): Promise<IndividualProfileCompletionState> {
  const [profileRow, individualRow, skillsCountRow, proofCountRow, acceptedVerificationCountRow] =
    await Promise.all([
      db
        .select({
          displayName: profiles.displayName,
        })
        .from(profiles)
        .where(eq(profiles.id, userId))
        .limit(1),
      db
        .select({
          values: individualProfiles.values,
          causes: individualProfiles.causes,
        })
        .from(individualProfiles)
        .where(eq(individualProfiles.userId, userId))
        .limit(1),
      db.select({ count: count() }).from(skills).where(eq(skills.profileId, userId)),
      db.select({ count: count() }).from(skillProofs).where(eq(skillProofs.profileId, userId)),
      db
        .select({ count: count() })
        .from(skillVerificationRequests)
        .where(
          and(
            eq(skillVerificationRequests.requesterProfileId, userId),
            eq(skillVerificationRequests.status, 'accepted'),
            eq(skillVerificationRequests.integrityStatus, 'clear')
          )
        ),
    ]);

  const displayName = profileRow[0]?.displayName ?? null;
  const valuesCount = countItems(individualRow[0]?.values);
  const causesCount = countItems(individualRow[0]?.causes);
  const skillsCount = skillsCountRow[0]?.count ?? 0;
  const proofCount = proofCountRow[0]?.count ?? 0;
  const acceptedVerificationCount = acceptedVerificationCountRow[0]?.count ?? 0;

  return evaluateIndividualProfileCompletion({
    displayName,
    valuesCount,
    causesCount,
    skillsCount,
    proofCount,
    acceptedVerificationCount,
  });
}
