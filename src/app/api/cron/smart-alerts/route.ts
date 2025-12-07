import { NextRequest, NextResponse } from 'next/server';
import { and, desc, eq, gt, inArray } from 'drizzle-orm';

import { db } from '@/db';
import {
  assignments,
  matchRankHistory,
  matches,
  notificationPreferences,
  notifications,
  organizationFollows,
  organizations,
  profiles,
  savedSearches,
  type NotificationPreference,
  type SavedSearch,
} from '@/db/schema';
import { createNotification, type NotificationType } from '@/lib/notifications';
import { sendSmartAlertEmail } from '@/lib/email';
import { createAdminClient } from '@/lib/supabase/admin';
import { log } from '@/lib/log';

const DEFAULT_THRESHOLD = 0.75;
const LOOKBACK_HOURS = 24;
const RANK_LOOKBACK_DAYS = 14;

type PreferenceCache = Map<string, NotificationPreference | null>;
type ProfileCache = Map<string, { displayName: string | null }>;
type EmailCache = Map<string, string | null>;

const IN_APP_PREF_MAP: Record<NotificationType, keyof NotificationPreference> = {
  match_suggested: 'inAppMatchSuggested',
  intro_accepted: 'inAppIntroAccepted',
  message_received: 'inAppMessageReceived',
  verification_requested: 'inAppVerificationRequested',
  verification_completed: 'inAppVerificationCompleted',
  assignment_published: 'inAppAssignmentPublished',
  interview_scheduled: 'inAppInterviewScheduled',
  contract_signed: 'inAppContractSigned',
  referral_received: 'inAppReferralReceived',
  referral_accepted: 'inAppReferralAccepted',
  referral_signed_up: 'inAppReferralSignedUp',
  endorsement_received: 'inAppEndorsementReceived',
  new_match_alert: 'inAppNewMatchAlert',
  rank_improved: 'inAppRankImproved',
  followed_org_new_role: 'inAppFollowedOrgNewRole',
  application_stage_updated: 'inAppApplicationStageUpdated',
  expected_timeframe_reminder: 'inAppExpectedTimeframeReminder',
};

const EMAIL_PREF_MAP: Record<NotificationType, keyof NotificationPreference> = {
  match_suggested: 'emailMatchSuggested',
  intro_accepted: 'emailIntroAccepted',
  message_received: 'emailMessageReceived',
  verification_requested: 'emailVerificationRequested',
  verification_completed: 'emailVerificationCompleted',
  assignment_published: 'emailAssignmentPublished',
  interview_scheduled: 'emailInterviewScheduled',
  contract_signed: 'emailContractSigned',
  referral_received: 'emailReferralReceived',
  referral_accepted: 'emailReferralAccepted',
  referral_signed_up: 'emailReferralSignedUp',
  endorsement_received: 'emailEndorsementReceived',
  new_match_alert: 'emailNewMatchAlert',
  rank_improved: 'emailRankImproved',
  followed_org_new_role: 'emailFollowedOrgNewRole',
  application_stage_updated: 'emailApplicationStageUpdated',
  expected_timeframe_reminder: 'emailExpectedTimeframeReminder',
};

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const start = Date.now();

  const preferenceCache: PreferenceCache = new Map();
  const profileCache: ProfileCache = new Map();
  const emailCache: EmailCache = new Map();

  const adminClient = safeCreateAdminClient();
  const results = {
    newMatchAlerts: 0,
    rankImproved: 0,
    followedOrgNewRole: 0,
  };

  await processSavedSearchAlerts(preferenceCache, profileCache, emailCache, adminClient, results);
  await processRankImprovements(preferenceCache, profileCache, emailCache, adminClient, results);
  await processFollowedOrgAlerts(preferenceCache, profileCache, emailCache, adminClient, results);

  const durationMs = Date.now() - start;

  log.info('cron.smart_alerts.completed', { ...results, durationMs });

  return NextResponse.json({ ok: true, ...results, durationMs });
}

function safeCreateAdminClient() {
  try {
    return createAdminClient();
  } catch (error) {
    console.warn('Smart Alerts: admin client unavailable; email sending may be skipped.', error);
    return null;
  }
}

async function getPreferences(
  userId: string,
  cache: PreferenceCache
): Promise<NotificationPreference | null> {
  if (cache.has(userId)) return cache.get(userId) ?? null;

  const prefs = await db.query.notificationPreferences.findFirst({
    where: eq(notificationPreferences.userId, userId),
  });

  cache.set(userId, prefs ?? null);
  return prefs ?? null;
}

