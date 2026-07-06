import { notFound, redirect } from 'next/navigation';

import { getActiveOrg, requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function OrgCandidatesPage({ params }: { params: Promise<{ slug: string }> }) {
  const user = await requireAuth();
  const { slug } = await params;
  const result = await getActiveOrg(slug, user.id);

  if (!result) {
    notFound();
  }

  redirect(`/app/o/${encodeURIComponent(slug)}/assignments`);
}
