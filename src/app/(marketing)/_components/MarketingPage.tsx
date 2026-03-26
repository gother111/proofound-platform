import Link from 'next/link';
import type { ReactNode } from 'react';

type MarketingPageProps = {
  title: string;
  description: string;
  children?: ReactNode;
  ctaLabel?: string;
  ctaHref?: string;
};

// Simple, shared marketing layout to avoid repeated markup across static pages.
export function MarketingPage({
  title,
  description,
  children,
  ctaLabel = 'Return to home',
  ctaHref = '/',
}: MarketingPageProps) {
  const trustLinks = [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
    { label: 'Cookie Policy', href: '/cookies' },
  ];

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-4xl flex-col gap-6 px-6 py-16 md:px-10">
      <div className="flex flex-col gap-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Proofound
        </p>
        <h1 className="text-3xl font-semibold text-foreground md:text-4xl">{title}</h1>
        <p className="text-base text-muted-foreground">{description}</p>
      </div>

      {children ? <div className="flex flex-col gap-4">{children}</div> : null}

      <div>
        <Link
          href={ctaHref}
          className="inline-flex items-center rounded-lg bg-proofound-forest px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:translate-y-[-1px] hover:bg-proofound-forest/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-proofound-forest"
        >
          {ctaLabel}
        </Link>
      </div>

      <div className="rounded-xl border border-border bg-card/30 p-4">
        <p className="text-sm text-muted-foreground">
          Need policy details? Use these launch-safe legal links:
        </p>
        <nav aria-label="Support and legal navigation" className="mt-3 flex flex-wrap gap-4">
          {trustLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-semibold text-proofound-forest underline underline-offset-4"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </main>
  );
}
