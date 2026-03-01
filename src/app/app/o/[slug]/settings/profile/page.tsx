import { OrganizationBasicInfoEditor } from '@/components/organization/OrganizationBasicInfoEditor';
import { getActiveOrg, requireAuth } from '@/lib/auth';
import { normalizeOrganizationValues } from '@/lib/organizations/normalizeValues';
import {
  createOrganizationDefaultPurposeLinks,
  normalizeOrganizationPurposeLinks,
  pruneOrganizationPurposeLinks,
} from '@/lib/organizations/normalizePurposeLinks';
import { notFound, redirect } from 'next/navigation';
import { AppSurface } from '@/components/ui/v2/AppSurface';

export const dynamic = 'force-dynamic';

export default async function OrganizationProfileSettingsPage({
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
  const normalizedCauses = Array.isArray(org.causes)
    ? org.causes.filter((cause): cause is string => typeof cause === 'string')
    : [];
  const missionLinks = pruneOrganizationPurposeLinks(
    normalizeOrganizationPurposeLinks(org.missionLinks),
    normalizedValues,
    normalizedCauses
  );
  const visionLinks = pruneOrganizationPurposeLinks(
    normalizeOrganizationPurposeLinks(org.visionLinks),
    normalizedValues,
    normalizedCauses
  );
  const canManageSettings = membership.role === 'owner' || membership.role === 'admin';
  if (!canManageSettings) {
    redirect(`/app/o/${slug}/home`);
  }

  return (
    <AppSurface>
      <div className="max-w-4xl mx-auto space-y-6 w-full">
        <div>
          <h1 className="text-3xl font-['Crimson_Pro'] font-semibold text-proofound-forest dark:text-primary mb-2">
            Profile Settings
          </h1>
          <p className="text-proofound-charcoal/70 dark:text-muted-foreground">
            Update your core organization profile information.
          </p>
        </div>

        <OrganizationBasicInfoEditor
          org={{
            id: org.id,
            displayName: org.displayName,
            legalName: org.legalName,
            tagline: org.tagline,
            mission: org.mission,
            vision: org.vision,
            missionLinks:
              org.mission && (missionLinks.values.length === 0 || missionLinks.causes.length === 0)
                ? createOrganizationDefaultPurposeLinks(normalizedValues, normalizedCauses)
                : missionLinks,
            visionLinks:
              org.vision && (visionLinks.values.length === 0 || visionLinks.causes.length === 0)
                ? createOrganizationDefaultPurposeLinks(normalizedValues, normalizedCauses)
                : visionLinks,
            industry: org.industryLabel || org.industry,
            industryKey: org.industryKey,
            industryLabel: org.industryLabel,
            industryLegacyText: org.industryLegacyText,
            organizationSize: org.organizationSize,
            impactArea: org.impactArea,
            legalForm: org.legalForm,
            foundedDate:
              typeof org.foundedDate === 'string'
                ? org.foundedDate
                : org.foundedDate
                  ? String(org.foundedDate)
                  : null,
            website: org.website,
            values: normalizedValues,
            causes: normalizedCauses,
          }}
          canEdit={canManageSettings}
        />
      </div>
    </AppSurface>
  );
}
