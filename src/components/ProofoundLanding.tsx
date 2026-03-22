'use client';

import { useRef, useEffect } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { MagneticButton } from '@/components/ui/magnetic-button';
import { Logo } from '@/components/brand/Logo';

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
import { SectionReveal } from './landing/SectionReveal';

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
      className="landing-japandi relative min-h-screen overflow-x-clip bg-[var(--landing-bg)] text-[var(--landing-text)]"
    >
      <motion.header
        initial={{ y: shouldReduceMotion ? 0 : -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={
          shouldReduceMotion ? { duration: 0 } : { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
        }
        className="fixed left-0 right-0 top-0 z-50 border-b border-[color:var(--landing-border-soft)]/55 bg-[color:var(--landing-bg)]/70 px-6 py-4 backdrop-blur-2xl md:px-10"
      >
        <div className="mx-auto flex max-w-[1280px] items-center justify-between">
          <Link href="/" aria-label="Proofound home" className="flex items-center gap-3">
            <Logo size="sm" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--landing-dark)]">
              Proofound
            </span>
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            <a
              href="#how-it-works"
              className="text-sm font-medium text-[var(--landing-muted)] transition-colors hover:text-[var(--landing-dark)]"
            >
              How it works
            </a>
            <a
              href="#individuals"
              className="text-sm font-medium text-[var(--landing-muted)] transition-colors hover:text-[var(--landing-dark)]"
            >
              For individuals
            </a>
            <a
              href="#organizations"
              className="text-sm font-medium text-[var(--landing-muted)] transition-colors hover:text-[var(--landing-dark)]"
            >
              For organizations
            </a>
            <Link
              href="/login"
              className="ml-2 border-l border-[var(--landing-border)] pl-5 text-sm font-medium text-[var(--landing-dark)] transition-colors hover:text-[var(--landing-clay)]"
            >
              Sign in
            </Link>
            <MagneticButton
              onClick={handleOrganizationSignup}
              className="ml-2 inline-flex min-h-[44px] items-center justify-center rounded-full bg-[var(--landing-action)] px-5 py-2 text-sm font-semibold text-white shadow-[0_14px_24px_rgba(96,108,90,0.18)] transition-all hover:-translate-y-0.5 hover:bg-[var(--landing-dark-soft)]"
            >
              Request a pilot
            </MagneticButton>
          </nav>

          <div className="flex items-center gap-4 md:hidden">
            <Link href="/login" className="text-sm font-medium text-[var(--landing-dark)]">
              Sign in
            </Link>
            <button
              onClick={handleOrganizationSignup}
              className="rounded-full bg-[var(--landing-action)] px-4 py-2 text-sm font-semibold text-white"
            >
              Pilot
            </button>
          </div>
        </div>
      </motion.header>

      <main id="main-content">
        <HeroSection
          shouldReduceMotion={shouldReduceMotion}
          onIndividualSignup={handleIndividualSignup}
          onOrganizationSignup={handleOrganizationSignup}
        />

        <SectionReveal>
          <TranslationBandSection />
        </SectionReveal>

        <SectionReveal>
          <div id="individuals" className="scroll-mt-24">
            <DayOneSurfacesSection />
          </div>
        </SectionReveal>

        <SectionReveal>
          <div id="organizations" className="scroll-mt-24">
            <HiringTeamsSection />
          </div>
        </SectionReveal>

        <SectionReveal>
          <div id="how-it-works" className="scroll-mt-24">
            <ThreeStepCorridorSection />
          </div>
        </SectionReveal>

        <SectionReveal>
          <ProofObjectSection />
        </SectionReveal>
        <SectionReveal>
          <PrivacySafeReviewSection />
        </SectionReveal>
        <SectionReveal>
          <EarlyProofSection />
        </SectionReveal>

        <SectionReveal>
          <FinalCTASection
            shouldReduceMotion={shouldReduceMotion}
            onIndividualSignup={handleIndividualSignup}
            onOrganizationSignup={handleOrganizationSignup}
          />
        </SectionReveal>

        <SectionReveal>
          <FooterSection />
        </SectionReveal>
      </main>
    </div>
  );
}
