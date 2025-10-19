import { requireAuth, getActiveOrg } from '@/lib/auth';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function OrgProjectsPage({ params }: { params: Promise<{ slug: string }> }) {
  const user = await requireAuth();
  const { slug } = await params;
  const result = await getActiveOrg(slug, user.id);

  if (!result) {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-2">Projects</h1>
      <p className="text-muted-foreground">Coming soon</p>
    </div>
  );
}
