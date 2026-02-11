'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';

const GlobalErrorHandler = dynamic(
  () => import('@/components/GlobalErrorHandler').then((mod) => mod.GlobalErrorHandler),
  { ssr: false }
);
const Toaster = dynamic(() => import('@/components/ui/sonner').then((mod) => mod.Toaster), {
  ssr: false,
});
const ChatWidget = dynamic(
  () => import('@/components/support/ChatWidget').then((mod) => mod.ChatWidget),
  {
    ssr: false,
  }
);
const CookieBanner = dynamic(
  () => import('@/components/CookieBanner').then((mod) => mod.CookieBanner),
  {
    ssr: false,
  }
);
const WebVitalsReporter = dynamic(
  () => import('@/components/WebVitalsReporter').then((mod) => mod.WebVitalsReporter),
  { ssr: false }
);
const PerformanceTracker = dynamic(
  () => import('@/components/PerformanceTracker').then((mod) => mod.PerformanceTracker),
  { ssr: false }
);
const SUSPromptHost = dynamic(
  () => import('@/components/surveys/SUSPromptHost').then((mod) => mod.SUSPromptHost),
  { ssr: false }
);

export function DeferredAppEnhancements() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let idleId: number | null = null;

    const onReady = () => setReady(true);
    const win = window as Window & {
      requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };

    if (typeof win.requestIdleCallback === 'function') {
      idleId = win.requestIdleCallback(onReady, { timeout: 2000 });
    } else {
      timeoutId = setTimeout(onReady, 1000);
    }

    return () => {
      if (idleId !== null && typeof win.cancelIdleCallback === 'function') {
        win.cancelIdleCallback(idleId);
      }
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }
    };
  }, []);

  if (!ready) {
    return null;
  }

  return (
    <>
      <GlobalErrorHandler />
      <SUSPromptHost />
      <Toaster />
      <ChatWidget />
      <CookieBanner />
      <PerformanceTracker />
      <WebVitalsReporter />
      <Analytics />
      <SpeedInsights />
    </>
  );
}
