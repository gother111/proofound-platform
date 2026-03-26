import { OrgScopeNotice } from '@/components/organization/OrgScopeNotice';
import { getOrgSurfaceFallbackHref } from '@/lib/org/mvp-surface-policy';

export const dynamic = 'force-dynamic';

export default async function OrganizationSettingsTeamPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return (
    <OrgScopeNotice
      title="Team settings are gated for launch"
      description="The org MVP keeps access narrow and review-focused. Full team settings remain outside the launch corridor."
      slug={slug}
      primaryHref={getOrgSurfaceFallbackHref(slug, 'settings')}
      primaryLabel="Back to overview"
      secondaryHref={`/app/o/${slug}/matching`}
      secondaryLabel="Open review queue"
    />
  );
}
