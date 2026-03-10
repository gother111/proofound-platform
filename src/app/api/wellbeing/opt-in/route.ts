import { NextRequest, NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { wellbeingOptIns } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { recordZenAuditEvent } from '@/lib/zen/service';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { optedIn, privacyBannerAcknowledged } = await req.json();
    if (typeof optedIn !== 'boolean') {
      return NextResponse.json({ error: 'optedIn must be a boolean' }, { status: 400 });
    }

    const now = new Date();
    const [record] = await db
      .insert(wellbeingOptIns)
      .values({
        userId: user.id,
        optedIn,
        privacyBannerAcknowledged: Boolean(privacyBannerAcknowledged),
        optedInAt: optedIn ? now : null,
        optedOutAt: optedIn ? null : now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: wellbeingOptIns.userId,
        set: {
          optedIn,
          privacyBannerAcknowledged: Boolean(privacyBannerAcknowledged),
          ...(optedIn ? { optedInAt: now } : {}),
          optedOutAt: optedIn ? null : now,
          updatedAt: now,
        },
      })
      .returning();

    await recordZenAuditEvent({
      userId: user.id,
      eventType: 'zen_opt_in_changed',
      routeSource: '/api/wellbeing/opt-in',
      metadata: {
        opted_in: optedIn,
        privacy_banner_acknowledged: Boolean(privacyBannerAcknowledged),
      },
    });

    return NextResponse.json({
      success: true,
      optedIn: record.optedIn,
      privacyBannerAcknowledged: Boolean(record.privacyBannerAcknowledged),
      optedInAt: record.optedInAt?.toISOString() ?? null,
      optedOutAt: record.optedOutAt?.toISOString() ?? null,
    });
  } catch (error) {
    console.error('wellbeing.opt-in.post.failed', error);
    return NextResponse.json(
      { error: 'Failed to update private check-in access' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const record = await db.query.wellbeingOptIns.findFirst({
      where: eq(wellbeingOptIns.userId, user.id),
    });

    return NextResponse.json({
      optedIn: Boolean(record?.optedIn),
      privacyBannerAcknowledged: Boolean(record?.privacyBannerAcknowledged),
      optedInAt: record?.optedInAt?.toISOString() ?? null,
      optedOutAt: record?.optedOutAt?.toISOString() ?? null,
      privacyBoundary:
        'Private check-ins stay private to you and are excluded from matching, ranking, reveal, fairness, and org analytics.',
    });
  } catch (error) {
    console.error('wellbeing.opt-in.get.failed', error);
    return NextResponse.json(
      { error: 'Failed to retrieve private check-in access' },
      { status: 500 }
    );
  }
}
