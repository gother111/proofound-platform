import { requireAuth } from '@/lib/auth';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { signOut } from '@/actions/auth';

export default async function IndividualLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAuth();

  return (
    <div className="min-h-screen bg-secondary-100">
      {/* Top Navigation */}
      <header className="bg-white border-b border-neutral-light-300">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-display font-semibold text-primary-500">Proofound</h1>
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/app/i/home"
              className="text-neutral-dark-700 hover:text-primary-500 transition-colors"
            >
              Home
            </Link>
            <Link
              href="/app/i/profile"
              className="text-neutral-dark-700 hover:text-primary-500 transition-colors"
            >
              Profile
            </Link>
            <Link
              href="/app/i/settings"
              className="text-neutral-dark-700 hover:text-primary-500 transition-colors"
            >
              Settings
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            <span className="text-sm text-neutral-dark-600">
              {user.displayName || user.handle || 'User'}
            </span>
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
