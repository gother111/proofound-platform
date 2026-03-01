import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuthContext } from '@/lib/auth';
import { db } from '@/db';
import { organizations, organizationMembers } from '@/db/schema';
import { and, eq } from 'drizzle-orm';
import { normalizeOrganizationWebsite } from '@/lib/organizations/normalizeWebsite';
import { LEGAL_FORM_VALUES, ORGANIZATION_SIZE_VALUES } from '@/lib/organizations/profile-options';
import { mapIndustryValueToCanonical, resolveIndustryFromInputs } from '@/lib/industry/options';
import { normalizeOrganizationValues } from '@/lib/organizations/normalizeValues';
import {
  normalizeOrganizationCauses,
  normalizeOrganizationPurposeLinks,
  pruneOrganizationPurposeLinks,
} from '@/lib/organizations/normalizePurposeLinks';
import {
  hasRequiredPurposeLinks,
  type PurposeLinksShape,
} from '@/lib/purpose/normalizePurposeLinks';

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const ORGANIZATION_SIZE_SET = new Set<string>(ORGANIZATION_SIZE_VALUES);
const LEGAL_FORM_SET = new Set<string>(LEGAL_FORM_VALUES);

function isValidIsoDate(value: string): boolean {
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

function normalizeCauses(causes: unknown): string[] {
  return normalizeOrganizationCauses(causes);
}

function parseValuesPayload(values: unknown): { value?: string[] | null; error?: string } {
  if (values === undefined) {
    return {};
  }

  if (values === null) {
    return { value: null };
  }

  if (!Array.isArray(values)) {
    return { error: 'Values must be an array of non-empty strings or null' };
  }

  if (values.length > 5) {
    return { error: 'Maximum of 5 values allowed' };
  }

  const normalized: string[] = [];
  const seen = new Set<string>();

  for (const value of values) {
    if (typeof value !== 'string' || !value.trim()) {
      return { error: 'Values must contain non-empty strings only' };
    }

    const trimmed = value.trim();
    if (seen.has(trimmed)) {
      continue;
    }

    seen.add(trimmed);
    normalized.push(trimmed);
  }

  return { value: normalized };
}

function parsePurposeLinksPayload(
  links: unknown,
  fieldName: 'missionLinks' | 'visionLinks'
): { value?: PurposeLinksShape | null; error?: string } {
  if (links === undefined) {
    return {};
  }

  if (links === null) {
    return { value: { values: [], causes: [] } };
  }

  if (!links || typeof links !== 'object') {
    return {
      error: `${fieldName} must be an object with values and causes arrays or null`,
    };
  }

  const normalized = normalizeOrganizationPurposeLinks(links);
  const raw = links as { values?: unknown[]; causes?: unknown[] };

  if (raw.values !== undefined && !Array.isArray(raw.values)) {
    return { error: `${fieldName}.values must be an array of non-empty strings` };
  }

  if (raw.causes !== undefined && !Array.isArray(raw.causes)) {
    return { error: `${fieldName}.causes must be an array of non-empty strings` };
  }

  const hasInvalidValues = Array.isArray(raw.values)
    ? raw.values.some((value) => typeof value !== 'string' || !value.trim())
    : false;
  if (hasInvalidValues) {
    return { error: `${fieldName}.values must contain non-empty strings only` };
  }

  const hasInvalidCauses = Array.isArray(raw.causes)
    ? raw.causes.some((cause) => typeof cause !== 'string' || !cause.trim())
    : false;
  if (hasInvalidCauses) {
    return { error: `${fieldName}.causes must contain non-empty strings only` };
  }

  return { value: normalized };
}

// GET - Fetch organization details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const authContext = await requireApiAuthContext();
    if (!authContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { user } = authContext;
    const { orgId } = await params;

    // Verify user is a member of the organization
    const membership = await db
      .select()
      .from(organizationMembers)
      .where(
        and(
          eq(organizationMembers.orgId, orgId),
          eq(organizationMembers.userId, user.id),
          eq(organizationMembers.status, 'active')
        )
      )
      .limit(1);

    if (!membership || membership.length === 0) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    // Fetch organization
    const [org] = await db.select().from(organizations).where(eq(organizations.id, orgId)).limit(1);

    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    return NextResponse.json({ organization: org });
  } catch (error) {
    console.error('Error fetching organization:', error);
    return NextResponse.json({ error: 'Failed to fetch organization' }, { status: 500 });
  }
}

