'use client';

import React, { useRef } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import { Globe, Scale, ShieldCheck, Target } from 'lucide-react';

interface TrustStripSectionProps {
  shouldReduceMotion?: boolean | null;
}

export function TrustStripSection({ shouldReduceMotion }: TrustStripSectionProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.1 });
  const reduceMotion = useReducedMotion() ?? !!shouldReduceMotion;
  const effectiveInView = reduceMotion ? true : isInView;

  const features = [
    { text: 'Public proof-based portfolio in minutes', icon: Globe },
    { text: 'Bias-aware, explainable matching', icon: Scale },
    { text: 'Verification and trust signals', icon: ShieldCheck },
    { text: 'Built for real assignments and real outcomes', icon: Target },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
    },
  };

  return (
    <section
      ref={ref}
      className="w-full py-8 md:py-12 px-6 md:px-12 bg-background border-t border-border/50 relative z-10"
    >
      <div className="max-w-7xl mx-auto">
        <motion.div
          variants={containerVariants}
          initial={reduceMotion ? false : 'hidden'}
          animate={effectiveInView ? 'visible' : 'hidden'}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-y-6 gap-x-8"
        >
          {features.map((item, i) => (
            <motion.div key={i} variants={itemVariants} className="flex items-center gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-proofound-forest/10 dark:bg-proofound-parchment/10 flex items-center justify-center">
                <item.icon className="w-4 h-4 text-proofound-forest dark:text-proofound-parchment" />
              </div>
              <span className="text-sm font-medium text-foreground text-balance">{item.text}</span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
