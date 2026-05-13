'use client';

import * as React from 'react';

type CommandPaletteDialogComponent = React.ComponentType<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
}>;

export function CommandPalette() {
  const [open, setOpen] = React.useState(false);
  const [Dialog, setDialog] = React.useState<CommandPaletteDialogComponent | null>(null);

  React.useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        return;
      }

      if (event.key === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((currentOpen) => !currentOpen);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  React.useEffect(() => {
    if (!open || Dialog) {
      return;
    }

    let cancelled = false;

    void import('./CommandPaletteDialog').then((module) => {
      if (!cancelled) {
        setDialog(() => module.CommandPaletteDialog);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [Dialog, open]);

  if (!open || !Dialog) {
    return null;
  }

  return <Dialog open={open} onOpenChange={setOpen} />;
}
