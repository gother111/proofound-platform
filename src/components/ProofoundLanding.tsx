'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { LayoutGrid, Menu, X } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';

import { HeroSection } from './landing/sections/HeroSection';
import { HowItWorksSection } from './landing/sections/HowItWorksSection';
import { PersonasSection } from './landing/sections/PersonasSection';
import { ProofSection } from './landing/sections/ProofSection';
import { FinalCTASection } from './landing/sections/FinalCTASection';
import { FooterSection } from './landing/sections/FooterSection';
const CalmBackground = () => (
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
    <div className="absolute top-[-10%] right-[-5%] h-[45vw] w-[45vw] rounded-full bg-extended-sage/10 blur-[120px]" />
    <div className="absolute bottom-[-15%] left-[-10%] h-[40vw] w-[40vw] rounded-full bg-proofound-terracotta/10 blur-[110px]" />
  </div>
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
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion() ?? false;
  const menuContentId = 'landing-menu';

  const handleIndividualSignup = () => {
    if (onIndividualSignup) {
      onIndividualSignup();
    } else {
      router.push('/signup/individual');
    }
  };

  const handleOrganizationSignup = () => {
    if (onOrganizationSignup) {
      onOrganizationSignup();
    } else {
      router.push('/signup/organization');
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
    <div className="relative min-h-screen overflow-x-clip bg-background text-foreground">
      <CalmBackground />

      <motion.header
        initial={{ y: shouldReduceMotion ? 0 : -100 }}
        animate={{ y: 0 }}
        transition={
          shouldReduceMotion ? { duration: 0 } : { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
        }
        className="fixed left-0 right-0 top-0 z-50 flex items-center justify-between px-6 py-6 pointer-events-none md:px-12"
      >
        <div className="pointer-events-auto">
          <Link href="/" aria-label="Proofound home">
            <img
              src="/logo.png"
              alt="Proofound"
              width={120}
              height={48}
              loading="eager"
              decoding="async"
              className="h-12 w-auto"
            />
          </Link>
        </div>

        <div className="pointer-events-none flex items-center gap-4">
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
                {/* Use arbitrary z-index values so Tailwind generates these classes even if z-60/z-70 are not in the scale. */}
                <Dialog.Overlay
                  className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-xl"
                  data-testid="landing-menu-overlay"
                  onClick={() => setMenuOpen(false)}
                />
                <Dialog.Content
                  id={menuContentId}
                  className="fixed inset-0 z-[110] pointer-events-none"
                >
                  {/* `Dialog.Content` must remain `fixed` for a true full-screen overlay.
	                    Do not add `relative` to this same element, since Tailwind generates
	                    conflicting position utilities that can push the menu off-screen. */}
                  <div className="relative w-full h-full flex items-center justify-center">
                    <Dialog.Title className="sr-only">Navigation</Dialog.Title>
                    <Dialog.Description className="sr-only">
                      Site navigation links.
                    </Dialog.Description>

                    <div className="absolute top-6 left-6 pointer-events-none">
                      <LayoutGrid
                        className="w-5 h-5 text-proofound-forest dark:text-foreground"
                        aria-hidden="true"
                      />
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

                    <motion.nav
                      initial="hidden"
                      animate="visible"
                      variants={{
                        hidden: { opacity: 0 },
                        visible: {
                          opacity: 1,
                          transition: {
                            staggerChildren: 0.1,
                            delayChildren: 0.1,
                          },
                        },
                      }}
                      className="text-center space-y-8 pointer-events-auto"
                      data-testid="landing-menu-nav"
                    >
                      {[
                        { label: 'How it Works', href: '#how-it-works' },
                        { label: 'For Organizations', href: '#personas' },
                        { label: 'Trust & Privacy', href: '#proof' },
                        { label: 'Log in', href: '/login' },
                      ].map((item) => (
                        <div key={item.label} className="overflow-hidden">
                          <motion.div
                            variants={{
                              hidden: { y: 40, opacity: 0 },
                              visible: {
                                y: 0,
                                opacity: 1,
                                transition: { type: 'spring', stiffness: 100, damping: 15 },
                              },
                            }}
                          >
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
                          </motion.div>
                        </div>
                      ))}
                    </motion.nav>
                  </div>
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>
          </div>
        </div>
      </motion.header>

      <main className="relative z-10">
        <HeroSection
          shouldReduceMotion={shouldReduceMotion}
          onIndividualSignup={handleIndividualSignup}
          onOrganizationSignup={handleOrganizationSignup}
        />
        <HowItWorksSection shouldReduceMotion={shouldReduceMotion} />
        <PersonasSection
          shouldReduceMotion={shouldReduceMotion}
          onIndividualSignup={handleIndividualSignup}
          onOrganizationSignup={handleOrganizationSignup}
        />
        <ProofSection shouldReduceMotion={shouldReduceMotion} />
        <FinalCTASection onGetStarted={handleGetStarted} shouldReduceMotion={shouldReduceMotion} />
      </main>

      <FooterSection shouldReduceMotion={shouldReduceMotion} />
    </div>
  );
}
