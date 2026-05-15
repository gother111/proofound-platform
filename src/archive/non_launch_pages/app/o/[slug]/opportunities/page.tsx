import { OrgScopeNotice } from '@/components/organization/OrgScopeNotice';
import { getOrgSurfaceFallbackHref } from '@/lib/org/mvp-surface-policy';

export const dynamic = 'force-dynamic';

export default async function OrgOpportunitiesPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return (
    <OrgScopeNotice
      title="Opportunity expansion is gated for launch"
      description="Launch keeps org activity inside one assignment path and one review queue. Additional opportunity workflows remain outside the MVP corridor."
      slug={slug}
      primaryHref={getOrgSurfaceFallbackHref(slug, 'opportunities')}
      primaryLabel="Open assignments & matches"
      secondaryHref={`/app/o/${slug}/profile`}
      secondaryLabel="Open organization profile"
    />
  );
}
