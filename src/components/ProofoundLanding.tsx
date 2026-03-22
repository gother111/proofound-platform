'use client';

import React, { useRef, useEffect } from 'react';
import Link from 'next/link';
import { motion, useScroll, useReducedMotion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { MagneticButton } from '@/components/ui/magnetic-button';

// Import all section components
import { HeroSection } from './landing/sections/HeroSection';
import { TranslationBandSection } from './landing/sections/TranslationBandSection';
import { DayOneSurfacesSection } from './landing/sections/DayOneSurfacesSection';
import { HiringTeamsSection } from './landing/sections/HiringTeamsSection';
import { ThreeStepCorridorSection } from './landing/sections/ThreeStepCorridorSection';
import { ProofObjectSection } from './landing/sections/ProofObjectSection';
import { PrivacySafeReviewSection } from './landing/sections/PrivacySafeReviewSection';
import { EarlyProofSection } from './landing/sections/EarlyProofSection';
import { FinalCTASection } from './landing/sections/FinalCTASection';
import { FooterSection } from './landing/sections/FooterSection';

import Lenis from 'lenis';

interface ProofoundLandingProps {
  onOrganizationSignup?: () => void;
  onIndividualSignup?: () => void;
}

export function ProofoundLanding({
  onOrganizationSignup,
  onIndividualSignup,
}: ProofoundLandingProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion() ?? false;

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  // Initialize Lenis Smooth Scroll
  useEffect(() => {
    if (shouldReduceMotion) return;

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
    });

    let rafId = 0;
    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }

    rafId = requestAnimationFrame(raf);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, [shouldReduceMotion]);

  const handleOrganizationSignup = () => {
    if (onOrganizationSignup) {
      onOrganizationSignup();
    } else {
      router.push('/signup/organization');
    }
  };

  const handleIndividualSignup = () => {
    if (onIndividualSignup) {
      onIndividualSignup();
    } else {
      router.push('/signup/individual');
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative bg-background text-foreground overflow-x-clip min-h-screen"
    >
      {/* Header - Minimal and calm */}
      <motion.header
        initial={{ y: shouldReduceMotion ? 0 : -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={
          shouldReduceMotion ? { duration: 0 } : { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
        }
        className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50 px-6 md:px-12 py-4"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" aria-label="Proofound home" className="flex items-center gap-2">
            <img
              src="/logo.png"
              alt="Proofound"
              width={120}
              height={48}
              loading="eager"
              decoding="async"
              className="h-8 w-auto"
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <a
              href="#how-it-works"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              How it works
            </a>
            <a
              href="#individuals"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              For individuals
            </a>
            <a
              href="#organizations"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              For organizations
            </a>
            <Link
              href="/login"
              className="text-sm font-medium text-foreground hover:text-proofound-terracotta transition-colors ml-4 pl-4 border-l border-border"
            >
              Sign in
            </Link>
            <MagneticButton
              onClick={handleOrganizationSignup}
              className="bg-proofound-forest text-proofound-sand dark:bg-[#D4C4A8] dark:text-proofound-forest rounded-full px-5 py-2 flex items-center justify-center font-medium shadow-sm hover:opacity-90 transition-opacity text-sm ml-2"
            >
              Request a pilot
            </MagneticButton>
          </nav>

          {/* Mobile minimal actions */}
          <div className="flex items-center gap-4 md:hidden">
            <Link href="/login" className="text-sm font-medium text-foreground">
              Sign in
            </Link>
            <button
              onClick={handleOrganizationSignup}
              className="bg-proofound-forest text-proofound-sand rounded-full px-4 py-1.5 text-sm font-medium"
            >
              Pilot
            </button>
          </div>
        </div>
      </motion.header>

      <main className="pt-24">
        <HeroSection
          shouldReduceMotion={shouldReduceMotion}
          onIndividualSignup={handleIndividualSignup}
          onOrganizationSignup={handleOrganizationSignup}
        />

        <TranslationBandSection />

        <div id="individuals" className="scroll-mt-24">
          <DayOneSurfacesSection />
        </div>

        <div id="organizations" className="scroll-mt-24">
          <HiringTeamsSection />
        </div>

        <div id="how-it-works" className="scroll-mt-24">
          <ThreeStepCorridorSection />
        </div>

        <ProofObjectSection />
        <PrivacySafeReviewSection />
        <EarlyProofSection />

        <FinalCTASection
          shouldReduceMotion={shouldReduceMotion}
          onIndividualSignup={handleIndividualSignup}
          onOrganizationSignup={handleOrganizationSignup}
        />

        <FooterSection shouldReduceMotion={shouldReduceMotion} />
      </main>
    </div>
  );
}
