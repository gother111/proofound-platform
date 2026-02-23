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
      className="py-16 md:py-32 lg:py-40 px-6 md:px-12 relative bg-japandi-charcoal text-white overflow-hidden flex items-center justify-center min-h-[80dvh] scroll-mt-24"
      data-testid="landing-final-cta-section"
    >
      {/* Background Decoration */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('/noise.png')] opacity-30 mix-blend-overlay" />
        <motion.div
          animate={
            reduceMotion
              ? undefined
              : {
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.5, 0.3],
                  rotate: [0, 10, 0],
                }
          }
          transition={
            reduceMotion ? undefined : { duration: 20, repeat: Infinity, ease: 'easeInOut' }
          }
          className="absolute -top-1/2 -left-1/2 w-[150%] h-[150%] bg-gradient-to-br from-japandi-sage/40 to-transparent rounded-full blur-[150px]"
        />
        <motion.div
          animate={
            reduceMotion
              ? undefined
              : {
                  scale: [1, 1.3, 1],
                  opacity: [0.2, 0.4, 0.2],
                  rotate: [0, -15, 0],
                }
          }
          transition={
            reduceMotion
              ? undefined
              : { duration: 25, repeat: Infinity, ease: 'easeInOut', delay: 2 }
          }
          className="absolute -bottom-1/2 -right-1/2 w-[150%] h-[150%] bg-gradient-to-tl from-japandi-terracotta/40 to-transparent rounded-full blur-[150px]"
        />
      </div>

      <div className="max-w-5xl mx-auto text-center relative z-10">
        <motion.h2
          initial={reduceMotion ? false : { opacity: 0, y: 50 }}
          animate={effectiveInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
          transition={
            reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 80, damping: 20 }
          }
          className="text-5xl md:text-7xl lg:text-9xl font-display mb-12 leading-[0.9] tracking-tight text-balance"
        >
          Ready to share <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-japandi-sage to-white">
            proof today?
          </span>
        </motion.h2>

        <motion.p
          initial={reduceMotion ? false : { opacity: 0, y: 30 }}
          animate={effectiveInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={
            reduceMotion
              ? { duration: 0 }
              : { type: 'spring', stiffness: 80, damping: 20, delay: 0.2 }
          }
          className="text-xl md:text-2xl text-white/60 mb-16 max-w-2xl mx-auto font-sans leading-relaxed"
        >
          Start with a clean public proof portfolio link, then grow into matching and collaboration
          workflows at your pace.
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
                'bg-white text-foreground hover:bg-white/90 text-xl px-16 py-10 rounded-full shadow-[0_0_50px_-10px_rgba(255,255,255,0.3)] hover:shadow-[0_0_80px_-10px_rgba(255,255,255,0.5)] font-sans relative overflow-hidden',
                reduceMotion
                  ? 'transition-colors transition-shadow duration-300'
                  : 'transition-colors transition-shadow duration-500 group'
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
                    : 'group-hover:translate-x-[150%] transition-transform duration-1000 ease-in-out'
                )}
              />
            </MagneticButton>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
