import { OrgScopeNotice } from '@/components/organization/OrgScopeNotice';
import { getOrgSurfaceFallbackHref } from '@/lib/org/mvp-surface-policy';

export const dynamic = 'force-dynamic';

export default async function OrgShortlistPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  return (
    <OrgScopeNotice
      title="Separate shortlist views are gated for launch"
      description="Launch uses one queue for assignments, matches, and review. Separate shortlist storytelling is intentionally out of scope."
      slug={slug}
      primaryHref={getOrgSurfaceFallbackHref(slug, 'shortlist')}
      primaryLabel="Open assignments & matches"
      secondaryHref={`/app/o/${slug}/profile`}
      secondaryLabel="Open trust profile"
    />
  );
}
