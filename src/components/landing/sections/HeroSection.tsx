'use client';

import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';

interface HeroSectionProps {
  onIndividualSignup?: () => void;
  onOrganizationSignup?: () => void;
  shouldReduceMotion?: boolean | null;
}

export function HeroSection({ onIndividualSignup, onOrganizationSignup }: HeroSectionProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <section
      ref={containerRef}
      className="relative min-h-[90vh] flex items-center justify-center overflow-hidden px-6 md:px-12 pt-20 scroll-mt-24"
    >
      {/* Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 -right-20 w-[600px] h-[600px] bg-japandi-sage/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-[500px] h-[500px] bg-japandi-terracotta/10 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto w-full grid lg:grid-cols-2 gap-12 items-center relative z-10">
        {/* Text Content */}
        <div className="space-y-8">
          <div>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif text-foreground leading-[0.95] tracking-tight mb-6">
              Proofound
            </h1>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-sans text-foreground leading-tight">
              A credibility engineering platform for impactful connections
            </h2>
          </div>

          <p className="text-lg md:text-xl text-muted-foreground max-w-xl leading-relaxed font-sans">
            Unprecedented possibilities for work, business, and individual transformation. Backed by
            evidence, not vanity metrics.
          </p>

          <div className="flex flex-wrap gap-4">
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
          </div>
        </div>
      </div>

      <div
        aria-hidden="true"
        className="absolute top-[8%] right-[-10%] bottom-[6%] hidden lg:block w-[42%] pointer-events-none z-10 rounded-[50%] bg-gradient-to-b from-extended-sage/20 to-proofound-terracotta/15 blur-2xl"
      />
    </section>
  );
}
