import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
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
} from '@/db/schema';
import { requireAuth } from '@/lib/auth';
import { log } from '@/lib/log';
import { db } from '@/db';
import { buildExperienceTimeline } from '@/lib/profile/experience-timeline';

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
  try {
    const user = await requireAuth();
    const exportedAt = new Date().toISOString();

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
    ]);

    const individualProfile = individualProfileData[0] || null;

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
          organization: experience.orgDescription || 'Organization not specified',
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
    };

    const exportData = {
      ...portability,
      exportDate: exportedAt,
      exportVersion: '3.0.0',
      userId: user.id,
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

    log.info('privacy.export.completed', {
      userId: user.id,
      dataSize: JSON.stringify(exportData).length,
      categories: {
        skills: skillsData.length,
        projects: projectsData.length,
        matches: matchesData.length,
        analyticsEvents: analyticsData.length,
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
