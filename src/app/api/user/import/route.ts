import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import {
  auditLogs,
  experiences,
  individualProfiles,
  proofArtifacts,
  proofPackItems,
  proofPacks,
  skills,
  submissionArtifacts,
  submissions,
  verificationLogEntries,
  verificationRecords,
  volunteering,
} from '@/db/schema';
import { and, eq, inArray } from 'drizzle-orm';
import { z } from 'zod';
import { detectPII } from '@/lib/privacy/pii-detection';
import { normalizeImportRequest } from '@/lib/contracts/data-portability';
import { parseOptionalDate } from '@/lib/datetime/parse-optional-date';
import { buildExperienceTimeline } from '@/lib/profile/experience-timeline';
import { syncCanonicalProofPackState } from '@/lib/proofs/canonical-pack';

function collectPotentialPiiText(payload: {
  profile?: { bio?: string; mission?: string; vision?: string };
  experiences: Array<{
    organization?: string;
    role?: string;
    description?: string;
    location?: string;
  }>;
  volunteering: Array<{ organization?: string; role?: string; description?: string }>;
}): string[] {
  const texts: string[] = [];

  if (payload.profile?.bio) texts.push(payload.profile.bio);
  if (payload.profile?.mission) texts.push(payload.profile.mission);
  if (payload.profile?.vision) texts.push(payload.profile.vision);

  for (const experience of payload.experiences) {
    if (experience.organization) texts.push(experience.organization);
    if (experience.role) texts.push(experience.role);
    if (experience.description) texts.push(experience.description);
    if (experience.location) texts.push(experience.location);
  }

  for (const entry of payload.volunteering) {
    if (entry.organization) texts.push(entry.organization);
    if (entry.role) texts.push(entry.role);
    if (entry.description) texts.push(entry.description);
  }

  return texts;
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    let normalized;
    try {
      normalized = normalizeImportRequest(await request.json(), { requireConsent: true });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          {
            error: 'Invalid data format',
            message: 'The uploaded file does not match the expected format',
            details: error.errors.map((e) => ({
              path: e.path.join('.'),
              message: e.message,
            })),
          },
          { status: 400 }
        );
      }

      if (error instanceof Error && error.message === 'CONSENT_REQUIRED') {
        return NextResponse.json(
          {
            error: 'Consent required',
            message:
              'Please confirm you understand the import will modify your profile data before continuing.',
          },
          { status: 400 }
        );
      }

      if (error instanceof Error && error.message === 'ONLY_OWNER_FULL_PROOF_IMPORT_SUPPORTED') {
        return NextResponse.json(
          {
            error: 'Unsupported proof import scope',
            message: 'Only owner_full proof exports can be re-imported.',
          },
          { status: 400 }
        );
      }

      return NextResponse.json(
        {
          error: 'Invalid data format',
          message: error instanceof Error ? error.message : 'Could not parse import payload',
        },
        { status: 400 }
      );
    }

    const { data, mode, consentAcknowledged } = normalized;

    const piiDetections = collectPotentialPiiText({
      profile: {
        bio: data.profile?.bio,
        mission: data.profile?.mission,
        vision: data.profile?.vision,
      },
      experiences: data.experiences,
      volunteering: data.volunteering,
    })
      .map((text) => detectPII(text))
      .filter((detection) => detection.hasPII);

    if (piiDetections.length > 0 && !consentAcknowledged) {
      return NextResponse.json(
        {
          error: 'PII consent required',
          message:
            'Your import contains personal contact data. Please explicitly acknowledge consent before importing.',
        },
        { status: 400 }
      );
    }

    const importedCounts = {
      profile: 0,
      skills: 0,
      experiences: 0,
      volunteering: 0,
      proofPacks: 0,
      proofArtifacts: 0,
      proofPackItems: 0,
      verificationReferences: 0,
      submissions: 0,
    };
    const syncedPackIds = new Set<string>();

    await db.transaction(async (tx) => {
      if (data.profile && Object.keys(data.profile).length > 0) {
        const [existingIndividualProfile] = await tx
          .select({ userId: individualProfiles.userId })
          .from(individualProfiles)
          .where(eq(individualProfiles.userId, user.id))
          .limit(1);

        const profilePayload = {
          headline: data.profile.headline,
          bio: data.profile.bio,
          mission: data.profile.mission,
          vision: data.profile.vision,
          tagline: data.profile.tagline,
          location: data.profile.location,
          values: data.profile.values as any,
          causes: data.profile.causes,
        };

        if (existingIndividualProfile) {
          await tx
            .update(individualProfiles)
            .set(profilePayload)
            .where(eq(individualProfiles.userId, user.id));
        } else {
          await tx.insert(individualProfiles).values({
            userId: user.id,
            ...profilePayload,
          });
        }

        importedCounts.profile = 1;
      }

      if (mode === 'replace') {
        await tx.delete(skills).where(eq(skills.profileId, user.id));
        await tx.delete(experiences).where(eq(experiences.userId, user.id));
        await tx.delete(volunteering).where(eq(volunteering.userId, user.id));

        const [existingPacks, existingArtifacts, existingSubmissions, existingVerifications] =
          await Promise.all([
            tx
              .select({ id: proofPacks.id })
              .from(proofPacks)
              .where(
                and(eq(proofPacks.ownerType, 'individual_profile'), eq(proofPacks.ownerId, user.id))
              ),
            tx
              .select({ id: proofArtifacts.id })
              .from(proofArtifacts)
              .where(
                and(
                  eq(proofArtifacts.ownerType, 'individual_profile'),
                  eq(proofArtifacts.ownerId, user.id)
                )
              ),
            tx
              .select({ id: submissions.id })
              .from(submissions)
              .where(
                and(
                  eq(submissions.ownerType, 'individual_profile'),
                  eq(submissions.ownerId, user.id)
                )
              ),
            tx
              .select({ id: verificationRecords.id })
              .from(verificationRecords)
              .where(
                and(
                  eq(verificationRecords.ownerType, 'individual_profile'),
                  eq(verificationRecords.ownerId, user.id)
                )
              ),
          ]);

        const existingPackIds = existingPacks.map((row) => row.id);
        const existingSubmissionIds = existingSubmissions.map((row) => row.id);
        const existingVerificationIds = existingVerifications.map((row) => row.id);

        if (existingSubmissionIds.length > 0) {
          await tx
            .delete(submissionArtifacts)
            .where(inArray(submissionArtifacts.submissionId, existingSubmissionIds));
        }
        if (existingPackIds.length > 0) {
          await tx.delete(proofPackItems).where(inArray(proofPackItems.packId, existingPackIds));
        }
        if (existingVerificationIds.length > 0) {
          await tx
            .delete(verificationLogEntries)
            .where(inArray(verificationLogEntries.verificationRecordId, existingVerificationIds));
        }

        await tx
          .delete(submissions)
          .where(
            and(eq(submissions.ownerType, 'individual_profile'), eq(submissions.ownerId, user.id))
          );
        await tx
          .delete(verificationRecords)
          .where(
            and(
              eq(verificationRecords.ownerType, 'individual_profile'),
              eq(verificationRecords.ownerId, user.id)
            )
          );
        await tx
          .delete(proofPacks)
          .where(
            and(eq(proofPacks.ownerType, 'individual_profile'), eq(proofPacks.ownerId, user.id))
          );
        await tx
          .delete(proofArtifacts)
          .where(
            and(
              eq(proofArtifacts.ownerType, 'individual_profile'),
              eq(proofArtifacts.ownerId, user.id)
            )
          );
      }

      for (const skill of data.skills) {
        await tx
          .insert(skills)
          .values({
            profileId: user.id,
            skillId: skill.skillCode,
            skillCode: skill.skillCode,
            level: skill.level,
            monthsExperience: 0,
            lastUsedAt: parseOptionalDate(skill.lastUsed),
          })
          .onConflictDoUpdate({
            target: [skills.profileId, skills.skillId],
            set: {
              skillCode: skill.skillCode,
              level: skill.level,
              lastUsedAt: parseOptionalDate(skill.lastUsed),
              updatedAt: new Date(),
            },
          });
      }
      importedCounts.skills = data.skills.length;

      if (data.experiences.length > 0) {
        await tx.insert(experiences).values(
          data.experiences.map((experience) => {
            const timeline = buildExperienceTimeline({
              startDate: experience.startDate ?? null,
              endDate: experience.endDate ?? null,
              duration:
                experience.startDate && experience.endDate
                  ? `${experience.startDate} - ${experience.endDate}`
                  : experience.startDate || experience.endDate || null,
            });

            return {
              userId: user.id,
              title: experience.role || 'Imported Experience',
              organizationName: experience.organization?.trim() || null,
              orgDescription: 'Organization details not specified',
              duration: timeline.duration,
              startDate: timeline.startDate,
              endDate: timeline.endDate,
              outcomes: experience.description || 'Imported from data portability export',
              projects: 'Imported from data portability export',
              colleagues: 'Imported from data portability export',
              achievements: experience.description || 'Imported from data portability export',
            };
          })
        );
      }
      importedCounts.experiences = data.experiences.length;

      if (data.volunteering.length > 0) {
        await tx.insert(volunteering).values(
          data.volunteering.map((entry) => ({
            userId: user.id,
            title: entry.role || 'Imported Volunteering',
            orgDescription: entry.organization,
            duration:
              entry.startDate && entry.endDate
                ? `${entry.startDate} - ${entry.endDate}`
                : entry.startDate || entry.endDate || 'Duration not specified',
            cause: 'Imported from data portability export',
            impact: entry.description || 'No impact description provided',
            skillsDeployed: 'Not specified',
            personalWhy: 'Imported from data portability export',
          }))
        );
      }
      importedCounts.volunteering = data.volunteering.length;

      const existingPacks = await tx
        .select({
          id: proofPacks.id,
          legacySourceTable: proofPacks.legacySourceTable,
          legacySourceId: proofPacks.legacySourceId,
          portabilityMeta: proofPacks.portabilityMeta,
        })
        .from(proofPacks)
        .where(
          and(eq(proofPacks.ownerType, 'individual_profile'), eq(proofPacks.ownerId, user.id))
        );
      const existingArtifacts = await tx
        .select({
          id: proofArtifacts.id,
          legacySourceTable: proofArtifacts.legacySourceTable,
          legacySourceId: proofArtifacts.legacySourceId,
          legacySourcePath: proofArtifacts.legacySourcePath,
        })
        .from(proofArtifacts)
        .where(
          and(
            eq(proofArtifacts.ownerType, 'individual_profile'),
            eq(proofArtifacts.ownerId, user.id)
          )
        );

      const packIdByKey = new Map<string, string>();
      const packIdByPortabilityHash = new Map<string, string>();
      for (const pack of existingPacks) {
        if (pack.legacySourceTable && pack.legacySourceId) {
          packIdByKey.set(`${pack.legacySourceTable}:${pack.legacySourceId}`, pack.id);
        }
        const portabilityHash =
          pack.portabilityMeta &&
          typeof pack.portabilityMeta === 'object' &&
          typeof (pack.portabilityMeta as Record<string, unknown>).portabilityHash === 'string'
            ? ((pack.portabilityMeta as Record<string, unknown>).portabilityHash as string)
            : null;
        if (portabilityHash) {
          packIdByPortabilityHash.set(portabilityHash, pack.id);
        }
      }

      const artifactIdByKey = new Map<string, string>();
      for (const artifact of existingArtifacts) {
        const key = [
          artifact.legacySourceTable ?? '',
          artifact.legacySourceId ?? '',
          artifact.legacySourcePath ?? '',
        ].join(':');
        if (key !== '::') {
          artifactIdByKey.set(key, artifact.id);
        }
      }

      const importedArtifactIdMap = new Map<string, string>();
      for (const artifact of data.proof.artifacts) {
        const artifactKey = [
          artifact.legacySourceTable ?? '',
          artifact.legacySourceId ?? '',
          artifact.legacySourcePath ?? '',
        ].join(':');
        const resolvedArtifactId =
          artifactIdByKey.get(artifactKey) || (mode === 'merge' ? artifact.id : artifact.id);

        importedArtifactIdMap.set(artifact.id, resolvedArtifactId);

        await tx
          .insert(proofArtifacts)
          .values({
            id: resolvedArtifactId,
            ownerType: 'individual_profile',
            ownerId: user.id,
            subjectType: artifact.subjectType,
            subjectId: artifact.subjectId,
            artifactKind: artifact.artifactKind,
            lifecycleState: 'active',
            title: artifact.title,
            description: artifact.description,
            sourceUrl: artifact.sourceUrl,
            storagePath: artifact.storagePath,
            mimeType: artifact.mimeType,
            issuedAt: parseOptionalDate(artifact.issuedAt),
            expiresAt: parseOptionalDate(artifact.expiresAt),
            visibility: artifact.visibility,
            revealGate: artifact.revealGate,
            metadata: artifact.metadata,
            legacySourceTable: artifact.legacySourceTable,
            legacySourceId: artifact.legacySourceId,
            legacySourcePath: artifact.legacySourcePath,
          })
          .onConflictDoUpdate({
            target: proofArtifacts.id,
            set: {
              ownerType: 'individual_profile',
              ownerId: user.id,
              subjectType: artifact.subjectType,
              subjectId: artifact.subjectId,
              artifactKind: artifact.artifactKind,
              title: artifact.title,
              description: artifact.description,
              sourceUrl: artifact.sourceUrl,
              storagePath: artifact.storagePath,
              mimeType: artifact.mimeType,
              issuedAt: parseOptionalDate(artifact.issuedAt),
              expiresAt: parseOptionalDate(artifact.expiresAt),
              visibility: artifact.visibility,
              revealGate: artifact.revealGate,
              metadata: artifact.metadata,
              legacySourceTable: artifact.legacySourceTable,
              legacySourceId: artifact.legacySourceId,
              legacySourcePath: artifact.legacySourcePath,
              updatedAt: new Date(),
            },
          });
      }
      importedCounts.proofArtifacts = data.proof.artifacts.length;

      const importedPackIdMap = new Map<string, string>();
      for (const pack of data.proof.packs) {
        const portabilityHash =
          typeof pack.portabilityMeta?.portabilityHash === 'string'
            ? pack.portabilityMeta.portabilityHash
            : null;
        const resolvedPackId =
          (pack.legacySourceTable && pack.legacySourceId
            ? packIdByKey.get(`${pack.legacySourceTable}:${pack.legacySourceId}`)
            : null) ||
          (portabilityHash ? packIdByPortabilityHash.get(portabilityHash) : null) ||
          pack.id;

        importedPackIdMap.set(pack.id, resolvedPackId);
        syncedPackIds.add(resolvedPackId);

        await tx
          .insert(proofPacks)
          .values({
            id: resolvedPackId,
            ownerType: 'individual_profile',
            ownerId: user.id,
            packKind: pack.packKind,
            primarySubjectType: pack.primarySubjectType,
            primarySubjectId: pack.primarySubjectId,
            lifecycleState: pack.lifecycleState,
            title: pack.title,
            summary: pack.summary,
            contextJson: pack.contextJson,
            evidenceSummary: pack.evidenceSummary,
            outcomesSummary: pack.outcomesSummary,
            visibility: pack.visibility,
            revealGate: pack.revealGate,
            shareTokenHash: pack.shareTokenHash,
            shareExpiresAt: parseOptionalDate(pack.shareExpiresAt),
            createdBy: user.id,
            verificationStatus: pack.verificationStatus,
            freshnessState: pack.freshnessState,
            freshnessEvaluatedAt: parseOptionalDate(pack.freshnessEvaluatedAt),
            lastVerifiedAt: parseOptionalDate(pack.lastVerifiedAt),
            lastRefreshedAt: parseOptionalDate(pack.lastRefreshedAt),
            publishedAt: parseOptionalDate(pack.publishedAt),
            submittedAt: parseOptionalDate(pack.submittedAt),
            withdrawnAt: parseOptionalDate(pack.withdrawnAt),
            supersededAt: parseOptionalDate(pack.supersededAt),
            archivedAt: parseOptionalDate(pack.archivedAt),
            portabilityMeta: pack.portabilityMeta,
            metadata: pack.metadata,
            legacySourceTable: pack.legacySourceTable,
            legacySourceId: pack.legacySourceId,
          })
          .onConflictDoUpdate({
            target: proofPacks.id,
            set: {
              ownerType: 'individual_profile',
              ownerId: user.id,
              packKind: pack.packKind,
              primarySubjectType: pack.primarySubjectType,
              primarySubjectId: pack.primarySubjectId,
              lifecycleState: pack.lifecycleState,
              title: pack.title,
              summary: pack.summary,
              contextJson: pack.contextJson,
              evidenceSummary: pack.evidenceSummary,
              outcomesSummary: pack.outcomesSummary,
              visibility: pack.visibility,
              revealGate: pack.revealGate,
              shareTokenHash: pack.shareTokenHash,
              shareExpiresAt: parseOptionalDate(pack.shareExpiresAt),
              verificationStatus: pack.verificationStatus,
              freshnessState: pack.freshnessState,
              freshnessEvaluatedAt: parseOptionalDate(pack.freshnessEvaluatedAt),
              lastVerifiedAt: parseOptionalDate(pack.lastVerifiedAt),
              lastRefreshedAt: parseOptionalDate(pack.lastRefreshedAt),
              publishedAt: parseOptionalDate(pack.publishedAt),
              submittedAt: parseOptionalDate(pack.submittedAt),
              withdrawnAt: parseOptionalDate(pack.withdrawnAt),
              supersededAt: parseOptionalDate(pack.supersededAt),
              archivedAt: parseOptionalDate(pack.archivedAt),
              portabilityMeta: pack.portabilityMeta,
              metadata: pack.metadata,
              legacySourceTable: pack.legacySourceTable,
              legacySourceId: pack.legacySourceId,
              updatedAt: new Date(),
            },
          });
      }
      importedCounts.proofPacks = data.proof.packs.length;

      for (const item of data.proof.packItems) {
        const resolvedPackId = importedPackIdMap.get(item.packId);
        const resolvedArtifactId = importedArtifactIdMap.get(item.artifactId);
        if (!resolvedPackId || !resolvedArtifactId) {
          continue;
        }

        await tx
          .insert(proofPackItems)
          .values({
            id: item.id,
            packId: resolvedPackId,
            artifactId: resolvedArtifactId,
            position: item.position,
            includedFields: item.includedFields,
          })
          .onConflictDoUpdate({
            target: proofPackItems.id,
            set: {
              packId: resolvedPackId,
              artifactId: resolvedArtifactId,
              position: item.position,
              includedFields: item.includedFields,
              updatedAt: new Date(),
            },
          });
      }
      importedCounts.proofPackItems = data.proof.packItems.length;

      const importedVerificationIdSet = new Set<string>();
      for (const record of data.proof.verificationReferences) {
        const resolvedArtifactId = record.proofArtifactId
          ? (importedArtifactIdMap.get(record.proofArtifactId) ?? null)
          : null;
        importedVerificationIdSet.add(record.id);

        await tx
          .insert(verificationRecords)
          .values({
            id: record.id,
            ownerType: 'individual_profile',
            ownerId: user.id,
            subjectType: record.subjectType,
            subjectId: record.subjectId,
            proofArtifactId: resolvedArtifactId,
            verificationSlot: record.verificationSlot,
            verificationKind: record.verificationKind,
            status: record.status,
            verifierPrincipalType: record.verifierPrincipalType,
            verifierClass: record.verifierClass,
            verifierProfileId: record.verifierProfileId,
            verifierOrgId: record.verifierOrgId,
            verifierEmailHash: record.verifierEmailHash,
            verifierDomainSnapshot: record.verifierDomainSnapshot,
            integrityStatus: record.integrityStatus,
            integrityReason: record.integrityReason,
            disputeState: record.disputeState,
            badgeSemanticsVersion: record.badgeSemanticsVersion,
            riskSignals: record.riskSignals,
            claimSnapshot: record.claimSnapshot,
            sourceRequestTable: record.sourceRequestTable,
            sourceRequestId: record.sourceRequestId,
            sourceResponseTable: record.sourceResponseTable,
            sourceResponseId: record.sourceResponseId,
            requestedAt: parseOptionalDate(record.requestedAt),
            lastRefreshedAt: parseOptionalDate(record.lastRefreshedAt),
            verifiedAt: parseOptionalDate(record.verifiedAt),
            expiresAt: parseOptionalDate(record.expiresAt),
            supersededAt: parseOptionalDate(record.supersededAt),
            supersededByVerificationId: record.supersededByVerificationId,
            downgradedAt: parseOptionalDate(record.downgradedAt),
            contradictedAt: parseOptionalDate(record.contradictedAt),
            contradictedByVerificationId: record.contradictedByVerificationId,
            disputedAt: parseOptionalDate(record.disputedAt),
            revokedAt: parseOptionalDate(record.revokedAt),
            metadata: record.metadata,
          })
          .onConflictDoUpdate({
            target: verificationRecords.id,
            set: {
              ownerType: 'individual_profile',
              ownerId: user.id,
              subjectType: record.subjectType,
              subjectId: record.subjectId,
              proofArtifactId: resolvedArtifactId,
              verificationSlot: record.verificationSlot,
              verificationKind: record.verificationKind,
              status: record.status,
              verifierPrincipalType: record.verifierPrincipalType,
              verifierClass: record.verifierClass,
              verifierProfileId: record.verifierProfileId,
              verifierOrgId: record.verifierOrgId,
              verifierEmailHash: record.verifierEmailHash,
              verifierDomainSnapshot: record.verifierDomainSnapshot,
              integrityStatus: record.integrityStatus,
              integrityReason: record.integrityReason,
              disputeState: record.disputeState,
              badgeSemanticsVersion: record.badgeSemanticsVersion,
              riskSignals: record.riskSignals,
              claimSnapshot: record.claimSnapshot,
              sourceRequestTable: record.sourceRequestTable,
              sourceRequestId: record.sourceRequestId,
              sourceResponseTable: record.sourceResponseTable,
              sourceResponseId: record.sourceResponseId,
              requestedAt: parseOptionalDate(record.requestedAt),
              lastRefreshedAt: parseOptionalDate(record.lastRefreshedAt),
              verifiedAt: parseOptionalDate(record.verifiedAt),
              expiresAt: parseOptionalDate(record.expiresAt),
              supersededAt: parseOptionalDate(record.supersededAt),
              supersededByVerificationId: record.supersededByVerificationId,
              downgradedAt: parseOptionalDate(record.downgradedAt),
              contradictedAt: parseOptionalDate(record.contradictedAt),
              contradictedByVerificationId: record.contradictedByVerificationId,
              disputedAt: parseOptionalDate(record.disputedAt),
              revokedAt: parseOptionalDate(record.revokedAt),
              metadata: record.metadata,
              updatedAt: new Date(),
            },
          });
      }
      importedCounts.verificationReferences = data.proof.verificationReferences.length;

      for (const entry of data.proof.verificationLogEntries.filter((entry) =>
        importedVerificationIdSet.has(entry.verificationRecordId)
      )) {
        await tx
          .insert(verificationLogEntries)
          .values({
            id: entry.id,
            verificationRecordId: entry.verificationRecordId,
            sequenceNumber: entry.sequenceNumber,
            entryType: entry.entryType,
            fromStatus: entry.fromStatus,
            toStatus: entry.toStatus,
            reasonCode: entry.reasonCode,
            actorType: entry.actorType,
            actorId: entry.actorId,
            relatedContradictionId: entry.relatedContradictionId,
            relatedDisputeId: entry.relatedDisputeId,
            relatedVerificationRecordId: entry.relatedVerificationRecordId,
            recomputeBatchId: entry.recomputeBatchId,
            metadata: entry.metadata,
            occurredAt: parseOptionalDate(entry.occurredAt) ?? new Date(),
          })
          .onConflictDoUpdate({
            target: verificationLogEntries.id,
            set: {
              sequenceNumber: entry.sequenceNumber,
              entryType: entry.entryType,
              fromStatus: entry.fromStatus,
              toStatus: entry.toStatus,
              reasonCode: entry.reasonCode,
              actorType: entry.actorType,
              actorId: entry.actorId,
              relatedContradictionId: entry.relatedContradictionId,
              relatedDisputeId: entry.relatedDisputeId,
              relatedVerificationRecordId: entry.relatedVerificationRecordId,
              recomputeBatchId: entry.recomputeBatchId,
              metadata: entry.metadata,
              occurredAt: parseOptionalDate(entry.occurredAt) ?? new Date(),
            },
          });
      }

      const importedSubmissionIdSet = new Set<string>();
      for (const submission of data.proof.submissions) {
        importedSubmissionIdSet.add(submission.id);
        await tx
          .insert(submissions)
          .values({
            id: submission.id,
            submissionKind: submission.submissionKind,
            status: submission.status,
            ownerType: 'individual_profile',
            ownerId: user.id,
            submittedByUserId: user.id,
            submittedByOrgId: submission.submittedByOrgId,
            assignmentId: submission.assignmentId,
            proofPackId: submission.proofPackId
              ? (importedPackIdMap.get(submission.proofPackId) ?? null)
              : null,
            requestContextType: submission.requestContextType,
            requestContextId: submission.requestContextId,
            matchId: submission.matchId,
            introId: submission.introId,
            applicationId: submission.applicationId,
            legacySourceTable: submission.legacySourceTable,
            legacySourceId: submission.legacySourceId,
            submittedAt: parseOptionalDate(submission.submittedAt) ?? new Date(),
            reviewedAt: parseOptionalDate(submission.reviewedAt),
            withdrawnAt: parseOptionalDate(submission.withdrawnAt),
            supersededAt: parseOptionalDate(submission.supersededAt),
            supersededBySubmissionId: submission.supersededBySubmissionId,
            metadata: submission.metadata,
          })
          .onConflictDoUpdate({
            target: submissions.id,
            set: {
              status: submission.status,
              proofPackId: submission.proofPackId
                ? (importedPackIdMap.get(submission.proofPackId) ?? null)
                : null,
              requestContextType: submission.requestContextType,
              requestContextId: submission.requestContextId,
              matchId: submission.matchId,
              introId: submission.introId,
              applicationId: submission.applicationId,
              legacySourceTable: submission.legacySourceTable,
              legacySourceId: submission.legacySourceId,
              submittedAt: parseOptionalDate(submission.submittedAt) ?? new Date(),
              reviewedAt: parseOptionalDate(submission.reviewedAt),
              withdrawnAt: parseOptionalDate(submission.withdrawnAt),
              supersededAt: parseOptionalDate(submission.supersededAt),
              supersededBySubmissionId: submission.supersededBySubmissionId,
              metadata: submission.metadata,
              updatedAt: new Date(),
            },
          });
      }
      importedCounts.submissions = data.proof.submissions.length;

      for (const item of data.proof.submissionArtifacts.filter((entry) =>
        importedSubmissionIdSet.has(entry.submissionId)
      )) {
        const resolvedArtifactId = importedArtifactIdMap.get(item.artifactId);
        if (!resolvedArtifactId) {
          continue;
        }

        await tx
          .insert(submissionArtifacts)
          .values({
            id: item.id,
            submissionId: item.submissionId,
            artifactId: resolvedArtifactId,
            position: item.position,
            includedFields: item.includedFields,
          })
          .onConflictDoUpdate({
            target: submissionArtifacts.id,
            set: {
              artifactId: resolvedArtifactId,
              position: item.position,
              includedFields: item.includedFields,
            },
          });
      }
    });

    for (const packId of syncedPackIds) {
      await syncCanonicalProofPackState(packId).catch(() => null);
    }

    await db.insert(auditLogs).values({
      actorId: user.id,
      action: 'data_import',
      meta: {
        imported: importedCounts,
        version: data.version,
        mode,
        piiFindings: piiDetections.length,
        timestamp: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Data imported successfully',
      imported: importedCounts,
      mode,
    });
  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json(
      {
        error: 'Import failed',
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
      },
      { status: 500 }
    );
  }
}
