import { count, eq } from 'drizzle-orm';

import { db } from '@/db';
import { individualProfiles, profiles, skills } from '@/db/schema';
import {
  listCanonicalProofPackAggregatesForOwner,
  summarizeCanonicalProofOwnerAggregates,
} from '@/lib/proofs/canonical-pack';
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
  const [profileRow, individualRow, skillsCountRow, canonicalAggregates] = await Promise.all([
    db
      .select({
        displayName: profiles.displayName,
        handle: profiles.handle,
      })
      .from(profiles)
      .where(eq(profiles.id, userId))
      .limit(1),
    db
      .select({
        headline: individualProfiles.headline,
        bio: individualProfiles.bio,
        values: individualProfiles.values,
        causes: individualProfiles.causes,
      })
      .from(individualProfiles)
      .where(eq(individualProfiles.userId, userId))
      .limit(1),
    db.select({ count: count() }).from(skills).where(eq(skills.profileId, userId)),
    listCanonicalProofPackAggregatesForOwner('individual_profile', userId),
  ]);

  const displayName = profileRow[0]?.displayName ?? null;
  const handle = profileRow[0]?.handle ?? null;
  const headline = individualRow[0]?.headline ?? null;
  const bio = individualRow[0]?.bio ?? null;
  const valuesCount = countItems(individualRow[0]?.values);
  const causesCount = countItems(individualRow[0]?.causes);
  const skillsCount = skillsCountRow[0]?.count ?? 0;
  const canonicalSummary = summarizeCanonicalProofOwnerAggregates(canonicalAggregates);
  const proofCount = canonicalSummary.packCount;
  const publicProofCount = canonicalSummary.publicProofSignalCount;
  const acceptedVerificationCount = canonicalSummary.verifiedVerificationCount;

  return evaluateIndividualProfileCompletion({
    displayName,
    handle,
    headline,
    bio,
    valuesCount,
    causesCount,
    skillsCount,
    proofCount,
    acceptedVerificationCount,
    publicProofCount,
  });
}
