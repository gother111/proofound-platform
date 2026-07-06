'use client';

import { useEffect, useState, type ComponentType } from 'react';
import { usePathname } from 'next/navigation';

type TourProviderComponent = ComponentType;

const TOUR_IDLE_TIMEOUT_MS = 1600;

function isTourHomePath(pathname: string | null): boolean {
  if (!pathname) return false;
  if (pathname === '/app/i/home') return true;
  return /^\/app\/o\/[^/]+\/home$/.test(pathname);
}

function scheduleAfterInitialPaint(callback: () => void) {
  let hasRun = false;
  const runOnce = () => {
    if (hasRun) return;
    hasRun = true;
    callback();
  };

  if (typeof window.requestIdleCallback === 'function') {
    const idleId = window.requestIdleCallback(runOnce, { timeout: TOUR_IDLE_TIMEOUT_MS });
    const fallbackTimer = window.setTimeout(runOnce, TOUR_IDLE_TIMEOUT_MS);

    return () => {
      hasRun = true;
      window.cancelIdleCallback(idleId);
      window.clearTimeout(fallbackTimer);
    };
  }

  const timer = window.setTimeout(runOnce, 350);
  return () => {
    hasRun = true;
    window.clearTimeout(timer);
  };
}

export function DeferredTourProvider() {
  const pathname = usePathname();
  const [TourProvider, setTourProvider] = useState<TourProviderComponent | null>(null);

  useEffect(() => {
    if (!isTourHomePath(pathname) || TourProvider) {
      return;
    }

    let cancelled = false;
    const cancelSchedule = scheduleAfterInitialPaint(() => {
      void import('./TourProvider').then((module) => {
        if (!cancelled) {
          setTourProvider(() => module.TourProvider);
        }
      });
    });

    return () => {
      cancelled = true;
      cancelSchedule();
    };
  }, [TourProvider, pathname]);

  if (!TourProvider || !isTourHomePath(pathname)) {
    return null;
  }

  return <TourProvider />;
}
