'use client';

import Link from 'next/link';
import { ArrowLeft, Cookie } from 'lucide-react';
import { CookiePreferences } from '@/components/cookies/CookiePreferences';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

/**
 * Cookie Settings Page
 *
 * Allows users to manage granular cookie preferences
 * Accessible from cookie banner's "Cookie Settings" link
 * GDPR-compliant with clear category descriptions
 *
 * Supports returnTo parameter to redirect back after saving
 */

function CookieSettingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get('returnTo') || '/';

  // After saving preferences, redirect to the original page
  const handleSave = () => {
    router.push(returnTo);
  };

  return (
    <div className="min-h-screen bg-[#F7F6F1]">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link
              href={returnTo}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
            {/* Logo */}
            <Link href="/" className="font-serif text-2xl font-bold text-proofound-forest">
              Proofound
            </Link>
            <div className="w-24" /> {/* Spacer for centering */}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Page Title */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Cookie className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold text-proofound-forest mb-3">Cookie Settings</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Manage your cookie preferences to control how we collect and use your data. Your choices
            help us respect your privacy while improving your experience.
          </p>
        </div>

        {/* GDPR Notice */}
        <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-900">
            <strong>Your Privacy Matters:</strong> We are committed to protecting your data under
            GDPR regulations. You can change these settings at any time. Essential cookies are
            required for the site to function and cannot be disabled.
          </p>
        </div>

        {/* Cookie Preferences Component with onSave callback */}
        <CookiePreferences onSave={handleSave} />

        {/* Additional Information */}
        <div className="mt-12 pt-8 border-t space-y-4">
          <h2 className="text-xl font-semibold text-proofound-forest mb-4">Learn More</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <Link
              href="/privacy"
              className="p-4 border rounded-lg hover:border-primary hover:bg-primary/5 transition-colors"
            >
              <h3 className="font-semibold mb-1">Privacy Policy</h3>
              <p className="text-sm text-muted-foreground">
                Read our complete privacy policy to understand how we protect your data.
              </p>
            </Link>

            <Link
              href="/cookies"
              className="p-4 border rounded-lg hover:border-primary hover:bg-primary/5 transition-colors"
            >
              <h3 className="font-semibold mb-1">Cookie Policy</h3>
              <p className="text-sm text-muted-foreground">
                Detailed information about the cookies we use and why.
              </p>
            </Link>
          </div>
        </div>

        {/* Support Section */}
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            Have questions about cookies or privacy?{' '}
            <Link href="/support" className="text-primary hover:underline">
              Contact our support team
            </Link>
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t mt-16 py-8 bg-white">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Proofound. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default function CookieSettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F7F6F1] flex items-center justify-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      }
    >
      <CookieSettingsContent />
    </Suspense>
  );
}
