'use client';

import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { MagneticButton } from '@/components/landing/MagneticButton';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FinalCTASectionProps {
  onGetStarted?: () => void;
  shouldReduceMotion?: boolean | null;
}

export function FinalCTASection({ onGetStarted, shouldReduceMotion }: FinalCTASectionProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });
  const reduceMotion = !!shouldReduceMotion;
  const effectiveInView = reduceMotion ? true : isInView;

  return (
    <section
      ref={ref}
      className="relative flex min-h-[58dvh] items-center justify-center overflow-hidden bg-japandi-charcoal px-6 py-16 text-white md:px-12 md:py-24 lg:py-28 scroll-mt-24"
      data-testid="landing-final-cta-section"
    >
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('/noise.png')] opacity-30 mix-blend-overlay" />
        <div className="absolute -left-1/4 top-0 h-[420px] w-[420px] rounded-full bg-japandi-sage/35 blur-[150px]" />
        <div className="absolute -bottom-1/3 right-0 h-[420px] w-[420px] rounded-full bg-japandi-terracotta/25 blur-[160px]" />
      </div>

      <div className="max-w-5xl mx-auto text-center relative z-10">
        <motion.h2
          initial={reduceMotion ? false : { opacity: 0, y: 50 }}
          animate={effectiveInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
          transition={
            reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 80, damping: 20 }
          }
          className="mb-8 text-5xl font-serif leading-[0.95] tracking-tight text-balance md:text-7xl lg:text-8xl"
        >
          Start with proof.
        </motion.h2>

        <motion.p
          initial={reduceMotion ? false : { opacity: 0, y: 30 }}
          animate={effectiveInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={
            reduceMotion
              ? { duration: 0 }
              : { type: 'spring', stiffness: 80, damping: 20, delay: 0.2 }
          }
          className="mx-auto mb-12 max-w-2xl text-lg font-sans leading-relaxed text-white/70 md:text-2xl"
        >
          Build a Proof Pack, publish a public proof portfolio on day one, and move toward
          intro-eligible review when you are ready.
        </motion.p>

        <motion.div
          initial={reduceMotion ? false : { opacity: 0, scale: 0.9 }}
          animate={effectiveInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
          transition={
            reduceMotion
              ? { duration: 0 }
              : { type: 'spring', stiffness: 100, damping: 20, delay: 0.4 }
          }
        >
          <motion.div
            whileHover={reduceMotion ? {} : { scale: 1.05 }}
            whileTap={reduceMotion ? {} : { scale: 0.95 }}
            className="inline-block"
          >
            <MagneticButton
              size="lg"
              onClick={onGetStarted}
              className={cn(
                'relative overflow-hidden rounded-full bg-white px-16 py-8 text-xl font-sans text-foreground shadow-[0_18px_50px_-24px_rgba(255,255,255,0.35)] hover:bg-white/90',
                reduceMotion
                  ? 'transition-colors transition-shadow duration-300'
                  : 'group transition-colors transition-shadow duration-300'
              )}
            >
              <span className="relative z-10 flex items-center gap-3">
                Get Started
                <ArrowRight
                  className={cn(
                    'w-6 h-6',
                    reduceMotion
                      ? ''
                      : 'group-hover:translate-x-2 transition-transform duration-300'
                  )}
                />
              </span>
              <div
                className={cn(
                  'absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent translate-x-[-150%]',
                  reduceMotion
                    ? 'hidden'
                    : 'group-hover:translate-x-[150%] transition-transform duration-700 ease-in-out'
                )}
              />
            </MagneticButton>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
