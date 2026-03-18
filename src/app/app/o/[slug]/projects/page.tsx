import { OrgScopeNotice } from '@/components/organization/OrgScopeNotice';
import { getOrgSurfaceFallbackHref } from '@/lib/org/mvp-surface-policy';

export const dynamic = 'force-dynamic';

export default async function OrgProjectsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  return (
    <OrgScopeNotice
      title="Project libraries are not part of the launch MVP"
      description="The launch corridor keeps org activity focused on one trust profile and one assignment path. Project libraries remain safely isolated."
      slug={slug}
      primaryHref={getOrgSurfaceFallbackHref(slug, 'projects')}
      primaryLabel="Back to overview"
      secondaryHref={`/app/o/${slug}/matching`}
      secondaryLabel="Open assignments & matches"
    />
  );
}
