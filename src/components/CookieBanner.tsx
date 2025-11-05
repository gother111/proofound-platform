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

const CONSENT_KEY = 'proofound-cookie-consent';
const CONSENT_VERSION = 'v1.0.2025-11-06';

export function CookieBanner() {
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Check if user already consented
    const storedConsent = localStorage.getItem(CONSENT_KEY);
    if (!storedConsent || storedConsent !== CONSENT_VERSION) {
      // Show banner after short delay for better UX
      const timer = setTimeout(() => setShow(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = async () => {
    try {
      setSaving(true);

      // Store in localStorage
      localStorage.setItem(CONSENT_KEY, CONSENT_VERSION);

      // Store in database if user is authenticated
      try {
        await fetch('/api/user/consent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            consentType: 'analytics_tracking',
            consented: true,
            version: CONSENT_VERSION,
          }),
        });
      } catch (error) {
        // Silently fail if not authenticated - localStorage is sufficient
        console.error('Failed to store consent in database:', error);
      }

      setShow(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDecline = () => {
    // Store decline in localStorage
    localStorage.setItem(CONSENT_KEY, `${CONSENT_VERSION}-declined`);
    setShow(false);
  };

  if (!show) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-in slide-in-from-bottom duration-300"
      style={{ maxWidth: '100vw' }}
    >
      <Card className="mx-auto max-w-4xl border-2 shadow-lg">
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
                  We use essential cookies to make Proofound work, and optional analytics cookies
                  to understand how you use our platform and improve your experience. We never sell
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
                <Button onClick={handleAccept} disabled={saving} size="sm">
                  Accept All
                </Button>
                <Button
                  onClick={handleDecline}
                  variant="outline"
                  size="sm"
                  disabled={saving}
                >
                  Essential Only
                </Button>
                <Link
                  href="/privacy"
                  className="text-xs text-muted-foreground hover:text-foreground underline ml-auto"
                >
                  Privacy Policy
                </Link>
                <Link
                  href="/cookies"
                  className="text-xs text-muted-foreground hover:text-foreground underline"
                >
                  Cookie Policy
                </Link>
              </div>
            </div>

            {/* Close button (mobile only) */}
            <button
              onClick={handleDecline}
              className="sm:hidden text-muted-foreground hover:text-foreground flex-shrink-0"
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

