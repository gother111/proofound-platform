import { Metadata } from 'next';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { NetworkBackground } from '@/components/NetworkBackground';
import { ArrowLeft, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { JsonLdScripts } from '@/components/seo/JsonLdScripts';
import { POLICY_EFFECTIVE_DATES, POLICY_VERSIONS } from '@/lib/privacy/policy-version-config';
import { buildStaticPageJsonLd } from '@/lib/seo/json-ld';
import { buildPublicMetadata } from '@/lib/seo/public-metadata';

export const metadata: Metadata = buildPublicMetadata({
  title: 'Privacy Policy | Proofound privacy and consent controls',
  description:
    'Read how Proofound collects and processes personal information, applies consent controls, secures account and proof records, and supports user rights requests.',
  path: '/privacy',
});

export const dynamic = 'force-dynamic';

export default function PrivacyPolicyPage() {
  const effectiveDate = POLICY_EFFECTIVE_DATES.privacy;
  const version = POLICY_VERSIONS.privacy;
  const jsonLdItems = buildStaticPageJsonLd({
    path: '/privacy',
    title: 'Privacy Policy | Proofound privacy and consent controls',
    description:
      'Read how Proofound collects and processes personal information, applies consent controls, secures account and proof records, and supports user rights requests.',
  });

  return (
    <div className="relative min-h-screen bg-japandi-bg text-foreground">
      <JsonLdScripts items={jsonLdItems} idPrefix="privacy-jsonld" />
      <div className="pointer-events-none absolute inset-0 opacity-60">
        <NetworkBackground />
      </div>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(28,77,58,0.08),transparent_55%),radial-gradient(circle_at_85%_80%,rgba(199,107,74,0.07),transparent_65%)]" />

      <div className="relative z-10">
        <header className="border-b border-proofound-stone bg-white/80 backdrop-blur-sm">
          <div className="mx-auto max-w-4xl px-6 py-6">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm text-[#2D333099] transition-colors hover:text-proofound-forest"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>
          </div>
        </header>

        <main className="mx-auto max-w-4xl px-6 py-16">
          <div className="mb-12 text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-proofound-forest shadow-[0_8px_18px_rgba(28,77,58,0.28)]">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <h1 className="font-display text-[40px] font-semibold leading-[48px] tracking-[-0.02em] text-foreground">
              Privacy Policy
            </h1>
            <p className="mt-4 text-sm text-[#2D333099]">
              Effective date: {effectiveDate} · Version: {version}
            </p>
          </div>

          <Card className="rounded-2xl border border-proofound-stone bg-white p-10 shadow-[0_4px_24px_rgba(29,51,48,0.08)]">
            <div className="space-y-8 text-[#2D3330CC]">
              <section>
                <h2 className="font-display text-2xl font-semibold text-foreground">1. Scope</h2>
                <p className="mt-3 leading-7">
                  This policy explains how Proofound collects, uses, stores, and protects personal
                  information across account creation, Proof Pack creation, portfolio publication,
                  assignment review, verification, and user rights handling. Processing is performed
                  under applicable privacy laws, including GDPR and ePrivacy rules.
                </p>
              </section>

              <section>
                <h2 className="font-display text-2xl font-semibold text-foreground">
                  2. Data We Process
                </h2>
                <ul className="mt-3 list-disc space-y-2 pl-6 leading-7">
                  <li>Account records: email, display name, authentication identifiers.</li>
                  <li>
                    Profile information: expertise, projects, preferences, and verification status.
                  </li>
                  <li>
                    Operational records: moderation reports, consent records, security and audit
                    logs.
                  </li>
                  <li>
                    Optional analytics events: telemetry only when analytics consent is granted.
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="font-display text-2xl font-semibold text-foreground">
                  3. Legal Bases and Consent
                </h2>
                <p className="mt-3 leading-7">
                  We process data based on contract performance, legitimate interests, and explicit
                  consent where required. Non-essential analytics are disabled by default and only
                  enabled after affirmative cookie consent. Consent can be changed at any time in
                  cookie settings.
                </p>
              </section>

              <section>
                <h2 className="font-display text-2xl font-semibold text-foreground">
                  4. Data Minimization and Security
                </h2>
                <p className="mt-3 leading-7">
                  We apply data minimization by default and use access controls, encryption in
                  transit, and row-level security for protected tables. Where telemetry is retained,
                  personal identifiers are hashed or omitted.
                </p>
              </section>

              <section>
                <h2 className="font-display text-2xl font-semibold text-foreground">
                  5. International Transfers
                </h2>
                <p className="mt-3 leading-7">
                  If personal data is processed outside your region, we rely on approved transfer
                  mechanisms and contractual safeguards required by law.
                </p>
              </section>

              <section>
                <h2 className="font-display text-2xl font-semibold text-foreground">
                  6. Retention and Deletion
                </h2>
                <p className="mt-3 leading-7">
                  Account deletion requests are executed immediately. Associated data is deleted or
                  anonymized according to technical and legal constraints. We retain only what is
                  required for security, compliance, or legal obligations.
                </p>
              </section>

              <section>
                <h2 className="font-display text-2xl font-semibold text-foreground">
                  7. Your Rights
                </h2>
                <ul className="mt-3 list-disc space-y-2 pl-6 leading-7">
                  <li>Access and export your personal data.</li>
                  <li>Correct inaccurate information.</li>
                  <li>Request deletion of your account and personal data.</li>
                  <li>Withdraw optional processing consent, including analytics.</li>
                  <li>Object to certain processing where applicable by law.</li>
                </ul>
              </section>

              <section>
                <h2 className="font-display text-2xl font-semibold text-foreground">8. Contact</h2>
                <p className="mt-3 leading-7">
                  For privacy requests or questions, contact{' '}
                  <a
                    href="mailto:privacy@proofound.com"
                    className="font-medium text-proofound-forest hover:underline"
                  >
                    privacy@proofound.com
                  </a>
                  .
                </p>
              </section>

              <section>
                <h2 className="font-display text-2xl font-semibold text-foreground">
                  9. Processors and Operational Accountability
                </h2>
                <p className="mt-3 leading-7">
                  We rely on vetted subprocessors for hosting, authentication, email delivery, and
                  observability. Access is restricted by role, reviewed periodically, and monitored
                  through audit controls. When processor lists or handling practices change in ways
                  that materially affect users, we update this policy and related notices.
                </p>
              </section>
            </div>
          </Card>

          <div className="mt-8 flex justify-center gap-4">
            <Button
              asChild
              variant="outline"
              className="border-proofound-stone text-foreground hover:border-proofound-forest hover:bg-proofound-forest/5"
            >
              <Link href="/terms">View Terms of Service</Link>
            </Button>
            <Button asChild className="bg-proofound-forest text-white hover:bg-[#2D5D4A]">
              <Link href="/cookies">View Cookie Policy</Link>
            </Button>
            <a
              href="mailto:privacy@proofound.com"
              className="inline-flex items-center justify-center rounded-md border border-proofound-stone px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-proofound-forest hover:bg-proofound-forest/5"
            >
              Email privacy
            </a>
          </div>
        </main>

        <footer className="border-t border-proofound-stone bg-white/80 backdrop-blur-sm">
          <div className="mx-auto max-w-4xl px-6 py-8 text-center">
            <p className="text-sm text-[#2D333099]">
              © {new Date().getFullYear()} Proofound. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
