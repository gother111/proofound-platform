import { Metadata } from 'next';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { NetworkBackground } from '@/components/NetworkBackground';
import { ArrowLeft, Shield, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Privacy Policy | Proofound',
  description: 'Privacy Policy for Proofound',
};

export default function PrivacyPolicyPage() {
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="relative min-h-screen bg-[#F7F6F1] text-[#2D3330]">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0 opacity-60">
        <NetworkBackground />
      </div>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(28,77,58,0.08),transparent_55%),radial-gradient(circle_at_85%_80%,rgba(199,107,74,0.07),transparent_65%)]" />

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-[#E8E6DD] bg-white/80 backdrop-blur-sm">
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

        {/* Main Content */}
        <main className="mx-auto max-w-4xl px-6 py-16">
          {/* Title Section */}
          <div className="mb-12 text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-proofound-forest shadow-[0_8px_18px_rgba(28,77,58,0.28)]">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <h1 className="font-display text-[40px] font-semibold leading-[48px] tracking-[-0.02em] text-[#2D3330]">
              Privacy Policy
            </h1>
            <p className="mt-4 text-sm text-[#2D333099]">
              Last updated: {currentDate}
            </p>
          </div>

          {/* Placeholder Notice */}
          <Card className="mb-8 rounded-2xl border border-[#E8A852]/40 bg-[#FEF6E7] p-6">
            <div className="flex items-start gap-4">
              <AlertCircle className="h-6 w-6 flex-shrink-0 text-[#E8A852]" />
              <div>
                <h3 className="font-semibold text-[#2D3330]">Placeholder Document</h3>
                <p className="mt-2 text-sm leading-6 text-[#2D333099]">
                  This is a placeholder Privacy Policy. Before launching to production, this
                  document <strong>must be reviewed and finalized by legal counsel</strong> to
                  ensure compliance with GDPR, CCPA, and other applicable privacy regulations.
                </p>
              </div>
            </div>
          </Card>

          {/* Content */}
          <Card className="rounded-2xl border border-[#E8E6DD] bg-white p-10 shadow-[0_4px_24px_rgba(29,51,48,0.08)]">
            <div className="prose prose-lg max-w-none">
              <h2 className="font-display text-2xl font-semibold text-[#2D3330]">
                Our Commitment to Your Privacy
              </h2>
              <p className="mt-4 leading-7 text-[#2D3330CC]">
                At Proofound, we are committed to protecting your personal information and your
                right to privacy. This Privacy Policy explains how we collect, use, and protect
                your data when you use our platform.
              </p>

              <h3 className="mt-8 font-display text-xl font-semibold text-[#2D3330]">
                What We&apos;re Building
              </h3>
              <p className="mt-4 leading-7 text-[#2D3330CC]">
                Proofound is a platform that helps professionals showcase their expertise through
                verified credentials and connects them with meaningful opportunities. We take
                privacy seriously and have designed our platform with privacy-by-design principles
                from the ground up.
              </p>

              <h3 className="mt-8 font-display text-xl font-semibold text-[#2D3330]">
                Information We Collect
              </h3>
              <p className="mt-4 leading-7 text-[#2D3330CC]">
                We collect information that you provide directly to us, including:
              </p>
              <ul className="mt-4 space-y-2 text-[#2D3330CC]">
                <li>Account information (email, name, profile details)</li>
                <li>Professional information (skills, experience, education)</li>
                <li>Communication data (messages, interactions with other users)</li>
                <li>Usage data (anonymized analytics to improve our service)</li>
              </ul>

              <h3 className="mt-8 font-display text-xl font-semibold text-[#2D3330]">
                How We Protect Your Data
              </h3>
              <p className="mt-4 leading-7 text-[#2D3330CC]">
                We implement industry-standard security measures including:
              </p>
              <ul className="mt-4 space-y-2 text-[#2D3330CC]">
                <li>Encryption of data in transit (TLS 1.3) and at rest (AES-256)</li>
                <li>Row-level security policies to ensure data isolation</li>
                <li>IP address anonymization for analytics</li>
                <li>Regular security audits and updates</li>
              </ul>

              <h3 className="mt-8 font-display text-xl font-semibold text-[#2D3330]">
                Your Rights
              </h3>
              <p className="mt-4 leading-7 text-[#2D3330CC]">
                Under GDPR and CCPA, you have the right to:
              </p>
              <ul className="mt-4 space-y-2 text-[#2D3330CC]">
                <li>Access your personal data</li>
                <li>Correct inaccurate information</li>
                <li>Request deletion of your data</li>
                <li>Export your data in a portable format</li>
                <li>Opt out of marketing communications</li>
              </ul>

              <h3 className="mt-8 font-display text-xl font-semibold text-[#2D3330]">
                Contact Us
              </h3>
              <p className="mt-4 leading-7 text-[#2D3330CC]">
                If you have questions about this Privacy Policy or how we handle your data, please
                contact us at:
              </p>
              <p className="mt-4 font-medium text-proofound-forest">
                <a href="mailto:privacy@proofound.com" className="hover:underline">
                  privacy@proofound.com
                </a>
              </p>

              <div className="mt-12 rounded-xl border border-[#E8E6DD] bg-[#F7F6F1] p-6">
                <p className="text-sm leading-6 text-[#2D333099]">
                  <strong>Note:</strong> This is a simplified placeholder. A complete Privacy
                  Policy must include detailed information about data collection, processing,
                  storage, third-party services, cookies, international transfers, and specific
                  legal compliance details. Please consult with legal counsel before launch.
                </p>
              </div>
            </div>
          </Card>

          {/* Action Buttons */}
          <div className="mt-8 flex justify-center gap-4">
            <Button
              asChild
              variant="outline"
              className="border-[#E8E6DD] text-[#2D3330] hover:border-proofound-forest hover:bg-proofound-forest/5"
            >
              <Link href="/terms">View Terms of Service</Link>
            </Button>
            <Button
              asChild
              className="bg-proofound-forest text-white hover:bg-[#2D5D4A]"
            >
              <Link href="/signup">Create Account</Link>
            </Button>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-[#E8E6DD] bg-white/80 backdrop-blur-sm">
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

