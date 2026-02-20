'use client';

import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { ArrowRight, ShieldCheck, Lock, FileSearch, Fingerprint } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProofSectionProps {
  shouldReduceMotion?: boolean | null;
}

export function ProofSection({ shouldReduceMotion }: ProofSectionProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });
  const reduceMotion = !!shouldReduceMotion;
  const effectiveInView = reduceMotion ? true : isInView;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { type: 'spring', stiffness: 100, damping: 20 },
    },
  };

  return (
    <section
      id="proof"
      ref={ref}
      className="py-20 md:py-32 lg:py-40 px-6 md:px-12 relative overflow-hidden bg-background scroll-mt-24"
    >
      {/* Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          animate={
            reduceMotion
              ? undefined
              : {
                  scale: [1, 1.1, 1],
                  opacity: [0.3, 0.5, 0.3],
                }
          }
          transition={
            reduceMotion ? undefined : { duration: 10, repeat: Infinity, ease: 'easeInOut' }
          }
          className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-japandi-stone/20 rounded-full blur-[100px]"
        />
        <motion.div
          animate={
            reduceMotion
              ? undefined
              : {
                  scale: [1, 1.2, 1],
                  opacity: [0.2, 0.4, 0.2],
                }
          }
          transition={
            reduceMotion
              ? undefined
              : { duration: 15, repeat: Infinity, ease: 'easeInOut', delay: 2 }
          }
          className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-japandi-sage/10 rounded-full blur-[80px]"
        />
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
          <h2 className="text-5xl md:text-6xl font-display text-foreground mb-6 text-balance">
            Uncompromising <span className="text-japandi-terracotta">Proof.</span>
          </h2>
          <p className="text-xl text-foreground/60 font-sans max-w-2xl mx-auto leading-relaxed">
            We don't just claim credibility; we engineer it. Every interaction is verifiable,
            transparent, and secure by design.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial={reduceMotion ? false : 'hidden'}
          animate={effectiveInView ? 'visible' : 'hidden'}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8"
        >
          {/* Card 1: Verification (Large) */}
          <motion.div
            variants={itemVariants}
            className={cn(
              'md:col-span-2 group relative overflow-hidden rounded-[2.5rem] bg-card/60 backdrop-blur-xl border border-border p-10 md:p-14',
              reduceMotion
                ? ''
                : 'hover:bg-card/80 transition-colors transition-shadow duration-500 hover:shadow-lg hover:shadow-japandi-sage/5'
            )}
          >
            <div
              className={cn(
                'absolute top-0 right-0 p-10 opacity-10',
                reduceMotion ? '' : 'group-hover:opacity-20 transition-opacity duration-500'
              )}
            >
              <Fingerprint className="w-64 h-64 text-japandi-terracotta" />
            </div>

            <div className="relative z-10 h-full flex flex-col justify-between">
              <div>
                <div className="w-16 h-16 rounded-2xl bg-japandi-terracotta/10 flex items-center justify-center mb-8 text-japandi-terracotta">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <h3 className="text-3xl md:text-4xl font-display text-foreground mb-4">
                  Cryptographic Verification
                </h3>
                <p className="text-lg text-foreground/70 font-sans leading-relaxed max-w-md">
                  Every proof is cryptographically verifiable, source-traceable, and time-stamped.
                  Trust is engineered, not assumed.
                </p>
              </div>
              <div className="mt-12">
                <button
                  type="button"
                  className={cn(
                    'text-japandi-terracotta font-medium flex items-center gap-2 font-sans',
                    reduceMotion
                      ? ''
                      : 'hover:gap-4 transition-[gap,transform] duration-300 group-hover:translate-x-2'
                  )}
                >
                  Explore our protocol <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>

          {/* Card 2: Privacy (Tall) */}
          <motion.div
            variants={itemVariants}
            className={cn(
              'md:row-span-2 group relative overflow-hidden rounded-[2.5rem] bg-japandi-charcoal text-white p-10 md:p-12 flex flex-col justify-between',
              reduceMotion ? '' : 'hover:scale-[1.02] transition-transform duration-500'
            )}
          >
            <div
              className={cn(
                'absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0',
                reduceMotion ? '' : 'group-hover:opacity-100 transition-opacity duration-500'
              )}
            />

            <div>
              <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mb-8 text-white">
                <Lock className="w-8 h-8" />
              </div>
              <h3 className="text-3xl font-display mb-4">Privacy First</h3>
              <p className="text-white/70 font-sans leading-relaxed">
                Granular controls at every layer. You decide what's visible, to whom, and when. Your
                data is yours, always.
              </p>
            </div>

            <div className="mt-12 relative">
              <div className="aspect-square rounded-2xl bg-white/5 border border-white/10 p-6 flex items-center justify-center backdrop-blur-sm">
                <div className="text-center">
                  <div className="text-4xl font-display font-bold mb-2">100%</div>
                  <div className="text-sm text-white/60 font-sans uppercase tracking-wider">
                    User Controlled
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Card 3: Audits (Standard) */}
          <motion.div
            variants={itemVariants}
            className={cn(
              'group relative overflow-hidden rounded-[2.5rem] bg-card/70 backdrop-blur-xl border border-border p-10',
              reduceMotion ? '' : 'hover:bg-card transition-colors duration-500'
            )}
          >
            <div className="w-14 h-14 rounded-2xl bg-japandi-sage/10 flex items-center justify-center mb-6 text-japandi-sage">
              <FileSearch className="w-7 h-7" />
            </div>
            <h3 className="text-2xl font-display text-foreground mb-3">Transparent Audits</h3>
            <p className="text-foreground/70 font-sans leading-relaxed">
              Continuous monitoring and published transparency reports ensure our algorithms remain
              open and accountable.
            </p>
          </motion.div>

          {/* Card 4: Open Source (Standard) */}
          <motion.div
            variants={itemVariants}
            className={cn(
              'group relative overflow-hidden rounded-[2.5rem] bg-card/70 backdrop-blur-xl border border-border p-10',
              reduceMotion ? '' : 'hover:bg-card transition-colors duration-500'
            )}
          >
            <div className="w-14 h-14 rounded-2xl bg-japandi-stone/20 flex items-center justify-center mb-6 text-foreground">
              <Fingerprint className="w-7 h-7" />
            </div>
            <h3 className="text-2xl font-display text-foreground mb-3">Open Standards</h3>
            <p className="text-foreground/70 font-sans leading-relaxed">
              Built on open protocols to ensure longevity and interoperability. No walled gardens.
            </p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
