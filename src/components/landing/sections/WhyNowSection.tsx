'use client';

import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { cn } from '@/lib/utils';

interface WhyNowSectionProps {
  shouldReduceMotion?: boolean | null;
}

export function WhyNowSection({ shouldReduceMotion }: WhyNowSectionProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });
  const reduceMotion = !!shouldReduceMotion;
  const effectiveInView = reduceMotion ? true : isInView;

  const reasons = [
    {
      label: 'The AI paradigm shift',
      desc: 'New tools demand new models of trust and verification',
    },
    {
      label: 'The crisis of digital trust',
      desc: 'Deepfakes and misinformation are eroding credibility everywhere',
    },
    {
      label: 'The search for meaning',
      desc: 'Unprecedented uncertainty drives a need for well-being infrastructure',
    },
    {
      label: 'The obsolescence of the CV',
      desc: 'Static credentials fail to capture true capability or alignment',
    },
    {
      label: 'The demand for borderless talent',
      desc: 'Cross-border collaboration requires coordinated trust systems',
    },
  ];

  return (
    <section
      ref={ref}
      className="py-32 md:py-40 px-6 md:px-12 relative bg-background overflow-hidden scroll-mt-24"
    >
      {/* Organic Background */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute bottom-[-20%] left-[-10%] w-[60vw] h-[60vw] bg-proofound-terracotta/5 rounded-full blur-[150px]" />
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 30 }}
          animate={effectiveInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={reduceMotion ? { duration: 0 } : { duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-20"
        >
          <h2 className="text-5xl md:text-6xl font-serif text-foreground mb-6 tracking-tight text-balance">
            Why now
          </h2>
          <p className="text-xl md:text-2xl text-muted-foreground font-sans text-balance">
            The paradigm is shifting. The need is immediate.
          </p>
        </motion.div>

        <div className="space-y-8">
          {reasons.map((reason, idx) => (
            <motion.div
              key={idx}
              initial={reduceMotion ? false : { opacity: 0, x: -20 }}
              animate={effectiveInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
              transition={
                reduceMotion
                  ? { duration: 0 }
                  : { type: 'spring', stiffness: 100, damping: 20, delay: idx * 0.1 }
              }
              className={cn(
                'bg-card/60 backdrop-blur-md p-10 rounded-[2rem] flex items-start gap-8 border border-border',
                reduceMotion
                  ? ''
                  : 'hover:border-proofound-terracotta/30 hover:bg-card/80 transition-colors transition-shadow duration-500 group'
              )}
            >
              <div
                className={cn(
                  'w-12 h-12 rounded-full bg-proofound-terracotta flex items-center justify-center flex-shrink-0 shadow-lg',
                  reduceMotion ? '' : 'group-hover:scale-110 transition-transform duration-300'
                )}
              >
                <span className="text-white font-serif text-xl font-medium">{idx + 1}</span>
              </div>
              <div>
                <h3
                  className={cn(
                    'text-2xl font-serif text-foreground mb-3',
                    reduceMotion
                      ? ''
                      : 'group-hover:text-proofound-terracotta transition-colors duration-300'
                  )}
                >
                  {reason.label}
                </h3>
                <p className="text-muted-foreground leading-relaxed text-lg font-sans">
                  {reason.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
