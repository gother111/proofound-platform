import { db } from '@/db';
import { notifications, notificationPreferences } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { log } from '@/lib/log';
import { enqueuePushForNotification } from '@/lib/notifications/push';

export type NotificationType =
  | 'match_suggested'
  | 'intro_accepted'
  | 'message_received'
  | 'verification_requested'
  | 'verification_completed'
  | 'assignment_published'
  | 'interview_scheduled'
  | 'contract_signed'
  | 'weekly_digest';

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
      if (prefKey && !prefs[prefKey as keyof typeof prefs]) {
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

    // Push delivery is best-effort and must not break in-app notification flow.
    void enqueuePushForNotification({
      notificationId: notification.id,
      userId: params.userId,
      type: params.type,
      title: params.title,
      message: params.message,
      metadata: params.metadata,
    }).catch((error) => {
      log.error('notification.push.enqueue_failed', {
        notificationId: notification.id,
        userId: params.userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
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
function getPreferenceKey(type: NotificationType, channel: 'in-app' | 'email'): string | null {
  const typeMap: Record<Exclude<NotificationType, 'weekly_digest'>, string> = {
    match_suggested: 'MatchSuggested',
    intro_accepted: 'IntroAccepted',
    message_received: 'MessageReceived',
    verification_requested: 'VerificationRequested',
    verification_completed: 'VerificationCompleted',
    assignment_published: 'AssignmentPublished',
    interview_scheduled: 'InterviewScheduled',
    contract_signed: 'ContractSigned',
  };

  if (type === 'weekly_digest') {
    return channel === 'email' ? 'emailWeeklyDigest' : null;
  }

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
    actionUrl: `/app/i/communications?section=messages`,
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
    actionUrl: `/app/i/communications?section=messages&conversation=${conversationId}`,
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
    actionUrl: `/app/i/verifications?verificationRequest=${requestId}`,
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
    actionUrl: `/app/i/verifications`,
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
    title: 'New Assignment Review',
    message: `${orgName} posted an assignment for proof review: ${assignmentTitle}`,
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
    actionUrl: `/app/i/communications?section=interviews&interview=${interviewId}`,
    entityType: 'interview',
    entityId: interviewId,
    metadata: { interviewDate: interviewDate.toISOString() },
  });
}
