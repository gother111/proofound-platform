import { OrgScopeNotice } from '@/archive/non_launch_org_suite/components/organization/OrgScopeNotice';
import { getOrgSurfaceFallbackHref } from '@/lib/org/mvp-surface-policy';

export const dynamic = 'force-dynamic';

export default async function OrgCandidatesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  return (
    <OrgScopeNotice
      title="Candidates workspace is gated for launch"
      description="The canonical MVP uses one assignments and matches queue. Candidate discovery remains isolated until after launch."
      slug={slug}
      primaryHref={getOrgSurfaceFallbackHref(slug, 'candidates')}
      primaryLabel="Open assignments & matches"
      secondaryHref={`/app/o/${slug}/profile`}
      secondaryLabel="Open organization profile"
    />
  );
}
