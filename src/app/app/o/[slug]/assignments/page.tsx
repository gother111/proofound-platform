import OrgMatchingPage from '../matching/page';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function OrgAssignmentsAliasPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return (
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
          Assignments are managed from the matching workspace to keep role, candidate, and pipeline
          context together.
        </p>
      </header>
      <OrgMatchingPage />
    </div>
  );
}
