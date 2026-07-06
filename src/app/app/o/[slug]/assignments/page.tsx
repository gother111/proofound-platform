import Link from 'next/link';
import { AppSurface } from '@/components/ui/v2/AppSurface';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ClipboardCheck } from 'lucide-react';
import { OrgMatchingClient } from '../matching/OrgMatchingClient';

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
          <nav className="mb-2 text-xs text-neutral-dark-500">
            <Link
              href={`/app/o/${slug}/home`}
              className="-mx-2 inline-flex min-h-11 items-center rounded-md px-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-proofound-forest focus-visible:ring-offset-2"
            >
              Organization
            </Link>{' '}
            / Assignments
          </nav>
          <h1 className="text-2xl font-semibold text-primary-500">Assignments</h1>
          <p className="text-sm text-neutral-dark-600">
            Assignment cards own their review flow, proof-submission review, and pipeline context.
          </p>
        </header>
        <OrgMatchingClient />
      </div>
    </AppSurface>
  );
}
