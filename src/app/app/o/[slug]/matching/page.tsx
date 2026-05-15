import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function OrgMatchingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  redirect(`/app/o/${slug}/assignments`);
}
