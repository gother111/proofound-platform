'use client';

import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { MagneticButton } from '@/components/landing/MagneticButton';
import { ArrowRight } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

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

  const y = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    <section
      ref={containerRef}
      className="relative min-h-[100dvh] sm:min-h-[90dvh] flex items-center justify-center overflow-hidden px-6 md:px-12 pt-28 md:pt-32 scroll-mt-24"
      data-testid="landing-hero-section"
    >
      {/* Background Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Grain Overlay */}
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-multiply dark:mix-blend-overlay z-0" />

        {/* Animated Mesh Gradient */}
        <div
          className={cn(
            'absolute inset-0 opacity-40 dark:opacity-20 z-0',
            reduceMotion ? '' : 'animate-hero-mesh'
          )}
          style={{
            backgroundImage:
              'radial-gradient(at 80% 0%, hsla(150, 20%, 90%, 1) 0px, transparent 50%), radial-gradient(at 0% 100%, hsla(16, 40%, 90%, 1) 0px, transparent 50%), radial-gradient(at 40% 50%, hsla(43, 80%, 95%, 1) 0px, transparent 50%)',
          }}
        />

        {/* Organic Shape Right */}
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, scale: 0.95 }}
          animate={reduceMotion ? undefined : { opacity: 1, scale: 1 }}
          transition={reduceMotion ? { duration: 0 } : { duration: 2.5, ease: [0.22, 1, 0.36, 1] }}
          className="absolute top-1/4 -right-20 w-[60vw] h-[60vw] max-w-[800px] max-h-[800px] bg-japandi-sage/10 rounded-full blur-[100px] mix-blend-multiply dark:mix-blend-lighten"
        />
        {/* Organic Shape Left */}
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, scale: 0.95 }}
          animate={reduceMotion ? undefined : { opacity: 1, scale: 1 }}
          transition={
            reduceMotion ? { duration: 0 } : { duration: 2.5, delay: 0.4, ease: [0.22, 1, 0.36, 1] }
          }
          className="absolute -bottom-20 -left-20 w-[50vw] h-[50vw] max-w-[700px] max-h-[700px] bg-japandi-terracotta/10 rounded-full blur-[100px] mix-blend-multiply dark:mix-blend-lighten"
        />
      </div>

      <div className="max-w-7xl mx-auto w-full grid lg:grid-cols-2 gap-12 items-center relative z-10">
        {/* Text Content */}
        <motion.div
          style={{ y: reduceMotion ? 0 : y, opacity: reduceMotion ? 1 : opacity }}
          className="space-y-8"
        >
          <div>
            <motion.h1
              // Avoid animating opacity on text so contrast does not drop below WCAG AA mid-transition.
              initial={reduceMotion ? false : { y: 40 }}
              animate={reduceMotion ? undefined : { y: 0 }}
              transition={
                reduceMotion
                  ? { duration: 0 }
                  : { duration: 1.4, ease: [0.22, 1, 0.36, 1], delay: 0.1 }
              }
              className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-serif text-foreground leading-[0.95] tracking-tight mb-6"
            >
              Proofound
            </motion.h1>
            <motion.h2
              initial={reduceMotion ? false : { y: 30 }}
              animate={reduceMotion ? undefined : { y: 0 }}
              transition={
                reduceMotion
                  ? { duration: 0 }
                  : { duration: 1.4, ease: [0.22, 1, 0.36, 1], delay: 0.25 }
              }
              className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-sans text-foreground leading-tight text-balance"
            >
              Publish your public proof portfolio on day 1
            </motion.h2>
          </div>

          <motion.p
            initial={reduceMotion ? false : { y: 20, opacity: 0 }}
            animate={reduceMotion ? undefined : { y: 0, opacity: 1 }}
            transition={
              reduceMotion
                ? { duration: 0 }
                : { duration: 1.2, delay: 0.45, ease: [0.22, 1, 0.36, 1] }
            }
            className="text-lg md:text-xl text-muted-foreground max-w-xl leading-relaxed font-sans"
          >
            Get a clean, shareable portfolio link today. Then layer on matching, hiring, and
            collaboration workflows as you grow.
          </motion.p>

          <motion.div
            initial={reduceMotion ? false : { y: 20, opacity: 0 }}
            animate={reduceMotion ? undefined : { y: 0, opacity: 1 }}
            transition={
              reduceMotion
                ? { duration: 0 }
                : { duration: 1.2, delay: 0.6, ease: [0.22, 1, 0.36, 1] }
            }
            className="flex flex-col sm:flex-row w-full sm:w-auto gap-4"
          >
            <MagneticButton
              onClick={onIndividualSignup}
              size="lg"
              containerClassName="w-full sm:w-auto"
              className="rounded-full px-8 py-7 text-lg shadow-lg hover:shadow-xl font-sans w-full sm:w-auto"
            >
              Join as an Individual
            </MagneticButton>
            <MagneticButton
              onClick={onOrganizationSignup}
              size="lg"
              variant="outline"
              containerClassName="w-full sm:w-auto"
              className="rounded-full px-8 py-7 text-lg shadow-lg hover:shadow-xl font-sans w-full sm:w-auto"
            >
              Join as an Organization
            </MagneticButton>
          </motion.div>
        </motion.div>
      </div>

      {/* Visual Element - Isolated Shape Image - Positioned Absolutely to Right Edge */}
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, x: 100 }}
        animate={reduceMotion ? undefined : { opacity: 1, x: 0 }}
        transition={
          reduceMotion ? { duration: 0 } : { duration: 1.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }
        }
        className="absolute top-0 right-0 bottom-0 hidden lg:block w-[60%] pointer-events-none z-10"
      >
        <div className="absolute right-0 bottom-[-4px] h-[85vh] w-auto max-h-[90vh]">
          <Image
            src="/hero-shape.png"
            alt="Abstract organic shape"
            width={1200}
            height={1200}
            className="h-full w-auto object-contain"
            priority
          />
        </div>
      </motion.div>
    </section>
  );
}
