import { db } from '@/db';
import { notifications, notificationPreferences } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { log } from '@/lib/log';

export type NotificationType =
  | 'match_suggested'
  | 'intro_accepted'
  | 'message_received'
  | 'verification_requested'
  | 'verification_completed'
  | 'assignment_published'
  | 'interview_scheduled'
  | 'contract_signed'
  | 'referral_received'
  | 'referral_accepted'
  | 'referral_signed_up'
  | 'endorsement_received'
  | 'new_match_alert'
  | 'rank_improved'
  | 'followed_org_new_role'
  | 'application_stage_updated'
  | 'expected_timeframe_reminder';

interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  actionUrl?: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, any>;
}

/**
 * Create a notification for a user
 * Checks user preferences before creating
 */
export async function createNotification(params: CreateNotificationParams) {
  try {
    // Check if user has this notification type enabled
    const prefs = await db.query.notificationPreferences.findFirst({
      where: eq(notificationPreferences.userId, params.userId),
    });

    // If no preferences exist, default to enabled
    // If preferences exist, check the specific type
    if (prefs) {
      const prefKey = getPreferenceKey(params.type, 'in-app');
      if (!prefs[prefKey as keyof typeof prefs]) {
        // User has disabled this notification type
        return null;
      }
    }

    // Create notification
    const [notification] = await db
      .insert(notifications)
      .values({
        userId: params.userId,
        type: params.type,
        title: params.title,
        message: params.message,
        actionUrl: params.actionUrl,
        entityType: params.entityType,
        entityId: params.entityId,
        metadata: params.metadata || {},
      })
      .returning();

    log.info('notification.created', {
      notificationId: notification.id,
      userId: params.userId,
      type: params.type,
    });

    return notification;
  } catch (error) {
    log.error('notification.create.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      params,
    });
    return null;
  }
}

/**
 * Get preference key for notification type
 */
function getPreferenceKey(type: NotificationType, channel: 'in-app' | 'email'): string {
  const typeMap: Record<NotificationType, string> = {
    match_suggested: 'MatchSuggested',
    intro_accepted: 'IntroAccepted',
    message_received: 'MessageReceived',
    verification_requested: 'VerificationRequested',
    verification_completed: 'VerificationCompleted',
    assignment_published: 'AssignmentPublished',
    interview_scheduled: 'InterviewScheduled',
    contract_signed: 'ContractSigned',
    referral_received: 'ReferralReceived',
    referral_accepted: 'ReferralAccepted',
    referral_signed_up: 'ReferralSignedUp',
    endorsement_received: 'EndorsementReceived',
    new_match_alert: 'NewMatchAlert',
    rank_improved: 'RankImproved',
    followed_org_new_role: 'FollowedOrgNewRole',
    application_stage_updated: 'ApplicationStageUpdated',
    expected_timeframe_reminder: 'ExpectedTimeframeReminder',
  };

  const prefix = channel === 'in-app' ? 'inApp' : 'email';
  return `${prefix}${typeMap[type]}`;
}

/**
 * Notify user of a new match suggestion
 */
export async function notifyMatchSuggested(
  userId: string,
  matchId: string,
  matchedWithName: string
) {
  return createNotification({
    userId,
    type: 'match_suggested',
    title: 'New Match Found!',
    message: `You've been matched with ${matchedWithName}`,
    actionUrl: `/app/i/matching`,
    entityType: 'match',
    entityId: matchId,
  });
}

/**
 * Notify user that mutual interest was confirmed
 */
export async function notifyIntroAccepted(
  userId: string,
  matchId: string,
  matchedWithName: string
) {
  return createNotification({
    userId,
    type: 'intro_accepted',
    title: 'Intro Accepted!',
    message: `${matchedWithName} is interested in connecting with you`,
    actionUrl: `/app/i/messages`,
    entityType: 'match',
    entityId: matchId,
  });
}

/**
 * Notify user of a new message
 */
export async function notifyMessageReceived(
  userId: string,
  conversationId: string,
  senderName: string,
  messagePreview: string
) {
  return createNotification({
    userId,
    type: 'message_received',
    title: `New message from ${senderName}`,
    message: messagePreview.substring(0, 100),
    actionUrl: `/app/i/messages?conversation=${conversationId}`,
    entityType: 'conversation',
    entityId: conversationId,
  });
}

/**
 * Notify user they've been asked to verify a skill
 */
export async function notifyVerificationRequested(
  userId: string,
  requestId: string,
  requesterName: string,
  skillName: string
) {
  return createNotification({
    userId,
    type: 'verification_requested',
    title: 'Skill Verification Request',
    message: `${requesterName} has asked you to verify their ${skillName} skill`,
    actionUrl: `/app/i/expertise?verificationRequest=${requestId}`,
    entityType: 'verification',
    entityId: requestId,
  });
}

/**
 * Notify user that their skill verification was completed
 */
export async function notifyVerificationCompleted(
  userId: string,
  requestId: string,
  skillName: string,
  approved: boolean
) {
  return createNotification({
    userId,
    type: 'verification_completed',
    title: `Skill Verification ${approved ? 'Approved' : 'Declined'}`,
    message: `Your ${skillName} skill verification has been ${approved ? 'approved' : 'declined'}`,
    actionUrl: `/app/i/expertise`,
    entityType: 'verification',
    entityId: requestId,
    metadata: { approved },
  });
}

