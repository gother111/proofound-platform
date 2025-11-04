import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/db';
import {
  profiles,
  individualProfiles,
  matchingProfiles,
  skills,
  skillProofs,
  projects,
  impactStories,
  experiences,
  education,
  volunteering,
  profileBenefitsPrefs,
  matches,
  matchInterest,
  contracts,
  analyticsEvents,
  wellbeingCheckins,
  wellbeingReflections,
  wellbeingOptIns,
  notifications,
  notificationPreferences,
  userConsents,
  userIntegrations,
  conversations,
  messages,
} from '@/db/schema';
import { eq, or } from 'drizzle-orm';
import { log } from '@/lib/log';

export const dynamic = 'force-dynamic';

/**
 * GET /api/data-export
 *
 * Exports all user data for GDPR compliance.
 * Returns a comprehensive JSON file containing all user-related data.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();

    log.info('data.export.started', {
      userId: user.id,
    });

    // Fetch all user data from various tables
    const [
      userProfile,
      individualProfile,
      matchingProfile,
      userSkills,
      userSkillProofs,
      userProjects,
      userImpactStories,
      userExperiences,
      userEducation,
      userVolunteering,
      userBenefitsPrefs,
      userMatches,
      userMatchInterests,
      userContracts,
      userAnalyticsEvents,
      userWellbeingCheckins,
      userWellbeingReflections,
      userWellbeingOptIns,
      userNotifications,
      userNotificationPrefs,
      userConsents,
      userIntegrations,
      userConversations,
      userMessages,
    ] = await Promise.all([
      // Core profile data
      db.query.profiles.findFirst({
        where: eq(profiles.id, user.id),
      }),
      db.query.individualProfiles.findFirst({
        where: eq(individualProfiles.profileId, user.id),
      }),
      db.query.matchingProfiles.findFirst({
        where: eq(matchingProfiles.profileId, user.id),
      }),

      // Skills and capabilities
      db.query.skills.findMany({
        where: eq(skills.profileId, user.id),
      }),
      db.query.skillProofs.findMany({
        where: eq(skillProofs.profileId, user.id),
      }),

      // Work and experience
      db.query.projects.findMany({
        where: eq(projects.profileId, user.id),
      }),
      db.query.impactStories.findMany({
        where: eq(impactStories.profileId, user.id),
      }),
      db.query.experiences.findMany({
        where: eq(experiences.profileId, user.id),
      }),
      db.query.education.findMany({
        where: eq(education.profileId, user.id),
      }),
      db.query.volunteering.findMany({
        where: eq(volunteering.profileId, user.id),
      }),

      // Preferences and matching
      db.query.profileBenefitsPrefs.findMany({
        where: eq(profileBenefitsPrefs.profileId, user.id),
      }),
      db.query.matches.findMany({
        where: eq(matches.profileId, user.id),
      }),
      db.query.matchInterest.findMany({
        where: eq(matchInterest.profileId, user.id),
      }),

      // Contracts
      db.query.contracts.findMany({
        where: eq(contracts.userId, user.id),
      }),

      // Analytics and tracking
      db.query.analyticsEvents.findMany({
        where: eq(analyticsEvents.userId, user.id),
      }),

      // Wellbeing
      db.query.wellbeingCheckins.findMany({
        where: eq(wellbeingCheckins.userId, user.id),
      }),
      db.query.wellbeingReflections.findMany({
        where: eq(wellbeingReflections.userId, user.id),
      }),
      db.query.wellbeingOptIns.findMany({
        where: eq(wellbeingOptIns.userId, user.id),
      }),

      // Notifications and preferences
      db.query.notifications.findMany({
        where: eq(notifications.userId, user.id),
      }),
      db.query.notificationPreferences.findMany({
        where: eq(notificationPreferences.userId, user.id),
      }),

      // Consents and integrations
      db.query.userConsents.findMany({
        where: eq(userConsents.userId, user.id),
      }),
      db.query.userIntegrations.findMany({
        where: eq(userIntegrations.userId, user.id),
      }),

      // Communications
      db.query.conversations.findMany({
        where: or(
          eq(conversations.user1Id, user.id),
          eq(conversations.user2Id, user.id)
        ),
      }),
      db.query.messages.findMany({
        where: eq(messages.senderId, user.id),
      }),
    ]);

    // Compile all data into a structured export
    const exportData = {
      exportedAt: new Date().toISOString(),
      userId: user.id,
      profile: {
        core: userProfile,
        individual: individualProfile,
        matching: matchingProfile,
      },
      skills: {
        skills: userSkills,
        proofs: userSkillProofs,
      },
      workExperience: {
        projects: userProjects,
        impactStories: userImpactStories,
        experiences: userExperiences,
        education: userEducation,
        volunteering: userVolunteering,
      },
      matching: {
        benefitsPreferences: userBenefitsPrefs,
        matches: userMatches,
        interests: userMatchInterests,
      },
      contracts: userContracts,
      analytics: {
        events: userAnalyticsEvents,
      },
      wellbeing: {
        checkins: userWellbeingCheckins,
        reflections: userWellbeingReflections,
        optIns: userWellbeingOptIns,
      },
      communications: {
        conversations: userConversations,
        messages: userMessages,
      },
      settings: {
        notifications: userNotifications,
        notificationPreferences: userNotificationPrefs,
        consents: userConsents,
        integrations: userIntegrations,
      },
      metadata: {
        version: '1.0',
        dataProtectionNotice:
          'This export contains all personal data associated with your account. Please keep this file secure.',
        rightsNotice:
          'You have the right to request deletion of this data at any time by contacting support.',
      },
    };

    log.info('data.export.completed', {
      userId: user.id,
      recordCount: {
        skills: userSkills.length,
        projects: userProjects.length,
        matches: userMatches.length,
        contracts: userContracts.length,
        events: userAnalyticsEvents.length,
      },
    });

    // Return as downloadable JSON file
    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="proofound-data-export-${user.id}-${new Date().toISOString().split('T')[0]}.json"`,
      },
    });
  } catch (error) {
    log.error('data.export.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json(
      {
        error: 'Failed to export data',
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
      },
      { status: 500 }
    );
  }
}
