import { NextResponse } from 'next/server';

import { eq } from 'drizzle-orm';

import { db } from '@/db';
import { experiences, profiles } from '@/db/schema';
import { requireApiAuthContext } from '@/lib/auth';
import { log } from '@/lib/log';

export const dynamic = 'force-dynamic';

/**
 * GET /api/profile
 *
 * Backward-compatible profile read surface used by smoke flows.
 */
export async function GET() {
  try {
    const authContext = await requireApiAuthContext();
    if (!authContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [profileRow, experienceRows] = await Promise.all([
      db
        .select({
          displayName: profiles.displayName,
        })
        .from(profiles)
        .where(eq(profiles.id, authContext.user.id))
        .limit(1),
      db
        .select({
          id: experiences.id,
          title: experiences.title,
        })
        .from(experiences)
        .where(eq(experiences.userId, authContext.user.id)),
    ]);

    return NextResponse.json({
      displayName: profileRow[0]?.displayName ?? authContext.user.displayName ?? null,
      experiences: experienceRows,
    });
  } catch (error) {
    log.error('profile.payload.fetch_failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}
