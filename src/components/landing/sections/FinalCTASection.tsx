'use client';

import Link from 'next/link';
import { MagneticButton } from '@/components/ui/magnetic-button';

interface FinalCTASectionProps {
  onIndividualSignup?: () => void;
  onOrganizationSignup?: () => void;
  shouldReduceMotion?: boolean;
}

export function FinalCTASection({
  onIndividualSignup,
  onOrganizationSignup,
}: FinalCTASectionProps) {
  return (
    <section data-testid="landing-final-cta-section" className="bg-[var(--landing-bg)] py-32">
      <div className="mx-auto max-w-[920px] px-6 text-center lg:px-10">
        <h2 className="font-display text-[3.2rem] leading-[1.02] tracking-[-0.035em] text-[var(--landing-dark)] md:text-[4rem]">
          Start with proof, not noise.
        </h2>
        <p className="mx-auto mt-5 max-w-[30rem] text-[1.02rem] leading-8 text-[var(--landing-text)]">
          Choose the first action that matches your role.
        </p>

        <div className="mt-14 border-t border-[var(--landing-border)] pt-8">
          <div className="flex flex-col items-center justify-center gap-4 md:flex-row">
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--landing-muted)]">
              For individuals
            </div>
            <button
              onClick={onIndividualSignup}
              className="inline-flex min-h-[52px] items-center justify-center rounded-full border border-[var(--landing-border)] bg-[var(--landing-surface-soft)] px-6 py-3 text-sm font-semibold text-[var(--landing-dark)] transition-colors hover:border-[var(--landing-accent)] hover:text-[var(--landing-dark)]"
            >
              Create your proof portfolio
            </button>
            <div className="hidden h-5 w-px bg-[var(--landing-border)] md:block" />
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--landing-muted)]">
              For organizations
            </div>
            <MagneticButton
              onClick={onOrganizationSignup}
              className="inline-flex min-h-[52px] items-center justify-center rounded-full bg-[var(--landing-action)] px-6 py-3 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5 hover:bg-[var(--landing-dark-soft)]"
            >
              Request a pilot
            </MagneticButton>
          </div>
        </div>

        <p className="mt-10 text-sm text-[var(--landing-text)]">
          Already using Proofound?{' '}
          <Link
            href="/login"
            className="font-semibold text-[var(--landing-dark)] hover:text-[var(--landing-clay)]"
          >
            Sign in.
          </Link>
        </p>
      </div>
    </section>
  );
}
