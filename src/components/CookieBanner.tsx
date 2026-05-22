'use client';

/**
 * Cookie Consent Banner Component
 *
 * GDPR-compliant cookie consent banner shown to users on first visit.
 * Stores consent in localStorage and tracks in database.
 *
 * Reference: DATA_SECURITY_PRIVACY_ARCHITECTURE.md
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { X, Cookie } from 'lucide-react';
import Link from 'next/link';
import { logError } from '@/lib/error-handler';
import { usePathname } from 'next/navigation';
import { hasGivenConsent, saveCookiePreferences } from '@/lib/cookies/consent';
import { cn } from '@/lib/utils';

export function CookieBanner() {
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);
  const pathname = usePathname();
  const isSnippetEmbedRoute = /^\/p\/[^/]+\/embed\/?$/.test(pathname ?? '');
  const isMobileAppRoute = /^\/app\//.test(pathname ?? '');
  const isLandingRoute = pathname === '/';

  useEffect(() => {
    if (isSnippetEmbedRoute) {
      setShow(false);
      return;
    }

    if (!hasGivenConsent()) {
      // Show banner after short delay for better UX
      const timer = setTimeout(() => setShow(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [isSnippetEmbedRoute]);

  const persistChoice = (
    preferences: { essential: boolean; analytics: boolean; marketing: boolean },
    context: string
  ) => {
    setSaving(true);
    setShow(false);

    void saveCookiePreferences(preferences, false)
      .catch((error) => {
        logError(context, error);
      })
      .finally(() => {
        setSaving(false);
      });
  };

  const handleAccept = () => {
    persistChoice(
      {
        essential: true,
        analytics: true,
        marketing: false,
      },
      'CookieBanner.handleAccept'
    );
  };

  const handleDecline = () => {
    persistChoice(
      {
        essential: true,
        analytics: false,
        marketing: false,
      },
      'CookieBanner.handleDecline'
    );
  };

  if (isSnippetEmbedRoute || !show) return null;

  return (
    <div
      className={cn(
        'pointer-events-none fixed inset-x-0 z-50 p-2 sm:p-4',
        isMobileAppRoute
          ? 'bottom-[4.75rem] md:bottom-0'
          : isLandingRoute
            ? 'bottom-3 sm:bottom-4'
            : 'bottom-0'
      )}
    >
      <Card className="pointer-events-auto mx-auto w-full max-w-4xl border border-proofound-stone/70 bg-white/95 shadow-[0_18px_54px_-38px_rgba(86,98,79,0.45)] backdrop-blur">
        <CardContent className={cn('p-3 sm:p-4', isMobileAppRoute && 'max-sm:p-2.5')}>
          <div className="flex flex-col gap-2 sm:gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <span className="mt-0.5 hidden h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#eef3e8] text-proofound-forest sm:flex">
                <Cookie className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-proofound-charcoal">Privacy choices</h3>
                <p
                  className={cn(
                    'mt-1 max-w-2xl text-xs leading-4 text-muted-foreground sm:leading-5',
                    isMobileAppRoute && 'max-sm:line-clamp-2'
                  )}
                >
                  Essential cookies keep Proofound working. Optional analytics help us improve the
                  product. We never sell your data.
                </p>
                <div
                  className={cn(
                    'mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs',
                    isMobileAppRoute && 'max-sm:hidden'
                  )}
                >
                  <Link
                    href="/privacy"
                    className="rounded-sm text-proofound-forest underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-proofound-forest focus-visible:ring-offset-2"
                  >
                    Privacy Policy
                  </Link>
                  <Link
                    href="/cookies"
                    className="rounded-sm text-proofound-forest underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-proofound-forest focus-visible:ring-offset-2"
                  >
                    Cookie Policy
                  </Link>
                  <Link
                    href={`/cookies/settings?returnTo=${encodeURIComponent(
                      typeof window !== 'undefined' ? window.location.pathname : '/'
                    )}`}
                    className="rounded-sm text-proofound-forest underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-proofound-forest focus-visible:ring-offset-2"
                  >
                    Cookie Settings
                  </Link>
                </div>
              </div>
            </div>

            <div className="grid shrink-0 grid-cols-[1fr_1fr_auto] items-center gap-2 md:flex">
              <Button
                onClick={handleAccept}
                disabled={saving}
                size="sm"
                className={cn('px-3', isMobileAppRoute && 'max-sm:h-9')}
              >
                Accept All
              </Button>
              <Button
                onClick={handleDecline}
                variant="outline"
                disabled={saving}
                size="sm"
                className={cn('px-3', isMobileAppRoute && 'max-sm:h-9')}
              >
                Essential Only
              </Button>
              <button
                onClick={handleDecline}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-proofound-stone/30 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-proofound-forest focus-visible:ring-offset-2 md:hidden"
                aria-label="Close cookie preferences"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
