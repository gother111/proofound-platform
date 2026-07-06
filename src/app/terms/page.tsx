import { Metadata } from 'next';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { NetworkBackground } from '@/components/NetworkBackground';
import { ArrowLeft, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { JsonLdScripts } from '@/components/seo/JsonLdScripts';
import { POLICY_EFFECTIVE_DATES, POLICY_VERSIONS } from '@/lib/privacy/policy-version-config';
import { buildStaticPageJsonLd } from '@/lib/seo/json-ld';
import { buildPublicMetadata } from '@/lib/seo/public-metadata';

export const metadata: Metadata = buildPublicMetadata({
  title: 'Terms of Service | Proofound legal responsibilities',
  description:
    'Review the Terms of Service that govern use of Proofound, including eligibility, acceptable use, moderation, account deletion, and legal responsibilities.',
  path: '/terms',
});

export const dynamic = 'force-dynamic';

export default function TermsOfServicePage() {
  const effectiveDate = POLICY_EFFECTIVE_DATES.tos;
  const version = POLICY_VERSIONS.tos;
  const jsonLdItems = buildStaticPageJsonLd({
    path: '/terms',
    title: 'Terms of Service | Proofound legal responsibilities',
    description:
      'Review the Terms of Service that govern use of Proofound, including eligibility, acceptable use, moderation, account deletion, and legal responsibilities.',
  });

  return (
    <div className="relative min-h-screen bg-japandi-bg text-foreground">
      <JsonLdScripts items={jsonLdItems} idPrefix="terms-jsonld" />
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
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-proofound-terracotta shadow-[0_8px_18px_rgba(199,107,74,0.32)]">
              <FileText className="h-8 w-8 text-white" />
            </div>
            <h1 className="font-display text-[40px] font-semibold leading-[48px] tracking-[-0.02em] text-foreground">
              Terms of Service
            </h1>
            <p className="mt-4 text-sm text-[#2D333099]">
              Effective date: {effectiveDate} · Version: {version}
            </p>
          </div>

          <Card className="rounded-2xl border border-proofound-stone bg-white p-10 shadow-[0_4px_24px_rgba(29,51,48,0.08)]">
            <div className="space-y-8 text-[#2D3330CC]">
              <section>
                <h2 className="font-display text-2xl font-semibold text-foreground">
                  1. Acceptance and Eligibility
                </h2>
                <p className="mt-3 leading-7">
                  By using Proofound, you agree to these Terms. You must provide accurate account
                  information and keep your login credentials secure.
                </p>
              </section>

              <section>
                <h2 className="font-display text-2xl font-semibold text-foreground">
                  2. Service Scope
                </h2>
                <p className="mt-3 leading-7">
                  Proofound is a proof-first hiring flow centered on proof records, public proof
                  portfolios, organization trust pages, and privacy-safe review inside structured
                  assignment flows.
                </p>
              </section>

              <section>
                <h2 className="font-display text-2xl font-semibold text-foreground">
                  3. Acceptable Use
                </h2>
                <ul className="mt-3 list-disc space-y-2 pl-6 leading-7">
                  <li>No fraud, impersonation, or misleading submissions.</li>
                  <li>No harassment, abusive content, or unlawful activity.</li>
                  <li>No automated abuse, scraping, or interference with platform security.</li>
                  <li>Respect confidentiality and rights of other users.</li>
                </ul>
              </section>

              <section>
                <h2 className="font-display text-2xl font-semibold text-foreground">
                  4. Moderation and Enforcement
                </h2>
                <p className="mt-3 leading-7">
                  We may review content and apply moderation actions under platform rules. Where
                  required, we provide a statement of reasons and an appeal pathway.
                </p>
              </section>

              <section>
                <h2 className="font-display text-2xl font-semibold text-foreground">
                  5. Account Deletion
                </h2>
                <p className="mt-3 leading-7">
                  You may request account deletion in settings. Deletion is processed immediately
                  and is irreversible.
                </p>
              </section>

              <section>
                <h2 className="font-display text-2xl font-semibold text-foreground">
                  6. Liability and Availability
                </h2>
                <p className="mt-3 leading-7">
                  The service is provided on an as-available basis. To the extent permitted by law,
                  Proofound is not liable for indirect or consequential damages.
                </p>
              </section>

              <section>
                <h2 className="font-display text-2xl font-semibold text-foreground">7. Changes</h2>
                <p className="mt-3 leading-7">
                  We may update these Terms. Material changes are published with a new version and
                  effective date.
                </p>
              </section>

              <section>
                <h2 className="font-display text-2xl font-semibold text-foreground">8. Contact</h2>
                <p className="mt-3 leading-7">
                  For legal questions, contact{' '}
                  <a
                    href="mailto:legal@proofound.com"
                    className="font-medium text-proofound-terracotta hover:underline"
                  >
                    legal@proofound.com
                  </a>
                  .
                </p>
              </section>

              <section>
                <h2 className="font-display text-2xl font-semibold text-foreground">
                  9. Intellectual Property and Content Rights
                </h2>
                <p className="mt-3 leading-7">
                  You retain ownership of content you upload. By using the service, you grant
                  Proofound a limited license to host, process, and display submitted materials as
                  needed to deliver platform functionality. You are responsible for ensuring
                  uploaded content does not infringe third-party rights.
                </p>
              </section>

              <section>
                <h2 className="font-display text-2xl font-semibold text-foreground">
                  10. Dispute Handling and Governing Terms
                </h2>
                <p className="mt-3 leading-7">
                  We aim to resolve disputes through good-faith communication first. If escalation
                  is required, disputes are handled under the governing law and venue stated in your
                  service agreement or, where absent, under the default legal framework applicable
                  to Proofound operations.
                </p>
              </section>

              <section>
                <h2 className="font-display text-2xl font-semibold text-foreground">
                  11. Service Continuity and Incident Handling
                </h2>
                <p className="mt-3 leading-7">
                  We maintain operational safeguards to keep availability and integrity within
                  reasonable expectations. During incidents, we may temporarily limit selected
                  features to protect platform stability or user safety. Material disruptions are
                  communicated through our published legal and privacy contact channels whenever
                  practical.
                </p>
              </section>

              <section>
                <h2 className="font-display text-2xl font-semibold text-foreground">
                  12. Interpretation and Priority
                </h2>
                <p className="mt-3 leading-7">
                  If a localized translation differs from the canonical version, the canonical
                  version governs unless local law requires otherwise. Additional commercial terms
                  negotiated with organizations apply only to covered parties and do not alter
                  baseline user obligations unless explicitly stated.
                </p>
              </section>
            </div>
          </Card>

          <div className="mt-8 flex justify-center gap-4">
            <Button
              asChild
              variant="outline"
              className="border-proofound-stone text-foreground hover:border-proofound-terracotta hover:bg-proofound-terracotta/5"
            >
              <Link href="/privacy">View Privacy Policy</Link>
            </Button>
            <Button asChild className="bg-proofound-terracotta text-white hover:bg-[#B5673F]">
              <Link href="/cookies">View Cookie Policy</Link>
            </Button>
            <a
              href="mailto:legal@proofound.com"
              className="inline-flex items-center justify-center rounded-md border border-proofound-stone px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-proofound-terracotta hover:bg-proofound-terracotta/5"
            >
              Email legal
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
