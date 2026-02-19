import OrganizationMembersPage from '../members/page';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function OrgTeamAliasPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return (
    <div className="space-y-4">
      <header className="px-1">
        <nav className="text-xs text-neutral-dark-500 mb-2">
          <Link href={`/app/o/${slug}/home`} className="hover:underline">
            Organization
          </Link>{' '}
          / Team
        </nav>
        <h1 className="text-2xl font-semibold text-primary-500">Team</h1>
        <p className="text-sm text-neutral-dark-600">
          Team administration is provided through the members workspace to keep role permissions in
          one place.
        </p>
      </header>
      <OrganizationMembersPage params={params} />
    </div>
  );
}
