import { and, eq } from 'drizzle-orm';
import { NextRequest } from 'next/server';
import { z } from 'zod';

import { db } from '@/db';
import { organizationMembers, organizations } from '@/db/schema';
import { requireMobileAuth } from '@/lib/api/mobile/auth';
import { mobileError, mobileSuccess } from '@/lib/api/mobile/response';
import { LEGAL_FORM_VALUES, ORGANIZATION_SIZE_VALUES } from '@/lib/organizations/profile-options';
import { mapIndustryValueToCanonical, resolveIndustryFromInputs } from '@/lib/industry/options';

export const dynamic = 'force-dynamic';

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const UpdateSchema = z.object({
  displayName: z.string().min(1).optional(),
  legalName: z.string().nullable().optional(),
  mission: z.string().nullable().optional(),
  vision: z.string().nullable().optional(),
  website: z.string().nullable().optional(),
  tagline: z.string().nullable().optional(),
  industry: z.string().nullable().optional(),
  industryKey: z.string().nullable().optional(),
  industryLabel: z.string().nullable().optional(),
  organizationSize: z.enum(ORGANIZATION_SIZE_VALUES).nullable().optional(),
  impactArea: z.string().nullable().optional(),
  legalForm: z.enum(LEGAL_FORM_VALUES).nullable().optional(),
  foundedDate: z.string().nullable().optional(),
  values: z.array(z.string()).nullable().optional(),
  causes: z.array(z.string()).nullable().optional(),
});

function isValidIsoDate(value: string) {
  if (!ISO_DATE_REGEX.test(value)) {
    return false;
  }
  const [year, month, day] = value.split('-').map((part) => Number(part));
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    Number.isInteger(year) &&
    Number.isInteger(month) &&
    Number.isInteger(day) &&
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

async function membershipFor(userId: string, orgId: string) {
  return db.query.organizationMembers.findFirst({
    where: and(
      eq(organizationMembers.userId, userId),
      eq(organizationMembers.orgId, orgId),
      eq(organizationMembers.status, 'active')
    ),
    columns: {
      role: true,
    },
  });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const auth = await requireMobileAuth(request);
    if ('status' in auth) {
      return auth;
    }

    const { orgId } = await params;
    const membership = await membershipFor(auth.user.id, orgId);
    if (!membership) {
      return mobileError('forbidden', 'Organization membership required', 403);
    }

    const [organization] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, orgId))
      .limit(1);

    if (!organization) {
      return mobileError('not_found', 'Organization not found', 404);
    }

    return mobileSuccess({ organization, role: membership.role });
  } catch (error) {
    console.error('[mobile.organizations.get] failed', error);
    return mobileError('internal_error', 'Failed to load organization', 500);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const auth = await requireMobileAuth(request);
    if ('status' in auth) {
      return auth;
    }

    const { orgId } = await params;
    const membership = await membershipFor(auth.user.id, orgId);
    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return mobileError('forbidden', 'Only owner/admin can edit organization settings', 403);
    }

    const parsed = UpdateSchema.safeParse(await request.json());
    if (!parsed.success) {
      return mobileError(
        'validation_error',
        'Invalid organization payload',
        400,
        parsed.error.flatten()
      );
    }

    if (
      parsed.data.foundedDate !== undefined &&
      parsed.data.foundedDate !== null &&
      !isValidIsoDate(parsed.data.foundedDate)
    ) {
      return mobileError('validation_error', 'Founded date must be valid YYYY-MM-DD', 400);
    }

    const updateData: Record<string, unknown> = {
      ...parsed.data,
      updatedAt: new Date(),
    };

    if (
      parsed.data.industry !== undefined ||
      parsed.data.industryKey !== undefined ||
      parsed.data.industryLabel !== undefined
    ) {
      if (
        typeof parsed.data.industryKey === 'string' &&
        parsed.data.industryKey.trim().length > 0 &&
        typeof parsed.data.industryLabel === 'string' &&
        parsed.data.industryLabel.trim().length > 0
      ) {
        const mappedLabel = mapIndustryValueToCanonical(parsed.data.industryLabel.trim());
        if (mappedLabel.industryKey !== parsed.data.industryKey.trim()) {
          return mobileError('validation_error', 'Industry key and label do not match', 400);
        }
      }

      const resolvedIndustry = resolveIndustryFromInputs({
        industryKey: parsed.data.industryKey,
        industryLabel: parsed.data.industryLabel,
        legacyIndustry: parsed.data.industry,
      });
      updateData.industry = resolvedIndustry.industryLabel;
      updateData.industryKey = resolvedIndustry.industryKey;
      updateData.industryLabel = resolvedIndustry.industryLabel;
      updateData.industryLegacyText = resolvedIndustry.legacyText;
    }

    const [updated] = await db
      .update(organizations)
      .set(updateData)
      .where(eq(organizations.id, orgId))
      .returning();

    return mobileSuccess({ organization: updated });
  } catch (error) {
    console.error('[mobile.organizations.patch] failed', error);
    return mobileError('internal_error', 'Failed to update organization', 500);
  }
}
