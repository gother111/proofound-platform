import { notFound } from 'next/navigation';

import { OrgCandidatesWorkspace } from '@/components/organization/OrgCandidatesWorkspace';
import { getActiveOrg, requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function OrgCandidatesPage({ params }: { params: Promise<{ slug: string }> }) {
  const user = await requireAuth();
  const { slug } = await params;
  const result = await getActiveOrg(slug, user.id);

  if (!result) {
    notFound();
  }

  return <OrgCandidatesWorkspace orgId={result.org.id} />;
}
