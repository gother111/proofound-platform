'use client';

import Link from 'next/link';
import { Logo } from '@/components/brand/Logo';

export function FooterSection() {
  return (
    <footer
      data-testid="landing-footer-section"
      className="border-t border-[var(--landing-border)] bg-[var(--landing-surface)] py-14"
    >
      <div className="mx-auto flex max-w-[1240px] flex-col gap-10 px-6 lg:flex-row lg:items-center lg:justify-between lg:px-10">
        <div className="flex items-center gap-4">
          <Link href="/" aria-label="Proofound home" className="flex items-center gap-3">
            <Logo size="sm" />
            <span className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--landing-dark)]">
              Proofound
            </span>
          </Link>
        </div>

        <nav className="flex flex-wrap gap-x-8 gap-y-3 text-sm text-[var(--landing-text)]">
          <Link href="/cookies" className="transition-colors hover:text-[var(--landing-dark)]">
            Cookies
          </Link>
          <Link
            href="/cookies/settings"
            className="transition-colors hover:text-[var(--landing-dark)]"
          >
            Cookie settings
          </Link>
          <Link href="/privacy" className="transition-colors hover:text-[var(--landing-dark)]">
            Privacy
          </Link>
          <Link href="/terms" className="transition-colors hover:text-[var(--landing-dark)]">
            Terms
          </Link>
          <Link
            href="/login"
            className="font-semibold text-[var(--landing-dark)] hover:text-[var(--landing-clay)]"
          >
            Sign in
          </Link>
        </nav>
      </div>
    </footer>
  );
}
