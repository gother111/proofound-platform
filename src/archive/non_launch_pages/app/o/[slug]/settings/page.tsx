import { OrgScopeNotice } from '@/archive/non_launch_org_suite/components/organization/OrgScopeNotice';
import { getOrgSurfaceFallbackHref } from '@/lib/org/mvp-surface-policy';

export const dynamic = 'force-dynamic';

export default async function OrganizationSettingsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return (
    <OrgScopeNotice
      title="Broad org settings are gated for launch"
      description="Only trust-profile updates remain in scope for launch. Wider settings, integrations, and admin dashboards are isolated until after MVP."
      slug={slug}
      primaryHref={getOrgSurfaceFallbackHref(slug, 'settings')}
      primaryLabel="Back to overview"
      secondaryHref={`/app/o/${slug}/profile`}
      secondaryLabel="Open organization profile"
    />
  );
}
