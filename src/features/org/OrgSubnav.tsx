'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useOrgContext } from './context';

const navItems = [
  { label: 'Dashboard', path: (slug: string) => `/o/${slug}/home` },
  { label: 'Profile', path: (slug: string) => `/o/${slug}/profile` },
  { label: 'Projects', path: (slug: string) => `/o/${slug}/projects` },
  { label: 'Assignments', path: (slug: string) => `/o/${slug}/assignments` },
  { label: 'Team', path: (slug: string) => `/o/${slug}/team` },
  { label: 'Settings', path: (slug: string) => `/o/${slug}/settings` },
];

export function OrgSubnav() {
  const pathname = usePathname();
  const { slug } = useOrgContext();

  return (
    <nav className="flex flex-wrap gap-2">
      {navItems.map((item) => {
        const href = item.path(slug);
        const isActive = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={item.label}
            href={href}
            className={cn(
              'rounded-full px-4 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-muted text-muted-foreground hover:bg-muted/70 hover:text-foreground'
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
