import OrgMatchingPage from '../matching/page';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function OrgCandidatesAliasPage({
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
          / Candidates
        </nav>
        <h1 className="text-2xl font-semibold text-primary-500">Candidates</h1>
        <p className="text-sm text-neutral-dark-600">
          Candidate discovery and assignment context share the same matching workspace for faster
          shortlisting.
        </p>
      </header>
      <OrgMatchingPage />
    </div>
  );
}
