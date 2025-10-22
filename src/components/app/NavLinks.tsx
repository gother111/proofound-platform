'use client';

import clsx from 'clsx';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useOptionalOrgContext } from '@/features/org/context';

export type NavLinkDescriptor = { href: string; label: string };

export function useScopeAwareNavLinks(): { links: NavLinkDescriptor[]; pathname: string } {
  const pathname = usePathname();
  const orgCtx = useOptionalOrgContext();
  const isOrg = pathname.startsWith('/app/o/');

  let links: NavLinkDescriptor[] = [];

  if (isOrg && orgCtx) {
    const { slug } = orgCtx;
    links = [
      { href: `/app/o/${slug}/home`, label: 'Dashboard' },
      { href: `/app/o/${slug}/profile`, label: 'Profile' },
      { href: `/app/o/${slug}/projects`, label: 'Projects' },
      { href: `/app/o/${slug}/matching`, label: 'Matching' },
      { href: `/app/o/${slug}/verifications`, label: 'Verifications' },
      { href: `/app/o/${slug}/opportunities`, label: 'Opportunities' },
      { href: `/app/o/${slug}/team`, label: 'Team' },
      { href: `/app/o/${slug}/settings`, label: 'Settings' },
    ];
  } else {
    links = [
      { href: '/app/i/home', label: 'Dashboard' },
      { href: '/app/i/profile', label: 'Profile' },
      { href: '/app/i/projects', label: 'Projects' },
      { href: '/app/i/matching', label: 'Matching' },
      { href: '/app/i/verifications', label: 'Verifications' },
      { href: '/app/i/opportunities', label: 'Opportunities' },
      { href: '/app/i/settings', label: 'Settings' },
    ];
  }

  return { links, pathname };
}

export function NavLinks({ className }: { className?: string }) {
  const { links, pathname } = useScopeAwareNavLinks();

  return (
    <nav className={clsx('space-y-1', className)}>
      {links.map((link) => {
        const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={clsx(
              'nav-link block rounded-md px-3 py-2 text-sm font-medium transition-colors',
              isActive ? 'bg-[#7A9278] text-white' : 'hover:bg-[#E8E6DD] text-fg-base'
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
