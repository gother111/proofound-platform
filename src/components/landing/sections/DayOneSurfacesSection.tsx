'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

function PortfolioSurface() {
  return (
    <div className="relative overflow-hidden rounded-[32px] border border-[var(--landing-border)] bg-[var(--landing-surface-soft)] p-6">
      <div className="absolute left-8 top-0 h-10 w-px -translate-y-4 bg-[var(--landing-surface-strong)]" />
      <div className="absolute right-8 top-0 h-10 w-px -translate-y-4 bg-[var(--landing-surface-strong)]" />
      <div className="flex items-start justify-between border-b border-[var(--landing-border-soft)] pb-5">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--landing-muted)]">
            Public Page proof snapshot
          </div>
          <div className="mt-2 font-display text-[1.65rem] leading-none text-[var(--landing-dark)]">
            Selected proof
          </div>
        </div>
        <div className="rounded-full border border-[var(--landing-border)] bg-[var(--landing-surface)] px-3 py-1.5 text-xs text-[var(--landing-muted)]">
          Live now
        </div>
      </div>

      <div className="mt-6 space-y-5">
        <div className="bg-[color:var(--landing-surface-soft)]/88 p-5 shadow-[0_16px_34px_rgba(94,94,94,0.04)]">
          <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--landing-clay)]">
            Outcome
          </div>
          <div className="mt-3 text-lg font-medium text-[var(--landing-dark)]">
            Lifted volunteer onboarding completion from 58% to 82%
          </div>
          <div className="mt-4 text-sm leading-6 text-[var(--landing-text)]">
            Community operations · nonprofit program · 11-week redesign
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-[1.2fr_0.8fr]">
          <div className="border-t border-[var(--landing-border-soft)] bg-transparent px-0 py-5 text-sm text-[var(--landing-text)]">
            <div className="text-[11px] uppercase tracking-[0.2em] text-[var(--landing-muted)]">
              Artifact excerpt
            </div>
            <div className="mt-4 space-y-3">
              <div className="h-2.5 w-[82%] rounded-full bg-[var(--landing-surface-strong)]" />
              <div className="h-2.5 w-[64%] rounded-full bg-[var(--landing-surface)]" />
              <div className="border-l-2 border-[var(--landing-clay)]/45 pl-4 text-sm leading-7 text-[var(--landing-text)]">
                Workshop deck with the updated onboarding path, volunteer friction points, and
                rollout notes.
              </div>
            </div>
          </div>
          <div className="border-t border-[var(--landing-border-soft)] bg-transparent px-0 py-5 text-sm text-[var(--landing-action)]">
            <div className="text-[11px] uppercase tracking-[0.2em] text-[var(--landing-action)]">
              Trust
            </div>
            <div className="mt-3 text-base font-medium">Peer reviewed</div>
            <div className="mt-3 text-sm leading-7 text-[var(--landing-action)]">
              One visible proof item, one outcome, one scoped verification.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CorridorSurface() {
  return (
    <div className="relative overflow-hidden rounded-[32px] border border-[var(--landing-border)] bg-[var(--landing-surface-soft)] p-6">
      <div className="absolute left-8 top-0 h-10 w-px -translate-y-4 bg-[var(--landing-surface-strong)]" />
      <div className="absolute right-8 top-0 h-10 w-px -translate-y-4 bg-[var(--landing-surface-strong)]" />
      <div className="border-b border-[var(--landing-border-soft)] pb-5">
        <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--landing-muted)]">
          Organization trust page
        </div>
        <div className="mt-2 font-display text-[1.65rem] leading-none text-[var(--landing-dark)]">
          Assignment corridor
        </div>
      </div>

      <div className="mt-6 grid gap-5">
        <div className="bg-[color:var(--landing-surface-soft)]/88 p-5 shadow-[0_16px_34px_rgba(94,94,94,0.04)]">
          <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--landing-clay)]">
            Role
          </div>
          <div className="mt-3 text-lg font-medium text-[var(--landing-dark)]">
            Operations lead for onboarding redesign
          </div>
          <div className="mt-3 text-sm leading-6 text-[var(--landing-text)]">
            Define expected outcomes, useful evidence, and review sequence before applications open.
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {['Trust page', 'Evidence-first shortlist', 'Reveal later'].map((label) => (
            <div
              key={label}
              className="border-t border-[var(--landing-border-soft)] px-0 py-4 text-center text-sm text-[var(--landing-text)]"
            >
              {label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function DayOneSurfacesSection() {
  return (
    <section className="bg-[var(--landing-bg)] py-32">
      <div className="mx-auto max-w-[1240px] px-6 lg:px-10">
        <div className="max-w-[760px]">
          <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--landing-clay)]">
            Start with one useful surface
          </span>
          <h2 className="mt-5 max-w-[11ch] font-display text-[3rem] leading-[1.02] tracking-[-0.03em] text-[var(--landing-dark)] md:text-[3.5rem]">
            One clear starting point for each side.
          </h2>
          <p className="mt-5 max-w-[46rem] text-[1.1rem] leading-8 text-[var(--landing-text)]">
            Proofound starts with a Public Page proof snapshot for individuals and a trust page plus
            assignment corridor for organizations.
          </p>
        </div>

        <div className="mt-18 grid gap-12 lg:grid-cols-2">
          <article className="grid gap-8 border-t border-[var(--landing-border)] pt-8">
            <div className="max-w-[32rem]">
              <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--landing-muted)]">
                For individuals
              </div>
              <h3 className="mt-4 font-display text-[2.2rem] leading-tight text-[var(--landing-dark)]">
                Public Page proof snapshot
              </h3>
              <p className="mt-4 text-[1.04rem] leading-7 text-[var(--landing-text)]">
                Turn real work, volunteering, or learning into a calm Public Page with 1 to 3 proof
                items, role context, outcomes, and scoped verification checks.
              </p>
            </div>

            <PortfolioSurface />

            <Link
              href="/signup/individual"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--landing-action)] transition-colors hover:text-[var(--landing-clay)]"
            >
              Create your proof portfolio
              <ArrowRight className="h-4 w-4" />
            </Link>
          </article>

          <article className="grid gap-8 border-t border-[var(--landing-border)] pt-8">
            <div className="max-w-[32rem]">
              <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--landing-muted)]">
                For organizations
              </div>
              <h3 className="mt-4 font-display text-[2.2rem] leading-tight text-[var(--landing-dark)]">
                Trust page + assignment corridor
              </h3>
              <p className="mt-4 text-[1.04rem] leading-7 text-[var(--landing-text)]">
                Publish a credible team surface, define the work clearly, and review proof-backed
                candidates through a privacy-safe shortlist before interview time is wasted.
              </p>
            </div>

            <CorridorSurface />

            <Link
              href="/signup/organization"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--landing-dark)] transition-colors hover:text-[var(--landing-clay)]"
            >
              Request a pilot
              <ArrowRight className="h-4 w-4" />
            </Link>
          </article>
        </div>
      </div>
    </section>
  );
}