// PUT - Update organization
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const authContext = await requireApiAuthContext();
    if (!authContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { user } = authContext;
    const { orgId } = await params;

    // Verify user has admin or owner role
    const membership = await db
      .select()
      .from(organizationMembers)
      .where(
        and(
          eq(organizationMembers.orgId, orgId),
          eq(organizationMembers.userId, user.id),
          eq(organizationMembers.status, 'active')
        )
      )
      .limit(1);

    if (
      !membership ||
      membership.length === 0 ||
      !['owner', 'admin'].includes(membership[0].role)
    ) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const body = await request.json();
    const {
      displayName,
      legalName,
      mission,
      vision,
      causes,
      website,
      tagline,
      industry,
      industryKey,
      industryLabel,
      organizationSize,
      impactArea,
      legalForm,
      foundedDate,
      values,
      missionLinks,
      visionLinks,
    } = body;
    const parsedValues = parseValuesPayload(values);
    if (parsedValues.error) {
      return NextResponse.json({ error: parsedValues.error }, { status: 400 });
    }
    const parsedMissionLinks = parsePurposeLinksPayload(missionLinks, 'missionLinks');
    if (parsedMissionLinks.error) {
      return NextResponse.json({ error: parsedMissionLinks.error }, { status: 400 });
    }
    const parsedVisionLinks = parsePurposeLinksPayload(visionLinks, 'visionLinks');
    if (parsedVisionLinks.error) {
      return NextResponse.json({ error: parsedVisionLinks.error }, { status: 400 });
    }

    // Validate displayName if provided
    if (displayName !== undefined && (typeof displayName !== 'string' || !displayName.trim())) {
      return NextResponse.json({ error: 'Organization name cannot be empty' }, { status: 400 });
    }

    if (website !== undefined && website !== null && typeof website !== 'string') {
      return NextResponse.json({ error: 'Website must be a string or null' }, { status: 400 });
    }

    if (causes !== undefined) {
      if (causes !== null && !Array.isArray(causes)) {
        return NextResponse.json(
          { error: 'Causes must be an array of non-empty strings or null' },
          { status: 400 }
        );
      }

      if (Array.isArray(causes)) {
        if (causes.length > 5) {
          return NextResponse.json({ error: 'Maximum of 5 causes allowed' }, { status: 400 });
        }

        const hasInvalidCause = causes.some((cause) => typeof cause !== 'string' || !cause.trim());
        if (hasInvalidCause) {
          return NextResponse.json(
            { error: 'Causes must contain non-empty strings only' },
            { status: 400 }
          );
        }
      }
    }

    if (foundedDate !== undefined) {
      if (foundedDate !== null && typeof foundedDate !== 'string') {
        return NextResponse.json(
          { error: 'Founded date must be a YYYY-MM-DD string or null' },
          { status: 400 }
        );
      }

      if (typeof foundedDate === 'string' && !isValidIsoDate(foundedDate)) {
        return NextResponse.json(
          { error: 'Founded date must be a valid YYYY-MM-DD date' },
          { status: 400 }
        );
      }
    }

    if (organizationSize !== undefined) {
      if (organizationSize !== null && typeof organizationSize !== 'string') {
        return NextResponse.json(
          { error: 'Organization size must be a valid option or null' },
          { status: 400 }
        );
      }

      const normalizedOrganizationSize = organizationSize?.trim() || null;
      if (
        normalizedOrganizationSize !== null &&
        !ORGANIZATION_SIZE_SET.has(normalizedOrganizationSize)
      ) {
        return NextResponse.json(
          { error: 'Organization size must be one of the supported values' },
          { status: 400 }
        );
      }
    }

    if (legalForm !== undefined) {
      if (legalForm !== null && typeof legalForm !== 'string') {
        return NextResponse.json(
          { error: 'Legal form must be a valid option or null' },
          { status: 400 }
        );
      }

      const normalizedLegalForm = legalForm?.trim() || null;
      if (normalizedLegalForm !== null && !LEGAL_FORM_SET.has(normalizedLegalForm)) {
        return NextResponse.json(
          { error: 'Legal form must be one of the supported values' },
          { status: 400 }
        );
      }
    }

    if (industry !== undefined && industry !== null && typeof industry !== 'string') {
      return NextResponse.json({ error: 'Industry must be a string or null' }, { status: 400 });
    }
    if (industryKey !== undefined && industryKey !== null && typeof industryKey !== 'string') {
      return NextResponse.json({ error: 'Industry key must be a string or null' }, { status: 400 });
    }
    if (
      industryLabel !== undefined &&
      industryLabel !== null &&
      typeof industryLabel !== 'string'
    ) {
      return NextResponse.json(
        { error: 'Industry label must be a string or null' },
        { status: 400 }
      );
    }

    const [currentOrg] = await db
      .select({
        mission: organizations.mission,
        vision: organizations.vision,
        missionLinks: organizations.missionLinks,
        visionLinks: organizations.visionLinks,
        values: organizations.values,
        causes: organizations.causes,
      })
      .from(organizations)
      .where(eq(organizations.id, orgId))
      .limit(1);

    if (!currentOrg) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const nextValues =
      values !== undefined
        ? parsedValues.value === null
          ? []
          : (parsedValues.value ?? [])
        : normalizeOrganizationValues(currentOrg.values);
    const nextCauses =
      causes !== undefined
        ? causes === null
          ? []
          : normalizeCauses(causes)
        : normalizeCauses(currentOrg.causes);
    const nextMissionLinks =
      missionLinks !== undefined
        ? pruneOrganizationPurposeLinks(
            parsedMissionLinks.value ?? { values: [], causes: [] },
            nextValues,
            nextCauses
          )
        : pruneOrganizationPurposeLinks(
            normalizeOrganizationPurposeLinks(currentOrg.missionLinks),
            nextValues,
            nextCauses
          );
    const nextVisionLinks =
      visionLinks !== undefined
        ? pruneOrganizationPurposeLinks(
            parsedVisionLinks.value ?? { values: [], causes: [] },
            nextValues,
            nextCauses
          )
        : pruneOrganizationPurposeLinks(
            normalizeOrganizationPurposeLinks(currentOrg.visionLinks),
            nextValues,
            nextCauses
          );

    const nextMission =
      mission !== undefined
        ? typeof mission === 'string'
          ? mission.trim()
          : ''
        : currentOrg.mission || '';
    const nextVision =
      vision !== undefined
        ? typeof vision === 'string'
          ? vision.trim()
          : ''
        : currentOrg.vision || '';
    const isSettingPurpose =
      (mission !== undefined && nextMission.length > 0) ||
      (vision !== undefined && nextVision.length > 0);

    if (isSettingPurpose) {
      const missingRequirements: string[] = [];
      if (nextValues.length === 0) {
        missingRequirements.push('at least one core value');
      }
      if (nextCauses.length === 0) {
        missingRequirements.push('at least one cause');
      }

      if (missingRequirements.length > 0) {
        return NextResponse.json(
          {
            error: `Add ${missingRequirements.join(' and ')} before updating mission or vision.`,
          },
          { status: 400 }
        );
      }

      if (
        mission !== undefined &&
        nextMission.length > 0 &&
        !hasRequiredPurposeLinks(nextMissionLinks)
      ) {
        return NextResponse.json(
          {
            error: 'Select at least one linked value and one linked cause before updating mission.',
          },
          { status: 400 }
        );
      }

      if (
        vision !== undefined &&
        nextVision.length > 0 &&
        !hasRequiredPurposeLinks(nextVisionLinks)
      ) {
        return NextResponse.json(
          {
            error: 'Select at least one linked value and one linked cause before updating vision.',
          },
          { status: 400 }
        );
      }

      const nextValueSet = new Set(nextValues);
      const nextCauseSet = new Set(nextCauses);
      const missionLinksOutsideScope =
        nextMissionLinks.values.some((value) => !nextValueSet.has(value)) ||
        nextMissionLinks.causes.some((cause) => !nextCauseSet.has(cause));
      if (missionLinksOutsideScope) {
        return NextResponse.json(
          {
            error: 'Mission links must reference existing core values and causes.',
          },
          { status: 400 }
        );
      }

      const visionLinksOutsideScope =
        nextVisionLinks.values.some((value) => !nextValueSet.has(value)) ||
        nextVisionLinks.causes.some((cause) => !nextCauseSet.has(cause));
      if (visionLinksOutsideScope) {
        return NextResponse.json(
          {
            error: 'Vision links must reference existing core values and causes.',
          },
          { status: 400 }
        );
      }
    }

    // Build update object with only provided fields
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (displayName !== undefined) updateData.displayName = displayName.trim();
    if (legalName !== undefined) updateData.legalName = legalName?.trim() || null;
    if (mission !== undefined) updateData.mission = mission?.trim() || null;
    if (vision !== undefined) updateData.vision = vision?.trim() || null;
    if (causes !== undefined) {
      updateData.causes = Array.isArray(causes) ? causes.map((cause) => cause.trim()) : causes;
    }
    if (website !== undefined) {
      const normalizedWebsite = normalizeOrganizationWebsite(website);
      if (normalizedWebsite.error) {
        return NextResponse.json({ error: normalizedWebsite.error }, { status: 400 });
      }
      updateData.website = normalizedWebsite.value;
    }
    if (tagline !== undefined) updateData.tagline = tagline?.trim() || null;
    if (industry !== undefined || industryKey !== undefined || industryLabel !== undefined) {
      if (
        typeof industryKey === 'string' &&
        industryKey.trim().length > 0 &&
        typeof industryLabel === 'string' &&
        industryLabel.trim().length > 0
      ) {
        const mappedLabel = mapIndustryValueToCanonical(industryLabel.trim());
        if (mappedLabel.industryKey !== industryKey.trim()) {
          return NextResponse.json(
            { error: 'Industry key and label do not match' },
            { status: 400 }
          );
        }
      }

      const resolvedIndustry = resolveIndustryFromInputs({
        industryKey,
        industryLabel,
        legacyIndustry: industry,
      });
      updateData.industry = resolvedIndustry.industryLabel;
      updateData.industryKey = resolvedIndustry.industryKey;
      updateData.industryLabel = resolvedIndustry.industryLabel;
      updateData.industryLegacyText = resolvedIndustry.legacyText;
    }
    if (organizationSize !== undefined)
      updateData.organizationSize = organizationSize?.trim() || null;
    if (impactArea !== undefined) updateData.impactArea = impactArea?.trim() || null;
    if (legalForm !== undefined) updateData.legalForm = legalForm?.trim() || null;
    if (foundedDate !== undefined) updateData.foundedDate = foundedDate;
    if (values !== undefined) updateData.values = parsedValues.value ?? null;
    if (missionLinks !== undefined) updateData.missionLinks = nextMissionLinks;
    if (visionLinks !== undefined) updateData.visionLinks = nextVisionLinks;
    if ((values !== undefined || causes !== undefined) && missionLinks === undefined) {
      updateData.missionLinks = nextMissionLinks;
    }
    if ((values !== undefined || causes !== undefined) && visionLinks === undefined) {
      updateData.visionLinks = nextVisionLinks;
    }

    // Update organization
    const [updatedOrg] = await db
      .update(organizations)
      .set(updateData)
      .where(eq(organizations.id, orgId))
      .returning();

    return NextResponse.json({ organization: updatedOrg });
  } catch (error) {
    console.error('Error updating organization:', error);
    return NextResponse.json({ error: 'Failed to update organization' }, { status: 500 });
  }
}
