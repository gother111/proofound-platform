import { db } from '@/db';
import {
  assignments,
  profiles,
  referrals,
  referralCredits,
  type Referral,
  type ReferralCredit,
} from '@/db/schema';
import { and, desc, eq, isNull, or } from 'drizzle-orm';
import { log } from '@/lib/log';
import {
  notifyReferralAccepted,
  notifyReferralReceived,
  notifyReferralSignedUp,
} from '@/lib/notifications';

const REFERRAL_EXPIRY_DAYS = 45;

export class ReferralServiceError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

const defaultExpiry = () => new Date(Date.now() + REFERRAL_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

/**
 * Generate a short, shareable referral code
 */
export function generateReferralCode() {
  return crypto.randomUUID().replace(/-/g, '').slice(0, 12);
}

async function generateUniqueReferralCode() {
  // Try a few times before giving up
  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = generateReferralCode();
    const existing = await db.query.referrals.findFirst({
      where: eq(referrals.referralCode, candidate),
    });
    if (!existing) return candidate;
  }
  throw new ReferralServiceError('Unable to generate unique referral code', 500);
}

type CreateReferralInput = {
  referrerId: string;
  referralType: 'platform' | 'assignment';
  assignmentId?: string;
  referredEmail?: string;
  referredUserId?: string;
  message?: string;
  expiresAt?: Date;
};

type ReferralListItem = Referral & {
  assignmentRole?: string | null;
  assignmentOrgId?: string | null;
  counterpartName?: string | null;
};

export type ReferralListResponse = {
  sent: ReferralListItem[];
  received: ReferralListItem[];
  sentHasMore: boolean;
  receivedHasMore: boolean;
};

/**
 * Create a referral record and notify the referred user if already on-platform
 */
