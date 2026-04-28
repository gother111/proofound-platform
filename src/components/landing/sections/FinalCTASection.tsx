'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

interface FinalCTASectionProps {
  onGetStarted?: () => void;
  onIndividualSignup?: () => void;
  onOrganizationSignup?: () => void;
  shouldReduceMotion?: boolean | null;
}

export function FinalCTASection({
  onGetStarted,
  onIndividualSignup,
  onOrganizationSignup,
  shouldReduceMotion,
}: FinalCTASectionProps) {
  const reduceMotion = !!shouldReduceMotion;

  return (
    <section
      id="start"
      className="relative scroll-mt-24 overflow-hidden px-5 py-10 md:px-10 md:py-20"
      data-testid="landing-final-cta-section"
    >
      <span
        id="start-individuals"
        className="absolute top-0 h-px w-px scroll-mt-24"
        aria-hidden="true"
      />
      <span
        id="start-organizations"
        className="absolute top-0 h-px w-px scroll-mt-24"
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-transparent" aria-hidden="true" />
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <motion.div
          animate={
            reduceMotion
              ? undefined
              : {
                  scale: [1, 1.08, 1],
                  opacity: [0.24, 0.34, 0.24],
                  x: [0, 32, 0],
                }
          }
          transition={
            reduceMotion ? undefined : { duration: 18, repeat: Infinity, ease: 'easeInOut' }
          }
          className="absolute left-[-10%] top-[5%] h-[26rem] w-[26rem] rounded-full bg-proofound-forest/10 blur-[120px]"
        />
        <motion.div
          animate={
            reduceMotion
              ? undefined
              : {
                  scale: [1, 1.12, 1],
                  opacity: [0.18, 0.28, 0.18],
                  x: [0, -24, 0],
                }
          }
          transition={
            reduceMotion
              ? undefined
              : { duration: 22, repeat: Infinity, ease: 'easeInOut', delay: 1.2 }
          }
          className="absolute bottom-[-5%] right-[-6%] h-[24rem] w-[24rem] rounded-full bg-proofound-terracotta/12 blur-[110px]"
        />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl">
        <motion.div
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          transition={reduceMotion ? { duration: 0 } : { duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="rounded-[1.8rem] border border-white/55 bg-white/64 px-5 py-7 shadow-[0_28px_90px_-50px_rgba(45,51,48,0.45)] backdrop-blur-[24px] md:rounded-[2.4rem] md:px-10 md:py-12">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-sm font-medium uppercase tracking-[0.28em] text-proofound-forest/70">
                The story resolves into action
              </p>
              <motion.h2
                initial={false}
                animate={{ opacity: 1, y: 0 }}
                transition={
                  reduceMotion
                    ? { duration: 0 }
                    : { duration: 0.9, delay: 0.08, ease: [0.22, 1, 0.36, 1] }
                }
                className="mt-5 font-display text-[2.35rem] leading-[0.95] text-foreground md:text-6xl"
              >
                Build hiring on stronger proof
              </motion.h2>
              <motion.p
                initial={false}
                animate={{ opacity: 1, y: 0 }}
                transition={
                  reduceMotion
                    ? { duration: 0 }
                    : { duration: 0.9, delay: 0.16, ease: [0.22, 1, 0.36, 1] }
                }
                className="mx-auto mt-5 max-w-2xl text-base leading-7 text-muted-foreground md:mt-6 md:text-lg md:leading-8"
              >
                Proofound helps individuals present real capability through structured evidence, and
                helps organizations compare work-to-proof more clearly before time is lost.
              </motion.p>
            </div>

            <motion.div
              initial={false}
              animate={{ opacity: 1, y: 0 }}
              transition={
                reduceMotion
                  ? { duration: 0 }
                  : { duration: 0.9, delay: 0.24, ease: [0.22, 1, 0.36, 1] }
              }
              className="mt-8 grid gap-4 md:mt-12 md:gap-5 lg:grid-cols-2"
            >
              <button
                type="button"
                onClick={onIndividualSignup ?? onGetStarted}
                className="group rounded-[1.55rem] border border-proofound-forest/12 bg-proofound-forest px-5 py-5 text-left text-white transition-transform duration-300 hover:-translate-y-0.5 md:rounded-[2rem] md:px-6 md:py-6"
              >
                <p className="text-sm uppercase tracking-[0.24em] text-white/70">For individuals</p>
                <p className="mt-4 text-3xl font-display leading-tight">
                  Create your proof portfolio
                </p>
                <p className="mt-4 max-w-md text-sm leading-6 text-white/72">
                  Start with a cleaner public profile, then add proof, verification, and
                  privacy-safe signal over time.
                </p>
                <span className="mt-6 inline-flex items-center gap-2 text-sm font-medium">
                  Start building
                  <ArrowRight
                    className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </span>
              </button>

              <button
                type="button"
                onClick={onOrganizationSignup ?? onGetStarted}
                className="group rounded-[1.55rem] border border-border/80 bg-white/78 px-5 py-5 text-left text-foreground transition-transform duration-300 hover:-translate-y-0.5 md:rounded-[2rem] md:px-6 md:py-6"
              >
                <p className="text-sm uppercase tracking-[0.24em] text-foreground/54">
                  For organizations
                </p>
                <p className="mt-4 text-3xl font-display leading-tight">
                  Explore evidence-based hiring
                </p>
                <p className="mt-4 max-w-md text-sm leading-6 text-muted-foreground">
                  Review work through structured proof, clearer trust signals, and a more
                  explainable fit model.
                </p>
                <span className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-proofound-forest">
                  Talk to the team
                  <ArrowRight
                    className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </span>
              </button>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
