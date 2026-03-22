'use client';

import { ArrowRight, UserCircle2, Building2 } from 'lucide-react';
import Link from 'next/link';

export function DayOneSurfacesSection() {
  return (
    <section className="w-full py-32 bg-background relative z-10">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="mb-24 md:text-center">
          <span className="inline-block text-proofound-terracotta font-semibold tracking-[0.15em] text-xs mb-4 uppercase">
            Start with one useful surface
          </span>
          <h2 className="text-4xl md:text-5xl lg:text-[3.5rem] font-display text-proofound-forest dark:text-foreground mb-6 leading-tight">
            One clear starting point <br className="hidden md:block" /> for each side.
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl leading-relaxed md:mx-auto">
            Proofound is not a broad suite. The MVP starts with a public proof portfolio for
            individuals and a trust page plus assignment corridor for organizations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
          {/* Card 1: Individuals */}
          <div className="group bg-card/60 backdrop-blur-sm border border-border/40 hover:border-proofound-forest/20 dark:hover:border-[#D4C4A8]/20 rounded-[2rem] p-8 lg:p-12 shadow-[0_8px_30px_rgb(0,0,0,0.02)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.06)] transition-all duration-500 hover:-translate-y-1 flex flex-col h-full">
            <div className="w-12 h-12 bg-proofound-forest/5 dark:bg-white/5 rounded-full flex items-center justify-center mb-6">
              <UserCircle2 className="w-6 h-6 text-proofound-forest dark:text-foreground" />
            </div>
            <span className="text-sm font-semibold tracking-widest uppercase text-muted-foreground mb-4 block">
              For individuals
            </span>
            <h3 className="text-2xl font-display text-proofound-forest dark:text-foreground mb-4">
              Public proof portfolio
            </h3>
            <p className="text-muted-foreground leading-relaxed mb-8 flex-1">
              Turn real work, volunteering, or learning into a calm public portfolio with 1–3 proof
              items, role context, outcomes, and scoped trust signals.
            </p>

            <div className="relative w-full aspect-[4/3] bg-muted/30 rounded-xl border border-border/50 mb-8 overflow-hidden group-hover:border-border transition-colors flex items-center justify-center">
              {/* Semantic minimal mockup representation */}
              <div className="w-[80%] h-[80%] bg-card rounded-lg shadow-sm border border-border/50 p-4 flex flex-col gap-3">
                <div className="h-4 w-1/3 bg-muted rounded" />
                <div className="h-3 w-1/2 bg-muted/60 rounded" />
                <div className="flex-1 border-t border-border mt-2 pt-3 flex flex-col gap-2">
                  <div className="h-8 w-full bg-proofound-forest/5 dark:bg-white/5 rounded" />
                  <div className="h-8 w-full bg-proofound-forest/5 dark:bg-white/5 rounded" />
                </div>
              </div>
            </div>

            <Link
              href="/signup/individual"
              className="inline-flex items-center text-proofound-terracotta font-medium hover:opacity-80 transition-opacity"
            >
              Create your proof portfolio
              <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          {/* Card 2: Organizations */}
          <div className="group bg-card/60 backdrop-blur-sm border border-border/40 hover:border-proofound-terracotta/20 rounded-[2rem] p-8 lg:p-12 shadow-[0_8px_30px_rgb(0,0,0,0.02)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.06)] transition-all duration-500 hover:-translate-y-1 flex flex-col h-full">
            <div className="w-12 h-12 bg-proofound-terracotta/10 rounded-full flex items-center justify-center mb-6">
              <Building2 className="w-6 h-6 text-proofound-terracotta" />
            </div>
            <span className="text-sm font-semibold tracking-widest uppercase text-muted-foreground mb-4 block">
              For organizations
            </span>
            <h3 className="text-2xl font-display text-proofound-forest dark:text-foreground mb-4">
              Trust page + assignment corridor
            </h3>
            <p className="text-muted-foreground leading-relaxed mb-8 flex-1">
              Publish a credible team surface, define the work clearly, and review proof-backed
              candidates through a privacy-safe shortlist before interview time is wasted.
            </p>

            <div className="relative w-full aspect-[4/3] bg-muted/30 rounded-xl border border-border/50 mb-8 overflow-hidden group-hover:border-border transition-colors flex items-center justify-center">
              {/* Semantic minimal mockup representation */}
              <div className="w-[80%] h-[80%] bg-card rounded-lg shadow-sm border border-border/50 flex flex-col overflow-hidden">
                <div className="h-10 w-full bg-muted/30 border-b border-border/50 flex items-center px-4 gap-2">
                  <div className="h-3 w-3 rounded-full bg-muted/80" />
                  <div className="h-3 w-3 rounded-full bg-muted/80" />
                  <div className="h-3 w-3 rounded-full bg-muted/80" />
                </div>
                <div className="p-4 flex flex-col gap-2">
                  <div className="h-4 w-2/3 bg-muted rounded" />
                  <div className="flex gap-2">
                    <div className="h-12 flex-1 bg-proofound-forest/5 dark:bg-white/5 rounded flex items-center justify-center">
                      <div className="h-2 w-1/2 bg-muted/60 rounded" />
                    </div>
                    <div className="h-12 flex-1 bg-proofound-forest/5 dark:bg-white/5 rounded flex items-center justify-center">
                      <div className="h-2 w-1/2 bg-muted/60 rounded" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <Link
              href="/signup/organization"
              className="inline-flex items-center text-proofound-forest dark:text-foreground font-medium hover:text-proofound-terracotta transition-colors"
            >
              Request a pilot
              <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
