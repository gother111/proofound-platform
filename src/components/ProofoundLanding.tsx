'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { motion, useScroll, useSpring, useReducedMotion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Menu, X, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Import all section components
import { HeroSection } from './landing/sections/HeroSection';
import { ProblemSection } from './landing/sections/ProblemSection';
import { HowItWorksSection } from './landing/sections/HowItWorksSection';
import { PrinciplesSection } from './landing/sections/PrinciplesSection';
import { PersonasSection } from './landing/sections/PersonasSection';
import { WhyNowSection } from './landing/sections/WhyNowSection';
import { ProofSection } from './landing/sections/ProofSection';
import { StewardOwnershipSection } from './landing/sections/StewardOwnershipSection';
import { ProductsSection } from './landing/sections/ProductsSection';
import { FinalCTASection } from './landing/sections/FinalCTASection';
import { FinalQuoteSection } from './landing/sections/FinalQuoteSection';
import { FooterSection } from './landing/sections/FooterSection';
import SectionSeparator from '@/components/ui/SectionSeparator';

import Lenis from 'lenis';

// --- Shared Components ---

const NetworkBackground = () => (
  <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
    <div className="absolute inset-0 bg-[#F7F6F1] dark:bg-[#1A1D2E]" />
    {/* Global Noise Texture */}
    <div
      className="absolute inset-0 opacity-[0.03] mix-blend-overlay"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='1'/%3E%3C/svg%3E")`,
      }}
    />
    <div
      className="absolute inset-0 opacity-[0.02] dark:opacity-[0.04]"
      style={{
        backgroundImage: 'radial-gradient(#1C4D3A 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }}
    />
    {/* Organic blobs - Animated with more fluid motion */}
    <motion.div
      animate={{
        x: [0, 50, -20, 0],
        y: [0, -30, 40, 0],
        scale: [1, 1.1, 0.9, 1],
        rotate: [0, 10, -5, 0],
      }}
      transition={{
        duration: 25,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
      className="absolute top-[-10%] right-[-5%] w-[60vw] h-[60vw] bg-[#7A9278]/10 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-screen"
    />
    <motion.div
      animate={{
        x: [0, -40, 30, 0],
        y: [0, 50, -20, 0],
        scale: [1, 1.2, 0.95, 1],
        rotate: [0, -15, 10, 0],
      }}
      transition={{
        duration: 30,
        repeat: Infinity,
        ease: 'easeInOut',
        delay: 2,
      }}
      className="absolute bottom-[-10%] left-[-5%] w-[50vw] h-[50vw] bg-[#C76B4A]/10 rounded-full blur-[100px] mix-blend-multiply dark:mix-blend-screen"
    />
  </div>
);

const MinimalHeader = ({
  menuOpen,
  setMenuOpen,
}: {
  menuOpen: boolean;
  setMenuOpen: (open: boolean) => void;
}) => (
  <motion.header
    initial={{ y: -100 }}
    animate={{ y: 0 }}
    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 py-6 pointer-events-none"
  >
    <div className="pointer-events-auto">
      <Image
        src="/logo.png"
        alt="Proofound"
        width={120}
        height={48}
        className="h-12 w-auto"
        priority
      />
    </div>

    <div className="pointer-events-auto">
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className="w-12 h-12 rounded-full bg-white/80 dark:bg-[#2D3330]/80 backdrop-blur-md flex items-center justify-center shadow-sm hover:scale-105 transition-transform duration-300 group"
        aria-label="Menu"
      >
        {menuOpen ? (
          <X className="w-5 h-5 text-[#1C4D3A] dark:text-[#D4C4A8]" />
        ) : (
          <Menu className="w-5 h-5 text-[#1C4D3A] dark:text-[#D4C4A8]" />
        )}
      </button>
    </div>

    {/* Fullscreen Menu Overlay */}
    <motion.div
      initial={{ opacity: 0, pointerEvents: 'none' }}
      animate={{ opacity: menuOpen ? 1 : 0, pointerEvents: menuOpen ? 'auto' : 'none' }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 bg-[#F7F6F1]/95 dark:bg-[#1A1D2E]/95 backdrop-blur-xl z-40 flex items-center justify-center"
      onClick={() => setMenuOpen(false)}
    >
      <nav className="text-center space-y-8">
        {[
          { label: 'Mission', href: '#the-problem' },
          { label: 'How it Works', href: '#how-it-works' },
          { label: 'Principles', href: '#principles' },
          { label: 'Pricing', href: '#products' },
          { label: 'Login', href: '/login' },
        ].map((item) => (
          <div key={item.label} className="overflow-hidden">
            <motion.a
              href={item.href}
              className="block text-4xl md:text-5xl font-display text-[#1C4D3A] dark:text-[#D4C4A8] hover:text-[#C76B4A] transition-colors cursor-pointer"
              onClick={(e) => {
                e.preventDefault();
                setMenuOpen(false);
                if (item.href.startsWith('#')) {
                  const element = document.querySelector(item.href);
                  if (element) {
                    element.scrollIntoView({ behavior: 'smooth' });
                  }
                } else {
                  // Use window.location for external/full page navigation or router if passed
                  // Since this component is inside ProofoundLanding which has router, we can't easily access it here without passing it down.
                  // But we can just use window.location.href for Login to ensure full reload if needed, or just let the parent handle it if we refactor.
                  // Actually, MinimalHeader is defined *outside* the main component, so it doesn't have access to `router`.
                  // We should probably move MinimalHeader *inside* or pass a navigation handler.
                  // For now, window.location.href is safe for Login.
                  window.location.href = item.href;
                }
              }}
            >
              {item.label}
            </motion.a>
          </div>
        ))}
      </nav>
    </motion.div>
  </motion.header>
);

const ProgressIndicator = ({ scrollYProgress }: { scrollYProgress: any }) => (
  <motion.div
    className="fixed top-0 left-0 right-0 h-1 bg-[#C76B4A] origin-left z-50"
    style={{ scaleX: scrollYProgress }}
  />
);

const StickyMiniCTA = ({ onGetStarted }: { onGetStarted: () => void }) => (
  <motion.div
    initial={{ y: 100, opacity: 0 }}
    animate={{ y: 0, opacity: 1 }}
    exit={{ y: 100, opacity: 0 }}
    className="fixed bottom-8 right-6 md:right-12 z-40 pointer-events-auto"
  >
    <Button
      onClick={onGetStarted}
      className="rounded-full px-8 py-6 bg-[#1C4D3A] hover:bg-[#1C4D3A]/90 text-white shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-2 backdrop-blur-sm"
    >
      Start Your Journey <ArrowRight className="w-4 h-4" />
    </Button>
  </motion.div>
);

// --- Main Component ---

interface ProofoundLandingProps {
  onGetStarted?: () => void;
  onIndividualSignup?: () => void;
  onOrganizationSignup?: () => void;
}

export function ProofoundLanding({
  onGetStarted,
  onIndividualSignup,
  onOrganizationSignup,
}: ProofoundLandingProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showStickyProgress, setShowStickyProgress] = useState(false);
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  // Initialize Lenis Smooth Scroll
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, []);

  useEffect(() => {
    const unsubscribe = scrollYProgress.on('change', (v) => {
      setShowStickyProgress(v > 0.1 && v < 0.9);
    });
    return () => unsubscribe();
  }, [scrollYProgress]);

  const handleGetStarted = () => {
    if (onGetStarted) {
      onGetStarted();
    } else {
      window.location.href = '/signup';
    }
  };

  const handleIndividualSignup = () => {
    if (onIndividualSignup) {
      onIndividualSignup();
    } else {
      window.location.href = '/signup?type=individual';
    }
  };

  const handleOrganizationSignup = () => {
    if (onOrganizationSignup) {
      onOrganizationSignup();
    } else {
      window.location.href = '/signup?type=organization';
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative bg-[#F7F6F1] dark:bg-[#1A1D2E] overflow-hidden min-h-screen"
    >
      {/* Network Background */}
      <NetworkBackground />

      {/* Minimal Header */}
      <MinimalHeader menuOpen={menuOpen} setMenuOpen={setMenuOpen} />

      {/* Progress Indicator */}
      <ProgressIndicator scrollYProgress={smoothProgress} />

      {/* Sticky Mini CTA (appears on scroll) */}
      {showStickyProgress && <StickyMiniCTA onGetStarted={handleGetStarted} />}

      {/* Section 1: Hero - The Promise */}
      <HeroSection onGetStarted={handleGetStarted} shouldReduceMotion={shouldReduceMotion} />

      <SectionSeparator direction="up" className="-mt-20 relative z-0" />

      {/* Section 2: The Problem - Pains we solve */}
      <ProblemSection shouldReduceMotion={shouldReduceMotion} />

      <SectionSeparator direction="down" fill="#F7F6F1" className="-mb-20 relative z-20" />

      {/* Section 3: How It Works - The Solution */}
      <HowItWorksSection shouldReduceMotion={shouldReduceMotion} />

      {/* Section 4: Principles - Trustworthy Foundation */}
      <PrinciplesSection shouldReduceMotion={shouldReduceMotion} />

      <SectionSeparator direction="up" className="-mt-20 relative z-20" />

      {/* Section 5: Personas - Tailored Value */}
      <PersonasSection
        shouldReduceMotion={shouldReduceMotion}
        onIndividualSignup={handleIndividualSignup}
        onOrganizationSignup={handleOrganizationSignup}
      />

      {/* Section 6: Why Now - Urgency */}
      <WhyNowSection shouldReduceMotion={shouldReduceMotion} />

      {/* Section 7: Proof - Credibility */}
      <ProofSection shouldReduceMotion={shouldReduceMotion} />

      <SectionSeparator direction="down" className="-mb-20 relative z-20" />

      {/* Section 8: Steward Ownership - Business Model */}
      <StewardOwnershipSection shouldReduceMotion={shouldReduceMotion} />

      {/* Section 9: Products & Pricing */}
      <ProductsSection
        shouldReduceMotion={shouldReduceMotion}
        onIndividualSignup={handleIndividualSignup}
        onOrganizationSignup={handleOrganizationSignup}
      />

      {/* Section 10: Final CTA */}
      <FinalCTASection onGetStarted={handleGetStarted} />

      {/* Section 11: Final Quote */}
      <FinalQuoteSection />

      {/* Section 12: Footer */}
      <FooterSection />
    </div>
  );
}
