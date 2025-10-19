import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function OpportunitiesPage() {
  const user = await requireAuth();

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-2">Opportunities</h1>
      <p className="text-muted-foreground">Coming soon</p>
    </div>
  );
}
