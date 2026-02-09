'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, useScroll, useSpring, useReducedMotion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Menu, X, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import * as Dialog from '@radix-ui/react-dialog';

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

const NetworkBackground = ({ shouldReduceMotion }: { shouldReduceMotion: boolean }) => (
  <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
    <div className="absolute inset-0 bg-background" />
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
        backgroundImage: 'radial-gradient(var(--proofound-forest) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }}
    />
    {/* Organic blobs - Animated with more fluid motion */}
    <motion.div
      animate={
        shouldReduceMotion
          ? undefined
          : {
              x: [0, 50, -20, 0],
              y: [0, -30, 40, 0],
              scale: [1, 1.1, 0.9, 1],
              rotate: [0, 10, -5, 0],
            }
      }
      transition={
        shouldReduceMotion
          ? undefined
          : {
              duration: 25,
              repeat: Infinity,
              ease: 'easeInOut',
            }
      }
      className="absolute top-[-10%] right-[-5%] w-[60vw] h-[60vw] bg-extended-sage/10 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-screen"
    />
    <motion.div
      animate={
        shouldReduceMotion
          ? undefined
          : {
              x: [0, -40, 30, 0],
              y: [0, 50, -20, 0],
              scale: [1, 1.2, 0.95, 1],
              rotate: [0, -15, 10, 0],
            }
      }
      transition={
        shouldReduceMotion
          ? undefined
          : {
              duration: 30,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 2,
            }
      }
      className="absolute bottom-[-10%] left-[-5%] w-[50vw] h-[50vw] bg-proofound-terracotta/10 rounded-full blur-[100px] mix-blend-multiply dark:mix-blend-screen"
    />
  </div>
);

const ProgressIndicator = ({ scrollYProgress }: { scrollYProgress: any }) => (
  <motion.div
    className="fixed top-0 left-0 right-0 h-1 bg-proofound-terracotta origin-left z-50"
    style={{ scaleX: scrollYProgress }}
  />
);

