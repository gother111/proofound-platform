'use client';

import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

interface ProofSectionProps {
  shouldReduceMotion?: boolean | null;
}

export function ProofSection({ shouldReduceMotion }: ProofSectionProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });
  const reduceMotion = !!shouldReduceMotion;
  const effectiveInView = reduceMotion ? true : isInView;
  const mechanics = [
    {
      title: 'Proof Pack is the canonical proof object',
      copy: 'Proof Packs hold the work, outcomes, and context that matter more than self-claimed profile language.',
    },
    {
      title: 'Blind-by-default review is mandatory',
      copy: 'Organizations should see proof-backed summaries first so review starts from evidence, not identity cues.',
    },
    {
      title: 'Progressive reveal stays in the corridor',
      copy: 'Information opens in stages as mutual interest strengthens, rather than dumping identity up front.',
    },
    {
      title: 'Identity-bearing reveal requires consent',
      copy: 'A candidate chooses whether to allow reveal. Reveal is not a default consequence of being reviewed.',
    },
    {
      title: 'Public portfolios do not weaken review privacy',
      copy: 'Publishing a public proof portfolio on day one should never collapse the separate privacy protections used during review.',
    },
    {
      title: 'Compatibility signals stay account-side',
      copy: 'Work email and LinkedIn can help with compatibility, but they do not create public trust lift on their own.',
    },
  ];

  return (
    <section
      id="proof"
      ref={ref}
      className="relative overflow-hidden bg-background px-6 py-16 md:px-12 md:py-24 lg:py-28 scroll-mt-24"
    >
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 h-[520px] w-[520px] rounded-full bg-japandi-stone/20 blur-[100px]" />
        <div className="absolute bottom-0 right-1/4 h-[440px] w-[440px] rounded-full bg-japandi-sage/10 blur-[90px]" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 30 }}
          animate={effectiveInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={
            reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 100, damping: 20 }
          }
          className="text-center mb-24 relative z-10"
        >
          <h2 className="text-4xl font-serif text-foreground mb-6 text-balance md:text-5xl lg:text-6xl">
            Trust and privacy stay inside the corridor
          </h2>
          <p className="mx-auto max-w-3xl text-lg leading-relaxed text-muted-foreground md:text-xl">
            Day-one trust comes from narrow, honest mechanics: Proof Packs, blind-by-default review,
            progressive reveal, and candidate-consented identity reveal.
          </p>
        </motion.div>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {mechanics.map((mechanic, idx) => (
            <motion.div
              key={mechanic.title}
              initial={reduceMotion ? false : { opacity: 0, y: 24 }}
              animate={effectiveInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
              transition={
                reduceMotion
                  ? { duration: 0 }
                  : { duration: 0.65, delay: idx * 0.06, ease: [0.22, 1, 0.36, 1] }
              }
              className="rounded-[2rem] border border-border bg-card/70 p-6 shadow-sm backdrop-blur-sm md:p-8"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-proofound-forest text-sm font-semibold text-white">
                {idx + 1}
              </div>
              <h3 className="mt-5 text-2xl font-serif leading-tight text-foreground">
                {mechanic.title}
              </h3>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                {mechanic.copy}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
