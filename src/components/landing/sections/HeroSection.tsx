'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { MagneticButton } from '@/components/landing/MagneticButton';
import { ArrowRight, EyeOff, FolderKanban, UserRoundCheck } from 'lucide-react';

interface HeroSectionProps {
  onIndividualSignup?: () => void;
  onOrganizationSignup?: () => void;
  shouldReduceMotion?: boolean | null;
}

export function HeroSection({
  onIndividualSignup,
  onOrganizationSignup,
  shouldReduceMotion,
}: HeroSectionProps) {
  const reduceMotion = Boolean(shouldReduceMotion);
  const proofChips = [
    {
      icon: FolderKanban,
      label: 'Proof Pack first',
      copy: 'Add proof before you fill out a profile.',
    },
    {
      icon: EyeOff,
      label: 'Blind by default',
      copy: 'Organizations review stronger signal than CVs before identity appears.',
    },
    {
      icon: UserRoundCheck,
      label: 'Reveal by consent',
      copy: 'Identity-bearing reveal only happens when the candidate says yes.',
    },
  ];

  return (
    <section
      className="relative flex min-h-[92dvh] items-center justify-center overflow-hidden px-6 pb-16 pt-28 md:px-12 md:pt-32"
      data-testid="landing-hero-section"
    >
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-multiply dark:mix-blend-overlay z-0" />
        <div
          className="absolute inset-0 z-0 opacity-40 dark:opacity-20"
          style={{
            backgroundImage:
              'radial-gradient(at 80% 0%, hsla(150, 20%, 90%, 1) 0px, transparent 50%), radial-gradient(at 0% 100%, hsla(16, 40%, 90%, 1) 0px, transparent 50%), radial-gradient(at 40% 50%, hsla(43, 80%, 95%, 1) 0px, transparent 50%)',
          }}
        />
        <div className="absolute top-1/4 -right-20 h-[60vw] max-h-[760px] w-[60vw] max-w-[760px] rounded-full bg-japandi-sage/10 blur-[100px]" />
        <div className="absolute -bottom-20 -left-20 h-[50vw] max-h-[620px] w-[50vw] max-w-[620px] rounded-full bg-japandi-terracotta/10 blur-[100px]" />
      </div>

      <div className="relative z-10 mx-auto grid w-full max-w-7xl items-center gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)] lg:gap-14">
        <motion.div
          className="space-y-8"
          initial={reduceMotion ? false : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={reduceMotion ? { duration: 0 } : { duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="space-y-5">
            <p className="text-sm font-medium uppercase tracking-[0.22em] text-proofound-forest/80">
              Proof-backed review for people and hiring teams
            </p>
            <h1 className="text-h1 mb-6 font-serif leading-[0.95] tracking-tight text-foreground">
              Proofound
            </h1>
            <h2 className="text-h3 font-sans leading-tight text-foreground text-balance">
              Stronger signal than CVs, built from proof.
            </h2>
          </div>

          <p className="max-w-2xl text-body-lg font-sans leading-relaxed text-muted-foreground">
            Add proof into a Proof Pack, publish a public proof portfolio on day one, and let
            organizations review blind by default until you choose an identity-bearing reveal.
          </p>

          <div className="grid gap-3 sm:grid-cols-3">
            {proofChips.map((chip) => (
              <div
                key={chip.label}
                className="rounded-[1.75rem] border border-border bg-card/70 px-5 py-5 shadow-sm backdrop-blur-sm"
              >
                <chip.icon className="mb-4 h-5 w-5 text-proofound-forest" aria-hidden="true" />
                <p className="mb-2 text-sm font-semibold text-foreground">{chip.label}</p>
                <p className="text-sm leading-relaxed text-muted-foreground">{chip.copy}</p>
              </div>
            ))}
          </div>

          <div className="flex w-full flex-col gap-4 sm:w-auto sm:flex-row">
            <MagneticButton
              onClick={onIndividualSignup}
              size="lg"
              containerClassName="w-full sm:w-auto"
              className="rounded-full px-8 py-7 text-lg shadow-lg hover:shadow-xl font-sans w-full sm:w-auto"
            >
              Join as an Individual
            </MagneticButton>
            <MagneticButton
              onClick={onOrganizationSignup}
              size="lg"
              variant="outline"
              containerClassName="w-full sm:w-auto"
              className="rounded-full px-8 py-7 text-lg shadow-lg hover:shadow-xl font-sans w-full sm:w-auto"
            >
              Join as an Organization
              <ArrowRight className="ml-3 h-5 w-5" aria-hidden="true" />
            </MagneticButton>
          </div>
        </motion.div>

        <motion.div
          className="rounded-[2rem] border border-border bg-card/75 p-6 shadow-[0_24px_80px_-42px_rgba(35,35,35,0.45)] backdrop-blur-md"
          initial={reduceMotion ? false : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={
            reduceMotion
              ? { duration: 0 }
              : { duration: 0.8, delay: 0.12, ease: [0.22, 1, 0.36, 1] }
          }
        >
          <div className="rounded-[1.5rem] border border-border/80 bg-background/90 p-5">
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Hiring corridor
            </p>
            <div className="mt-5 space-y-4">
              {[
                'Proof Pack added and public proof portfolio published',
                'Organization trust page and one structured assignment live',
                'Blind-by-default review before any reveal decision',
                'Identity-bearing reveal only with candidate consent',
              ].map((item, index) => (
                <div
                  key={item}
                  className="flex items-start gap-4 rounded-2xl bg-muted/40 px-4 py-4"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-proofound-forest text-sm font-semibold text-white">
                    {index + 1}
                  </div>
                  <p className="text-sm leading-relaxed text-foreground/85">{item}</p>
                </div>
              ))}
            </div>
            <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
              Public portfolio publication stays separate from review-stage privacy, so sharing work
              never weakens the blind review corridor.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
