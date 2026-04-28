'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { MagneticButton } from '@/components/landing/MagneticButton';
import { Fingerprint, CheckCircle2 } from 'lucide-react';

interface HeroManifestoProps {
  shouldReduceMotion?: boolean;
}

export function HeroManifesto({ shouldReduceMotion }: HeroManifestoProps) {
  const reduceMotion = Boolean(shouldReduceMotion);

  return (
    <div className="w-full min-h-[90dvh] flex items-center justify-center pt-24 pb-20 relative z-10">
      <div className="max-w-7xl mx-auto w-full grid lg:grid-cols-2 gap-16 lg:gap-12 items-center px-6 md:px-12">
        {/* Left Column */}
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 30 }}
          animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          transition={reduceMotion ? { duration: 0 } : { duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-10 max-w-2xl"
        >
          <div className="space-y-8">
            <div className="inline-flex items-center gap-3">
              <div className="h-px w-8 bg-foreground/60" />
              <span className="text-sm font-semibold tracking-[0.2em] uppercase text-foreground/80">
                Work, verified.
              </span>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-[72px] font-display text-foreground leading-[1] tracking-tight">
              People are
              <br />
              <span className="text-muted-foreground italic font-serif">more than CVs.</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed font-sans max-w-[500px]">
              Proofound helps people turn real work into clear, shareable proof — and helps
              organizations find talent through evidence, not noise.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-6 pt-4">
            <MagneticButton
              size="lg"
              className="rounded-none px-10 py-6 text-lg tracking-wide font-sans bg-foreground text-background hover:bg-foreground/90 transition-colors"
            >
              Create your proof portfolio
            </MagneticButton>
            <button className="text-lg font-medium text-muted-foreground hover:text-foreground underline decoration-muted-foreground/30 hover:decoration-foreground underline-offset-4 transition-all">
              How it works
            </button>
          </div>
        </motion.div>

        {/* Right Column - Symbolic Abstract Artifact */}
        <div className="relative w-full h-[500px] lg:h-[600px] flex items-center justify-center lg:justify-end">
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, scale: 0.95 }}
            animate={reduceMotion ? undefined : { opacity: 1, scale: 1 }}
            transition={
              reduceMotion
                ? { duration: 0 }
                : { duration: 1.6, delay: 0.3, ease: [0.22, 1, 0.36, 1] }
            }
            className="w-full max-w-[420px] aspect-[3/4] bg-proofound-parchment dark:bg-[#1C1C1A] border shadow-2xl relative overflow-hidden flex flex-col items-center justify-center p-12"
            style={{
              borderColor: 'hsl(var(--border) / 0.5)',
              boxShadow:
                '0 25px 50px -12px rgba(0, 0, 0, 0.15), inset 0 0 0 1px rgba(255, 255, 255, 0.1)',
            }}
          >
            {/* Subtle paper texture/grain */}
            <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.04] mix-blend-multiply z-0" />

            <div className="relative z-10 flex flex-col items-center text-center space-y-8 w-full">
              <div className="w-16 h-16 rounded-full border border-foreground/20 flex items-center justify-center">
                <Fingerprint className="w-8 h-8 text-foreground/40" strokeWidth={1} />
              </div>

              <div className="space-y-4 w-full">
                <div className="h-0.5 w-12 bg-foreground/10 mx-auto" />
                <h3 className="font-serif text-2xl text-foreground tracking-tight">
                  Verified Record
                </h3>
                <div className="h-0.5 w-12 bg-foreground/10 mx-auto" />
              </div>

              <div className="space-y-3 w-full">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between border-b border-foreground/5 pb-2"
                  >
                    <div className="h-2 w-24 bg-foreground/10 rounded" />
                    <CheckCircle2 className="w-4 h-4 text-proofound-forest/50 dark:text-proofound-parchment/50" />
                  </div>
                ))}
              </div>

              <div className="pt-8 w-full flex justify-between items-end border-t border-foreground/10 mt-12">
                <div className="h-2 w-16 bg-foreground/10 rounded" />
                <div className="w-8 h-8 rounded-full border border-foreground/20 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-foreground/40" />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
