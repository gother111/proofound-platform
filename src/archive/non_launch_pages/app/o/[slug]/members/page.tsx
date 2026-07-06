import { OrgScopeNotice } from '@/archive/non_launch_org_suite/components/organization/OrgScopeNotice';
import { getOrgSurfaceFallbackHref } from '@/lib/org/mvp-surface-policy';

export const dynamic = 'force-dynamic';

export default async function OrgMembersPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  return (
    <OrgScopeNotice
      title="Member administration is gated for launch"
      description="The MVP corridor keeps membership handling minimal. Review happens in the queue, while broader member administration remains isolated."
      slug={slug}
      primaryHref={getOrgSurfaceFallbackHref(slug, 'members')}
      primaryLabel="Back to overview"
      secondaryHref={`/app/o/${slug}/matching`}
      secondaryLabel="Open review queue"
    />
  );
}
