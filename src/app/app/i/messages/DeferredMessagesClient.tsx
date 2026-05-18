'use client';

import { useEffect, useState, type ComponentType } from 'react';
import { Button } from '@/components/ui/button';
import LoadingIndividualMessages from './loading';

type MessagesLoader = () => Promise<{ MessagesClient: ComponentType }>;

const loadMessagesClient: MessagesLoader = () => import('./MessagesClient');

export function DeferredMessagesClient({
  loadMessagesView = loadMessagesClient,
}: {
  loadMessagesView?: MessagesLoader;
}) {
  const [MessagesView, setMessagesView] = useState<ComponentType | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    setLoadError(false);

    void loadMessagesView()
      .then((module) => {
        if (!cancelled) {
          setMessagesView(() => module.MessagesClient);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLoadError(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [loadMessagesView, retryKey]);

  if (loadError) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="rounded-2xl border border-proofound-stone/80 bg-white/75 p-5 shadow-sm sm:p-6">
          <p className="text-sm font-medium text-muted-foreground">Messages</p>
          <h1 className="mt-2 font-display text-2xl font-semibold text-proofound-charcoal">
            Conversations could not load
          </h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Your messages are still safe. Retry this section to load conversation threads and reveal
            requests.
          </p>
          <Button className="mt-5" variant="outline" onClick={() => setRetryKey((key) => key + 1)}>
            Retry conversations
          </Button>
        </div>
      </div>
    );
  }

  if (!MessagesView) {
    return <LoadingIndividualMessages />;
  }

  return <MessagesView />;
}
