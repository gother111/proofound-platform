'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ScrollytellingSection } from './sections/ScrollytellingSection';
import { FinalCTASection } from './sections/FinalCTASection';
import { FooterSection } from './sections/FooterSection';
import { NetworkBackground } from '@/components/ProofoundLanding';

interface StoryLandingProps {
  onGetStarted?: () => void;
  onIndividualSignup?: () => void;
  onOrganizationSignup?: () => void;
}

export function StoryLanding({
  onGetStarted,
  onIndividualSignup,
  onOrganizationSignup,
}: StoryLandingProps) {
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
