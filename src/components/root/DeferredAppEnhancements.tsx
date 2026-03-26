'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';

import { ChatWidget } from '@/components/support/ChatWidget';

const IDLE_TIMEOUT_MS = 1500;

function isSnippetEmbedRoute(pathname: string | null): boolean {
  return /^\/p\/[^/]+\/embed\/?$/.test(pathname ?? '');
}

function isAppRoute(pathname: string | null): boolean {
  return pathname === '/app' || (pathname?.startsWith('/app/') ?? false);
}

export function DeferredAppEnhancements() {
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const shouldDeferMount = useMemo(
    () => isAppRoute(pathname) && !isSnippetEmbedRoute(pathname),
    [pathname]
  );

  useEffect(() => {
    setReady(false);

    if (!shouldDeferMount) {
      return;
    }

    let active = true;
    let fallbackTimer: number | null = null;
    let idleId: number | null = null;

    const activate = () => {
      if (!active) return;
      setReady(true);
    };

    if (typeof window !== 'undefined' && typeof window.requestIdleCallback === 'function') {
      idleId = window.requestIdleCallback(activate, { timeout: IDLE_TIMEOUT_MS });
      fallbackTimer = window.setTimeout(activate, IDLE_TIMEOUT_MS);
    } else {
      fallbackTimer = window.setTimeout(activate, 250);
    }

    return () => {
      active = false;
      if (fallbackTimer) {
        window.clearTimeout(fallbackTimer);
      }
      if (idleId !== null && typeof window.cancelIdleCallback === 'function') {
        window.cancelIdleCallback(idleId);
      }
    };
  }, [shouldDeferMount]);

  if (!shouldDeferMount || !ready) {
    return null;
  }

  return (
    <>
      <ChatWidget />
    </>
  );
}
