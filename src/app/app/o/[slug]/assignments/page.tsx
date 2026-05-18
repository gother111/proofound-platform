import Link from 'next/link';
import { AppSurface } from '@/components/ui/v2/AppSurface';
import { Button } from '@/components/ui/button';
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
        <header className="flex flex-col gap-4 px-1 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <nav className="mb-2 text-xs text-neutral-dark-500">
              <Link href={`/app/o/${slug}/home`} className="hover:underline">
                Organization
              </Link>{' '}
              / Assignments
            </nav>
            <h1 className="text-2xl font-semibold text-primary-500">Assignments</h1>
            <p className="max-w-2xl text-sm leading-6 text-neutral-dark-600">
              Assignment cards own their matching corridor, candidate review, and pipeline context.
            </p>
          </div>
          <Button asChild className="w-full sm:w-auto">
            <Link href={`/app/o/${slug}/assignments/new`}>Create assignment</Link>
          </Button>
        </header>
        <DeferredOrgMatchingClient />
      </div>
    </AppSurface>
  );
}
