import { and, eq } from 'drizzle-orm';
import { NextRequest } from 'next/server';
import { z } from 'zod';

import { db } from '@/db';
import { assignments, organizationMembers, profiles } from '@/db/schema';
import { requireMobileAuth } from '@/lib/api/mobile/auth';
import { mobileError, mobileSuccess } from '@/lib/api/mobile/response';
import { normalizeAuthorizedOrgRole } from '@/lib/authz';

export const dynamic = 'force-dynamic';

const OrgOnboardingSchema = z.object({
  orgId: z.string().uuid(),
  role: z.string().min(1),
  description: z.string().optional(),
  locationMode: z.enum(['remote', 'onsite', 'hybrid']).optional(),
  valuesRequired: z.array(z.string()).optional(),
  causeTags: z.array(z.string()).optional(),
  mustHaveSkills: z.array(z.any()).optional(),
  niceToHaveSkills: z.array(z.any()).optional(),
});

/**
 * PUT /api/mobile/v1/onboarding/org
 *
 * Minimum viable org-side setup:
 * - profiles.persona = org_member
 * - create a draft assignment for the org (owner/manager only)
 */
export async function PUT(request: NextRequest) {
  try {
    const auth = await requireMobileAuth(request);
    if ('status' in auth) {
      return auth;
    }

    const parsed = OrgOnboardingSchema.safeParse(await request.json());
    if (!parsed.success) {
      return mobileError(
        'validation_error',
        'Invalid onboarding payload',
        400,
        parsed.error.flatten()
      );
    }

    const membership = await db.query.organizationMembers.findFirst({
      where: and(
        eq(organizationMembers.userId, auth.user.id),
        eq(organizationMembers.orgId, parsed.data.orgId),
        eq(organizationMembers.status, 'active')
      ),
      columns: { role: true },
    });

    const membershipRole = normalizeAuthorizedOrgRole(membership?.role);
    if (!membershipRole || !['org_owner', 'org_manager'].includes(membershipRole)) {
      return mobileError('forbidden', 'Only owner/manager can complete org onboarding', 403);
    }

    const now = new Date();
    const [assignment] = await db
      .insert(assignments)
      .values({
        orgId: parsed.data.orgId,
        role: parsed.data.role,
        description: parsed.data.description,
        status: 'draft',
        locationMode: parsed.data.locationMode,
        valuesRequired: parsed.data.valuesRequired,
        causeTags: parsed.data.causeTags,
        mustHaveSkills: parsed.data.mustHaveSkills,
        niceToHaveSkills: parsed.data.niceToHaveSkills,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    await db
      .insert(profiles)
      .values({
        id: auth.user.id,
        persona: 'org_member',
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: profiles.id,
        set: { persona: 'org_member', updatedAt: now },
      });

    return mobileSuccess({ ok: true, assignmentId: assignment.id });
  } catch (error) {
    console.error('[mobile.onboarding.org.put] failed', error);
    return mobileError('internal_error', 'Failed to complete org onboarding', 500);
  }
}
