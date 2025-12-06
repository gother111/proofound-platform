import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { and, desc, eq, or } from 'drizzle-orm';
import { db } from '@/db';
import { assignments, profiles, referrals } from '@/db/schema';
import { requireAuth } from '@/lib/auth';
import { log } from '@/lib/log';
import {
  cancelReferral,
  getReferralById,
  ReferralServiceError,
  generateReferralCode,
} from '@/services/referral-service';

type ReferralRouteContext = { params: { id: string } };

const UpdateReferralSchema = z.object({
  message: z.string().max(500).optional(),
  expiresAt: z.string().datetime().optional(),
  regenerateCode: z.boolean().optional(),
});

function buildReferralLink(origin: string, code: string) {
  return `${origin}/app/i/referrals?code=${code}`;
}

async function generateUniqueCode() {
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateReferralCode();
    const existing = await db.query.referrals.findFirst({
      where: eq(referrals.referralCode, code),
    });
    if (!existing) return code;
  }
  throw new ReferralServiceError('Could not generate referral code', 500);
}

export async function GET(request: NextRequest, { params }: ReferralRouteContext) {
  const { id } = params;
  try {
    const user = await requireAuth();
    const origin = request.nextUrl.origin;

    const detail = await db
      .select({
        referral: referrals,
        assignmentRole: assignments.role,
        assignmentOrgId: assignments.orgId,
        counterpartName: profiles.displayName,
        counterpartHandle: profiles.handle,
      })
      .from(referrals)
      .leftJoin(assignments, eq(referrals.assignmentId, assignments.id))
      .leftJoin(
        profiles,
        or(eq(referrals.referredUserId, profiles.id), eq(referrals.referrerId, profiles.id))
      )
      .where(
        and(
          eq(referrals.id, id),
          or(eq(referrals.referrerId, user.id), eq(referrals.referredUserId, user.id))
        )
      )
      .orderBy(desc(referrals.createdAt))
      .limit(1);

    if (!detail.length) {
      return NextResponse.json({ error: 'Referral not found' }, { status: 404 });
    }

    const item = detail[0];
    const response = {
      ...item.referral,
      assignmentRole: item.assignmentRole,
      assignmentOrgId: item.assignmentOrgId,
      counterpartName: item.counterpartName || item.counterpartHandle || null,
      referralLink: buildReferralLink(origin, item.referral.referralCode),
    };

    return NextResponse.json({ referral: response });
  } catch (error) {
    log.error('referral.detail.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      id: id,
    });

    return NextResponse.json({ error: 'Failed to load referral' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: ReferralRouteContext) {
  const { id } = params;
  try {
    const user = await requireAuth();
    const body = await request.json();
    const data = UpdateReferralSchema.parse(body);

    const existing = await getReferralById(id, user.id);
    if (existing.referrerId !== user.id) {
      return NextResponse.json({ error: 'Only the referrer can update' }, { status: 403 });
    }

    const updates: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (data.message !== undefined) {
      updates.message = data.message;
    }

    if (data.expiresAt) {
      updates.expiresAt = new Date(data.expiresAt);
    }

    if (data.regenerateCode) {
      updates.referralCode = await generateUniqueCode();
    }

    const [updated] = await db
      .update(referrals)
      .set(updates)
      .where(eq(referrals.id, id))
      .returning();

    const referralLink = buildReferralLink(request.nextUrl.origin, updated.referralCode);

    return NextResponse.json({ referral: updated, referralLink });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid referral update', details: error.errors },
        { status: 400 }
      );
    }

    if (error instanceof ReferralServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    log.error('referral.update.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      id: id,
    });

    return NextResponse.json({ error: 'Failed to update referral' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: ReferralRouteContext) {
  const { id } = params;
  try {
    const user = await requireAuth();
    await cancelReferral(id, user.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof ReferralServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    log.error('referral.cancel.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      id: id,
    });

    return NextResponse.json({ error: 'Failed to cancel referral' }, { status: 500 });
  }
}
