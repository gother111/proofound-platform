'use client';

import { useEffect, useState, type ComponentType } from 'react';
import LoadingIndividualMessages from './loading';

export function DeferredMessagesClient() {
  const [MessagesView, setMessagesView] = useState<ComponentType | null>(null);

  useEffect(() => {
    let cancelled = false;

    void import('./MessagesClient').then((module) => {
      if (!cancelled) {
        setMessagesView(() => module.MessagesClient);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  if (!MessagesView) {
    return <LoadingIndividualMessages />;
  }

  return <MessagesView />;
}
