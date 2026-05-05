'use client';

import { useEffect, useState } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import {
  COOKIE_PREFERENCES_CHANGED_EVENT,
  hasAnalyticsConsent,
  PREFERENCES_KEY,
} from '@/lib/cookies/consent';

/**
 * Mount non-essential telemetry only after explicit analytics consent.
 */
export function OptionalTelemetry() {
  const [telemetryEnabled, setTelemetryEnabled] = useState(false);

  useEffect(() => {
    const refresh = () => setTelemetryEnabled(hasAnalyticsConsent());
    refresh();

    const onStorage = (event: StorageEvent) => {
      if (event.key === PREFERENCES_KEY) {
        refresh();
      }
    };

    window.addEventListener('storage', onStorage);
    window.addEventListener(COOKIE_PREFERENCES_CHANGED_EVENT, refresh);

    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener(COOKIE_PREFERENCES_CHANGED_EVENT, refresh);
    };
  }, []);

  if (!telemetryEnabled) {
    return null;
  }

  return (
    <>
      <Analytics />
      <SpeedInsights />
    </>
  );
}
