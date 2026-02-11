'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { LayoutGrid, Menu, X, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import * as Dialog from '@radix-ui/react-dialog';

import { HeroSection } from './landing/sections/HeroSection';
import SectionSeparator from '@/components/ui/SectionSeparator';

const ProblemSection = dynamic(
  () => import('./landing/sections/ProblemSection').then((mod) => mod.ProblemSection),
  { ssr: false }
);
const HowItWorksSection = dynamic(
  () => import('./landing/sections/HowItWorksSection').then((mod) => mod.HowItWorksSection),
  { ssr: false }
);
const PrinciplesSection = dynamic(
  () => import('./landing/sections/PrinciplesSection').then((mod) => mod.PrinciplesSection),
  { ssr: false }
);
const PersonasSection = dynamic(
  () => import('./landing/sections/PersonasSection').then((mod) => mod.PersonasSection),
  { ssr: false }
);
const WhyNowSection = dynamic(
  () => import('./landing/sections/WhyNowSection').then((mod) => mod.WhyNowSection),
  { ssr: false }
);
const ProofSection = dynamic(
  () => import('./landing/sections/ProofSection').then((mod) => mod.ProofSection),
  { ssr: false }
);
const StewardOwnershipSection = dynamic(
  () =>
    import('./landing/sections/StewardOwnershipSection').then((mod) => mod.StewardOwnershipSection),
  { ssr: false }
);
const ProductsSection = dynamic(
  () => import('./landing/sections/ProductsSection').then((mod) => mod.ProductsSection),
  { ssr: false }
);
const FinalCTASection = dynamic(
  () => import('./landing/sections/FinalCTASection').then((mod) => mod.FinalCTASection),
  { ssr: false }
);
const FinalQuoteSection = dynamic(
  () => import('./landing/sections/FinalQuoteSection').then((mod) => mod.FinalQuoteSection),
  { ssr: false }
);
const FooterSection = dynamic(
  () => import('./landing/sections/FooterSection').then((mod) => mod.FooterSection),
  { ssr: false }
);

const NetworkBackground = () => (
  <div
    className="absolute inset-0 z-0 pointer-events-none overflow-hidden"
    data-testid="landing-network-background"
  >
    <div className="absolute inset-0 bg-background" />
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
    <div className="absolute top-[-10%] right-[-5%] w-[60vw] h-[60vw] bg-extended-sage/10 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-screen" />
    <div className="absolute bottom-[-10%] left-[-5%] w-[50vw] h-[50vw] bg-proofound-terracotta/10 rounded-full blur-[100px] mix-blend-multiply dark:mix-blend-screen" />
  </div>
);

const ProgressIndicator = ({ progress }: { progress: number }) => (
  <div
    className="fixed top-0 left-0 right-0 h-1 bg-proofound-terracotta origin-left z-50 transition-transform duration-150"
    style={{ transform: `scaleX(${progress})` }}
  />
);

