import { NextResponse } from 'next/server';
import { and, eq, inArray, isNull } from 'drizzle-orm';

import { db } from '@/db';
import {
  analyticsEvents,
  capabilities,
  education,
  evidence,
  experiences,
  impactStories,
  individualProfiles,
  matchInterest,
  matches,
  profiles,
  projects,
  proofArtifacts,
  proofPackItems,
  proofPacks,
  submissionArtifacts,
  submissions,
  skills,
  verificationRecords,
  volunteering,
} from '@/db/schema';
import { requireApiAuthContext } from '@/lib/auth';
import { isExportableProofPack } from '@/lib/proofs/pack-anchor';

export const dynamic = 'force-dynamic';

export async function GET() {
  const authContext = await requireApiAuthContext();
  if (!authContext) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { user } = authContext;

  const [
    profileData,
    individualProfileData,
    skillsData,
    capabilitiesData,
    evidenceData,
    projectsData,
    experiencesData,
    educationData,
    volunteeringData,
    impactStoriesData,
    matchesData,
    matchInterestData,
    analyticsData,
    canonicalProofArtifacts,
    canonicalProofPacks,
    canonicalVerificationRecords,
    canonicalSubmissions,
  ] = await Promise.all([
    db.select({ id: profiles.id }).from(profiles).where(eq(profiles.id, user.id)).limit(1),
    db
      .select({ id: individualProfiles.userId })
      .from(individualProfiles)
      .where(eq(individualProfiles.userId, user.id))
      .limit(1),
    db.select({ id: skills.id }).from(skills).where(eq(skills.profileId, user.id)),
    db
      .select({ id: capabilities.id })
      .from(capabilities)
      .where(eq(capabilities.profileId, user.id)),
    db.select({ id: evidence.id }).from(evidence).where(eq(evidence.profileId, user.id)),
    db.select({ id: projects.id }).from(projects).where(eq(projects.userId, user.id)),
    db.select({ id: experiences.id }).from(experiences).where(eq(experiences.userId, user.id)),
    db.select({ id: education.id }).from(education).where(eq(education.userId, user.id)),
    db.select({ id: volunteering.id }).from(volunteering).where(eq(volunteering.userId, user.id)),
    db
      .select({ id: impactStories.id })
      .from(impactStories)
      .where(eq(impactStories.userId, user.id)),
    db.select({ id: matches.id }).from(matches).where(eq(matches.profileId, user.id)),
    db
      .select({ id: matchInterest.id })
      .from(matchInterest)
      .where(eq(matchInterest.actorProfileId, user.id)),
    db
      .select({ id: analyticsEvents.id })
      .from(analyticsEvents)
      .where(eq(analyticsEvents.userId, user.id)),
    db
      .select({ id: proofArtifacts.id })
      .from(proofArtifacts)
      .where(
        and(
          eq(proofArtifacts.ownerType, 'individual_profile'),
          eq(proofArtifacts.ownerId, user.id),
          isNull(proofArtifacts.deletedAt),
          isNull(proofArtifacts.revokedAt)
        )
      ),
    db
      .select()
      .from(proofPacks)
      .where(
        and(
          eq(proofPacks.ownerType, 'individual_profile'),
          eq(proofPacks.ownerId, user.id),
          isNull(proofPacks.deletedAt)
        )
      ),
    db
      .select({ id: verificationRecords.id })
      .from(verificationRecords)
      .where(
        and(
          eq(verificationRecords.ownerType, 'individual_profile'),
          eq(verificationRecords.ownerId, user.id)
        )
      ),
    db
      .select({ id: submissions.id })
      .from(submissions)
      .where(
        and(eq(submissions.ownerType, 'individual_profile'), eq(submissions.ownerId, user.id))
      ),
  ]);

  const exportableProofPackIds = canonicalProofPacks
    .filter(isExportableProofPack)
    .map((pack) => pack.id);
  const canonicalSubmissionIds = canonicalSubmissions.map((submission) => submission.id);

  const [canonicalProofPackItems, canonicalSubmissionArtifacts] = await Promise.all([
    exportableProofPackIds.length > 0
      ? db
          .select({ id: proofPackItems.id })
          .from(proofPackItems)
          .where(inArray(proofPackItems.packId, exportableProofPackIds))
      : Promise.resolve([]),
    canonicalSubmissionIds.length > 0
      ? db
          .select({ id: submissionArtifacts.id })
          .from(submissionArtifacts)
          .where(inArray(submissionArtifacts.submissionId, canonicalSubmissionIds))
      : Promise.resolve([]),
  ]);

  return NextResponse.json(
    {
      counts: {
        profile: profileData.length + individualProfileData.length,
        professional:
          skillsData.length +
          capabilitiesData.length +
          evidenceData.length +
          projectsData.length +
          experiencesData.length +
          educationData.length +
          volunteeringData.length +
          impactStoriesData.length,
        proof:
          exportableProofPackIds.length +
          canonicalProofArtifacts.length +
          canonicalProofPackItems.length +
          canonicalSubmissions.length +
          canonicalSubmissionArtifacts.length +
          canonicalVerificationRecords.length,
        matching: matchesData.length + matchInterestData.length,
        activity: analyticsData.length,
      },
    },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    }
  );
}
