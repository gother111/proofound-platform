import { OrgScopeNotice } from '@/components/organization/OrgScopeNotice';
import { getOrgSurfaceFallbackHref } from '@/lib/org/mvp-surface-policy';

export const dynamic = 'force-dynamic';

export default async function OrgTeamPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  return (
    <OrgScopeNotice
      title="Broad team management is gated for launch"
      description="Launch access is intentionally lean: owner, manager, and reviewer roles only. Full team administration stays out of the corridor."
      slug={slug}
      primaryHref={getOrgSurfaceFallbackHref(slug, 'team')}
      primaryLabel="Back to overview"
      secondaryHref={`/app/o/${slug}/matching`}
      secondaryLabel="Open review queue"
    />
  );
}
