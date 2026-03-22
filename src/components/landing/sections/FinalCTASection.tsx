'use client';

import { MagneticButton } from '@/components/ui/magnetic-button';
import { ArrowRight, UserCircle2, Building2 } from 'lucide-react';
import Link from 'next/link';

interface FinalCTASectionProps {
  onIndividualSignup?: () => void;
  onOrganizationSignup?: () => void;
  shouldReduceMotion?: boolean;
}

export function FinalCTASection({
  onIndividualSignup,
  onOrganizationSignup,
  shouldReduceMotion = false,
}: FinalCTASectionProps) {
  return (
    <section className="w-full py-32 bg-background relative z-10 border-t border-border">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <h2 className="text-4xl md:text-5xl lg:text-6xl font-display text-proofound-forest dark:text-foreground mb-6">
          Start with proof, not noise.
        </h2>
        <p className="text-lg md:text-xl text-muted-foreground mb-16">
          Choose the first action that matches your role.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
          {/* Action 1: Individuals */}
          <div className="flex flex-col border border-border/40 bg-card/60 backdrop-blur-sm p-8 lg:p-10 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.02)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.06)] transition-all duration-500 hover:-translate-y-1 items-center text-center group">
            <div className="w-16 h-16 bg-proofound-forest/5 dark:bg-white/5 rounded-full flex items-center justify-center mb-6 group-hover:bg-proofound-forest/10 transition-colors">
              <UserCircle2 className="w-8 h-8 text-proofound-forest dark:text-foreground" />
            </div>
            <span className="text-sm font-semibold tracking-widest uppercase text-muted-foreground mb-6 block">
              For individuals
            </span>
            <button
              onClick={onIndividualSignup}
              className="px-6 py-3.5 bg-proofound-forest text-proofound-sand dark:bg-[#D4C4A8] dark:text-proofound-forest rounded-full font-medium hover:opacity-90 transition-opacity w-full border border-transparent hover:border-proofound-forest/20"
            >
              Create your proof portfolio
            </button>
          </div>

          {/* Action 2: Organizations */}
          <div className="flex flex-col border border-border/40 bg-card/60 backdrop-blur-sm p-8 lg:p-10 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.02)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.06)] transition-all duration-500 hover:-translate-y-1 items-center text-center group">
            <div className="w-16 h-16 bg-proofound-terracotta/10 rounded-full flex items-center justify-center mb-6 group-hover:bg-proofound-terracotta/20 transition-colors">
              <Building2 className="w-8 h-8 text-proofound-terracotta" />
            </div>
            <span className="text-sm font-semibold tracking-widest uppercase text-muted-foreground mb-6 block">
              For organizations
            </span>
            <MagneticButton
              onClick={onOrganizationSignup}
              className="bg-proofound-terracotta text-white rounded-full px-6 py-3.5 flex items-center justify-center font-medium shadow-sm hover:shadow-lg transition-all w-full ring-1 ring-proofound-terracotta/30"
            >
              Request a pilot
              <ArrowRight className="ml-2 w-4 h-4" />
            </MagneticButton>
          </div>
        </div>

        <div className="mt-12 text-muted-foreground">
          Already using Proofound?{' '}
          <Link
            href="/login"
            className="text-proofound-forest dark:text-[#D4C4A8] font-medium hover:underline"
          >
            Sign in.
          </Link>
        </div>
      </div>
    </section>
  );
}
