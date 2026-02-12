'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
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
    resolveSignupTypeFromQueryParam(searchParams.get('type'))
  );

  if (signupType === 'individual' || signupType === 'organization') {
    return <SignupForm accountType={signupType} onBack={() => setSignupType('choose')} />;
  }

  // Account type selection screen
  return (
    <div
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#F7F6F1] px-6 py-16 text-[#2D3330]"
      data-testid="signup-choice-screen"
    >
      {/* Proofound network background */}
      <div className="pointer-events-none absolute inset-0 opacity-60">
        <NetworkBackground />
      </div>

      {/* Warm radial highlights */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(28,77,58,0.08),transparent_55%),radial-gradient(circle_at_85%_80%,rgba(199,107,74,0.07),transparent_65%)]" />

      {/* Back to Home */}
      <motion.button
        type="button"
        initial={{ x: -20 }}
        animate={{ x: 0 }}
        onClick={() => router.push('/')}
        className="absolute left-6 top-6 flex min-h-[44px] items-center gap-2 px-2 -mx-2 text-[#44504B] transition-colors hover:text-[#2D3330]"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm">Back</span>
      </motion.button>

      {/* Account Type Selection */}
      <motion.div
        initial={{ y: 20 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-[960px] px-4"
      >
        <Card className="mx-auto rounded-[24px] border border-[#E8E6DD] bg-white/95 p-12 shadow-[0_4px_24px_rgba(29,51,48,0.08)] backdrop-blur">
          {/* Header */}
          <div className="text-center mb-12">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
              className="mb-4"
            >
              <Image
                src="/logo.png"
                alt="Proofound"
                width={120}
                height={48}
                className="mx-auto h-12 w-auto"
                priority
              />
            </motion.div>
            <h1 className="font-display text-[32px] font-semibold leading-[40px] tracking-[-0.02em] text-[#2D3330]">
              Join Proofound
            </h1>
            <p className="mx-auto mt-3 max-w-md text-[15px] leading-[22px] text-[#44504B]">
              Choose the account type that fits how you&apos;ll use Proofound.
            </p>
          </div>

          {/* Account Type Cards */}
          <div className="mx-auto grid max-w-3xl gap-6 md:grid-cols-2">
            {/* Individual Card */}
            <motion.div initial={{ x: -20 }} animate={{ x: 0 }} transition={{ delay: 0.3 }}>
              <button
                type="button"
                onClick={() => setSignupType('individual')}
                className="group h-full w-full text-left"
                data-testid="signup-choice-individual"
              >
                <Card className="h-full rounded-2xl border border-[#E8E6DD] p-8 transition-all duration-300 hover:-translate-y-1 hover:border-proofound-forest/40 hover:shadow-[0_14px_32px_-16px_rgba(28,77,58,0.3)]">
                  <div className="flex flex-col items-start gap-4">
                    <div className="rounded-xl bg-[#E8E6DD] p-4 transition-colors group-hover:bg-proofound-forest/10">
                      <User className="h-8 w-8 text-proofound-forest" />
                    </div>
                    <div>
                      <h3 className="mb-2 font-display text-xl font-semibold text-[#2D3330]">
                        Individual
                      </h3>
                      <p className="text-sm leading-6 text-[#44504B]">
                        For professionals looking to showcase expertise, get matched with
                        opportunities, and build verified credentials.
                      </p>
                    </div>
                    <div className="mt-auto">
                      <span className="text-sm font-medium text-[#1C4D3A] group-hover:underline">
                        Continue as Individual →
                      </span>
                    </div>
                  </div>
                </Card>
              </button>
            </motion.div>

            {/* Organization Card */}
            <motion.div initial={{ x: 20 }} animate={{ x: 0 }} transition={{ delay: 0.4 }}>
              <button
                type="button"
                onClick={() => setSignupType('organization')}
                className="group h-full w-full text-left"
                data-testid="signup-choice-organization"
              >
                <Card className="h-full rounded-2xl border border-[#E8E6DD] p-8 transition-all duration-300 hover:-translate-y-1 hover:border-proofound-terracotta/40 hover:shadow-[0_14px_32px_-16px_rgba(199,107,74,0.32)]">
                  <div className="flex flex-col items-start gap-4">
                    <div className="rounded-xl bg-[#F0E4D8] p-4 transition-colors group-hover:bg-proofound-terracotta/15">
                      <Building2 className="h-8 w-8 text-proofound-terracotta" />
                    </div>
                    <div>
                      <h3 className="mb-2 font-display text-xl font-semibold text-[#2D3330]">
                        Organization
                      </h3>
                      <p className="text-sm leading-6 text-[#44504B]">
                        For organizations seeking verified experts, posting assignments, and
                        building trusted teams.
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
            </motion.div>
          </div>

          {/* Sign In Link */}
          <div className="mt-10 text-center">
            <p className="text-sm text-[#44504B]">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => router.push('/login')}
                className="font-medium text-[#1C4D3A] hover:text-[#2D5D4A] hover:underline inline-flex min-h-[44px] items-center px-2 -mx-2"
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
            className="font-medium text-[#1C4D3A] underline underline-offset-2 hover:text-[#2D5D4A]"
          >
            Terms of Service
          </a>{' '}
          and{' '}
          <a
            href="/privacy"
            className="font-medium text-[#1C4D3A] underline underline-offset-2 hover:text-[#2D5D4A]"
          >
            Privacy Policy
          </a>
        </p>
      </motion.div>
    </div>
  );
}
