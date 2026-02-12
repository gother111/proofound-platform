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

    const safeQuery = async <T>(
      segment: string,
      run: () => Promise<T>,
      fallback: T
    ): Promise<T> => {
      try {
        return await run();
      } catch (error) {
        log.warn('data.export.partial_query_failed', {
          userId: user.id,
          segment,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        return fallback;
      }
    };

    // Fetch all user data from various tables (best-effort: one failing segment must not fail export)
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
      userConsentsData,
      userIntegrationsData,
      userConversations,
      userMessages,
    ] = await Promise.all([
      // Core profile data
      safeQuery(
        'profiles',
        () =>
          db.query.profiles.findFirst({
            where: eq(profiles.id, user.id),
          }),
        null
      ),
      safeQuery(
        'individual_profiles',
        () =>
          db.query.individualProfiles.findFirst({
            where: eq(individualProfiles.userId, user.id),
          }),
        null
      ),
      safeQuery(
        'matching_profiles',
        () =>
          db.query.matchingProfiles.findFirst({
            where: eq(matchingProfiles.profileId, user.id),
          }),
        null
      ),

      // Skills and capabilities
      safeQuery(
        'skills',
        () =>
          db.query.skills.findMany({
            where: eq(skills.profileId, user.id),
          }),
        []
      ),
      safeQuery(
        'skill_proofs',
        () =>
          db.query.skillProofs.findMany({
            where: eq(skillProofs.profileId, user.id),
          }),
        []
      ),

      // Work and experience
      safeQuery(
        'projects',
        () =>
          db.query.projects.findMany({
            where: eq(projects.userId, user.id),
          }),
        []
      ),
      safeQuery(
        'impact_stories',
        () =>
          db.query.impactStories.findMany({
            where: eq(impactStories.userId, user.id),
          }),
        []
      ),
      safeQuery(
        'experiences',
        () =>
          db.query.experiences.findMany({
            where: eq(experiences.userId, user.id),
          }),
        []
      ),
      safeQuery(
        'education',
        () =>
          db.query.education.findMany({
            where: eq(education.userId, user.id),
          }),
        []
      ),
      safeQuery(
        'volunteering',
        () =>
          db.query.volunteering.findMany({
            where: eq(volunteering.userId, user.id),
          }),
        []
      ),

      // Preferences and matching
      safeQuery(
        'profile_benefits_prefs',
        () =>
          db.query.profileBenefitsPrefs.findMany({
            where: eq(profileBenefitsPrefs.profileId, user.id),
          }),
        []
      ),
      safeQuery(
        'matches',
        () =>
          db.query.matches.findMany({
            where: eq(matches.profileId, user.id),
          }),
        []
      ),
      safeQuery(
        'match_interest',
        () =>
          db.query.matchInterest.findMany({
            where: eq(matchInterest.actorProfileId, user.id),
          }),
        []
      ),

      // Contracts
      safeQuery(
        'contracts',
        () =>
          db.query.contracts.findMany({
            where: eq(contracts.userId, user.id),
          }),
        []
      ),

      // Analytics and tracking
      safeQuery(
        'analytics_events',
        () =>
          db.query.analyticsEvents.findMany({
            where: eq(analyticsEvents.userId, user.id),
          }),
        []
      ),

      // Wellbeing
      safeQuery(
        'wellbeing_checkins',
        () =>
          db.query.wellbeingCheckins.findMany({
            where: eq(wellbeingCheckins.userId, user.id),
          }),
        []
      ),
      safeQuery(
        'wellbeing_reflections',
        () =>
          db.query.wellbeingReflections.findMany({
            where: eq(wellbeingReflections.userId, user.id),
          }),
        []
      ),
      safeQuery(
        'wellbeing_opt_ins',
        () =>
          db.query.wellbeingOptIns.findMany({
            where: eq(wellbeingOptIns.userId, user.id),
          }),
        []
      ),

      // Notifications and preferences
      safeQuery(
        'notifications',
        () =>
          db.query.notifications.findMany({
            where: eq(notifications.userId, user.id),
          }),
        []
      ),
      safeQuery(
        'notification_preferences',
        () =>
          db.query.notificationPreferences.findMany({
            where: eq(notificationPreferences.userId, user.id),
          }),
        []
      ),

      // Consents and integrations
      safeQuery(
        'user_consents',
        () =>
          db.query.userConsents.findMany({
            where: eq(userConsents.profileId, user.id),
          }),
        []
      ),
      safeQuery(
        'user_integrations',
        () =>
          db.query.userIntegrations.findMany({
            where: eq(userIntegrations.userId, user.id),
          }),
        []
      ),

      // Communications
      safeQuery(
        'conversations',
        () =>
          db.query.conversations.findMany({
            where: or(
              eq(conversations.participantOneId, user.id),
              eq(conversations.participantTwoId, user.id)
            ),
          }),
        []
      ),
      safeQuery(
        'messages',
        () =>
          db.query.messages.findMany({
            where: eq(messages.senderId, user.id),
          }),
        []
      ),
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
        consents: userConsentsData,
        integrations: userIntegrationsData,
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
