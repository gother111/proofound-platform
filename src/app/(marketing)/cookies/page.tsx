import Link from 'next/link';
import type { Metadata } from 'next';
import { MarketingPage } from '../_components/MarketingPage';
import { POLICY_EFFECTIVE_DATES, POLICY_VERSIONS } from '@/lib/privacy/policy-version-config';

export const metadata: Metadata = {
  title: 'Cookie Policy',
  description: 'How Proofound uses cookies and how you control them.',
};

export default function CookiesPage() {
  return (
    <MarketingPage
      title="Cookie Policy"
      description="Proofound uses strictly necessary cookies by default and optional analytics cookies only with your consent."
      ctaLabel="Manage cookies"
      ctaHref="/cookies/settings"
    >
      <div className="space-y-4 text-base leading-relaxed text-muted-foreground">
        <p>
          Effective date: {POLICY_EFFECTIVE_DATES.cookie} · Version: {POLICY_VERSIONS.cookie}
        </p>
        <p>
          Necessary cookies support authentication, security, and core platform functionality. These
          cannot be switched off.
        </p>
        <p>
          Analytics cookies are optional. We only activate non-essential telemetry after explicit
          consent. You can withdraw or change your preferences at any time.
        </p>
        <p>We do not use third-party advertising cookies and we do not sell personal data.</p>
      </div>
      <Link
        href="/cookies/settings"
        className="text-sm font-semibold text-proofound-forest underline underline-offset-4"
      >
        Open cookie settings
      </Link>
    </MarketingPage>
  );
}
