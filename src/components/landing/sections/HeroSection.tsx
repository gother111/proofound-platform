'use client';

import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import Image from 'next/image';
// import Magnetic from '@/components/ui/Magnetic'; // This import is no longer needed based on the new code

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
      className="relative min-h-[90vh] flex items-center justify-center overflow-hidden px-6 md:px-12 pt-20 scroll-mt-24"
    >
      {/* Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Organic Shape Right */}
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, scale: 0.8, x: 100 }}
          animate={reduceMotion ? undefined : { opacity: 1, scale: 1, x: 0 }}
          transition={reduceMotion ? { duration: 0 } : { duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
          className="absolute top-1/4 -right-20 w-[600px] h-[600px] bg-japandi-sage/10 rounded-full blur-3xl"
        />
        {/* Organic Shape Left */}
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, scale: 0.8, x: -100 }}
          animate={reduceMotion ? undefined : { opacity: 1, scale: 1, x: 0 }}
          transition={
            reduceMotion ? { duration: 0 } : { duration: 1.5, delay: 0.2, ease: [0.22, 1, 0.36, 1] }
          }
          className="absolute -bottom-20 -left-20 w-[500px] h-[500px] bg-japandi-terracotta/10 rounded-full blur-3xl"
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
              initial={reduceMotion ? false : { y: 30 }}
              animate={reduceMotion ? undefined : { y: 0 }}
              transition={
                reduceMotion
                  ? { duration: 0 }
                  : { duration: 1.0, ease: [0.22, 1, 0.36, 1], delay: 0.1 }
              }
              className="text-5xl md:text-7xl lg:text-8xl font-serif text-foreground leading-[0.95] tracking-tight mb-6"
            >
              Proofound
            </motion.h1>
            <motion.h2
              initial={reduceMotion ? false : { y: 30 }}
              animate={reduceMotion ? undefined : { y: 0 }}
              transition={
                reduceMotion
                  ? { duration: 0 }
                  : { duration: 1.0, ease: [0.22, 1, 0.36, 1], delay: 0.2 }
              }
              className="text-3xl md:text-4xl lg:text-5xl font-sans text-foreground leading-tight"
            >
              A credibility engineering platform for impactful connections
            </motion.h2>
          </div>

          <motion.p
            initial={reduceMotion ? false : { y: 20 }}
            animate={reduceMotion ? undefined : { y: 0 }}
            transition={
              reduceMotion
                ? { duration: 0 }
                : { duration: 1.0, delay: 0.3, ease: [0.22, 1, 0.36, 1] }
            }
            className="text-lg md:text-xl text-muted-foreground max-w-xl leading-relaxed font-sans"
          >
            Unprecedented possibilities for work, business, and individual transformation. Backed by
            evidence, not vanity metrics.
          </motion.p>

          <motion.div
            initial={reduceMotion ? false : { y: 20 }}
            animate={reduceMotion ? undefined : { y: 0 }}
            transition={
              reduceMotion
                ? { duration: 0 }
                : { duration: 1.0, delay: 0.4, ease: [0.22, 1, 0.36, 1] }
            }
            className="flex flex-wrap gap-4"
          >
            <Button
              onClick={onIndividualSignup}
              size="lg"
              className="rounded-full px-8 py-7 text-lg shadow-lg hover:shadow-xl font-sans"
            >
              Join as an Individual
            </Button>
            <Button
              onClick={onOrganizationSignup}
              size="lg"
              variant="outline"
              className="rounded-full px-8 py-7 text-lg shadow-lg hover:shadow-xl font-sans"
            >
              Join as an Organization
            </Button>
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
