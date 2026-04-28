'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { MagneticButton } from '@/components/landing/MagneticButton';
import { BadgeCheck, Sparkles } from 'lucide-react';
import Image from 'next/image';

interface HeroHumanProofProps {
  shouldReduceMotion?: boolean;
}

export function HeroHumanProof({ shouldReduceMotion }: HeroHumanProofProps) {
  const reduceMotion = Boolean(shouldReduceMotion);

  return (
    <div className="w-full min-h-[90dvh] flex items-center justify-center pt-24 pb-20 relative z-10">
      <div className="max-w-7xl mx-auto w-full grid lg:grid-cols-2 gap-16 lg:gap-12 items-center px-6 md:px-12">
        {/* Left Column */}
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, scale: 0.98 }}
          animate={reduceMotion ? undefined : { opacity: 1, scale: 1 }}
          transition={reduceMotion ? { duration: 0 } : { duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-10 max-w-2xl"
        >
          <div className="space-y-8">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-proofound-forest dark:text-proofound-parchment" />
              <span className="text-sm font-medium text-foreground/80 tracking-wide">
                A calmer way to be seen
              </span>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-[72px] font-display text-foreground leading-[1.05] tracking-tight text-balance">
              Show what you can{' '}
              <span className="font-serif italic text-muted-foreground">actually do.</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed font-sans max-w-[500px]">
              Proofound helps people present real work with clarity and trust — and helps
              organizations hire through explainable evidence, not just polished claims.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-5 pt-2">
            <MagneticButton
              size="lg"
              className="rounded-full px-8 py-7 text-lg font-medium shadow-sm font-sans bg-foreground text-background hover:bg-foreground/90 transition-all w-full sm:w-auto"
            >
              Start with your proof portfolio
            </MagneticButton>
            <button className="rounded-full px-8 py-4 text-lg font-medium text-foreground border border-border/50 hover:bg-muted/50 transition-colors w-full sm:w-auto">
              For organizations
            </button>
          </div>
        </motion.div>

        {/* Right Column - Editorial Human + Proof Composition */}
        <div className="relative w-full h-[500px] lg:h-[600px] flex items-center justify-center lg:justify-end">
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, x: 20 }}
            animate={reduceMotion ? undefined : { opacity: 1, x: 0 }}
            transition={
              reduceMotion
                ? { duration: 0 }
                : { duration: 1.5, delay: 0.2, ease: [0.22, 1, 0.36, 1] }
            }
            className="w-full max-w-[420px] relative"
          >
            {/* Editorial Portrait Frame */}
            <div className="relative aspect-[3/4] w-full max-w-[380px] rounded-2xl overflow-hidden bg-muted ml-auto shadow-2xl border border-border/20">
              <Image
                src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=800"
                alt="Editorial Portrait"
                fill
                className="object-cover grayscale-[20%] opacity-90"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/40 to-transparent mix-blend-multiply" />
            </div>

            {/* Proof Card Overlapping */}
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 20, x: -20 }}
              animate={reduceMotion ? undefined : { opacity: 1, y: 0, x: 0 }}
              transition={
                reduceMotion
                  ? { duration: 0 }
                  : { duration: 1.2, delay: 0.6, ease: [0.22, 1, 0.36, 1] }
              }
              className="absolute -bottom-8 -left-8 sm:-left-12 bg-background/90 backdrop-blur-xl border border-border/50 rounded-2xl p-6 shadow-2xl w-[280px]"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-proofound-forest/10 dark:bg-proofound-parchment/10 flex items-center justify-center flex-shrink-0">
                  <BadgeCheck className="w-5 h-5 text-proofound-forest dark:text-proofound-parchment" />
                </div>
                <div>
                  <h4 className="font-display font-semibold text-foreground mb-1">
                    Impact Verified
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed leading-[1.4]">
                    "Led the platform redesign, increasing engagement by 35% in Q2."
                  </p>
                  <p className="text-[10px] text-foreground/40 mt-3 font-medium uppercase tracking-widest">
                    Confirmed by Design Director
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
