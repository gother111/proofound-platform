import { getActiveOrg, requirePersona } from '@/lib/auth';
import { notFound, redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function OrganizationPortfolioRedirectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const user = await requirePersona('org_member');
  const { slug } = await params;

  const result = await getActiveOrg(slug, user.id);
  if (!result) {
    notFound();
  }

  redirect(`/portfolio/org/${encodeURIComponent(slug)}`);
}