const StickyMiniCTA = ({
  onGetStarted,
  shouldReduceMotion,
}: {
  onGetStarted: () => void;
  shouldReduceMotion: boolean;
}) => (
  <motion.div
    // Keep stable visible state for reduced motion users. Avoid a hydration race where
    // initial state is applied before `useReducedMotion()` resolves, leaving the element off-screen.
    initial={shouldReduceMotion ? { y: 0, opacity: 1 } : { y: 100, opacity: 0 }}
    animate={{ y: 0, opacity: 1 }}
    exit={shouldReduceMotion ? { y: 0, opacity: 1 } : { y: 100, opacity: 0 }}
    transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    className="fixed bottom-8 right-6 md:right-12 z-40 pointer-events-auto"
  >
    <Button
      onClick={onGetStarted}
      className="rounded-full px-8 py-6 shadow-xl hover:shadow-2xl flex items-center justify-center gap-2 backdrop-blur-sm"
    >
      Join as an Individual <ArrowRight className="w-4 h-4" aria-hidden="true" />
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
  const shouldReduceMotion = useReducedMotion() ?? false;
  const menuContentId = 'landing-menu';

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

  useEffect(() => {
    const unsubscribe = scrollYProgress.on('change', (v) => {
      setShowStickyProgress(v > 0.1 && v < 0.9);
    });
    return () => unsubscribe();
  }, [scrollYProgress]);

  const handleIndividualSignup = () => {
    if (onIndividualSignup) {
      onIndividualSignup();
    } else {
      router.push('/signup?type=individual');
    }
  };

  const handleOrganizationSignup = () => {
    if (onOrganizationSignup) {
      onOrganizationSignup();
    } else {
      router.push('/signup?type=organization');
    }
  };

  const handleGetStarted = () => {
    // Default conversion is the individual path.
    if (onGetStarted) {
      onGetStarted();
    } else {
      handleIndividualSignup();
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative bg-background text-foreground overflow-hidden min-h-screen"
    >
      {/* Network Background */}
      <NetworkBackground shouldReduceMotion={shouldReduceMotion} />

      {/* Header with accessible menu */}
      <motion.header
        // Always animate to the stable on-screen state. If reduced motion resolves after first paint,
        // this prevents the header from getting stuck at the off-screen initial position.
        initial={{ y: shouldReduceMotion ? 0 : -100 }}
        animate={{ y: 0 }}
        transition={
          shouldReduceMotion ? { duration: 0 } : { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
        }
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 py-6 pointer-events-none"
      >
        <div className="pointer-events-auto">
          <Link href="/" aria-label="Proofound home">
            <Image
              src="/logo.png"
              alt="Proofound"
              width={120}
              height={48}
              className="h-12 w-auto"
              priority
            />
          </Link>
        </div>

        <div className="pointer-events-auto">
          <Dialog.Root open={menuOpen} onOpenChange={setMenuOpen}>
            <Dialog.Trigger asChild>
              <button
                type="button"
                className="w-12 h-12 rounded-full bg-card/80 backdrop-blur-md flex items-center justify-center shadow-sm hover:scale-105 transition-transform duration-300 group"
                aria-label={menuOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={menuOpen}
                aria-controls={menuContentId}
              >
                {menuOpen ? (
                  <X
                    className="w-5 h-5 text-proofound-forest dark:text-foreground"
                    aria-hidden="true"
                  />
                ) : (
                  <Menu
                    className="w-5 h-5 text-proofound-forest dark:text-foreground"
                    aria-hidden="true"
                  />
                )}
              </button>
            </Dialog.Trigger>

            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 z-40 bg-background/95 backdrop-blur-xl" />
              <Dialog.Content
                id={menuContentId}
                className="fixed inset-0 z-50 flex items-center justify-center"
              >
                <Dialog.Title className="sr-only">Navigation</Dialog.Title>
                <Dialog.Description className="sr-only">Site navigation links.</Dialog.Description>
                <nav className="text-center space-y-8">
                  {[
                    { label: 'Mission', href: '#the-problem' },
                    { label: 'How it Works', href: '#how-it-works' },
                    { label: 'Principles', href: '#principles' },
                    { label: 'Pricing', href: '#products' },
                    { label: 'Log in', href: '/login' },
                  ].map((item) => (
                    <div key={item.label} className="overflow-hidden">
                      <Dialog.Close asChild>
                        {item.href.startsWith('#') ? (
                          <a
                            href={item.href}
                            className="block text-4xl md:text-5xl font-display text-proofound-forest dark:text-foreground hover:text-proofound-terracotta transition-colors cursor-pointer"
                          >
                            {item.label}
                          </a>
                        ) : (
                          <Link
                            href={item.href}
                            className="block text-4xl md:text-5xl font-display text-proofound-forest dark:text-foreground hover:text-proofound-terracotta transition-colors cursor-pointer"
                          >
                            {item.label}
                          </Link>
                        )}
                      </Dialog.Close>
                    </div>
                  ))}
                </nav>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </div>
      </motion.header>

      {/* Progress Indicator */}
      <ProgressIndicator scrollYProgress={smoothProgress} />

      {/* Sticky Mini CTA (appears on scroll) */}
      {showStickyProgress && (
        <StickyMiniCTA onGetStarted={handleGetStarted} shouldReduceMotion={shouldReduceMotion} />
      )}

      {/* Section 1: Hero - The Promise */}
      <HeroSection onGetStarted={handleGetStarted} shouldReduceMotion={shouldReduceMotion} />

      <SectionSeparator direction="up" className="-mt-20 relative z-0" />

      {/* Section 2: The Problem - Pains we solve */}
      <ProblemSection shouldReduceMotion={shouldReduceMotion} />

      <SectionSeparator
        direction="down"
        fill="hsl(var(--background))"
        className="-mb-20 relative z-20"
      />

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
      <FinalCTASection onGetStarted={handleGetStarted} shouldReduceMotion={shouldReduceMotion} />

      {/* Section 11: Final Quote */}
      <FinalQuoteSection shouldReduceMotion={shouldReduceMotion} />

      {/* Section 12: Footer */}
      <FooterSection shouldReduceMotion={shouldReduceMotion} />
    </div>
  );
}
