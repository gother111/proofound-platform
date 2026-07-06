'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Mail } from 'lucide-react';

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
      <div className="absolute inset-0 bg-transparent" aria-hidden="true" />
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <motion.div
          animate={
            reduceMotion
              ? undefined
              : {
                  opacity: [0.18, 0.28, 0.18],
                  y: [0, 10, 0],
                }
          }
          transition={
            reduceMotion ? undefined : { duration: 18, repeat: Infinity, ease: 'easeInOut' }
          }
          className="absolute inset-x-0 top-0 h-28 bg-[linear-gradient(180deg,rgba(86,98,79,0.1),rgba(86,98,79,0))]"
        />
        <motion.div
          animate={
            reduceMotion
              ? undefined
              : {
                  opacity: [0.16, 0.26, 0.16],
                  y: [0, -12, 0],
                }
          }
          transition={
            reduceMotion
              ? undefined
              : { duration: 22, repeat: Infinity, ease: 'easeInOut', delay: 1.2 }
          }
          className="absolute inset-x-0 bottom-0 h-32 bg-[linear-gradient(0deg,rgba(139,74,54,0.09),rgba(139,74,54,0))]"
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
                Start with verified proof
              </p>
              <motion.h2
                initial={false}
                animate={{ opacity: 1, y: 0 }}
                transition={
                  reduceMotion
                    ? { duration: 0 }
                    : { duration: 0.9, delay: 0.08, ease: [0.22, 1, 0.36, 1] }
                }
                className="mt-5 max-w-[11ch] font-display text-[2.3rem] leading-[0.95] text-foreground md:mx-auto md:max-w-none md:text-6xl"
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
                className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground md:mx-auto md:mt-6 md:text-lg md:leading-8"
              >
                Proofound helps people present real capability through structured evidence, and
                helps organizations compare proof before time is lost.
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
              className="mt-7 grid gap-3 md:mt-12 md:gap-5 lg:grid-cols-2"
            >
              <button
                id="start-individuals"
                type="button"
                onClick={onIndividualSignup ?? onGetStarted}
                data-testid="landing-final-individual-cta"
                className="group rounded-[1.55rem] border border-proofound-forest/12 bg-proofound-forest px-5 py-5 text-left text-white transition-[box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:shadow-[0_22px_54px_-34px_rgba(28,77,58,0.68)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-proofound-forest/35 focus-visible:ring-offset-4 focus-visible:ring-offset-white active:translate-y-0 md:rounded-[2rem] md:px-6 md:py-6"
              >
                <p className="text-sm uppercase tracking-[0.24em] text-white/85">For individuals</p>
                <p className="mt-4 text-3xl font-display leading-tight">
                  Create your proof profile — free
                </p>
                <p className="mt-4 max-w-md text-sm leading-6 text-white/85">
                  Start with a cleaner proof profile, then add proof, confirmation, and privacy-safe
                  signal over time.
                </p>
                <span className="mt-6 inline-flex items-center gap-2 text-sm font-medium">
                  Create your proof profile
                  <ArrowRight
                    className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </span>
              </button>

              <button
                id="start-organizations"
                type="button"
                onClick={onOrganizationSignup ?? onGetStarted}
                data-testid="landing-final-organization-cta"
                className="group rounded-[1.55rem] border border-border/80 bg-white/78 px-5 py-5 text-left text-foreground transition-[background-color,box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_22px_54px_-38px_rgba(45,51,48,0.45)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-proofound-forest/35 focus-visible:ring-offset-4 focus-visible:ring-offset-white active:translate-y-0 md:rounded-[2rem] md:px-6 md:py-6"
              >
                <p className="text-sm uppercase tracking-[0.24em] text-foreground/54">
                  For organizations
                </p>
                <p className="mt-4 text-3xl font-display leading-tight">Start screening on proof</p>
                <p className="mt-4 max-w-md text-sm leading-6 text-muted-foreground">
                  Review work through structured proof, clearer verification checks, and a more
                  explainable assignment-fit review.
                </p>
                <span className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-proofound-forest">
                  Start screening on proof
                  <ArrowRight
                    className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </span>
              </button>
            </motion.div>

            <div className="mt-7 text-center">
              <a
                href="mailto:hello@proofound.io?subject=Proofound%20organization%20screening"
                className="inline-flex items-center gap-2 text-sm font-medium text-proofound-forest underline-offset-4 hover:underline"
              >
                <Mail className="h-4 w-4" aria-hidden="true" />
                Talk to us
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
