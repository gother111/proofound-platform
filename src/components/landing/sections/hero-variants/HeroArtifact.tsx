'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { MagneticButton } from '@/components/landing/MagneticButton';
import { ShieldCheck, BadgeCheck } from 'lucide-react';

interface HeroArtifactProps {
  shouldReduceMotion?: boolean;
}

export function HeroArtifact({ shouldReduceMotion }: HeroArtifactProps) {
  const reduceMotion = Boolean(shouldReduceMotion);

  return (
    <div className="w-full min-h-[90dvh] flex items-center justify-center pt-24 pb-20 relative z-10">
      <div className="max-w-7xl mx-auto w-full grid lg:grid-cols-2 gap-16 lg:gap-12 items-center px-6 md:px-12">
        {/* Left Column */}
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, x: -20 }}
          animate={reduceMotion ? undefined : { opacity: 1, x: 0 }}
          transition={reduceMotion ? { duration: 0 } : { duration: 1.0, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-10 max-w-2xl"
        >
          <div className="space-y-8">
            <span className="inline-block px-3 py-1 rounded bg-muted/50 text-xs font-semibold tracking-wider uppercase text-muted-foreground border border-border/50">
              Proof-first hiring
            </span>

            <h1 className="text-5xl sm:text-6xl lg:text-[72px] font-display text-foreground leading-[1.05] tracking-tight">
              Publish proof, <br className="hidden sm:block" />
              <span className="text-muted-foreground">not posture.</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed font-sans max-w-[500px]">
              Create a clean public portfolio from real work, verified outcomes, and trusted signals
              — then use it for matching, hiring, and collaboration.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-6 pt-2">
            <MagneticButton
              size="lg"
              className="rounded-xl px-8 py-6 text-lg font-medium shadow-xl hover:shadow-2xl font-sans bg-proofound-forest text-white border border-transparent hover:bg-proofound-forest/90 w-full sm:w-auto transition-all"
            >
              Build your portfolio
            </MagneticButton>
            <button className="text-lg font-medium text-foreground hover:text-proofound-forest transition-colors w-full sm:w-auto">
              See a sample profile &rarr;
            </button>
          </div>
        </motion.div>

        {/* Right Column - Tactile Product Artifact */}
        <div className="relative w-full h-[500px] lg:h-[600px] flex items-center justify-center lg:justify-end">
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 40, rotateX: 10 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0, rotateX: 0 }}
            transition={
              reduceMotion
                ? { duration: 0 }
                : { duration: 1.4, delay: 0.2, ease: [0.22, 1, 0.36, 1] }
            }
            style={{ perspective: 1000 }}
            className="w-full max-w-[480px]"
          >
            <div
              className="bg-background/80 backdrop-blur-2xl rounded-3xl shadow-2xl border border-border/60 overflow-hidden relative z-10 flex flex-col p-8 sm:p-10 transform-gpu"
              style={{
                boxShadow:
                  '0 30px 60px -15px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(255,255,255,0.05) inset',
              }}
            >
              <div className="flex items-center justify-between mb-10">
                <div className="h-6 w-32 bg-muted/50 rounded flex items-center px-3 border border-border/40">
                  <span className="text-[10px] text-muted-foreground truncate">
                    proofound.co/p/sample
                  </span>
                </div>
                <div className="w-10 h-10 rounded-full bg-proofound-forest/10 flex items-center justify-center text-proofound-forest font-serif font-bold text-lg">
                  S
                </div>
              </div>

              <div className="mb-8">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 mb-6">
                  <ShieldCheck className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                  <span className="text-xs font-medium text-green-700 dark:text-green-300">
                    Verified Work Record
                  </span>
                </div>

                <h3 className="text-3xl font-display font-semibold text-foreground mb-3">
                  Sarah Jenkins
                </h3>
                <p className="text-foreground/70 leading-relaxed font-serif italic text-lg max-w-[300px]">
                  "Shipped the V2 re-architecture, improving core web vitals by 40%."
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-muted/30 border border-border/50">
                <div className="flex items-center gap-3 mb-2">
                  <BadgeCheck className="w-5 h-5 text-proofound-forest" />
                  <p className="font-semibold text-foreground">Principal Engineer</p>
                </div>
                <p className="text-sm text-foreground/60 mb-4">
                  Confirmed by previous employer via Proofound Trust Network.
                </p>

                <div className="flex gap-2">
                  <div className="h-2 w-full bg-border/40 rounded-full overflow-hidden">
                    <div className="h-full bg-proofound-forest w-[100%]" />
                  </div>
                </div>
              </div>
            </div>

            {/* Subtle glow behind the card */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-proofound-forest/5 blur-[100px] -z-10 rounded-full" />
          </motion.div>
        </div>
      </div>
    </div>
  );
}
