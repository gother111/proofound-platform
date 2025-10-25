import type { Metadata } from 'next';
import Link from 'next/link';
import '../globals.css';

export const metadata: Metadata = {
  title: 'Proofound Wireframe',
  description: 'Wireframe views for the Proofound platform',
};

const NAV_LINKS = [
  { href: '/wireframe', label: 'Overview' },
  { href: '/wireframe/dashboard', label: 'Dashboard' },
  { href: '/wireframe/matching', label: 'Matching' },
  { href: '/wireframe/zen-hub', label: 'Zen Hub' },
];

export default function WireframeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F5F3EE] text-[#2C2A27] dark:bg-[#1F1A16] dark:text-[#E8E6DD]">
      <header className="sticky top-0 z-50 border-b border-[#2C2A27]/10 bg-[#F5F3EE]/90 backdrop-blur dark:border-[#E8E6DD]/10 dark:bg-[#1F1A16]/90">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#2C2A27]/60 dark:text-[#E8E6DD]/60">
            Wireframes
          </span>
          <nav className="flex flex-wrap gap-2 text-sm">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-full border border-transparent px-4 py-2 text-[#2C2A27]/70 transition-colors hover:border-[#2C2A27]/20 hover:text-[#2C2A27] dark:text-[#E8E6DD]/70 dark:hover:border-[#E8E6DD]/20 dark:hover:text-[#E8E6DD]"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="pt-6">{children}</main>
    </div>
  );
}
