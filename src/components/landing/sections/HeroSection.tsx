'use client';

import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import { useRef } from 'react';
import { ArrowRight, CheckCircle2, ShieldCheck, EyeOff, LayoutTemplate } from 'lucide-react';
import { MagneticButton } from '@/components/ui/magnetic-button';

interface HeroSectionProps {
  shouldReduceMotion?: boolean;
  onOrganizationSignup?: () => void;
  onIndividualSignup?: () => void;
}

export function HeroSection({
  shouldReduceMotion = false,
  onOrganizationSignup,
  onIndividualSignup,
}: HeroSectionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  });

  // Animation values for the CV to Proof transformation
  const fadeOutNoise = useTransform(scrollYProgress, [0, 0.3], [1, 0]);
  const blurNoise = useTransform(scrollYProgress, [0, 0.3], [0, 10]);

  const emergeProof = useTransform(scrollYProgress, [0.4, 0.7], [0, 1]);
  const yProof = useTransform(scrollYProgress, [0.4, 0.7], [20, 0]);

  return (
    <section ref={containerRef} className="relative w-full h-[200vh]">
      <div className="sticky top-0 h-screen w-full flex items-center overflow-hidden">
        <div className="max-w-7xl mx-auto w-full px-6 lg:px-12 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Column: Copy */}
          <div className="flex flex-col z-10">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: { staggerChildren: 0.15, delayChildren: 0.1 },
                },
              }}
            >
              <motion.span
                variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}
                className="inline-block text-proofound-terracotta font-semibold tracking-[0.15em] text-xs mb-6 uppercase"
              >
                Stronger signal than CVs
              </motion.span>
              <motion.h1
                variants={{ hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0 } }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                className="text-5xl md:text-6xl lg:text-[5rem] font-display text-proofound-forest dark:text-foreground leading-[1.05] mb-8 tracking-tight"
              >
                See the work <br className="hidden sm:block" /> behind the claim.
              </motion.h1>
              <motion.p
                variants={{ hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0 } }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-xl mb-12"
              >
                Proofound helps people turn real work into structured proof and helps organizations
                review candidates through proof-backed, privacy-safe, explainable signal instead of
                profile theater.
              </motion.p>

              <motion.div
                variants={{ hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0 } }}
                className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-12"
              >
                <MagneticButton
                  onClick={onOrganizationSignup}
                  className="bg-proofound-terracotta text-white rounded-full px-8 py-3.5 flex items-center justify-center font-medium shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all text-base w-full sm:w-auto ring-1 ring-proofound-terracotta/50"
                >
                  Request a pilot
                  <ArrowRight className="ml-2 w-4 h-4" />
                </MagneticButton>

                <button
                  onClick={onIndividualSignup}
                  className="px-6 py-3.5 text-proofound-forest dark:text-foreground hover:text-proofound-terracotta transition-colors font-medium border-b border-transparent hover:border-proofound-terracotta/30 pb-1 w-full sm:w-auto flex justify-center items-center group"
                >
                  Create your proof portfolio
                  <ArrowRight className="ml-2 w-3.5 h-3.5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                </button>
              </motion.div>

              <motion.p
                variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}
                transition={{ delay: 0.8 }}
                className="text-sm text-muted-foreground/70 max-w-md leading-relaxed border-l-2 border-proofound-terracotta/20 pl-4 py-1 italic"
              >
                For lean teams hiring through work, not noise — and for under-credited talent with
                real work to show.
              </motion.p>
            </motion.div>
          </div>

          {/* Right Column: Visual Transformation */}
          <div className="relative h-[600px] w-full flex items-center justify-center lg:justify-end hidden md:flex perspective-1000">
            {/* The Main Surface */}
            <div className="relative w-full max-w-[480px] aspect-[3/4] bg-white dark:bg-[#1a1a1a] border border-border/40 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] rounded-3xl overflow-hidden group-hover:shadow-[0_30px_70px_-15px_rgba(0,0,0,0.15)] transition-shadow duration-700">
              {/* STATE 1: Noisy CV Surface */}
              <motion.div
                className="absolute inset-0 p-8 flex flex-col pointer-events-none"
                style={{ opacity: fadeOutNoise, filter: `blur(${blurNoise}px)` }}
              >
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-16 h-16 rounded-full bg-muted animate-pulse" />
                  <div>
                    <div className="h-6 w-48 bg-muted rounded mb-2" />
                    <div className="h-4 w-32 bg-muted/60 rounded" />
                  </div>
                </div>

                <div className="space-y-3 mb-8">
                  <div className="h-3 w-full bg-muted/40 rounded" />
                  <div className="h-3 w-5/6 bg-muted/40 rounded" />
                  <div className="h-3 w-4/6 bg-muted/40 rounded" />
                </div>

                <div className="h-4 w-24 bg-muted/80 rounded mb-4" />
                <div className="flex flex-wrap gap-2 mb-8">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="h-8 w-20 bg-muted/30 rounded-full" />
                  ))}
                </div>

                <div className="mt-auto flex justify-between items-center pt-6 border-t border-border">
                  <div className="flex -space-x-2">
                    <div className="w-8 h-8 rounded-full bg-muted border-2 border-white dark:border-card" />
                    <div className="w-8 h-8 rounded-full bg-muted border-2 border-white dark:border-card" />
                    <div className="w-8 h-8 rounded-full bg-muted border-2 border-white dark:border-card" />
                  </div>
                  <div className="h-4 w-32 bg-muted/50 rounded" />
                </div>
              </motion.div>

              {/* STATE 2: Proof-first Structure */}
              <motion.div
                className="absolute inset-0 p-8 bg-white dark:bg-card flex flex-col"
                style={{ opacity: emergeProof, y: yProof }}
              >
                <div className="flex items-center gap-3 mb-8 pb-6 border-b border-border/50">
                  <div className="w-10 h-10 rounded bg-proofound-forest/5 dark:bg-white/5 flex items-center justify-center">
                    <LayoutTemplate className="w-5 h-5 text-proofound-forest dark:text-muted-foreground" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-foreground">
                      Operations lead · B2B SaaS
                    </div>
                    <div className="text-xs text-muted-foreground">Team of 6</div>
                  </div>
                </div>

                <div className="space-y-8 flex-1">
                  <div>
                    <span className="text-[10px] font-semibold tracking-wider uppercase text-proofound-terracotta mb-2 block">
                      Outcome
                    </span>
                    <h3 className="text-xl font-display text-proofound-forest dark:text-foreground">
                      Reduced onboarding time by 31%
                    </h3>
                  </div>

                  <div>
                    <span className="text-[10px] font-semibold tracking-wider uppercase text-muted-foreground mb-2 block">
                      Artifact
                    </span>
                    <div className="flex items-center gap-2 text-sm text-foreground bg-muted/30 py-2 px-3 rounded-md border border-border/50">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      Onboarding redesign deck
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-[10px] font-semibold tracking-wider uppercase text-muted-foreground mb-2 block">
                        Verification
                      </span>
                      <div className="flex items-center gap-1.5 text-sm text-foreground">
                        <ShieldCheck className="w-4 h-4 text-proofound-terracotta" />
                        Peer-attested
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold tracking-wider uppercase text-muted-foreground mb-2 block">
                        Fit cue
                      </span>
                      <div className="flex flex-wrap gap-1">
                        <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded">
                          Workflow design
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Privacy Hint */}
                <div className="mt-auto pt-6 border-t border-border flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <EyeOff className="w-3.5 h-3.5" />
                  Identity hidden during early review
                </div>
              </motion.div>
            </div>

            {/* Interpretive Caption */}
            <motion.div
              style={{ opacity: emergeProof }}
              className="absolute -bottom-6 right-0 bg-background/80 backdrop-blur-sm border border-border py-2 px-4 rounded-full text-sm text-foreground shadow-sm"
            >
              When noise recedes, real work becomes easier to compare.
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
