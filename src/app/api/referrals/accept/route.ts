import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth';
import { log } from '@/lib/log';
import { acceptReferral, ReferralServiceError } from '@/services/referral-service';

export const dynamic = 'force-dynamic';

const AcceptReferralSchema = z.object({
  code: z.string().min(4),
});

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const data = AcceptReferralSchema.parse(body);

    const referral = await acceptReferral({ code: data.code, userId: user.id });

    log.info('referral.accepted', {
      referralId: referral.id,
      userId: user.id,
      referrerId: referral.referrerId,
    });

    return NextResponse.json({ referral });
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

    log.error('referral.accept.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json({ error: 'Failed to accept referral' }, { status: 500 });
  }
}