async function getProfile(userId: string, cache: ProfileCache) {
  if (cache.has(userId)) return cache.get(userId);

  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.id, userId),
    columns: { displayName: true },
  });

  const result = { displayName: profile?.displayName ?? null };
  cache.set(userId, result);
  return result;
}

async function getEmail(
  userId: string,
  cache: EmailCache,
  adminClient: ReturnType<typeof createAdminClient> | null
) {
  if (cache.has(userId)) return cache.get(userId);
  if (!adminClient) {
    cache.set(userId, null);
    return null;
  }

  try {
    const { data, error } = await adminClient.auth.admin.getUserById(userId);
    if (error) {
      console.error('Smart Alerts: failed to fetch user email', { userId, error });
      cache.set(userId, null);
      return null;
    }
    const email = data.user?.email ?? null;
    cache.set(userId, email);
    return email;
  } catch (error) {
    console.error('Smart Alerts: admin email lookup failed', error);
    cache.set(userId, null);
    return null;
  }
}

async function dispatchAlert(options: {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  actionUrl: string;
  entityType?: string;
  entityId?: string;
  contextTag?: string;
  preferenceCache: PreferenceCache;
  profileCache: ProfileCache;
  emailCache: EmailCache;
  adminClient: ReturnType<typeof createAdminClient> | null;
}) {
  const {
    userId,
    type,
    title,
    message,
    actionUrl,
    entityId,
    entityType,
    contextTag,
    preferenceCache,
    profileCache,
    emailCache,
    adminClient,
  } = options;

  const prefs = await getPreferences(userId, preferenceCache);
  const inAppKey = IN_APP_PREF_MAP[type];
  const emailKey = EMAIL_PREF_MAP[type];

  const inAppEnabled = prefs ? (prefs[inAppKey] as boolean) !== false : true;
  const emailEnabled = prefs ? (prefs[emailKey] as boolean) !== false : true;

  // In-app notification (respects per-type preference)
  if (inAppEnabled) {
    await createNotification({
      userId,
      type,
      title,
      message,
      actionUrl,
      entityType,
      entityId,
      metadata: { contextTag },
    });
  }

  // Email notification
  if (emailEnabled) {
    const email = await getEmail(userId, emailCache, adminClient);
    if (email) {
      const profile = await getProfile(userId, profileCache);
      await sendSmartAlertEmail({
        to: email,
        recipientName: profile?.displayName,
        title,
        summary: message,
        ctaUrl: `${process.env.NEXT_PUBLIC_SITE_URL}${actionUrl}`,
        ctaLabel: 'View details',
        contextTag,
      });
    }
  }
}

async function processSavedSearchAlerts(
  preferenceCache: PreferenceCache,
  profileCache: ProfileCache,
  emailCache: EmailCache,
  adminClient: ReturnType<typeof createAdminClient> | null,
  results: { newMatchAlerts: number }
) {
  const activeSearches = await db
    .select()
    .from(savedSearches)
    .where(eq(savedSearches.alertEnabled, true));

  for (const search of activeSearches) {
    const since = search.lastAlertedAt ?? new Date(Date.now() - LOOKBACK_HOURS * 60 * 60 * 1000);

    const rows = await db
      .select({
        matchId: matches.id,
        profileId: matches.profileId,
        score: matches.score,
        assignmentId: assignments.id,
        assignmentRole: assignments.role,
        assignmentStatus: assignments.status,
        assignmentCreatedAt: assignments.createdAt,
        assignmentLocationMode: assignments.locationMode,
        assignmentCountry: assignments.country,
        assignmentCity: assignments.city,
        assignmentCompMin: assignments.compMin,
        assignmentCompMax: assignments.compMax,
        assignmentHoursMin: assignments.hoursMin,
        assignmentHoursMax: assignments.hoursMax,
        assignmentCauseTags: assignments.causeTags,
        assignmentValues: assignments.valuesRequired,
        orgId: assignments.orgId,
        orgName: organizations.displayName,
        orgIndustry: organizations.industry,
      })
      .from(matches)
      .innerJoin(assignments, eq(matches.assignmentId, assignments.id))
      .innerJoin(organizations, eq(assignments.orgId, organizations.id))
      .where(
        and(
          eq(matches.profileId, search.userId),
          gt(assignments.createdAt, since),
          eq(assignments.status, 'active')
        )
      );

    const threshold = Number(search.alertThreshold ?? DEFAULT_THRESHOLD);

    for (const row of rows) {
      const scoreNumber = Number(row.score);
      if (Number.isNaN(scoreNumber) || scoreNumber < threshold) continue;
      if (!passesSavedSearchFilters(search, row)) continue;

      await dispatchAlert({
        userId: search.userId,
        type: 'new_match_alert',
        title: `New match: ${row.assignmentRole} @ ${row.orgName}`,
        message: `${row.assignmentRole} at ${row.orgName} matches your saved search.`,
        actionUrl: `/app/i/matching`,
        entityType: 'assignment',
        entityId: row.assignmentId,
        contextTag: 'Strong match',
        preferenceCache,
        profileCache,
        emailCache,
        adminClient,
      });

      results.newMatchAlerts += 1;
    }

    await db
      .update(savedSearches)
      .set({ lastAlertedAt: new Date(), updatedAt: new Date() })
      .where(eq(savedSearches.id, search.id));
  }
}

