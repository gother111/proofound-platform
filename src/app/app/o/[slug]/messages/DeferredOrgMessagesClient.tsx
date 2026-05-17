'use client';

import { useEffect, useState, type ComponentType } from 'react';

type OrgMessagesClientProps = {
  currentUserId: string;
};

function LoadingOrganizationMessages() {
  return (
    <div className="h-full flex items-center justify-center">
      <p className="text-muted-foreground">Loading...</p>
    </div>
  );
}

export function DeferredOrgMessagesClient({ currentUserId }: OrgMessagesClientProps) {
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

  return <MessagesView currentUserId={currentUserId} />;
}
