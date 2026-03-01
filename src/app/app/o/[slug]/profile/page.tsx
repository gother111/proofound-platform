import { requireAuth, getActiveOrg } from '@/lib/auth';
import { notFound } from 'next/navigation';
import { OrganizationProfileView } from '@/components/profile/OrganizationProfileView';
import { normalizeOrganizationValues } from '@/lib/organizations/normalizeValues';
import type { PurposeLinks } from '@/types/profile';
import {
  createOrganizationDefaultPurposeLinks,
  normalizeOrganizationPurposeLinks,
  pruneOrganizationPurposeLinks,
} from '@/lib/organizations/normalizePurposeLinks';

export const dynamic = 'force-dynamic';

type ClientOrganizationProfile = {
  id: string;
  slug: string;
  displayName: string;
  legalName: string | null;
  type: string | null;
  verified: boolean;
  logoUrl: string | null;
  coverImageUrl: string | null;
  tagline: string | null;
  mission: string | null;
  vision: string | null;
  missionLinks: PurposeLinks;
  visionLinks: PurposeLinks;
  website: string | null;
  foundedDate: string | null;
  industry: string | null;
  industryKey: string | null;
  industryLabel: string | null;
  industryLegacyText: string | null;
  organizationSize: string | null;
  impactArea: string | null;
  legalForm: string | null;
  values: string[] | null;
  causes: string[] | null;
  workCulture: unknown;
  locations: string[] | null;
};

export default async function OrganizationProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const user = await requireAuth();
  const { slug } = await params;
  const result = await getActiveOrg(slug, user.id);

  if (!result) {
    notFound();
  }

  const { org, membership } = result;
  const normalizedValues = normalizeOrganizationValues(org.values);

  // Check if user can edit
  const canEdit = membership.role === 'owner' || membership.role === 'admin';

  // Check if organization profile is empty (has minimal data beyond required fields)
  const hasBasicInfo = Boolean(org.tagline || org.mission || org.vision || org.website);
  const hasBusinessDetails = Boolean(
    org.industryLabel || org.industry || org.organizationSize || org.impactArea || org.legalForm
  );
  const hasExtendedInfo = Boolean(normalizedValues.length > 0 || org.workCulture || org.legalName);

  const isEmptyProfile = !hasBasicInfo && !hasBusinessDetails && !hasExtendedInfo;

  // Calculate profile completion percentage
  const completionFields = [
    org.logoUrl,
    org.tagline,
    org.mission,
    org.vision,
    org.industryLabel || org.industry,
    org.organizationSize,
    org.impactArea,
    org.legalForm,
    org.foundedDate,
    org.legalName,
    org.website,
    normalizedValues.length > 0 ? normalizedValues : null,
    org.workCulture,
  ];
  const completedFields = completionFields.filter((field) => Boolean(field)).length;
  const profileCompletion = Math.round((completedFields / completionFields.length) * 100);
  const orgVerified = Boolean((org as Record<string, unknown>).verified);

  const clientOrg: ClientOrganizationProfile = {
    id: org.id,
    slug: org.slug,
    displayName: org.displayName,
    legalName: org.legalName,
    type: org.type,
    verified: orgVerified,
    logoUrl: org.logoUrl,
    coverImageUrl: org.coverImageUrl,
    tagline: org.tagline,
    mission: org.mission,
    vision: org.vision,
    missionLinks: pruneOrganizationPurposeLinks(
      normalizeOrganizationPurposeLinks(org.missionLinks),
      normalizedValues,
      org.causes ?? []
    ),
    visionLinks: pruneOrganizationPurposeLinks(
      normalizeOrganizationPurposeLinks(org.visionLinks),
      normalizedValues,
      org.causes ?? []
    ),
    website: org.website,
    foundedDate:
      typeof org.foundedDate === 'string'
        ? org.foundedDate
        : org.foundedDate
          ? String(org.foundedDate)
          : null,
    industry: org.industryLabel || org.industry,
    industryKey: org.industryKey,
    industryLabel: org.industryLabel,
    industryLegacyText: org.industryLegacyText,
    organizationSize: org.organizationSize,
    impactArea: org.impactArea,
    legalForm: org.legalForm,
    values: normalizedValues.length > 0 ? normalizedValues : null,
    causes: org.causes ?? null,
    workCulture: org.workCulture ?? null,
    locations: org.locations ?? null,
  };

  if (
    org.mission &&
    (clientOrg.missionLinks.values.length === 0 || clientOrg.missionLinks.causes.length === 0)
  ) {
    clientOrg.missionLinks = createOrganizationDefaultPurposeLinks(
      normalizedValues,
      org.causes ?? []
    );
  }

  if (
    org.vision &&
    (clientOrg.visionLinks.values.length === 0 || clientOrg.visionLinks.causes.length === 0)
  ) {
    clientOrg.visionLinks = createOrganizationDefaultPurposeLinks(
      normalizedValues,
      org.causes ?? []
    );
  }

  return (
    <OrganizationProfileView
      org={clientOrg}
      canEdit={canEdit}
      isEmptyProfile={isEmptyProfile}
      profileCompletion={Math.max(profileCompletion, 5)}
    />
  );
}
