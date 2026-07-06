import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function OrgShortlistPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const encodedSlug = encodeURIComponent(slug);

  redirect(`/app/o/${encodedSlug}/assignments?from=shortlist`);
}