export async function createReferral(input: CreateReferralInput) {
  if (input.referralType === 'assignment' && !input.assignmentId) {
    throw new ReferralServiceError('assignmentId is required for assignment referrals', 400);
  }

  const referralCode = await generateUniqueReferralCode();

  const expiresAt = input.expiresAt ?? defaultExpiry();

  const [referral] = await db
    .insert(referrals)
    .values({
      referrerId: input.referrerId,
      referralType: input.referralType,
      assignmentId: input.assignmentId,
      referralCode,
      referredEmail: input.referredEmail,
      referredUserId: input.referredUserId,
      message: input.message,
      expiresAt,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  // If the referred user already has an account, send them a notification
  if (input.referredUserId) {
    const referrerProfile = await db.query.profiles.findFirst({
      columns: { displayName: true, handle: true },
      where: eq(profiles.id, input.referrerId),
    });

    const referrerName = referrerProfile?.displayName || referrerProfile?.handle || 'A colleague';
    await notifyReferralReceived(
      input.referredUserId,
      referrerName,
      referral.referralCode,
      input.referralType
    );
  }

  return referral;
}

/**
 * Fetch sent and received referrals for a user with pagination
 */
export async function getReferralsByUser(
  userId: string,
  options: { limit?: number; offset?: number } = {}
): Promise<ReferralListResponse> {
  const limit = Math.min(options.limit ?? 20, 50);
  const offset = options.offset ?? 0;

  const sentRows = await db
    .select({
      referral: referrals,
      assignmentRole: assignments.role,
      assignmentOrgId: assignments.orgId,
      counterpartName: profiles.displayName,
      counterpartHandle: profiles.handle,
    })
    .from(referrals)
    .leftJoin(assignments, eq(referrals.assignmentId, assignments.id))
    .leftJoin(profiles, eq(referrals.referredUserId, profiles.id))
    .where(eq(referrals.referrerId, userId))
    .orderBy(desc(referrals.createdAt))
    .limit(limit + 1)
    .offset(offset);

  const receivedRows = await db
    .select({
      referral: referrals,
      assignmentRole: assignments.role,
      assignmentOrgId: assignments.orgId,
      counterpartName: profiles.displayName,
      counterpartHandle: profiles.handle,
    })
    .from(referrals)
    .leftJoin(assignments, eq(referrals.assignmentId, assignments.id))
    .leftJoin(profiles, eq(referrals.referrerId, profiles.id))
    .where(eq(referrals.referredUserId, userId))
    .orderBy(desc(referrals.createdAt))
    .limit(limit + 1)
    .offset(offset);

  const mapRow = (row: (typeof sentRows)[number]): ReferralListItem => ({
    ...row.referral,
    assignmentRole: row.assignmentRole,
    assignmentOrgId: row.assignmentOrgId,
    counterpartName: row.counterpartName || row.counterpartHandle || null,
  });

  const sentHasMore = sentRows.length > limit;
  const receivedHasMore = receivedRows.length > limit;

  return {
    sent: (sentHasMore ? sentRows.slice(0, limit) : sentRows).map(mapRow),
    received: (receivedHasMore ? receivedRows.slice(0, limit) : receivedRows).map(mapRow),
    sentHasMore,
    receivedHasMore,
  };
}

/**
 * Get a single referral if the user participates in it
 */
export async function getReferralById(id: string, userId: string) {
  const referral = await db.query.referrals.findFirst({
    where: and(
      eq(referrals.id, id),
      or(eq(referrals.referrerId, userId), eq(referrals.referredUserId, userId))
    ),
  });

  if (!referral) {
    throw new ReferralServiceError('Referral not found', 404);
  }

  return referral;
}

/**
 * Cancel (expire) a referral
 */
export async function cancelReferral(referralId: string, userId: string) {
  const referral = await db.query.referrals.findFirst({
    where: and(eq(referrals.id, referralId), eq(referrals.referrerId, userId)),
  });

  if (!referral) {
    throw new ReferralServiceError('Referral not found or not owned by user', 404);
  }

  const [updated] = await db
    .update(referrals)
    .set({
      status: 'expired',
      updatedAt: new Date(),
    })
    .where(eq(referrals.id, referralId))
    .returning();

  return updated;
}

/**
 * Accept a referral code for the current user
 */
export async function acceptReferral(params: { code: string; userId: string }) {
  const referral = await db.query.referrals.findFirst({
    where: eq(referrals.referralCode, params.code),
  });

  if (!referral) {
    throw new ReferralServiceError('Referral code is invalid', 404);
  }

  if (referral.referrerId === params.userId) {
    throw new ReferralServiceError('You cannot accept your own referral', 400);
  }

  if (referral.expiresAt && referral.expiresAt < new Date()) {
    await db
      .update(referrals)
      .set({ status: 'expired', updatedAt: new Date() })
      .where(eq(referrals.id, referral.id));
    throw new ReferralServiceError('Referral has expired', 410);
  }

  if (referral.referredUserId && referral.referredUserId !== params.userId) {
    throw new ReferralServiceError('Referral already linked to another user', 400);
  }

  const [updated] = await db
    .update(referrals)
    .set({
      referredUserId: referral.referredUserId ?? params.userId,
      status: 'signed_up',
      updatedAt: new Date(),
    })
    .where(eq(referrals.id, referral.id))
    .returning();

  // Notify referrer that someone accepted/signed up
  try {
    const referredProfile = await db.query.profiles.findFirst({
      columns: { displayName: true, handle: true },
      where: eq(profiles.id, params.userId),
    });
    const referredName = referredProfile?.displayName || referredProfile?.handle || undefined;
    await notifyReferralAccepted(referral.referrerId, referredName);
    await notifyReferralSignedUp(referral.referrerId, referredName);
  } catch (error) {
    log.warn('referral.accept.notification_failed', {
      error: error instanceof Error ? error.message : 'unknown',
      referralId: referral.id,
    });
  }

  // Record a pending credit for signup (non-monetary)
  await createReferralCredit({
    referralId: referral.id,
    referrerId: referral.referrerId,
    creditType: 'signup_bonus',
    amount: 1,
  });

  return updated;
}

/**
 * Link referrals by email during signup
 */
export async function updateReferralOnSignup(params: { userId: string; email?: string }) {
  if (!params.email) return null;

  const matchingReferral = await db.query.referrals.findFirst({
    where: and(
      eq(referrals.referredEmail, params.email),
      or(eq(referrals.status, 'pending'), eq(referrals.status, 'signed_up')),
      isNull(referrals.referredUserId)
    ),
  });

  if (!matchingReferral) return null;

  const [updated] = await db
    .update(referrals)
    .set({
      referredUserId: params.userId,
      status: 'signed_up',
      updatedAt: new Date(),
    })
    .where(eq(referrals.id, matchingReferral.id))
    .returning();

  await createReferralCredit({
    referralId: updated.id,
    referrerId: updated.referrerId,
    creditType: 'signup_bonus',
    amount: 1,
  });

  try {
    const referredProfile = await db.query.profiles.findFirst({
      columns: { displayName: true, handle: true },
      where: eq(profiles.id, params.userId),
    });
    const referredName = referredProfile?.displayName || referredProfile?.handle || undefined;
    await notifyReferralSignedUp(updated.referrerId, referredName);
  } catch (error) {
    log.warn('referral.signup.notification_failed', {
      error: error instanceof Error ? error.message : 'unknown',
      referralId: matchingReferral.id,
    });
  }

  return updated;
}

async function createReferralCredit(input: {
  referrerId: string;
  referralId: string;
  creditType: ReferralCredit['creditType'];
  amount: number;
}) {
  try {
    await db.insert(referralCredits).values({
      referrerId: input.referrerId,
      referralId: input.referralId,
      creditType: input.creditType,
      amount: String(input.amount),
      status: 'pending',
      createdAt: new Date(),
    });
  } catch (error) {
    // Ignore duplicate credit attempts
    log.warn('referral.credit.create_failed', {
      error: error instanceof Error ? error.message : 'unknown',
      referralId: input.referralId,
      creditType: input.creditType,
    });
  }
}
