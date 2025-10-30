import { Metadata } from 'next';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { NetworkBackground } from '@/components/NetworkBackground';
import { ArrowLeft, FileText, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Terms of Service | Proofound',
  description: 'Terms of Service for Proofound',
};

export default function TermsOfServicePage() {
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
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-proofound-terracotta shadow-[0_8px_18px_rgba(199,107,74,0.32)]">
              <FileText className="h-8 w-8 text-white" />
            </div>
            <h1 className="font-display text-[40px] font-semibold leading-[48px] tracking-[-0.02em] text-[#2D3330]">
              Terms of Service
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
                  This is a placeholder Terms of Service. Before launching to production, this
                  document <strong>must be reviewed and finalized by legal counsel</strong> to
                  ensure proper legal protection and compliance with applicable laws.
                </p>
              </div>
            </div>
          </Card>

          {/* Content */}
          <Card className="rounded-2xl border border-[#E8E6DD] bg-white p-10 shadow-[0_4px_24px_rgba(29,51,48,0.08)]">
            <div className="prose prose-lg max-w-none">
              <h2 className="font-display text-2xl font-semibold text-[#2D3330]">
                Agreement to Terms
              </h2>
              <p className="mt-4 leading-7 text-[#2D3330CC]">
                By accessing or using Proofound, you agree to be bound by these Terms of Service.
                If you disagree with any part of these terms, you may not access or use our
                platform.
              </p>

              <h3 className="mt-8 font-display text-xl font-semibold text-[#2D3330]">
                Our Platform
              </h3>
              <p className="mt-4 leading-7 text-[#2D3330CC]">
                Proofound is a professional networking platform that enables individuals to
                showcase verified skills and expertise, and connects them with organizations
                seeking qualified professionals. We provide the technology and infrastructure to
                facilitate these connections.
              </p>

              <h3 className="mt-8 font-display text-xl font-semibold text-[#2D3330]">
                User Accounts
              </h3>
              <p className="mt-4 leading-7 text-[#2D3330CC]">
                When you create an account, you agree to:
              </p>
              <ul className="mt-4 space-y-2 text-[#2D3330CC]">
                <li>Provide accurate and complete information</li>
                <li>Maintain the security of your account credentials</li>
                <li>Notify us immediately of any unauthorized access</li>
                <li>Be responsible for all activities under your account</li>
              </ul>

              <h3 className="mt-8 font-display text-xl font-semibold text-[#2D3330]">
                Acceptable Use
              </h3>
              <p className="mt-4 leading-7 text-[#2D3330CC]">
                You agree not to:
              </p>
              <ul className="mt-4 space-y-2 text-[#2D3330CC]">
                <li>Provide false or misleading information</li>
                <li>Impersonate others or misrepresent affiliations</li>
                <li>Violate any laws or regulations</li>
                <li>Harass, abuse, or harm other users</li>
                <li>Attempt to breach security or interfere with the platform</li>
                <li>Use automated tools to scrape or access the platform</li>
              </ul>

              <h3 className="mt-8 font-display text-xl font-semibold text-[#2D3330]">
                Intellectual Property
              </h3>
              <p className="mt-4 leading-7 text-[#2D3330CC]">
                The Proofound platform, including all content, features, and functionality, is
                owned by Proofound and is protected by copyright, trademark, and other
                intellectual property laws. You retain ownership of content you post, but grant us
                a license to use it as necessary to provide our services.
              </p>

              <h3 className="mt-8 font-display text-xl font-semibold text-[#2D3330]">
                Verification Services
              </h3>
              <p className="mt-4 leading-7 text-[#2D3330CC]">
                Our skill verification system relies on third-party verifiers. While we strive to
                maintain the integrity of the verification process, we cannot guarantee the
                accuracy of all verifications. Organizations should conduct their own due
                diligence when evaluating candidates.
              </p>

              <h3 className="mt-8 font-display text-xl font-semibold text-[#2D3330]">
                Termination
              </h3>
              <p className="mt-4 leading-7 text-[#2D3330CC]">
                We reserve the right to suspend or terminate your account at any time for
                violations of these Terms or for any other reason at our discretion. You may also
                terminate your account at any time through your account settings.
              </p>

              <h3 className="mt-8 font-display text-xl font-semibold text-[#2D3330]">
                Limitation of Liability
              </h3>
              <p className="mt-4 leading-7 text-[#2D3330CC]">
                Proofound is provided &quot;as is&quot; without warranties of any kind. We are not liable
                for any indirect, incidental, special, or consequential damages arising from your
                use of the platform.
              </p>

              <h3 className="mt-8 font-display text-xl font-semibold text-[#2D3330]">
                Changes to Terms
              </h3>
              <p className="mt-4 leading-7 text-[#2D3330CC]">
                We may update these Terms from time to time. We will notify you of any material
                changes by posting the new Terms on this page and updating the &quot;Last updated&quot;
                date.
              </p>

              <h3 className="mt-8 font-display text-xl font-semibold text-[#2D3330]">
                Contact Us
              </h3>
              <p className="mt-4 leading-7 text-[#2D3330CC]">
                If you have questions about these Terms of Service, please contact us at:
              </p>
              <p className="mt-4 font-medium text-proofound-terracotta">
                <a href="mailto:legal@proofound.com" className="hover:underline">
                  legal@proofound.com
                </a>
              </p>

              <div className="mt-12 rounded-xl border border-[#E8E6DD] bg-[#F7F6F1] p-6">
                <p className="text-sm leading-6 text-[#2D333099]">
                  <strong>Note:</strong> This is a simplified placeholder. Complete Terms of
                  Service must include detailed sections on dispute resolution, governing law,
                  indemnification, disclaimers, and other legal protections specific to your
                  jurisdiction and business model. Please consult with legal counsel before
                  launch.
                </p>
              </div>
            </div>
          </Card>

          {/* Action Buttons */}
          <div className="mt-8 flex justify-center gap-4">
            <Button
              asChild
              variant="outline"
              className="border-[#E8E6DD] text-[#2D3330] hover:border-proofound-terracotta hover:bg-proofound-terracotta/5"
            >
              <Link href="/privacy">View Privacy Policy</Link>
            </Button>
            <Button
              asChild
              className="bg-proofound-terracotta text-white hover:bg-[#B5673F]"
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

