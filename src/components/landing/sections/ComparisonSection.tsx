'use client';

import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { XCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ComparisonSectionProps {
  shouldReduceMotion?: boolean | null;
}

export function ComparisonSection({ shouldReduceMotion }: ComparisonSectionProps) {
  const reduceMotion = Boolean(shouldReduceMotion);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });
  const effectiveInView = reduceMotion ? true : isInView;

  const oldWayItems = [
    'CVs and profiles are easy to fake',
    'Hiring and networking rely on weak signals',
    'People repeatedly have to prove credibility from scratch',
  ];

  const newWayItems = [
    'One direct-link Public Page',
    'Portable trust signals and verification',
    'Better matching based on evidence and alignment, not posture',
  ];

  return (
    <section
      id="comparison"
      ref={ref}
      className="py-16 md:py-24 px-6 md:px-12 relative bg-background/50 overflow-hidden scroll-mt-24"
    >
      <div className="max-w-6xl mx-auto relative z-10">
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12 items-stretch">
          {/* Old Way Column */}
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, x: -20 }}
            animate={effectiveInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
            transition={
              reduceMotion ? { duration: 0 } : { duration: 0.8, ease: [0.22, 1, 0.36, 1] }
            }
            className="bg-muted/30 border border-border/50 rounded-2xl p-8 lg:p-10 flex flex-col justify-center"
          >
            <h3 className="text-xl md:text-2xl font-serif text-muted-foreground mb-8">
              The Old Way
            </h3>
            <ul className="space-y-6">
              {oldWayItems.map((item, idx) => (
                <li key={idx} className="flex items-start gap-4">
                  <XCircle className="w-6 h-6 text-muted-foreground/50 flex-shrink-0 mt-0.5" />
                  <span className="text-lg text-muted-foreground font-medium">{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* New Way (Proofound) Column */}
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, x: 20 }}
            animate={effectiveInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 20 }}
            transition={
              reduceMotion
                ? { duration: 0 }
                : { duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }
            }
            className="bg-proofound-forest/5 dark:bg-proofound-parchment/5 border border-proofound-forest/20 dark:border-proofound-parchment/20 rounded-2xl p-8 lg:p-10 flex flex-col justify-center shadow-lg"
          >
            <h3 className="text-2xl md:text-3xl font-serif text-proofound-forest dark:text-proofound-parchment mb-8 tracking-tight">
              Proofound
            </h3>
            <ul className="space-y-6">
              {newWayItems.map((item, idx) => (
                <li key={idx} className="flex items-start gap-4">
                  <CheckCircle2 className="w-6 h-6 text-proofound-forest dark:text-proofound-parchment flex-shrink-0 mt-0.5" />
                  <span className="text-lg text-foreground font-medium">{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
