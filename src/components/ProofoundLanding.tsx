'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { ScrollytellingSection } from './landing/sections/ScrollytellingSection';
import { FinalCTASection } from './landing/sections/FinalCTASection';
import { FooterSection } from './landing/sections/FooterSection';

interface LandingActionProps {
  onGetStarted?: () => void;
  onIndividualSignup?: () => void;
  onOrganizationSignup?: () => void;
}

const NetworkBackground = () => {
  return (
    <div
      className="absolute inset-0 z-0 pointer-events-none overflow-hidden"
      data-testid="landing-network-background"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.88),_rgba(247,246,241,0.98)_38%,_rgba(244,241,233,1)_100%)]" />
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
      <div className="absolute right-[-5%] top-[-10%] h-[42rem] w-[42rem] rounded-full bg-proofound-forest/10 blur-[130px]" />
      <div className="absolute bottom-[-12%] left-[-6%] h-[34rem] w-[34rem] rounded-full bg-proofound-terracotta/12 blur-[110px]" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(28,77,58,0),rgba(28,77,58,0.03))] opacity-60" />
    </div>
  );
};

// --- Main Component ---

type ProofoundLandingProps = LandingActionProps;

export function ProofoundLanding({
  onGetStarted,
  onIndividualSignup,
  onOrganizationSignup,
}: ProofoundLandingProps) {
  const router = useRouter();

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
      <NetworkBackground />

      <header
        className="fixed left-0 right-0 top-0 z-[80] border-b border-black/8 bg-[#f6f2ea] px-3 py-2.5 shadow-[0_18px_48px_-42px_rgba(45,51,48,0.48)] md:px-8 md:py-4"
        data-testid="landing-header"
      >
        <div className="mx-auto flex max-w-[88rem] items-center justify-between gap-3 rounded-full px-1 py-0 md:gap-6 md:px-4">
          <div className="flex min-w-0 items-center gap-4">
            <Link href="/" aria-label="Proofound home" className="flex items-center gap-3">
              <Image
                src="/logo.png"
                alt="Proofound"
                width={44}
                height={44}
                priority
                className="h-9 w-9 sm:h-10 sm:w-10 md:h-11 md:w-11"
              />
              <span className="hidden text-xs font-medium uppercase tracking-[0.32em] text-foreground/72 lg:inline">
                Proofound
              </span>
            </Link>
          </div>

          <nav className="hidden items-center gap-10 text-[1.02rem] text-foreground/66 lg:flex">
            <a
              href="#story"
              className="rounded-full transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-proofound-forest/35 focus-visible:ring-offset-4 focus-visible:ring-offset-[#f6f2ea]"
            >
              How it works
            </a>
            <a
              href="#start-individuals"
              className="rounded-full transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-proofound-forest/35 focus-visible:ring-offset-4 focus-visible:ring-offset-[#f6f2ea]"
            >
              For individuals
            </a>
            <a
              href="#start-organizations"
              className="rounded-full transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-proofound-forest/35 focus-visible:ring-offset-4 focus-visible:ring-offset-[#f6f2ea]"
            >
              For organizations
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <div className="hidden h-6 w-px bg-border/80 lg:block" aria-hidden="true" />
            <Link
              href="/login"
              className="hidden rounded-full text-[1.02rem] text-foreground/82 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-proofound-forest/35 focus-visible:ring-offset-4 focus-visible:ring-offset-[#f6f2ea] lg:inline-flex"
            >
              Sign in
            </Link>
            <button
              type="button"
              onClick={handleOrganizationSignup}
              className="inline-flex items-center gap-2 whitespace-nowrap rounded-full bg-[#65755d] px-3.5 py-2.5 text-[0.8rem] font-medium text-white shadow-[0_16px_30px_-20px_rgba(101,117,93,0.72)] transition-[background-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:bg-[#5c6b54] hover:shadow-[0_20px_36px_-22px_rgba(101,117,93,0.78)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-proofound-forest/35 focus-visible:ring-offset-4 focus-visible:ring-offset-[#f6f2ea] active:translate-y-0 sm:px-5 sm:py-3 sm:text-sm md:px-6"
            >
              <span>Request a pilot</span>
              <ArrowRight className="hidden h-4 w-4 sm:block" aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      <main>
        <ScrollytellingSection
          onIndividualSignup={handleIndividualSignup}
          onOrganizationSignup={handleOrganizationSignup}
        />

        <FinalCTASection
          onGetStarted={handleGetStarted}
          onIndividualSignup={handleIndividualSignup}
          onOrganizationSignup={handleOrganizationSignup}
        />

        <FooterSection />
      </main>
    </div>
  );
}
