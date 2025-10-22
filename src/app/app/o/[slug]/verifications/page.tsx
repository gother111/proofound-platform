import { requireAuth, getActiveOrg } from '@/lib/auth';
import { notFound } from 'next/navigation';
import type { ParamsPromise } from '@/types/next';

export const dynamic = 'force-dynamic';

export default async function OrgVerificationsPage({
  params,
}: {
  params: ParamsPromise<{ slug: string }>;
}) {
  const user = await requireAuth();
  const { slug } = params as unknown as { slug: string };
  const result = await getActiveOrg(slug, user.id);

  if (!result) {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-2">Verifications</h1>
      <p className="text-muted-foreground">Coming soon</p>
    </div>
  );
}
