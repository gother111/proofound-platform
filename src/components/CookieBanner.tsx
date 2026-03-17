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

export function CookieBanner() {
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);
  const pathname = usePathname();
  const isSnippetEmbedRoute = /^\/p\/[^/]+\/embed\/?$/.test(pathname ?? '');

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

  const handleAccept = async () => {
    try {
      setSaving(true);

      await saveCookiePreferences(
        {
          essential: true,
          analytics: true,
          marketing: false,
        },
        true
      );

      setShow(false);
    } catch (error) {
      logError('CookieBanner.handleAccept', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDecline = async () => {
    try {
      setSaving(true);
      await saveCookiePreferences(
        {
          essential: true,
          analytics: false,
          marketing: false,
        },
        true
      );
      setShow(false);
    } catch (error) {
      logError('CookieBanner.handleDecline', error);
      setShow(false);
    } finally {
      setSaving(false);
    }
  };

  if (isSnippetEmbedRoute || !show) return null;

  return (
    <div className="fixed bottom-0 left-0 md:left-auto md:right-0 z-50 p-4 md:p-6 animate-in slide-in-from-bottom duration-300 pointer-events-none w-full md:w-[450px]">
      <Card className="mx-auto w-full border-2 shadow-lg pointer-events-auto">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-start gap-4">
            {/* Icon */}
            <div className="hidden sm:flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 flex-shrink-0">
              <Cookie className="h-6 w-6 text-primary" />
            </div>

            {/* Content */}
            <div className="flex-1 space-y-3">
              <div>
                <h3 className="font-semibold text-lg mb-1">🍪 We Value Your Privacy</h3>
                <p className="text-sm text-muted-foreground">
                  We use essential cookies to make Proofound work, and optional analytics cookies to
                  understand how you use our platform and improve your experience. We never sell
                  your data.
                </p>
              </div>

              <div className="text-xs text-muted-foreground">
                <p>
                  <strong>Essential cookies:</strong> Required for authentication and core
                  functionality (always active)
                </p>
                <p className="mt-1">
                  <strong>Analytics cookies:</strong> Help us understand usage patterns (your
                  choice)
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button onClick={handleAccept} disabled={saving} size="touch">
                  Accept All
                </Button>
                <Button onClick={handleDecline} variant="outline" disabled={saving} size="touch">
                  Essential Only
                </Button>
                <Link
                  href="/privacy"
                  className="text-xs text-muted-foreground hover:text-foreground underline ml-auto inline-flex min-h-[44px] items-center px-2 -mx-2"
                >
                  Privacy Policy
                </Link>
                <Link
                  href="/cookies"
                  className="text-xs text-muted-foreground hover:text-foreground underline inline-flex min-h-[44px] items-center px-2 -mx-2"
                >
                  Cookie Policy
                </Link>
                <Link
                  href={`/cookies/settings?returnTo=${encodeURIComponent(typeof window !== 'undefined' ? window.location.pathname : '/')}`}
                  className="text-xs text-muted-foreground hover:text-foreground underline inline-flex min-h-[44px] items-center px-2 -mx-2"
                >
                  Cookie Settings
                </Link>
              </div>
            </div>

            {/* Close button (mobile only) */}
            <button
              onClick={handleDecline}
              className="sm:hidden text-muted-foreground hover:text-foreground flex-shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
