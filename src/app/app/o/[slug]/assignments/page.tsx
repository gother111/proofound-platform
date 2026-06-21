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
      <div className="space-y-6">
        <header className="overflow-hidden rounded-lg border border-proofound-stone/70 bg-white shadow-[0_18px_50px_rgba(45,51,48,0.06)]">
          <div className="flex items-center gap-2 border-b border-proofound-stone/60 bg-[#f3f6ef] px-5 py-3">
            <Badge
              variant="secondary"
              className="bg-white hover:bg-white text-proofound-forest border-proofound-stone"
            >
              Assignment corridor
            </Badge>
          </div>
          <div className="flex flex-col gap-6 px-5 py-6 sm:flex-row sm:items-start sm:justify-between sm:px-6">
            <div className="flex min-w-0 flex-1 gap-4 sm:gap-5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#dfead5] text-proofound-forest shadow-sm ring-1 ring-black/5 sm:h-14 sm:w-14">
                <ClipboardCheck className="h-7 w-7" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <nav className="mb-2 flex min-h-11 items-center gap-1 text-xs text-muted-foreground">
                  <Link
                    href={`/app/o/${slug}/home`}
                    className="-ml-2 inline-flex min-h-11 items-center rounded-md px-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-proofound-forest focus-visible:ring-offset-2"
                  >
                    Organization
                  </Link>{' '}
                  / Assignments
                </nav>
                <h1 className="mb-2 font-display text-2xl font-medium leading-tight text-proofound-charcoal md:text-3xl">
                  Assignments
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                  Create one proof-led assignment, review submissions blind by default, and move
                  ready participants toward introductions and interviews.
                </p>
              </div>
            </div>
          </div>
        </header>
        <OrgMatchingClient />
      </div>
    </AppSurface>
  );
}
