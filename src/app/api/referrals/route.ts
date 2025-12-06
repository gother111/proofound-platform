import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth';
import { log } from '@/lib/log';
import {
  createReferral,
  getReferralsByUser,
  ReferralServiceError,
} from '@/services/referral-service';

export const dynamic = 'force-dynamic';

const CreateReferralSchema = z
  .object({
    referralType: z.enum(['platform', 'assignment']),
    assignmentId: z.string().uuid().optional(),
    referredEmail: z.string().email().optional(),
    referredUserId: z.string().uuid().optional(),
    message: z.string().max(500).optional(),
    expiresAt: z.string().datetime().optional(),
  })
  .superRefine((val, ctx) => {
    if (val.referralType === 'assignment' && !val.assignmentId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'assignmentId is required when referralType is assignment',
        path: ['assignmentId'],
      });
    }
  });

function buildReferralLink(origin: string, code: string) {
  return `${origin}/app/i/referrals?code=${code}`;
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const result = await getReferralsByUser(user.id, { limit, offset });
    const origin = request.nextUrl.origin;

    const mapWithLink = (item: (typeof result.sent)[number]) => ({
      ...item,
      referralLink: buildReferralLink(origin, item.referralCode),
    });

    return NextResponse.json({
      sent: result.sent.map(mapWithLink),
      received: result.received.map(mapWithLink),
      sentHasMore: result.sentHasMore,
      receivedHasMore: result.receivedHasMore,
      nextOffset: result.sentHasMore || result.receivedHasMore ? offset + limit : null,
    });
  } catch (error) {
    log.error('referrals.list.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json({ error: 'Failed to fetch referrals' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const data = CreateReferralSchema.parse(body);

    const referral = await createReferral({
      referrerId: user.id,
      referralType: data.referralType,
      assignmentId: data.assignmentId,
      referredEmail: data.referredEmail,
      referredUserId: data.referredUserId,
      message: data.message,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
    });

    const referralLink = buildReferralLink(request.nextUrl.origin, referral.referralCode);

    log.info('referral.created', {
      referrerId: user.id,
      referralId: referral.id,
      referralType: referral.referralType,
    });

    return NextResponse.json({ referral, referralLink }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid referral payload', details: error.errors },
        { status: 400 }
      );
    }

    if (error instanceof ReferralServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    log.error('referral.create.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json({ error: 'Failed to create referral' }, { status: 500 });
  }
}
