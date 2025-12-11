import Link from 'next/link';
import type { Metadata } from 'next';
import { MarketingPage } from '../_components/MarketingPage';

export const metadata: Metadata = {
  title: 'Cookie Preferences',
  description: 'How Proofound uses cookies and how you control them.',
};

export default function CookiesPage() {
  return (
    <MarketingPage
      title="Cookie Preferences"
      description="We keep cookies minimal: sign-in essentials plus optional analytics with your consent."
      ctaLabel="Manage cookies"
      ctaHref="/cookies/settings"
    >
      <p className="text-base leading-relaxed text-muted-foreground">
        We use only what is needed for secure sign-in and optional analytics to improve the product.
        No ads. You can adjust or withdraw consent anytime in settings.
      </p>
      <Link
        href="/cookies/settings"
        className="text-sm font-semibold text-proofound-forest underline underline-offset-4"
      >
        Open cookie settings
      </Link>
    </MarketingPage>
  );
}
