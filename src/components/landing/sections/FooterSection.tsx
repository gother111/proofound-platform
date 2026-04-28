'use client';

import React from 'react';
import Link from 'next/link';

interface FooterSectionProps {
  shouldReduceMotion?: boolean | null;
}

export function FooterSection({ shouldReduceMotion }: FooterSectionProps) {
  const currentYear = new Date().getFullYear();

  void shouldReduceMotion;

  return (
    <footer
      id="footer"
      data-testid="landing-footer-section"
      className="border-t border-white/35 px-6 pb-12 pt-10 md:px-10"
    >
      <div className="mx-auto max-w-7xl">
        <div className="rounded-[2rem] border border-white/55 bg-white/58 px-5 py-6 backdrop-blur-[18px] md:px-8 md:py-7">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="space-y-3">
              <Link href="/" className="inline-flex items-center gap-3" aria-label="Proofound home">
                <img
                  src="/logo.png"
                  alt="Proofound"
                  width={120}
                  height={48}
                  loading="eager"
                  decoding="async"
                  className="h-11 w-auto"
                />
                <span className="text-sm uppercase tracking-[0.28em] text-foreground/48">
                  Proofound
                </span>
              </Link>
              <p className="max-w-xl text-sm leading-6 text-muted-foreground">
                Evidence-based hiring for a world with too much polished signal and too little
                proof.
              </p>
            </div>

            <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-foreground/62">
              <Link href="/cookies" className="transition-colors hover:text-foreground">
                Cookies
              </Link>
              <Link href="/cookies/settings" className="transition-colors hover:text-foreground">
                Cookie settings
              </Link>
              <Link href="/privacy" className="transition-colors hover:text-foreground">
                Privacy
              </Link>
              <Link href="/terms" className="transition-colors hover:text-foreground">
                Terms
              </Link>
              <Link href="/login" className="transition-colors hover:text-foreground">
                Sign in
              </Link>
            </nav>
          </div>

          <div className="mt-6 border-t border-border/70 pt-4 text-sm text-foreground/48 md:flex md:items-center md:justify-between">
            <p>&copy; {currentYear} Proofound. Privacy-first by design.</p>
            <p className="mt-2 md:mt-0">Calm signal. Clearer proof. Better fit.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
