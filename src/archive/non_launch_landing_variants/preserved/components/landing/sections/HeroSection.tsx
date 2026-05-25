'use client';

import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { MagneticButton } from '@/components/landing/MagneticButton';
import { ShieldCheck, BadgeCheck, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface HeroSectionProps {
  onIndividualSignup?: () => void;
  onOrganizationSignup?: () => void;
  shouldReduceMotion?: boolean | null;
}

export function HeroSection({
  onIndividualSignup,
  onOrganizationSignup,
  shouldReduceMotion,
}: HeroSectionProps) {
  const reduceMotion = Boolean(shouldReduceMotion);
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  });

  const y1 = useTransform(scrollYProgress, [0, 1], [0, 80]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -40]);

  return (
    <section
      ref={containerRef}
      className="relative min-h-[100dvh] sm:min-h-[90dvh] flex items-center justify-center overflow-hidden px-6 md:px-12 pt-28 md:pt-32 pb-20 scroll-mt-24"
      data-testid="landing-hero-section"
    >
      {/* Background Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Grain Overlay */}
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-multiply dark:mix-blend-overlay z-0" />
      </div>

      <div className="max-w-7xl mx-auto w-full grid lg:grid-cols-2 gap-16 lg:gap-12 items-center relative z-10">
        {/* Left Column - Text Content */}
        <motion.div style={{ y: reduceMotion ? 0 : y1 }} className="space-y-10 max-w-2xl">
          <div className="space-y-8">
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 20 }}
              animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              transition={
                reduceMotion ? { duration: 0 } : { duration: 0.8, ease: [0.22, 1, 0.36, 1] }
              }
              className="inline-flex items-center gap-2"
            >
              <div className="h-px w-6 bg-proofound-forest dark:bg-proofound-parchment" />
              <span className="text-sm font-semibold text-proofound-forest dark:text-proofound-parchment uppercase tracking-wider">
                Proof-first hiring for people and organizations
              </span>
            </motion.div>

            <motion.h1
              initial={reduceMotion ? false : { opacity: 0, y: 30 }}
              animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              transition={
                reduceMotion
                  ? { duration: 0 }
                  : { duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.1 }
              }
              className="text-4xl sm:text-5xl lg:text-[64px] font-display text-foreground leading-[1.05] tracking-tight text-balance"
            >
              Hire and get hired through verified proof, not CV noise
            </motion.h1>

            <motion.p
              initial={reduceMotion ? false : { opacity: 0, y: 20 }}
              animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              transition={
                reduceMotion
                  ? { duration: 0 }
                  : { duration: 1.2, delay: 0.25, ease: [0.22, 1, 0.36, 1] }
              }
              className="text-lg md:text-xl text-muted-foreground leading-relaxed font-sans max-w-[540px]"
            >
              Proofound helps individuals turn real work into clear, shareable proof-based
              portfolios, and helps organizations find values-aligned talent through structured
              evidence, trust signals, and explainable matching.
            </motion.p>
          </div>

          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 20 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            transition={
              reduceMotion
                ? { duration: 0 }
                : { duration: 1.2, delay: 0.4, ease: [0.22, 1, 0.36, 1] }
            }
            className="flex flex-col gap-4"
          >
            <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-4">
              <MagneticButton
                onClick={onIndividualSignup}
                size="lg"
                containerClassName="w-full sm:w-auto"
                className="rounded-full px-8 py-7 text-lg shadow-lg hover:shadow-xl font-sans w-full sm:w-auto bg-proofound-forest hover:bg-proofound-forest/90 text-white"
              >
                Create your proof-based portfolio
              </MagneticButton>
              <button
                type="button"
                onClick={() =>
                  document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })
                }
                className="rounded-full px-8 py-4 text-lg font-medium text-foreground hover:text-proofound-forest hover:bg-muted/50 transition-colors w-full sm:w-auto"
              >
                See how Proofound works
              </button>
            </div>
            <p className="text-sm text-muted-foreground ml-2 pt-2">
              Share a clean Public Page link today. No CV-first workflow.
            </p>
          </motion.div>
        </motion.div>

        {/* Right Column - UI Mockups */}
        <div className="relative w-full h-full min-h-[500px] lg:min-h-[600px] flex items-center justify-center lg:justify-end">
          {/* Main Browser Mockup */}
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, scale: 0.95, y: 40 }}
            animate={reduceMotion ? undefined : { opacity: 1, scale: 1, y: 0 }}
            transition={
              reduceMotion
                ? { duration: 0 }
                : { duration: 1.4, delay: 0.2, ease: [0.22, 1, 0.36, 1] }
            }
            className="w-full max-w-[500px] bg-card rounded-2xl shadow-xl border border-border/40 overflow-hidden relative z-10 flex flex-col will-change-transform"
          >
            {/* Browser Header */}
            <div className="h-10 bg-muted/20 border-b border-border/40 flex items-center px-4 gap-2">
              <div className="w-3 h-3 rounded-full bg-border/80" />
              <div className="w-3 h-3 rounded-full bg-border/80" />
              <div className="w-3 h-3 rounded-full bg-border/80" />
              <div className="mx-auto bg-background/50 border border-border/30 rounded-md h-6 w-1/2 flex items-center justify-center">
                <span className="text-[10px] text-muted-foreground font-medium">
                  proofound.co/p/alex-chen
                </span>
              </div>
            </div>

            {/* Portfolio Content */}
            <div className="p-6 md:p-8 flex-1 bg-gradient-to-b from-background to-muted/5">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-display font-semibold text-foreground mb-1">
                    Alex Chen
                  </h3>
                  <p className="text-sm text-muted-foreground font-medium mb-3">
                    Senior Product Engineer
                  </p>
                  <p className="text-sm text-foreground/80 leading-relaxed max-w-[280px]">
                    Building scalable systems and leading technical teams. Focused on high-impact
                    outcomes over output.
                  </p>
                </div>
                {/* Avatar Placeholder */}
                <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center border border-border">
                  <span className="text-lg font-display font-medium text-foreground/60">AC</span>
                </div>
              </div>

              {/* Trust Bar */}
              <div className="flex items-center gap-2 mb-8 bg-proofound-success-tint/30 dark:bg-green-950/20 border border-green-100 dark:border-green-900 rounded-md p-2 px-3">
                <ShieldCheck className="w-4 h-4 text-green-600 dark:text-green-400" />
                <span className="text-xs font-medium text-green-800 dark:text-green-300">
                  Identity & Experience Verified
                </span>
              </div>

              {/* Top Skills */}
              <div className="mb-6">
                <h4 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                  Top Verified Skills
                </h4>
                <div className="flex flex-wrap gap-2">
                  <span className="px-2.5 py-1 rounded bg-muted/50 text-xs font-medium border border-border/30">
                    System Architecture
                  </span>
                  <span className="px-2.5 py-1 rounded bg-muted/50 text-xs font-medium border border-border/30">
                    React / Next.js
                  </span>
                  <span className="px-2.5 py-1 rounded bg-muted/50 text-xs font-medium border border-border/30">
                    Team Leadership
                  </span>
                </div>
              </div>

              {/* Outcome Cards */}
              <div>
                <h4 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                  Recent Outcomes
                </h4>
                <div className="space-y-3">
                  <div className="p-4 rounded-xl border border-border/60 bg-background shadow-sm">
                    <p className="text-sm font-medium text-foreground mb-1.5">
                      Scaled API infrastructure to 10k RPS
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <BadgeCheck className="w-3.5 h-3.5 text-proofound-forest" /> Verified
                      </span>
                      <span>•</span>
                      <span>Q3 2025</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Floating proof-fit card */}
          <motion.div
            style={{ y: reduceMotion ? 0 : y2 }}
            initial={reduceMotion ? false : { opacity: 0, x: 20 }}
            animate={reduceMotion ? undefined : { opacity: 1, x: 0 }}
            transition={
              reduceMotion
                ? { duration: 0 }
                : { duration: 1.2, delay: 0.8, ease: [0.22, 1, 0.36, 1] }
            }
            className="absolute -right-4 sm:-right-8 top-10 sm:top-24 bg-background/95 backdrop-blur-xl border border-border/60 rounded-xl p-4 sm:p-5 shadow-xl z-20 w-[220px]"
          >
            <div className="flex items-center gap-3 mb-3 border-b border-border/40 pb-3">
              <div className="w-9 h-9 rounded-full bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Proof-fit band
                </p>
                <p className="text-xl font-display font-semibold text-foreground leading-none mt-0.5">
                  Strong review
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">
                Reason Codes
              </p>
              <div className="flex items-center gap-2 text-xs font-medium text-foreground/80">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-500/80 flex-shrink-0" />
                Tool fluency
              </div>
              <div className="flex items-center gap-2 text-xs font-medium text-foreground/80">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-500/80 flex-shrink-0" />
                Mission alignment
              </div>
              <div className="flex items-center gap-2 text-xs font-medium text-foreground/80">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-500/80 flex-shrink-0" />
                Verified outcomes
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
