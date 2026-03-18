import { OrgScopeNotice } from '@/components/organization/OrgScopeNotice';
import { getOrgSurfaceFallbackHref } from '@/lib/org/mvp-surface-policy';

export const dynamic = 'force-dynamic';

export default async function OrganizationSettingsGoalsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return (
    <OrgScopeNotice
      title="Goal dashboards are gated for launch"
      description="The launch corridor does not include broad goal or admin dashboards. Keep work focused on trust profile, assignments, and review."
      slug={slug}
      primaryHref={getOrgSurfaceFallbackHref(slug, 'settings')}
      primaryLabel="Back to overview"
      secondaryHref={`/app/o/${slug}/matching`}
      secondaryLabel="Open assignments & matches"
    />
  );
}
