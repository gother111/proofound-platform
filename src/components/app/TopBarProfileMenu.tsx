'use client';

import Link from 'next/link';

interface TopBarProfileMenuProps {
  userName: string;
  basePath: string;
  onClose: () => void;
}

export function TopBarProfileMenu({ userName, basePath, onClose }: TopBarProfileMenuProps) {
  const isIndividual = basePath === '/app/i';
  const menuLinks = isIndividual
    ? [
        { href: '/app/i/settings', label: 'Account settings' },
        { href: '/app/i/settings/privacy', label: 'Privacy controls' },
        { href: '/app/i/settings/privacy#privacy-delete', label: 'Export or delete data' },
        { href: '/app/i/settings/audit-log', label: 'Account history' },
      ]
    : [
        { href: `${basePath}/profile`, label: 'Organization trust page' },
        { href: `${basePath}/portfolio`, label: 'Public preview' },
      ];

  return (
    <div
      role="menu"
      aria-label="Profile menu"
      className="absolute right-0 top-full z-50 mt-2 w-56 rounded-xl border border-proofound-stone/60 bg-white p-1 text-proofound-charcoal shadow-lg"
    >
      <div className="flex flex-col px-2 py-1.5">
        <span className="text-sm font-medium">{userName}</span>
        <span className="text-xs text-muted-foreground">Signed in</span>
      </div>
      <div className="-mx-1 my-1 h-px bg-proofound-stone/60" />
      {menuLinks.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          role="menuitem"
          onClick={onClose}
          className="flex min-h-11 items-center rounded-md px-3 py-2 text-sm outline-none transition-colors hover:bg-proofound-stone/30 focus-visible:bg-proofound-stone/30 focus-visible:ring-2 focus-visible:ring-proofound-forest focus-visible:ring-offset-2"
        >
          {item.label}
        </Link>
      ))}
      <div className="-mx-1 my-1 h-px bg-proofound-stone/60" />
      <Link
        href="/auth/logout"
        role="menuitem"
        onClick={onClose}
        className="flex min-h-11 w-full items-center rounded-md px-3 py-2 text-left text-sm outline-none transition-colors hover:bg-rose-50 hover:text-rose-600 focus-visible:bg-rose-50 focus-visible:text-rose-600 focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2"
      >
        Log out
      </Link>
    </div>
  );
}