function passesSavedSearchFilters(
  search: SavedSearch,
  row: {
    assignmentLocationMode: string | null;
    assignmentCountry: string | null;
    assignmentCity: string | null;
    assignmentCompMin: number | null;
    assignmentCompMax: number | null;
    assignmentHoursMin: number | null;
    assignmentHoursMax: number | null;
    assignmentCauseTags: string[] | null;
    assignmentValues: string[] | null;
    orgIndustry: string | null;
  }
) {
  if (
    search.locationMode &&
    row.assignmentLocationMode &&
    search.locationMode !== row.assignmentLocationMode
  ) {
    return false;
  }

  if (
    search.country &&
    row.assignmentCountry &&
    search.country.toLowerCase() !== row.assignmentCountry.toLowerCase()
  ) {
    return false;
  }

  if (
    search.city &&
    row.assignmentCity &&
    search.city.toLowerCase() !== row.assignmentCity.toLowerCase()
  ) {
    return false;
  }

  if (search.causes?.length) {
    const assignmentCauses = row.assignmentCauseTags ?? [];
    if (!arraysOverlap(assignmentCauses, search.causes)) return false;
  }

  if (search.valuesTags?.length) {
    const assignmentValues = row.assignmentValues ?? [];
    if (!arraysOverlap(assignmentValues, search.valuesTags)) return false;
  }

  if (search.industries?.length && row.orgIndustry) {
    if (!search.industries.includes(row.orgIndustry)) return false;
  }

  if (!withinRange(search.compMin, search.compMax, row.assignmentCompMin, row.assignmentCompMax)) {
    return false;
  }

  if (
    !withinRange(search.hoursMin, search.hoursMax, row.assignmentHoursMin, row.assignmentHoursMax)
  ) {
    return false;
  }

  return true;
}

function withinRange(
  minDesired: number | null,
  maxDesired: number | null,
  minActual: number | null,
  maxActual: number | null
) {
  if (minDesired != null && maxActual != null && maxActual < minDesired) return false;
  if (maxDesired != null && minActual != null && minActual > maxDesired) return false;
  return true;
}

function arraysOverlap(left: string[] = [], right: string[] = []) {
  const set = new Set(left);
  return right.some((item) => set.has(item));
}

