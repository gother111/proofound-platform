import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function OrganizationPortfolioShortcutPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const returnTo = encodeURIComponent(`/app/o/${slug}/home`);
  redirect(`/portfolio/org/${slug}?returnTo=${returnTo}`);
}
