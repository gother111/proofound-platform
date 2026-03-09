import crypto from 'crypto';
import { NextResponse } from 'next/server';
import {
  profiles,
  individualProfiles,
  skills,
  capabilities,
  evidence,
  projects,
  experiences,
  education,
  volunteering,
  impactStories,
  matches,
  matchInterest,
  analyticsEvents,
  proofArtifacts,
  proofPacks,
  proofPackItems,
  submissions,
  submissionArtifacts,
  verificationRecords,
  verificationLogEntries,
} from '@/db/schema';
import { requireApiAuthContext } from '@/lib/auth';
import { log } from '@/lib/log';
import { db } from '@/db';
import { buildExperienceTimeline } from '@/lib/profile/experience-timeline';
import {
  createLifecycleOperation,
  finalizeLifecycleOperation,
  resolveLifecycleTarget,
} from '@/lib/lifecycle/reconciliation';
import {
  createDataPortabilityExport,
  getLatestProfileDeletionRequest,
  updateDataPortabilityExportState,
} from '@/lib/lifecycle/residual';
import { getRows } from '@/lib/db/rows';
import { and, eq, inArray, isNull, sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

function toDateOnlyString(value: unknown): string | null {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const isoDatePrefix = trimmed.match(/^(\d{4}-\d{2}-\d{2})/);
  if (isoDatePrefix) {
    return isoDatePrefix[1];
  }

  const isoMonthOnly = trimmed.match(/^(\d{4}-\d{2})$/);
  if (isoMonthOnly) {
    return `${isoMonthOnly[1]}-01`;
  }

  return null;
}

/**
 * GET /api/user/export
 *
 * Canonical data portability contract: v3.0.0
 */
export async function GET() {
  let exportRecord: { id: string } | null = null;

  try {
    const authContext = await requireApiAuthContext();
    if (!authContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { user } = authContext;
    const [profileStatus] = await db
      .select({
        deletionRequestedAt: profiles.deletionRequestedAt,
        deleted: profiles.deleted,
      })
      .from(profiles)
      .where(eq(profiles.id, user.id))
      .limit(1);
    const deletionRequest = await getLatestProfileDeletionRequest(user.id);

    if (
      profileStatus?.deleted ||
      profileStatus?.deletionRequestedAt ||
      (deletionRequest &&
        ['requested', 'processing', 'blocked_legal_hold', 'deleted'].includes(
          deletionRequest.lifecycleState
        ))
    ) {
      return NextResponse.json(
        {
          error: 'Export unavailable during deletion',
          message: 'Data export is blocked while account deletion is pending or completed.',
        },
        { status: 409 }
      );
    }

    const exportedAt = new Date().toISOString();
    const operation = await createLifecycleOperation({
      operationType: 'export',
      subjectType: 'profile',
      subjectId: user.id,
      requestedBy: user.id,
      visibleStatus: 'processing',
      metadata: {
        exportFormat: 'json',
      },
      targets: [
        { targetType: 'db_record', targetRef: `profiles:${user.id}`, desiredState: 'snapshotted' },
        {
          targetType: 'analytics_snapshot',
          targetRef: `profiles:${user.id}`,
          desiredState: 'snapshotted',
        },
        {
          targetType: 'export_manifest_entry',
          targetRef: `profiles:${user.id}`,
          desiredState: 'generated',
        },
      ],
    });
    exportRecord = await createDataPortabilityExport({
      profileId: user.id,
      requestedBy: user.id,
      lifecycleOperationId: operation.id,
      metadata: {
        exportFormat: 'json',
      },
    });
    await updateDataPortabilityExportState({
      exportId: exportRecord.id,
      toState: 'preparing',
      actorType: 'system',
      trigger: 'export_packaging_started',
      metadata: {
        operationId: operation.id,
      },
    });

    log.info('privacy.export.requested', { userId: user.id });

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
      db.select().from(profiles).where(eq(profiles.id, user.id)).limit(1),
      db.select().from(individualProfiles).where(eq(individualProfiles.userId, user.id)).limit(1),
      db.select().from(skills).where(eq(skills.profileId, user.id)),
      db.select().from(capabilities).where(eq(capabilities.profileId, user.id)),
      db.select().from(evidence).where(eq(evidence.profileId, user.id)),
      db.select().from(projects).where(eq(projects.userId, user.id)),
      db.select().from(experiences).where(eq(experiences.userId, user.id)),
      db.select().from(education).where(eq(education.userId, user.id)),
      db.select().from(volunteering).where(eq(volunteering.userId, user.id)),
      db.select().from(impactStories).where(eq(impactStories.userId, user.id)),
      db.select().from(matches).where(eq(matches.profileId, user.id)),
      db.select().from(matchInterest).where(eq(matchInterest.actorProfileId, user.id)),
      db
        .select({
          id: analyticsEvents.id,
          eventType: analyticsEvents.eventType,
          entityType: analyticsEvents.entityType,
          entityId: analyticsEvents.entityId,
          properties: analyticsEvents.properties,
          sessionId: analyticsEvents.sessionId,
          ipHash: analyticsEvents.ipHash,
          userAgentHash: analyticsEvents.userAgentHash,
          createdAt: analyticsEvents.createdAt,
        })
        .from(analyticsEvents)
        .where(eq(analyticsEvents.userId, user.id)),
      db
        .select()
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
        .select()
        .from(verificationRecords)
        .where(
          and(
            eq(verificationRecords.ownerType, 'individual_profile'),
            eq(verificationRecords.ownerId, user.id)
          )
        ),
      db
        .select()
        .from(submissions)
        .where(
          and(eq(submissions.ownerType, 'individual_profile'), eq(submissions.ownerId, user.id))
        ),
    ]);

    const canonicalProofPackIds = canonicalProofPacks.map((pack) => pack.id);
    const canonicalSubmissionIds = canonicalSubmissions.map((submission) => submission.id);
    const canonicalVerificationRecordIds = canonicalVerificationRecords.map((record) => record.id);

    const [canonicalProofPackItems, canonicalSubmissionArtifacts, canonicalVerificationLogEntries] =
      await Promise.all([
        canonicalProofPackIds.length > 0
          ? db
              .select()
              .from(proofPackItems)
              .where(inArray(proofPackItems.packId, canonicalProofPackIds))
          : Promise.resolve([]),
        canonicalSubmissionIds.length > 0
          ? db
              .select()
              .from(submissionArtifacts)
              .where(inArray(submissionArtifacts.submissionId, canonicalSubmissionIds))
          : Promise.resolve([]),
        canonicalVerificationRecordIds.length > 0
          ? db
              .select()
              .from(verificationLogEntries)
              .where(
                inArray(verificationLogEntries.verificationRecordId, canonicalVerificationRecordIds)
              )
          : Promise.resolve([]),
      ]);

    const individualProfile = individualProfileData[0] || null;
    const uploadedFilesResult = await db.execute(sql`
      SELECT id, upload_kind, original_filename, durable_path, public_path, deleted_at
      FROM uploaded_files
      WHERE owner_id = ${user.id}::uuid
      ORDER BY created_at ASC
    `);
    const uploadedFiles = getRows<any>(uploadedFilesResult as any);
    const omittedFiles = uploadedFiles
      .filter((file) => file.deleted_at)
      .map((file) => ({
        fileId: file.id,
        reason: 'deleted_before_export',
        uploadKind: file.upload_kind,
        originalFilename: file.original_filename,
      }));
    const includedFiles = uploadedFiles
      .filter((file) => !file.deleted_at)
      .map((file) => ({
        fileId: file.id,
        uploadKind: file.upload_kind,
        originalFilename: file.original_filename,
        storagePath: file.durable_path || file.public_path || null,
      }));

    const portability = {
      version: '3.0.0',
      exportedAt,
      profile: {
        headline: individualProfile?.headline || undefined,
        bio: individualProfile?.bio || undefined,
        mission: individualProfile?.mission || undefined,
        vision: individualProfile?.vision || undefined,
        tagline: individualProfile?.tagline || undefined,
        location: individualProfile?.location || undefined,
        values: individualProfile?.values || undefined,
        causes: individualProfile?.causes || undefined,
      },
      skills: skillsData.map((skill) => ({
        skillCode: skill.skillCode || skill.skillId,
        level: skill.level,
        lastUsed: skill.lastUsedAt ? skill.lastUsedAt.toISOString() : null,
        notes: undefined,
      })),
      experiences: experiencesData.map((experience) => {
        const timeline = buildExperienceTimeline({
          startDate: toDateOnlyString((experience as any).startDate),
          endDate: toDateOnlyString((experience as any).endDate),
          duration: experience.duration,
        });

        return {
          type: 'work',
          organization:
            experience.organizationName ||
            experience.orgDescription ||
            'Organization not specified',
          role: experience.title || undefined,
          startDate: timeline.startDate || undefined,
          endDate: timeline.endDate,
          description:
            experience.outcomes ||
            experience.achievements ||
            experience.projects ||
            experience.colleagues ||
            undefined,
          location: undefined,
        };
      }),
      volunteering: volunteeringData.map((entry) => ({
        organization: entry.orgDescription || 'Organization not specified',
        role: entry.title || undefined,
        startDate: undefined,
        endDate: null,
        description: entry.impact || undefined,
        hoursPerWeek: undefined,
      })),
    };

    const legacy = {
      exportDate: exportedAt,
      userId: user.id,
      exportVersion: '3.0.0',
      profile: {
        basic: profileData[0] || null,
        individual: individualProfile,
      },
      skills: {
        skills: skillsData,
        capabilities: capabilitiesData,
        evidence: evidenceData,
        totalSkills: skillsData.length,
        verifiedSkills: capabilitiesData.filter((c) => c.verificationStatus === 'verified').length,
      },
      workHistory: {
        projects: projectsData,
        experiences: experiencesData,
        education: educationData,
        volunteering: volunteeringData,
        impactStories: impactStoriesData,
        totalProjects: projectsData.length,
        totalExperiences: experiencesData.length,
      },
      matches: {
        matches: matchesData,
        interests: matchInterestData,
        totalMatches: matchesData.length,
        totalInterests: matchInterestData.length,
      },
      analytics: {
        events: analyticsData,
        totalEvents: analyticsData.length,
        note: 'All IP addresses and user agents are hashed for privacy (GDPR Article 4(5) - pseudonymization)',
      },
      canonical: {
        proofArtifacts: canonicalProofArtifacts,
        proofPacks: canonicalProofPacks,
        proofPackItems: canonicalProofPackItems,
        submissions: canonicalSubmissions,
        submissionArtifacts: canonicalSubmissionArtifacts,
        verificationRecords: canonicalVerificationRecords,
        verificationLogEntries: canonicalVerificationLogEntries,
      },
    };

    const exportData = {
      ...portability,
      exportDate: exportedAt,
      exportVersion: '3.0.0',
      userId: user.id,
      operationId: operation.id,
      exportId: exportRecord.id,
      manifest: {
        includedFiles,
        omittedFiles,
      },
      legacy,
      _metadata: {
        format: 'JSON',
        encoding: 'UTF-8',
        gdprCompliance: {
          article15: 'Right to Access - Complete data export provided',
          article20: 'Right to Data Portability - Machine-readable JSON format',
        },
      },
    };
    const exportChecksum = crypto
      .createHash('sha256')
      .update(JSON.stringify(exportData))
      .digest('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await resolveLifecycleTarget(operation.id, 'db_record', `profiles:${user.id}`, 'snapshotted');
    await resolveLifecycleTarget(
      operation.id,
      'analytics_snapshot',
      `profiles:${user.id}`,
      'snapshotted'
    );
    await resolveLifecycleTarget(
      operation.id,
      'export_manifest_entry',
      `profiles:${user.id}`,
      omittedFiles.length > 0 ? 'generated_partial' : 'generated'
    );
    await finalizeLifecycleOperation(operation.id, {
      status: omittedFiles.length > 0 ? 'partial' : 'completed',
      visibleStatus: omittedFiles.length > 0 ? 'partial' : 'completed',
      summaryCode: omittedFiles.length > 0 ? 'export_partial' : 'export_ready',
    });
    await updateDataPortabilityExportState({
      exportId: exportRecord.id,
      toState: 'ready',
      actorType: 'system',
      trigger: 'export_ready',
      expiresAt,
      payloadChecksum: exportChecksum,
      metadata: {
        operationId: operation.id,
        manifestStatus: omittedFiles.length > 0 ? 'partial' : 'complete',
        omittedFiles: omittedFiles.length,
      },
    });
    await updateDataPortabilityExportState({
      exportId: exportRecord.id,
      toState: 'downloaded',
      actorType: 'candidate',
      actorId: user.id,
      trigger: 'export_downloaded',
      metadata: {
        operationId: operation.id,
      },
    });

    log.info('privacy.export.completed', {
      userId: user.id,
      dataSize: JSON.stringify(exportData).length,
      categories: {
        skills: skillsData.length,
        projects: projectsData.length,
        matches: matchesData.length,
        analyticsEvents: analyticsData.length,
        uploadedFiles: includedFiles.length,
        omittedFiles: omittedFiles.length,
      },
    });

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="proofound-data-export-${user.id.substring(0, 8)}-${new Date().toISOString().split('T')[0]}.json"`,
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (error) {
    if (exportRecord) {
      await updateDataPortabilityExportState({
        exportId: exportRecord.id,
        toState: 'failed',
        actorType: 'system',
        trigger: 'export_failed',
        failureCode: error instanceof Error ? error.name : 'export_failed',
        metadata: {
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      }).catch((transitionError) => {
        log.error('privacy.export.state_update_failed', {
          exportId: exportRecord?.id,
          error: transitionError instanceof Error ? transitionError.message : 'Unknown error',
        });
      });
    }

    log.error('privacy.export.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      {
        error: 'Failed to generate data export',
        message: 'An error occurred while exporting your data. Please try again later.',
      },
      { status: 500 }
    );
  }
}
