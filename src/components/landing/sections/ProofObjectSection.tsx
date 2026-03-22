'use client';

import { CheckCircle2, Link as LinkIcon, ShieldCheck } from 'lucide-react';

export function ProofObjectSection() {
  return (
    <section className="w-full py-32 bg-proofound-forest text-proofound-sand dark:bg-[#1a1a1a] dark:text-[#D4C4A8] relative z-10 overflow-hidden">
      {/* Decorative background grain */}
      <div
        className="absolute inset-0 opacity-[0.03] mix-blend-overlay pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(ellipse at center, rgba(199, 107, 74, 0.05) 0%, transparent 70%), url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.7'/%3E%3C/svg%3E")`,
        }}
      />

      <div className="max-w-7xl mx-auto px-6 lg:px-12 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
        {/* Left: Copy */}
        <div>
          <span className="inline-block text-proofound-terracotta font-semibold tracking-[0.15em] text-xs mb-6 uppercase">
            The proof object
          </span>
          <h2 className="text-4xl md:text-5xl lg:text-[3.5rem] leading-[1.1] font-display text-white mb-8">
            Every real claim should resolve to evidence.
          </h2>
          <p className="text-lg md:text-xl text-proofound-sand/70 dark:text-[#D4C4A8]/70 leading-relaxed mb-12">
            The Proof Pack is the canonical object at the center of Proofound. It strips away noise
            and isolates exactly what matters.
          </p>

          <div className="space-y-8">
            <div className="border-l-2 border-proofound-terracotta/30 pl-4">
              <h4 className="text-sm font-semibold tracking-wider uppercase text-white mb-2">
                Outcome
              </h4>
              <p className="text-proofound-sand/80 dark:text-[#D4C4A8]/80 text-sm leading-relaxed">
                What changed in a way someone can actually understand.
              </p>
            </div>

            <div className="border-l-2 border-proofound-terracotta/30 pl-4">
              <h4 className="text-sm font-semibold tracking-wider uppercase text-white mb-2">
                Context
              </h4>
              <p className="text-proofound-sand/80 dark:text-[#D4C4A8]/80 text-sm leading-relaxed">
                What the person owned, where, and under what constraints.
              </p>
            </div>

            <div className="border-l-2 border-proofound-terracotta/30 pl-4">
              <h4 className="text-sm font-semibold tracking-wider uppercase text-white mb-2">
                Evidence
              </h4>
              <p className="text-proofound-sand/80 dark:text-[#D4C4A8]/80 text-sm leading-relaxed">
                What someone can inspect instead of simply taking it on faith.
              </p>
            </div>

            <div className="border-l-2 border-proofound-terracotta/30 pl-4">
              <h4 className="text-sm font-semibold tracking-wider uppercase text-white mb-2">
                Verification
              </h4>
              <p className="text-proofound-sand/80 dark:text-[#D4C4A8]/80 text-sm leading-relaxed">
                What kind of trust exists, and how strong it really is.
              </p>
            </div>
          </div>
        </div>

        {/* Right: The Visual */}
        <div className="relative w-full aspect-square md:aspect-[4/3] flex items-center justify-center p-4 perspective-1000">
          <div className="w-full max-w-[460px] bg-white dark:bg-[#1a1a1a] border border-border/10 rounded-3xl shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] p-10 relative transform hover:rotate-y-2 transition-transform duration-700">
            {/* Context */}
            <div className="absolute -top-4 -right-4 md:-right-8 bg-proofound-terracotta text-white text-[10px] font-bold px-4 py-2 rounded-full shadow-lg uppercase tracking-widest ring-4 ring-background/50">
              Context
            </div>
            <div className="mb-8 border-l-2 border-proofound-terracotta/30 pl-4">
              <div className="text-sm font-semibold text-foreground tracking-wide">
                Lead Engineer · Acme Corp
              </div>
              <div className="text-xs text-muted-foreground/80 font-medium tracking-wider mt-1 uppercase">
                Nov 2024 - Present
              </div>
            </div>

            {/* Outcome */}
            <div className="absolute top-[30%] -left-3 md:-left-8 bg-proofound-forest text-white text-xs font-semibold px-3 py-1.5 rounded shadow-lg uppercase tracking-wider">
              Outcome
            </div>
            <div className="mb-8 p-4 bg-muted/20 border border-border/50 rounded-lg">
              <h3 className="text-lg font-display text-foreground mb-1">
                Migrated monolithic API to serverless infrastructure, reducing costs by 45%.
              </h3>
            </div>

            {/* Evidence */}
            <div className="absolute top-[60%] -right-3 md:-right-8 bg-extended-sage text-proofound-forest font-semibold text-xs px-3 py-1.5 rounded shadow-lg uppercase tracking-wider">
              Evidence
            </div>
            <div className="mb-6 space-y-2">
              <div className="flex items-center gap-3 p-3 bg-muted/40 border border-border/40 rounded-lg text-sm text-foreground">
                <LinkIcon className="w-4 h-4 text-muted-foreground" />
                <span>Architecture Decision Record (ADR)</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted/40 border border-border/40 rounded-lg text-sm text-foreground">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Code Repository Excerpt</span>
              </div>
            </div>

            {/* Verification */}
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-[#D4C4A8] text-proofound-forest text-xs font-semibold px-3 py-1.5 rounded shadow-lg uppercase tracking-wider">
              Verification
            </div>
            <div className="pt-6 border-t border-border flex justify-between items-center text-sm">
              <div className="flex items-center gap-2 text-foreground font-medium">
                <ShieldCheck className="w-4 h-4 text-proofound-terracotta" />
                Network Verified
              </div>
              <div className="flex -space-x-2">
                <div className="w-6 h-6 rounded-full bg-muted border-2 border-white dark:border-card" />
                <div className="w-6 h-6 rounded-full bg-muted border-2 border-white dark:border-card" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
