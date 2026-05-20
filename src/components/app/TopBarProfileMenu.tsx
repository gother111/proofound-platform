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
        { href: '/app/i/settings?tab=privacy', label: 'Export or delete data' },
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
          className="block rounded-md px-2 py-1.5 text-sm outline-none hover:bg-proofound-stone/30 focus:bg-proofound-stone/30"
        >
          {item.label}
        </Link>
      ))}
      <div className="-mx-1 my-1 h-px bg-proofound-stone/60" />
      <Link
        href="/auth/logout"
        role="menuitem"
        onClick={onClose}
        className="block w-full rounded-md px-2 py-1.5 text-left text-sm outline-none hover:bg-rose-50 hover:text-rose-600 focus:bg-rose-50 focus:text-rose-600"
      >
        Log out
      </Link>
    </div>
  );
}
