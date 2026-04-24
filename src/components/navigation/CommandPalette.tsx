'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Command } from 'cmdk';
import {
  Search,
  Compass,
  LayoutDashboard,
  Briefcase,
  FileCheck,
  LogOut,
  Settings,
} from 'lucide-react';

export function CommandPalette() {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        return;
      }

      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const runCommand = React.useCallback((command: () => unknown) => {
    setOpen(false);
    command();
  }, []);

  if (!open) return null;

  return (
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm transition-all"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          setOpen(false);
        }
      }}
      role="presentation"
    >
      <div
        className="fixed left-[50%] top-[20%] z-50 w-full max-w-lg translate-x-[-50%] p-4"
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
      >
        <Command
          className="flex h-full w-full flex-col overflow-hidden rounded-xl bg-background shadow-2xl border border-border"
          loop
        >
          <div className="flex items-center border-b px-3" cmdk-input-wrapper="">
            <Search className="mr-2 h-5 w-5 shrink-0 opacity-50" />
            <Command.Input
              // eslint-disable-next-line jsx-a11y/no-autofocus
              autoFocus
              placeholder="Type a command or search..."
              className="flex h-14 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <Command.List className="max-h-[300px] overflow-y-auto overflow-x-hidden p-2">
            <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
              No results found.
            </Command.Empty>

            <Command.Group
              heading="Navigation"
              className="px-2 py-1.5 text-xs font-medium text-muted-foreground"
            >
              <Command.Item
                onSelect={() => runCommand(() => router.push('/app/i/home'))}
                className="relative flex cursor-default select-none items-center rounded-sm px-2 py-2.5 text-sm outline-none aria-selected:bg-proofound-forest aria-selected:text-white data-[disabled]:pointer-events-none data-[disabled]:opacity-50 transition-colors"
              >
                <LayoutDashboard className="mr-2 h-4 w-4" />
                <span>Overview</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => router.push('/app/i/matching'))}
                className="relative flex cursor-default select-none items-center rounded-sm px-2 py-2.5 text-sm outline-none aria-selected:bg-proofound-forest aria-selected:text-white data-[disabled]:pointer-events-none data-[disabled]:opacity-50 transition-colors"
              >
                <Compass className="mr-2 h-4 w-4" />
                <span>Matching</span>
              </Command.Item>
              <Command.Item
                onSelect={() =>
                  runCommand(() => router.push('/app/i/profile?profileView=full&tab=visibility'))
                }
                className="relative flex cursor-default select-none items-center rounded-sm px-2 py-2.5 text-sm outline-none aria-selected:bg-proofound-forest aria-selected:text-white data-[disabled]:pointer-events-none data-[disabled]:opacity-50 transition-colors"
              >
                <Briefcase className="mr-2 h-4 w-4" />
                <span>Portfolio visibility</span>
              </Command.Item>
            </Command.Group>

            <Command.Separator className="-mx-2 my-1 h-px bg-border" />

            <Command.Group
              heading="Actions"
              className="px-2 py-1.5 text-xs font-medium text-muted-foreground"
            >
              <Command.Item
                onSelect={() => runCommand(() => router.push('/app/i/verifications'))}
                className="relative flex cursor-default select-none items-center rounded-sm px-2 py-2.5 text-sm outline-none aria-selected:bg-proofound-forest aria-selected:text-white data-[disabled]:pointer-events-none data-[disabled]:opacity-50 transition-colors"
              >
                <FileCheck className="mr-2 h-4 w-4" />
                <span>Review verifications</span>
              </Command.Item>
            </Command.Group>

            <Command.Separator className="-mx-2 my-1 h-px bg-border" />

            <Command.Group
              heading="Settings"
              className="px-2 py-1.5 text-xs font-medium text-muted-foreground"
            >
              <Command.Item
                onSelect={() => runCommand(() => router.push('/app/i/settings'))}
                className="relative flex cursor-default select-none items-center rounded-sm px-2 py-2.5 text-sm outline-none aria-selected:bg-proofound-forest aria-selected:text-white data-[disabled]:pointer-events-none data-[disabled]:opacity-50 transition-colors"
              >
                <Settings className="mr-2 h-4 w-4" />
                <span>Account Settings</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => router.push('/auth/logout'))}
                className="relative flex cursor-default select-none items-center rounded-sm px-2 py-2.5 text-sm outline-none aria-selected:bg-red-50 aria-selected:text-red-900 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 transition-colors text-red-600"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log Out</span>
              </Command.Item>
            </Command.Group>
          </Command.List>
        </Command>
      </div>
    </div>
  );
}
