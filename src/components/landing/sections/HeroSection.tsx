'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, EyeOff, ShieldCheck } from 'lucide-react';
import { useRef } from 'react';
import { MagneticButton } from '@/components/ui/magnetic-button';

interface HeroSectionProps {
  shouldReduceMotion?: boolean;
  onOrganizationSignup?: () => void;
  onIndividualSignup?: () => void;
}

export function HeroSection({
  shouldReduceMotion = false,
  onOrganizationSignup,
  onIndividualSignup,
}: HeroSectionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  const traceOpacity = useTransform(scrollYProgress, [0, 0.18, 0.32], [1, 1, 0]);
  const proofOpacity = useTransform(scrollYProgress, [0.28, 0.5, 0.9], [0, 1, 1]);
  const handoffOpacity = useTransform(scrollYProgress, [0.62, 0.82], [0, 1]);
  const artifactScale = useTransform(scrollYProgress, [0, 1], [1.02, 1]);
  const artifactY = useTransform(scrollYProgress, [0, 1], [20, 0]);

  return (
    <section
      ref={containerRef}
      data-testid="landing-hero-section"
      className="relative min-h-[200svh] overflow-clip bg-[var(--landing-bg)]"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_14%,rgba(176,185,168,0.18),transparent_20%),radial-gradient(circle_at_63%_48%,rgba(224,207,195,0.28),transparent_24%),linear-gradient(180deg,#f6f2ea_0%,#efe8de_48%,#f3f0e8_100%)]" />

      <div className="sticky top-0 flex min-h-[100svh] items-center pt-24">
        <div className="mx-auto w-full max-w-[1460px] px-0 lg:px-0">
          <motion.div
            className="relative min-h-[calc(100svh-6rem)] overflow-hidden border-y border-[var(--landing-border)] bg-[var(--landing-surface)] shadow-[0_42px_120px_rgba(94,94,94,0.08)] lg:min-h-[calc(100svh-7rem)] lg:rounded-[42px] lg:border"
            style={{
              scale: shouldReduceMotion ? 1 : artifactScale,
              y: shouldReduceMotion ? 0 : artifactY,
            }}
          >
            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.42),transparent_28%),radial-gradient(circle_at_76%_24%,rgba(176,185,168,0.14),transparent_22%)]" />

            <div className="relative grid min-h-[calc(100svh-6rem)] items-end gap-10 px-6 pb-8 pt-8 md:px-10 md:pb-10 md:pt-10 lg:min-h-[calc(100svh-7rem)] lg:grid-cols-[0.48fr_1.52fr] lg:px-14 lg:pb-12 lg:pt-12">
              <div className="relative z-10 max-w-[390px] self-end">
                <div className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[var(--landing-muted)]">
                  Proofound
                </div>
                <div className="mt-4 max-w-[12ch] font-display text-[2.15rem] leading-[0.92] tracking-[-0.04em] text-[var(--landing-dark)] md:text-[2.8rem]">
                  A calmer standard for seeing work clearly.
                </div>

                <div className="mt-10 text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--landing-clay)]">
                  Stronger signal than CVs
                </div>

                <h1 className="mt-5 max-w-[8ch] font-display text-[3.7rem] leading-[0.9] tracking-[-0.055em] text-[var(--landing-dark)] md:text-[4.8rem] lg:text-[5.2rem]">
                  See the work behind the claim.
                </h1>

                <p className="mt-5 max-w-[18rem] text-[0.96rem] leading-8 text-[var(--landing-text)]">
                  Proof-backed, privacy-safe review that helps teams compare real work instead of
                  polished claims.
                </p>

                <div className="mt-8 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                  <MagneticButton
                    onClick={onOrganizationSignup}
                    className="inline-flex min-h-[54px] items-center justify-center rounded-full bg-[var(--landing-action)] px-7 py-3 text-sm font-semibold text-white shadow-[0_16px_34px_rgba(96,108,90,0.18)] transition-all hover:-translate-y-0.5 hover:bg-[var(--landing-dark-soft)]"
                  >
                    Request a pilot
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </MagneticButton>

                  <button
                    onClick={onIndividualSignup}
                    className="inline-flex min-h-[54px] items-center justify-center rounded-full border border-[var(--landing-border)] bg-transparent px-7 py-3 text-sm font-semibold text-[var(--landing-dark)] transition-colors hover:border-[var(--landing-clay)] hover:text-[var(--landing-clay)]"
                  >
                    Create your proof portfolio
                  </button>
                </div>

                <p className="mt-5 max-w-[18rem] text-[13px] leading-7 text-[var(--landing-muted)]">
                  For lean teams hiring through work, not noise, and for under-credited talent with
                  real work to show.
                </p>
              </div>

              <div className="relative min-h-[540px] lg:min-h-[660px]">
                <motion.div
                  className="absolute left-[4%] top-[8%] z-0 w-[34%] rotate-[-5deg] border border-[var(--landing-border)] bg-[color:var(--landing-surface-soft)]/88 px-5 py-4 text-[var(--landing-muted)] shadow-[0_18px_40px_rgba(94,94,94,0.06)] backdrop-blur-sm"
                  style={{ opacity: shouldReduceMotion ? 0 : traceOpacity }}
                >
                  <div className="text-[10px] uppercase tracking-[0.24em]">Resume shorthand</div>
                  <div className="mt-3 text-sm leading-7">
                    Maya Chen
                    <br />
                    ex-Stripe
                    <br />
                    Berkeley
                    <br />
                    Strategic leader
                  </div>
                </motion.div>

                <motion.div
                  className="relative z-10 ml-auto h-full w-full max-w-[980px]"
                  style={{ opacity: shouldReduceMotion ? 1 : proofOpacity }}
                >
                  <div className="relative h-full overflow-hidden rounded-[34px] border border-[var(--landing-border)] bg-[var(--landing-surface-soft)] p-6 shadow-[0_34px_100px_rgba(94,94,94,0.08)] md:p-8">
                    <div className="absolute left-10 top-0 h-12 w-px -translate-y-5 bg-[var(--landing-surface-strong)]" />
                    <div className="absolute right-10 top-0 h-12 w-px -translate-y-5 bg-[var(--landing-surface-strong)]" />
                    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.58),transparent_24%)]" />

                    <div className="relative flex items-start justify-between gap-4 border-b border-[var(--landing-border-soft)] pb-5">
                      <div>
                        <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--landing-clay)]">
                          Proof Pack
                        </div>
                        <div className="mt-3 font-display text-[2.3rem] leading-none text-[var(--landing-dark)] md:text-[3rem]">
                          Onboarding redesign
                        </div>
                      </div>
                      <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--landing-muted)]">
                        Review-safe
                      </div>
                    </div>

                    <div className="relative mt-6 grid gap-5 lg:grid-cols-[1.16fr_0.84fr]">
                      <div className="rounded-[30px] bg-[#f8f4ee] p-7 shadow-[0_16px_36px_rgba(94,94,94,0.04)]">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--landing-clay)]">
                          Outcome
                        </div>
                        <div className="mt-4 max-w-[8ch] font-display text-[3.45rem] leading-[0.9] text-[var(--landing-dark)] md:text-[4rem]">
                          Reduced onboarding time by 31%
                        </div>
                        <div className="mt-6 max-w-[23rem] border-l-2 border-[var(--landing-clay)]/45 pl-4 text-sm leading-7 text-[var(--landing-text)]">
                          One documented path replaced fragmented handoffs across product, success,
                          and ops.
                        </div>
                      </div>

                      <div className="grid gap-5">
                        <div className="rounded-[26px] bg-[var(--landing-surface)] p-5">
                          <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--landing-muted)]">
                            Review rail
                          </div>
                          <div className="mt-4 space-y-4 text-sm leading-7 text-[var(--landing-text)]">
                            <div>Operations lead · B2B SaaS · team of 6</div>
                            <div className="inline-flex items-center gap-2 text-[var(--landing-action)]">
                              <ShieldCheck className="h-4 w-4" />
                              Peer-attested
                            </div>
                            <div className="inline-flex items-center gap-2 text-[var(--landing-action)]">
                              <EyeOff className="h-4 w-4" />
                              Identity hidden during early review
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="relative mt-5 overflow-hidden rounded-[28px] bg-[var(--landing-blush)] p-6">
                      <div className="flex items-center justify-between gap-4">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--landing-muted)]">
                          Artifact excerpt
                        </div>
                        <div className="text-[10px] uppercase tracking-[0.22em] text-[var(--landing-muted)]">
                          Easier to trust than a CV
                        </div>
                      </div>

                      <div className="mt-4 rounded-[22px] bg-[var(--landing-surface-soft)] p-5 shadow-[0_14px_30px_rgba(94,94,94,0.035)]">
                        <div className="h-2.5 w-[78%] rounded-full bg-[var(--landing-surface-strong)]" />
                        <div className="mt-3 h-2.5 w-[58%] rounded-full bg-[var(--landing-surface)]" />
                        <div className="mt-5 grid grid-cols-3 gap-3">
                          <div className="rounded-[14px] bg-[var(--landing-surface)] p-3">
                            <div className="h-2.5 w-10 rounded-full bg-[var(--landing-surface-strong)]" />
                            <div className="mt-3 h-10 rounded-[10px] bg-[var(--landing-surface-strong)]" />
                          </div>
                          <div className="rounded-[14px] bg-[var(--landing-surface)] p-3">
                            <div className="h-2.5 w-12 rounded-full bg-[var(--landing-surface-strong)]" />
                            <div className="mt-3 h-10 rounded-[10px] bg-[var(--landing-surface-strong)]" />
                          </div>
                          <div className="rounded-[14px] bg-[var(--landing-surface)] p-3">
                            <div className="h-2.5 w-8 rounded-full bg-[var(--landing-surface-strong)]" />
                            <div className="mt-3 h-10 rounded-[10px] bg-[var(--landing-surface-strong)]" />
                          </div>
                        </div>
                        <div className="mt-5 border-l-2 border-[var(--landing-clay)]/45 pl-4 text-sm leading-7 text-[var(--landing-text)]">
                          Deck excerpt and rollout notes give a reviewer something inspectable
                          instead of a polished claim.
                        </div>
                      </div>
                    </div>

                    <motion.div
                      className="pointer-events-none absolute bottom-6 right-6 overflow-hidden rounded-[20px] border border-[var(--landing-action)]/18 bg-[linear-gradient(145deg,rgba(87,98,83,0.96),rgba(103,114,95,0.93))] px-5 py-4 text-white shadow-[0_26px_52px_rgba(82,91,78,0.24)]"
                      style={{ opacity: handoffOpacity }}
                    >
                      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.16),transparent_38%)]" />
                      <div className="relative text-[11px] font-semibold uppercase tracking-[0.22em] text-[#f2eadf]">
                        Review handoff
                      </div>
                      <div className="relative mt-2 max-w-[18rem] text-[15px] font-medium leading-7 text-white">
                        Shared into a privacy-safe assignment corridor.
                      </div>
                    </motion.div>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
