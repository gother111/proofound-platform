import { and, eq } from 'drizzle-orm';
import { NextRequest } from 'next/server';
import { z } from 'zod';

import { db } from '@/db';
import { organizationMembers, profiles } from '@/db/schema';
import { requireMobileAuth } from '@/lib/api/mobile/auth';
import { mobileError, mobileSuccess } from '@/lib/api/mobile/response';

export const dynamic = 'force-dynamic';

const SwitchSchema = z.object({
  persona: z.enum(['individual', 'org_member']),
});

/**
 * POST /api/mobile/v1/persona/switch
 *
 * Switch the user's primary persona. Persists to `profiles.persona`.
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireMobileAuth(request);
    if ('status' in auth) {
      return auth;
    }

    const parsed = SwitchSchema.safeParse(await request.json());
    if (!parsed.success) {
      return mobileError(
        'validation_error',
        'Invalid persona switch payload',
        400,
        parsed.error.flatten()
      );
    }

    if (parsed.data.persona === 'org_member') {
      const membership = await db.query.organizationMembers.findFirst({
        where: and(
          eq(organizationMembers.userId, auth.user.id),
          eq(organizationMembers.status, 'active')
        ),
        columns: { orgId: true },
      });

      if (!membership) {
        return mobileError(
          'validation_error',
          'Organization membership required to switch persona',
          400
        );
      }
    }

    const now = new Date();
    await db
      .insert(profiles)
      .values({
        id: auth.user.id,
        persona: parsed.data.persona,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: profiles.id,
        set: {
          persona: parsed.data.persona,
          updatedAt: now,
        },
      });

    return mobileSuccess({ persona: parsed.data.persona });
  } catch (error) {
    console.error('[mobile.persona.switch.post] failed', error);
    return mobileError('internal_error', 'Failed to switch persona', 500);
  }
}
