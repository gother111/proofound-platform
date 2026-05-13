'use client';

import { signOut } from '@/actions/auth';

interface TopBarProfileMenuProps {
  userName: string;
  onClose: () => void;
}

export function TopBarProfileMenu({ userName, onClose }: TopBarProfileMenuProps) {
  return (
    <div
      role="menu"
      aria-label="Profile menu"
      className="absolute right-0 top-full z-50 mt-2 w-48 rounded-xl border border-proofound-stone/60 bg-white p-1 text-proofound-charcoal shadow-lg"
    >
      <div className="flex flex-col px-2 py-1.5">
        <span className="text-sm font-medium">{userName}</span>
        <span className="text-xs text-muted-foreground">Signed in</span>
      </div>
      <div className="-mx-1 my-1 h-px bg-proofound-stone/60" />
      <form action={signOut}>
        <button
          type="submit"
          role="menuitem"
          onClick={onClose}
          className="w-full rounded-md px-2 py-1.5 text-left text-sm outline-none hover:bg-rose-50 hover:text-rose-600 focus:bg-rose-50 focus:text-rose-600"
        >
          Log out
        </button>
      </form>
    </div>
  );
}
