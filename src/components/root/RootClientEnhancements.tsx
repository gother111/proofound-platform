'use client';

import { useEffect, useState, type ComponentType } from 'react';

const ENHANCEMENT_IDLE_TIMEOUT_MS = 1200;

interface RootEnhancementComponents {
  SonnerToaster: ComponentType;
  LegacyToaster: ComponentType;
  CookieBanner: ComponentType;
  OptionalTelemetry: ComponentType;
  DeferredAppEnhancements: ComponentType;
}

function scheduleAfterInitialPaint(callback: () => void) {
  if (typeof window.requestIdleCallback === 'function') {
    const idleId = window.requestIdleCallback(callback, {
      timeout: ENHANCEMENT_IDLE_TIMEOUT_MS,
    });
    const fallbackTimer = window.setTimeout(callback, ENHANCEMENT_IDLE_TIMEOUT_MS);

    return () => {
      window.cancelIdleCallback(idleId);
      window.clearTimeout(fallbackTimer);
    };
  }

  const timer = window.setTimeout(callback, 250);
  return () => window.clearTimeout(timer);
}

export function RootClientEnhancements() {
  const [components, setComponents] = useState<RootEnhancementComponents | null>(null);

  useEffect(() => {
    let cancelled = false;
    let hasStarted = false;

    const loadEnhancements = () => {
      if (cancelled || hasStarted) return;
      hasStarted = true;

      void Promise.all([
        import('@/components/ui/sonner'),
        import('@/components/ui/toaster'),
        import('@/components/CookieBanner'),
        import('@/components/OptionalTelemetry'),
        import('@/components/root/DeferredAppEnhancements'),
      ]).then(([sonner, legacyToaster, cookieBanner, telemetry, appEnhancements]) => {
        if (cancelled) return;

        setComponents({
          SonnerToaster: sonner.Toaster,
          LegacyToaster: legacyToaster.Toaster,
          CookieBanner: cookieBanner.CookieBanner,
          OptionalTelemetry: telemetry.OptionalTelemetry,
          DeferredAppEnhancements: appEnhancements.DeferredAppEnhancements,
        });
      });
    };

    const cancelSchedule = scheduleAfterInitialPaint(loadEnhancements);

    return () => {
      cancelled = true;
      cancelSchedule();
    };
  }, []);

  if (!components) {
    return null;
  }

  const { SonnerToaster, LegacyToaster, CookieBanner, OptionalTelemetry, DeferredAppEnhancements } =
    components;

  return (
    <>
      <SonnerToaster />
      <LegacyToaster />
      <DeferredAppEnhancements />
      <CookieBanner />
      <OptionalTelemetry />
    </>
  );
}
