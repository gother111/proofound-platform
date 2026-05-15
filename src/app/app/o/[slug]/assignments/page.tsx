import Link from 'next/link';
import { AppSurface } from '@/components/ui/v2/AppSurface';
import { DeferredOrgMatchingClient } from '../matching/DeferredOrgMatchingClient';

export const dynamic = 'force-dynamic';

export default async function OrgAssignmentsAliasPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return (
    <AppSurface>
      <div className="space-y-4">
        <header className="px-1">
          <nav className="text-xs text-neutral-dark-500 mb-2">
            <Link href={`/app/o/${slug}/home`} className="hover:underline">
              Organization
            </Link>{' '}
            / Assignments
          </nav>
          <h1 className="text-2xl font-semibold text-primary-500">Assignments</h1>
          <p className="text-sm text-neutral-dark-600">
            Assignment cards own their matching corridor, candidate review, and pipeline context.
          </p>
        </header>
        <DeferredOrgMatchingClient />
      </div>
    </AppSurface>
  );
}
