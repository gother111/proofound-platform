import { notFound } from 'next/navigation';
import { getActiveOrg, requireAuth } from '@/lib/auth';
import { OrgCandidatesWorkspace } from '@/components/organization/OrgCandidatesWorkspace';

export const dynamic = 'force-dynamic';

export default async function OrgCandidatesAliasPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const user = await requireAuth();
  const { slug } = await params;
  const result = await getActiveOrg(slug, user.id);

  if (!result) {
    notFound();
  }

  return <OrgCandidatesWorkspace orgId={result.org.id} />;
}
