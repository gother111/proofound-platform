'use client';

import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Building2, EyeOff, FolderKanban } from 'lucide-react';

interface HowItWorksSectionProps {
  shouldReduceMotion?: boolean | null;
}

export function HowItWorksSection({ shouldReduceMotion }: HowItWorksSectionProps) {
  const reduceMotion = Boolean(shouldReduceMotion);
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.1 });
  const effectiveInView = reduceMotion ? true : isInView;

  const steps = [
    {
      icon: FolderKanban,
      step: 'Step 1',
      title: 'Add proof into a Proof Pack',
      desc: 'The first meaningful action is add proof. Capture real work, structure it into a Proof Pack, and publish a public proof portfolio on day one.',
    },
    {
      icon: Building2,
      step: 'Step 2',
      title: 'Open the organization corridor',
      desc: 'Organizations publish a trust page and create one structured assignment so candidates know what the work is and why the review is credible.',
    },
    {
      icon: EyeOff,
      step: 'Step 3',
      title: 'Review proof before identity',
      desc: 'Blind-by-default summaries give stronger signal than CVs. Progressive reveal keeps identity hidden until the candidate consents to an identity-bearing reveal.',
    },
  ];

  return (
    <section
      id="how-it-works"
      ref={ref}
      className="relative bg-background px-6 py-16 md:px-12 md:py-24 lg:py-28 scroll-mt-24"
    >
      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 24 }}
          animate={effectiveInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
          transition={reduceMotion ? { duration: 0 } : { duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto max-w-3xl text-center"
        >
          <p className="text-sm font-medium uppercase tracking-[0.22em] text-proofound-forest/80">
            The narrow corridor
          </p>
          <h2 className="mt-4 text-4xl font-serif tracking-tight text-foreground text-balance md:text-5xl lg:text-6xl">
            How Proofound works
          </h2>
          <p className="mt-5 text-lg font-sans leading-relaxed text-muted-foreground md:text-xl">
            One hiring corridor for launch: proof first, trust page plus assignment, then
            blind-by-default review with progressive reveal.
          </p>
        </motion.div>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {steps.map((step, idx) => (
            <motion.div
              key={step.title}
              initial={reduceMotion ? false : { opacity: 0, y: 24 }}
              animate={effectiveInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
              transition={
                reduceMotion
                  ? { duration: 0 }
                  : { duration: 0.65, delay: idx * 0.08, ease: [0.22, 1, 0.36, 1] }
              }
              className="rounded-[2rem] border border-border bg-card/70 p-6 shadow-sm backdrop-blur-sm md:p-8"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-proofound-forest/10 text-proofound-forest">
                <step.icon className="h-6 w-6" aria-hidden="true" />
              </div>
              <p className="mt-6 text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">
                {step.step}
              </p>
              <h3 className="mt-3 text-2xl font-serif leading-tight text-foreground">
                {step.title}
              </h3>
              <p className="mt-4 text-base font-sans leading-relaxed text-muted-foreground md:text-lg">
                {step.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
