import { count, eq } from 'drizzle-orm';

import { db } from '@/db';
import {
  education,
  experiences,
  individualProfiles,
  matchingProfiles,
  portfolioPublicationStates,
  profiles,
  skills,
  volunteering,
} from '@/db/schema';
import { isAccessiblePublicPortfolioState } from '@/lib/portfolio/public-contract';
import {
  hasPrimaryAnchorContext,
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
  const [
    profileRow,
    individualRow,
    matchingRow,
    skillsCountRow,
    experienceCountRow,
    educationCountRow,
    volunteeringCountRow,
    publicationStateRow,
    canonicalAggregates,
  ] = await Promise.all([
    db
      .select({
        displayName: profiles.displayName,
        handle: profiles.handle,
        publicPortfolioState: profiles.publicPortfolioState,
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
        location: individualProfiles.location,
      })
      .from(individualProfiles)
      .where(eq(individualProfiles.userId, userId))
      .limit(1),
    db
      .select({
        timezone: matchingProfiles.timezone,
        desiredRoles: matchingProfiles.desiredRoles,
        workMode: matchingProfiles.workMode,
        engagementType: matchingProfiles.engagementType,
      })
      .from(matchingProfiles)
      .where(eq(matchingProfiles.profileId, userId))
      .limit(1),
    db.select({ count: count() }).from(skills).where(eq(skills.profileId, userId)),
    db.select({ count: count() }).from(experiences).where(eq(experiences.userId, userId)),
    db.select({ count: count() }).from(education).where(eq(education.userId, userId)),
    db.select({ count: count() }).from(volunteering).where(eq(volunteering.userId, userId)),
    db
      .select({
        effectiveState: portfolioPublicationStates.effectiveState,
      })
      .from(portfolioPublicationStates)
      .where(eq(portfolioPublicationStates.subjectId, userId))
      .limit(1),
    listCanonicalProofPackAggregatesForOwner('individual_profile', userId),
  ]);

  const displayName = profileRow[0]?.displayName ?? null;
  const handle = profileRow[0]?.handle ?? null;
  const headline = individualRow[0]?.headline ?? null;
  const bio = individualRow[0]?.bio ?? null;
  const location = individualRow[0]?.location ?? null;
  const timezone = matchingRow[0]?.timezone ?? null;
  const desiredRolesCount = countItems(matchingRow[0]?.desiredRoles);
  const workPreference = matchingRow[0]?.workMode ?? null;
  const engagementType = matchingRow[0]?.engagementType ?? null;
  const contextCount =
    (experienceCountRow[0]?.count ?? 0) +
    (educationCountRow[0]?.count ?? 0) +
    (volunteeringCountRow[0]?.count ?? 0);
  const valuesCount = countItems(individualRow[0]?.values);
  const causesCount = countItems(individualRow[0]?.causes);
  const skillsCount = skillsCountRow[0]?.count ?? 0;
  const canonicalSummary = summarizeCanonicalProofOwnerAggregates(canonicalAggregates);
  const anchoredProofPackCount = canonicalAggregates.filter((aggregate) =>
    hasPrimaryAnchorContext(aggregate.pack)
  ).length;
  const proofCount = anchoredProofPackCount;
  const proofArtifactCount = canonicalSummary.artifactCount;
  const publicProofCount = canonicalAggregates.filter(
    (aggregate) => hasPrimaryAnchorContext(aggregate.pack) && aggregate.publicSafe !== null
  ).length;
  const acceptedVerificationCount = canonicalSummary.verifiedVerificationCount;
  const publicationEffectiveState =
    publicationStateRow[0]?.effectiveState ?? profileRow[0]?.publicPortfolioState ?? null;
  const publishedPortfolio =
    typeof publicationEffectiveState === 'string' &&
    isAccessiblePublicPortfolioState(publicationEffectiveState as any);

  return evaluateIndividualProfileCompletion({
    displayName,
    handle,
    headline,
    bio,
    location,
    timezone,
    desiredRolesCount,
    workPreference,
    engagementType,
    contextCount,
    valuesCount,
    causesCount,
    skillsCount,
    proofCount,
    proofArtifactCount,
    anchoredProofPackCount,
    acceptedVerificationCount,
    publicProofCount,
    publishedPortfolio,
  });
}
