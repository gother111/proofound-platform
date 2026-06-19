'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { NetworkBackground } from '@/components/NetworkBackground';
import { User, Building2, ArrowLeft } from 'lucide-react';
import { SignupForm } from '@/components/auth/SignupForm';

type SignupType = 'choose' | 'individual' | 'organization';

function resolveSignupTypeFromQueryParam(value: string | null): SignupType {
  if (!value) return 'choose';

  const normalized = value.trim().toLowerCase();

  if (normalized === 'individual') return 'individual';
  if (normalized === 'organization' || normalized === 'org' || normalized === 'org_member') {
    return 'organization';
  }

  return 'choose';
}

export function SignupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [signupType, setSignupType] = useState<SignupType>(() =>
    resolveSignupTypeFromQueryParam(searchParams?.get('type') ?? null)
  );

  if (signupType === 'individual' || signupType === 'organization') {
    return <SignupForm accountType={signupType} onBack={() => setSignupType('choose')} />;
  }

  // Account type selection screen
  return (
    <main
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-japandi-bg px-4 py-10 text-foreground sm:px-6 sm:py-16"
      data-testid="signup-choice-screen"
    >
      {/* Proofound network background */}
      <div className="pointer-events-none absolute inset-0 opacity-60">
        <NetworkBackground />
      </div>

      {/* Warm radial highlights */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(28,77,58,0.08),transparent_55%),radial-gradient(circle_at_85%_80%,rgba(199,107,74,0.07),transparent_65%)]" />

      {/* Back to Home */}
      <button
        type="button"
        onClick={() => router.push('/')}
        className="absolute left-4 top-6 flex min-h-[44px] items-center gap-2 rounded-sm px-3 text-[#44504B] transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-proofound-forest focus-visible:ring-offset-2 sm:left-6"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm">Back</span>
      </button>

      {/* Account Type Selection */}
      <div className="relative z-10 w-full max-w-[960px] px-0 sm:px-4">
        <Card className="mx-auto rounded-[24px] border border-proofound-stone bg-white/90 p-5 shadow-[0_4px_24px_rgba(29,51,48,0.08)] backdrop-blur sm:p-10 lg:p-12">
          {/* Header */}
          <div className="mb-8 text-center sm:mb-12">
            <div className="mb-4">
              <Image
                src="/logo.png"
                alt="Proofound"
                width={48}
                height={48}
                className="mx-auto h-12 w-12"
                priority
              />
            </div>
            <h1 className="font-display text-[32px] font-semibold leading-[40px] tracking-[-0.02em] text-foreground">
              Join Proofound
            </h1>
            <p className="mx-auto mt-3 max-w-md text-[15px] leading-[22px] text-[#44504B]">
              Choose the account type that fits how you&apos;ll use Proofound.
            </p>
          </div>

          {/* Account Type Cards */}
          <div className="mx-auto grid max-w-3xl gap-4 sm:gap-6 md:grid-cols-2">
            {/* Individual Card */}
            <div className="min-w-0">
              <button
                type="button"
                onClick={() => setSignupType('individual')}
                className="group h-full w-full text-left"
                data-testid="signup-choice-individual"
              >
                <Card className="h-full rounded-2xl border border-proofound-stone p-5 transition-all duration-300 hover:-translate-y-1 hover:border-proofound-forest/40 hover:shadow-[0_14px_32px_-16px_rgba(28,77,58,0.3)] sm:p-8">
                  <div className="flex flex-col items-start gap-4">
                    <div className="rounded-xl bg-proofound-stone p-4 transition-colors group-hover:bg-proofound-forest/10">
                      <User className="h-8 w-8 text-proofound-forest" />
                    </div>
                    <div>
                      <h3 className="mb-2 font-display text-xl font-semibold text-foreground">
                        Individual
                      </h3>
                      <p className="text-sm leading-6 text-[#44504B]">
                        For professionals who want a clean proof-based portfolio link they can share
                        today, then assignment reviews when proof and privacy are ready.
                      </p>
                    </div>
                    <div className="mt-auto">
                      <span className="text-sm font-medium text-proofound-forest group-hover:underline">
                        Continue as Individual →
                      </span>
                    </div>
                  </div>
                </Card>
              </button>
            </div>

            {/* Organization Card */}
            <div className="min-w-0">
              <button
                type="button"
                onClick={() => setSignupType('organization')}
                className="group h-full w-full text-left"
                data-testid="signup-choice-organization"
              >
                <Card className="h-full rounded-2xl border border-proofound-stone p-5 transition-all duration-300 hover:-translate-y-1 hover:border-proofound-terracotta/40 hover:shadow-[0_14px_32px_-16px_rgba(199,107,74,0.32)] sm:p-8">
                  <div className="flex flex-col items-start gap-4">
                    <div className="rounded-xl bg-[#F0E4D8] p-4 transition-colors group-hover:bg-proofound-terracotta/15">
                      <Building2 className="h-8 w-8 text-proofound-terracotta" />
                    </div>
                    <div>
                      <h3 className="mb-2 font-display text-xl font-semibold text-foreground">
                        Organization
                      </h3>
                      <p className="text-sm leading-6 text-[#44504B]">
                        For organizations that need a credible trust page on day 1, then one
                        assignment and a privacy-safe shortlist.
                      </p>
                    </div>
                    <div className="mt-auto">
                      <span className="text-sm font-medium text-[#9A4F33] group-hover:underline">
                        Continue as Organization →
                      </span>
                    </div>
                  </div>
                </Card>
              </button>
            </div>
          </div>

          {/* Sign In Link */}
          <div className="mt-10 text-center">
            <p className="text-sm text-[#44504B]">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => router.push('/login')}
                className="-mx-2 inline-flex min-h-[44px] items-center rounded-sm px-2 font-medium text-proofound-forest hover:text-[#2D5D4A] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-proofound-forest focus-visible:ring-offset-2"
              >
                Sign in
              </button>
            </p>
          </div>
        </Card>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-[#44504B]">
          By creating an account, you agree to our{' '}
          <a
            href="/terms"
            className="inline-flex min-h-11 items-center rounded-sm px-1 font-medium text-proofound-forest underline underline-offset-2 hover:text-[#2D5D4A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-proofound-forest focus-visible:ring-offset-2"
          >
            Terms of Service
          </a>{' '}
          and{' '}
          <a
            href="/privacy"
            className="inline-flex min-h-11 items-center rounded-sm px-1 font-medium text-proofound-forest underline underline-offset-2 hover:text-[#2D5D4A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-proofound-forest focus-visible:ring-offset-2"
          >
            Privacy Policy
          </a>
        </p>
      </div>
    </main>
  );
}