async function processRankImprovements(
  preferenceCache: PreferenceCache,
  profileCache: ProfileCache,
  emailCache: EmailCache,
  adminClient: ReturnType<typeof createAdminClient> | null,
  results: { rankImproved: number }
) {
  const cutoff = new Date(Date.now() - RANK_LOOKBACK_DAYS * 24 * 60 * 60 * 1000);

  const recentMatches = await db
    .select({
      matchId: matches.id,
      profileId: matches.profileId,
      assignmentId: matches.assignmentId,
      score: matches.score,
      assignmentRole: assignments.role,
      orgName: organizations.displayName,
    })
    .from(matches)
    .innerJoin(assignments, eq(matches.assignmentId, assignments.id))
    .innerJoin(organizations, eq(assignments.orgId, organizations.id))
    .where(gt(matches.createdAt, cutoff));

  if (recentMatches.length === 0) return;

  const matchIds = recentMatches.map((row) => row.matchId);
  const historyRows =
    matchIds.length === 0
      ? []
      : await db
          .select({
            matchId: matchRankHistory.matchId,
            rank: matchRankHistory.rank,
            recordedAt: matchRankHistory.recordedAt,
          })
          .from(matchRankHistory)
          .where(inArray(matchRankHistory.matchId, matchIds))
          .orderBy(desc(matchRankHistory.recordedAt));

  const lastRankMap = new Map<string, number>();
  for (const row of historyRows) {
    if (!lastRankMap.has(row.matchId)) {
      lastRankMap.set(row.matchId, row.rank);
    }
  }

  const grouped = new Map<string, typeof recentMatches>();
  for (const row of recentMatches) {
    const list = grouped.get(row.assignmentId) ?? [];
    list.push(row);
    grouped.set(row.assignmentId, list);
  }

  const historyInserts: { matchId: string; rank: number }[] = [];

  for (const [, rows] of grouped) {
    const sorted = [...rows].sort((a, b) => Number(b.score) - Number(a.score));

    for (let idx = 0; idx < sorted.length; idx += 1) {
      const row = sorted[idx];
      const currentRank = idx + 1;
      const previousRank = lastRankMap.get(row.matchId);

      if (previousRank && previousRank - currentRank >= 2) {
        await dispatchAlert({
          userId: row.profileId,
          type: 'rank_improved',
          title: `Your rank improved for ${row.assignmentRole}`,
          message: `You're now ranked #${currentRank} for ${row.assignmentRole} at ${row.orgName}.`,
          actionUrl: '/app/i/matching',
          entityType: 'assignment',
          entityId: row.assignmentId,
          contextTag: 'Rank improved',
          preferenceCache,
          profileCache,
          emailCache,
          adminClient,
        });
        results.rankImproved += 1;
      }

      historyInserts.push({ matchId: row.matchId, rank: currentRank });
    }
  }

  if (historyInserts.length) {
    await db.insert(matchRankHistory).values(historyInserts);
  }
}

async function processFollowedOrgAlerts(
  preferenceCache: PreferenceCache,
  profileCache: ProfileCache,
  emailCache: EmailCache,
  adminClient: ReturnType<typeof createAdminClient> | null,
  results: { followedOrgNewRole: number }
) {
  const follows = await db
    .select({
      followId: organizationFollows.id,
      userId: organizationFollows.userId,
      orgId: organizationFollows.orgId,
      createdAt: organizationFollows.createdAt,
      notifyNewRoles: organizationFollows.notifyNewRoles,
      orgName: organizations.displayName,
    })
    .from(organizationFollows)
    .innerJoin(organizations, eq(organizationFollows.orgId, organizations.id))
    .where(eq(organizationFollows.notifyNewRoles, true));

  const lookback = new Date(Date.now() - LOOKBACK_HOURS * 60 * 60 * 1000);

  for (const follow of follows) {
    const since = follow.createdAt && follow.createdAt > lookback ? follow.createdAt : lookback;

    const recentAssignments = await db
      .select({
        assignmentId: assignments.id,
        role: assignments.role,
        createdAt: assignments.createdAt,
      })
      .from(assignments)
      .where(
        and(
          eq(assignments.orgId, follow.orgId),
          gt(assignments.createdAt, since),
          eq(assignments.status, 'active')
        )
      );

    if (recentAssignments.length === 0) continue;

    const assignmentIds = recentAssignments.map((a) => a.assignmentId);
    const existingNotifs = await db
      .select({ entityId: notifications.entityId })
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, follow.userId),
          eq(notifications.type, 'followed_org_new_role'),
          inArray(notifications.entityId, assignmentIds)
        )
      );

    const alreadyNotified = new Set(existingNotifs.map((n) => n.entityId));

    for (const assignment of recentAssignments) {
      if (alreadyNotified.has(assignment.assignmentId)) continue;

      await dispatchAlert({
        userId: follow.userId,
        type: 'followed_org_new_role',
        title: `${follow.orgName} posted a new role`,
        message: `${follow.orgName} just posted "${assignment.role}".`,
        actionUrl: '/app/i/opportunities',
        entityType: 'assignment',
        entityId: assignment.assignmentId,
        contextTag: 'Followed org',
        preferenceCache,
        profileCache,
        emailCache,
        adminClient,
      });

      results.followedOrgNewRole += 1;
    }
  }
}

// Export helpers for unit testing
