'use client';

import React, { useRef } from 'react';
import Image from 'next/image';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
// import Magnetic from '@/components/ui/Magnetic'; // This import is no longer needed based on the new code

interface HeroSectionProps {
  onGetStarted?: () => void;
  shouldReduceMotion?: boolean | null;
}

export function HeroSection({ onGetStarted, shouldReduceMotion }: HeroSectionProps) {
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
      className="relative min-h-[90vh] flex items-center justify-center overflow-hidden px-6 md:px-12 pt-20"
    >
      {/* Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Organic Shape Right */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8, x: 100 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
          className="absolute top-1/4 -right-20 w-[600px] h-[600px] bg-japandi-sage/10 rounded-full blur-3xl"
        />
        {/* Organic Shape Left */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8, x: -100 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          transition={{ duration: 1.5, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="absolute -bottom-20 -left-20 w-[500px] h-[500px] bg-japandi-terracotta/10 rounded-full blur-3xl"
        />
      </div>

      <div className="max-w-7xl mx-auto w-full grid lg:grid-cols-2 gap-16 items-center relative z-10">
        {/* Text Content */}
        <motion.div
          style={{ y: shouldReduceMotion ? 0 : y, opacity: shouldReduceMotion ? 1 : opacity }}
          className="space-y-8"
        >
          <div>
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.0, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
              className="text-5xl md:text-7xl lg:text-8xl font-serif text-japandi-charcoal leading-[0.95] tracking-tight mb-6"
            >
              Proofound
            </motion.h1>
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.0, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
              className="text-3xl md:text-4xl lg:text-5xl font-sans text-japandi-charcoal leading-tight"
            >
              A credibility engineering platform for impactful connections
            </motion.h2>
          </div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.0, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="text-lg md:text-xl text-japandi-charcoal/80 max-w-xl leading-relaxed font-sans"
          >
            Unprecedented possibilities for work, business, and individual transformation. Backed by
            evidence, not vanity metrics.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.0, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-wrap gap-4"
          >
            <Button
              onClick={onGetStarted}
              size="lg"
              className="rounded-full px-8 py-7 text-lg bg-[#C17F59] hover:bg-[#A66A47] text-white transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-1 font-sans"
            >
              Become a contributor
            </Button>
          </motion.div>
        </motion.div>

        {/* Visual Element - Abstract sculpture */}
        <motion.div
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="relative mt-10 lg:mt-0 flex items-center justify-center lg:justify-end"
        >
          {/* Container scales with viewport, max-height relative to viewport for large screens */}
          <div className="relative w-full max-w-[320px] sm:max-w-[380px] md:max-w-[450px] lg:max-w-[500px] xl:max-w-[600px] 2xl:max-w-[700px] aspect-[532/1024] drop-shadow-2xl">
            <Image
              src="/hero-shape.png"
              alt="Abstract organic sculpture"
              fill
              sizes="(min-width: 1536px) 700px, (min-width: 1280px) 600px, (min-width: 1024px) 500px, (min-width: 768px) 450px, (min-width: 640px) 380px, 320px"
              className="object-contain"
              priority
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
