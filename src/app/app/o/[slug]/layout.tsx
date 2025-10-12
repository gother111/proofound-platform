import { requireAuth, getActiveOrg } from '@/lib/auth';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { signOut } from '@/actions/auth';

export default async function OrganizationLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const user = await requireAuth();
  const { slug } = await params;
  const result = await getActiveOrg(slug, user.id);

  if (!result) {
    notFound();
  }

  const { org, membership } = result;

  return (
    <div className="min-h-screen bg-secondary-100">
      {/* Top Navigation */}
      <header className="bg-white border-b border-neutral-light-300">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-display font-semibold text-primary-500">
              {org.displayName}
            </h1>
            <p className="text-xs text-neutral-dark-500">{membership.role}</p>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href={`/app/o/${slug}/home`}
              className="text-neutral-dark-700 hover:text-primary-500 transition-colors"
            >
              Home
            </Link>
            <Link
              href={`/app/o/${slug}/profile`}
              className="text-neutral-dark-700 hover:text-primary-500 transition-colors"
            >
              Profile
            </Link>
            <Link
              href={`/app/o/${slug}/members`}
              className="text-neutral-dark-700 hover:text-primary-500 transition-colors"
            >
              Members
            </Link>
            {(membership.role === 'owner' || membership.role === 'admin') && (
              <Link
                href={`/app/o/${slug}/settings`}
                className="text-neutral-dark-700 hover:text-primary-500 transition-colors"
              >
                Settings
              </Link>
            )}
          </nav>
          <div className="flex items-center gap-4">
            <Link
              href="/app/i/home"
              className="text-sm text-neutral-dark-600 hover:text-primary-500"
            >
              My Profile
            </Link>
            <form action={signOut as any}>
              <Button variant="ghost" size="sm" type="submit">
                Log out
              </Button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