/**
 * Notify user of a new assignment that matches their profile
 */
export async function notifyAssignmentPublished(
  userId: string,
  assignmentId: string,
  assignmentTitle: string,
  orgName: string
) {
  return createNotification({
    userId,
    type: 'assignment_published',
    title: 'New Opportunity',
    message: `${orgName} posted: ${assignmentTitle}`,
    actionUrl: `/app/i/matching?assignment=${assignmentId}`,
    entityType: 'assignment',
    entityId: assignmentId,
  });
}

/**
 * Notify user of a scheduled interview
 */
export async function notifyInterviewScheduled(
  userId: string,
  interviewId: string,
  interviewDate: Date,
  orgName: string
) {
  return createNotification({
    userId,
    type: 'interview_scheduled',
    title: 'Interview Scheduled',
    message: `Your interview with ${orgName} is scheduled for ${interviewDate.toLocaleDateString()}`,
    actionUrl: `/app/i/interviews/${interviewId}`,
    entityType: 'interview',
    entityId: interviewId,
    metadata: { interviewDate: interviewDate.toISOString() },
  });
}

/**
 * Notify user of a signed contract
 */
export async function notifyContractSigned(userId: string, contractId: string, orgName: string) {
  return createNotification({
    userId,
    type: 'contract_signed',
    title: 'Contract Signed!',
    message: `Your contract with ${orgName} has been signed`,
    actionUrl: `/app/i/contracts/${contractId}`,
    entityType: 'contract',
    entityId: contractId,
  });
}

/**
 * Notify a user that someone referred them
 */
export async function notifyReferralReceived(
  userId: string,
  referrerName: string,
  referralCode: string,
  referralType: 'platform' | 'assignment'
) {
  return createNotification({
    userId,
    type: 'referral_received',
    title: 'You were referred',
    message: `${referrerName} thinks you'd be a great fit${referralType === 'assignment' ? ' for an assignment' : ''}.`,
    actionUrl: `/app/i/referrals?code=${referralCode}`,
    entityType: 'referral',
    metadata: { referralCode, referralType, referrerName },
  });
}

/**
 * Notify the referrer that their invite was accepted
 */
export async function notifyReferralAccepted(referrerId: string, referredName?: string) {
  return createNotification({
    userId: referrerId,
    type: 'referral_accepted',
    title: 'Referral accepted',
    message: referredName
      ? `${referredName} accepted your referral link`
      : 'Your referral link was accepted',
    actionUrl: '/app/i/referrals',
    entityType: 'referral',
  });
}

/**
 * Notify the referrer that the referred person signed up
 */
export async function notifyReferralSignedUp(referrerId: string, referredName?: string) {
  return createNotification({
    userId: referrerId,
    type: 'referral_signed_up',
    title: 'Referral joined Proofound',
    message: referredName
      ? `${referredName} signed up using your referral`
      : 'Someone signed up using your referral link',
    actionUrl: '/app/i/referrals',
    entityType: 'referral',
  });
}

/**
 * Notify a user that they received an endorsement
 */
export async function notifyEndorsementReceived(
  userId: string,
  endorserName: string,
  message?: string
) {
  return createNotification({
    userId,
    type: 'endorsement_received',
    title: 'New endorsement received',
    message: message ?? `${endorserName} endorsed you on Proofound`,
    actionUrl: '/app/i/verifications',
    entityType: 'endorsement',
    metadata: { endorserName },
  });
}

/**
 * Notify user that their application stage changed
 */
export async function notifyApplicationStageUpdated(
  userId: string,
  assignmentId: string,
  stageLabel: string,
  expectedDecisionDate?: string
) {
  return createNotification({
    userId,
    type: 'application_stage_updated',
    title: 'Application Update',
    message: `Your application moved to: ${stageLabel}`,
    actionUrl: `/app/i/applications?assignment=${assignmentId}`,
    entityType: 'assignment',
    entityId: assignmentId,
    metadata: { stageLabel, expectedDecisionDate },
  });
}

/**
 * Notify user about expected timeframe reminders
 */
export async function notifyExpectedTimeframeReminder(
  userId: string,
  assignmentId: string,
  currentStageLabel: string,
  expectedDecisionDate?: string
) {
  return createNotification({
    userId,
    type: 'expected_timeframe_reminder',
    title: 'Timeline Reminder',
    message: expectedDecisionDate
      ? `Decision expected by ${expectedDecisionDate} for ${currentStageLabel}`
      : `We are following up on your ${currentStageLabel} stage`,
    actionUrl: `/app/i/applications?assignment=${assignmentId}`,
    entityType: 'assignment',
    entityId: assignmentId,
    metadata: { currentStageLabel, expectedDecisionDate },
  });
}

/**
 * Notify a follower that an organization posted a new role
 */
export async function notifyFollowedOrgNewRole(
  userId: string,
  orgSlug: string,
  orgName: string,
  assignmentId: string,
  assignmentTitle: string
) {
  return createNotification({
    userId,
    type: 'followed_org_new_role',
    title: `${orgName} posted a new role`,
    message: assignmentTitle || 'A new opportunity is available',
    actionUrl: `/app/i/opportunities?org=${orgSlug}`,
    entityType: 'assignment',
    entityId: assignmentId,
    metadata: { orgSlug },
  });
}
