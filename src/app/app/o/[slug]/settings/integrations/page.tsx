import { OrgScopeNotice } from '@/components/organization/OrgScopeNotice';
import { getOrgSurfaceFallbackHref } from '@/lib/org/mvp-surface-policy';

export const dynamic = 'force-dynamic';

export default async function OrganizationIntegrationsSettingsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return (
    <OrgScopeNotice
      title="Integrations settings are gated for launch"
      description="Video and broader workspace integrations are not launch-binding for the org MVP corridor."
      slug={slug}
      primaryHref={getOrgSurfaceFallbackHref(slug, 'settings')}
      primaryLabel="Back to overview"
      secondaryHref={`/app/o/${slug}/profile`}
      secondaryLabel="Open trust profile"
    />
  );
}