const StickyMiniCTA = ({ onGetStarted }: { onGetStarted: () => void }) => (
  <div className="fixed bottom-8 right-6 md:right-12 z-40 pointer-events-auto">
    <Button
      onClick={onGetStarted}
      className="rounded-full px-8 py-6 shadow-xl hover:shadow-2xl flex items-center justify-center gap-2 backdrop-blur-sm"
    >
      Get Started <ArrowRight className="w-4 h-4" aria-hidden="true" />
    </Button>
  </div>
);

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
  const [showDeferredSections, setShowDeferredSections] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const router = useRouter();
  const menuContentId = 'landing-menu';

  useEffect(() => {
    const updateProgress = () => {
      const doc = document.documentElement;
      const scrollTop = window.scrollY;
      const scrollHeight = Math.max(doc.scrollHeight - window.innerHeight, 1);
      const nextProgress = Math.min(1, Math.max(0, scrollTop / scrollHeight));

      setScrollProgress(nextProgress);
      setShowStickyProgress(nextProgress > 0.1 && nextProgress < 0.9);

      if (!showDeferredSections && scrollTop > Math.max(120, window.innerHeight * 0.4)) {
        setShowDeferredSections(true);
      }
    };

    updateProgress();
    window.addEventListener('scroll', updateProgress, { passive: true });
    window.addEventListener('resize', updateProgress);

    return () => {
      window.removeEventListener('scroll', updateProgress);
      window.removeEventListener('resize', updateProgress);
    };
  }, [showDeferredSections]);

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
    if (onGetStarted) {
      onGetStarted();
    } else {
      router.push('/signup');
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative bg-background text-foreground overflow-hidden min-h-screen"
    >
      <NetworkBackground />

      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 py-6">
        <div className="pointer-events-auto">
          <Link href="/" aria-label="Proofound home">
            <Image
              src="/logo.png"
              alt="Proofound"
              width={120}
              height={48}
              className="h-12 w-auto"
            />
          </Link>
        </div>

        <div className="pointer-events-auto">
          <Dialog.Root open={menuOpen} onOpenChange={setMenuOpen}>
            <Dialog.Trigger asChild>
              <button
                type="button"
                className="w-12 h-12 rounded-full bg-card/80 backdrop-blur-md flex items-center justify-center shadow-sm hover:scale-105 transition-transform duration-300 group"
                aria-label="Open menu"
                aria-expanded={menuOpen}
                aria-controls={menuContentId}
                data-testid="landing-menu-trigger"
              >
                <Menu
                  className="w-5 h-5 text-proofound-forest dark:text-foreground"
                  aria-hidden="true"
                />
              </button>
            </Dialog.Trigger>

            <Dialog.Portal>
              <Dialog.Overlay
                className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-xl"
                data-testid="landing-menu-overlay"
                onClick={() => setMenuOpen(false)}
              />
              <Dialog.Content
                id={menuContentId}
                className="fixed inset-0 z-[110] pointer-events-none"
              >
                <div className="relative w-full h-full flex items-center justify-center">
                  <Dialog.Title className="sr-only">Navigation</Dialog.Title>
                  <Dialog.Description className="sr-only">
                    Site navigation links.
                  </Dialog.Description>

                  <div className="absolute top-6 left-6 pointer-events-none">
                    <LayoutGrid className="w-5 h-5 text-proofound-forest" aria-hidden="true" />
                  </div>
                  <div className="absolute top-6 right-6 pointer-events-auto">
                    <Dialog.Close asChild>
                      <button
                        type="button"
                        className="w-12 h-12 rounded-full bg-card/80 backdrop-blur-md flex items-center justify-center shadow-sm hover:scale-105 transition-transform duration-300 group"
                        aria-label="Close menu"
                        data-testid="landing-menu-close"
                        onClick={() => setMenuOpen(false)}
                      >
                        <X
                          className="w-5 h-5 text-proofound-forest dark:text-foreground"
                          aria-hidden="true"
                        />
                      </button>
                    </Dialog.Close>
                  </div>

                  <nav
                    className="text-center space-y-8 pointer-events-auto"
                    data-testid="landing-menu-nav"
                  >
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
                </div>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </div>
      </header>

      <ProgressIndicator progress={scrollProgress} />

      {showStickyProgress && <StickyMiniCTA onGetStarted={handleGetStarted} />}

      <main>
        <HeroSection
          shouldReduceMotion={false}
          onIndividualSignup={handleIndividualSignup}
          onOrganizationSignup={handleOrganizationSignup}
        />

        {showDeferredSections && (
          <>
            <SectionSeparator direction="up" className="-mt-20 relative z-0" />

            <ProblemSection shouldReduceMotion={false} />

            <SectionSeparator
              direction="down"
              fill="hsl(var(--background))"
              className="-mb-20 relative z-20"
            />

            <HowItWorksSection shouldReduceMotion={false} />

            <PrinciplesSection shouldReduceMotion={false} />

            <SectionSeparator direction="up" className="-mt-20 relative z-20" />

            <PersonasSection
              shouldReduceMotion={false}
              onIndividualSignup={handleIndividualSignup}
              onOrganizationSignup={handleOrganizationSignup}
            />

            <WhyNowSection shouldReduceMotion={false} />

            <ProofSection shouldReduceMotion={false} />

            <SectionSeparator direction="down" className="-mb-20 relative z-20" />

            <StewardOwnershipSection shouldReduceMotion={false} />

            <ProductsSection
              shouldReduceMotion={false}
              onIndividualSignup={handleIndividualSignup}
              onOrganizationSignup={handleOrganizationSignup}
            />

            <FinalCTASection onGetStarted={handleGetStarted} shouldReduceMotion={false} />

            <FinalQuoteSection shouldReduceMotion={false} />

            <FooterSection shouldReduceMotion={false} />
          </>
        )}
      </main>
    </div>
  );
}
