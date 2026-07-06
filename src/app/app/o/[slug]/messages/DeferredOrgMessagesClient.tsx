'use client';

import { useEffect, useState, type ComponentType } from 'react';

type OrgMessagesClientProps = {
  currentUserId: string;
  hideHeader?: boolean;
};

export function LoadingOrganizationMessages() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex h-full min-h-[320px] items-center justify-center rounded-xl border border-proofound-stone/70 bg-white/70 px-5 text-center shadow-sm"
    >
      <div className="max-w-sm space-y-2">
        <p className="text-sm font-semibold text-proofound-charcoal">
          Preparing organization messages
        </p>
        <p className="text-xs leading-5 text-muted-foreground">
          Loading the team conversation context before showing threads, intros, and reveal requests.
        </p>
      </div>
    </div>
  );
}

export function DeferredOrgMessagesClient({ currentUserId, hideHeader }: OrgMessagesClientProps) {
  const [MessagesView, setMessagesView] = useState<ComponentType<OrgMessagesClientProps> | null>(
    null
  );

  useEffect(() => {
    let cancelled = false;

    void import('./OrgMessagesClient').then((module) => {
      if (!cancelled) {
        setMessagesView(() => module.OrgMessagesClient);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  if (!MessagesView) {
    return <LoadingOrganizationMessages />;
  }

  return <MessagesView currentUserId={currentUserId} hideHeader={hideHeader} />;
}
