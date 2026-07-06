'use client';

import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { ShieldCheck, Eye, Fingerprint } from 'lucide-react';

interface PracticalTrustSectionProps {
  shouldReduceMotion?: boolean | null;
}

export function PracticalTrustSection({ shouldReduceMotion }: PracticalTrustSectionProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });
  const reduceMotion = !!shouldReduceMotion;
  const effectiveInView = reduceMotion ? true : isInView;

  const trustPillars = [
    {
      icon: Eye,
      title: 'Evidence over claims',
      desc: 'Portfolios are built on actual work, outcomes, and verifiable data—not just well-written bios.',
    },
    {
      icon: ShieldCheck,
      title: 'Verification & credibility',
      desc: 'Trust signals can be checked against the source or confirmed by people who know the work, creating a higher-signal review.',
    },
    {
      icon: Fingerprint,
      title: 'Explainable matching',
      desc: 'When there is a fit, the reason is visible. No hidden ranking making opaque decisions about your future.',
    },
  ];

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] },
    },
  };

  return (
    <section
      id="trust"
      ref={ref}
      data-testid="landing-trust-section"
      className="py-16 md:py-24 px-6 md:px-12 relative overflow-hidden bg-muted/30 scroll-mt-24"
    >
      <div className="max-w-6xl mx-auto relative z-10">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 20 }}
          animate={effectiveInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={reduceMotion ? { duration: 0 } : { duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-16 max-w-2xl mx-auto"
        >
          <h2 className="text-3xl md:text-5xl font-display text-foreground mb-6 text-balance">
            Trust built on reality
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground font-sans leading-relaxed">
            We replace empty signals with structured evidence. You control your privacy, own your
            portable proof, and always know how matches are made.
          </p>
        </motion.div>

        <motion.div
          initial={reduceMotion ? false : 'hidden'}
          animate={effectiveInView ? 'visible' : 'hidden'}
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: { staggerChildren: 0.15 },
            },
          }}
          className="grid md:grid-cols-3 gap-8"
        >
          {trustPillars.map((pillar, idx) => (
            <motion.div
              key={idx}
              variants={itemVariants}
              className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-3xl p-8 flex flex-col items-start"
            >
              <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-6">
                <pillar.icon className="w-6 h-6 text-foreground" strokeWidth={1.5} />
              </div>
              <h3 className="text-xl font-serif text-foreground mb-3">{pillar.title}</h3>
              <p className="text-muted-foreground font-sans leading-relaxed">{pillar.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
