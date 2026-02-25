import { OrganizationBasicInfoEditor } from '@/components/organization/OrganizationBasicInfoEditor';
import { getActiveOrg, requireAuth } from '@/lib/auth';
import { normalizeOrganizationValues } from '@/lib/organizations/normalizeValues';
import { notFound, redirect } from 'next/navigation';

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
  const canManageSettings = membership.role === 'owner' || membership.role === 'admin';
  if (!canManageSettings) {
    redirect(`/app/o/${slug}/home`);
  }

  return (
    <div className="max-w-4xl mx-auto min-h-screen bg-proofound-parchment dark:bg-background p-6 space-y-6">
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
          industry: org.industry,
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
  );
}
