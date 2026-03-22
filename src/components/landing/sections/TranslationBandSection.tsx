'use client';

import { motion } from 'framer-motion';

export function TranslationBandSection() {
  return (
    <section className="w-full py-20 bg-proofound-forest/5 dark:bg-[#121212] border-y border-border/40 relative z-10">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="text-center mb-16">
          <span className="text-proofound-terracotta text-xs font-semibold tracking-[0.15em] uppercase border border-proofound-terracotta/20 rounded-full px-4 py-1.5 bg-proofound-terracotta/5">
            What changes when proof comes first
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8 divide-y md:divide-y-0 md:divide-x divide-border/30">
          {/* Column 1 */}
          <div className="flex flex-col items-center text-center pt-8 md:pt-0 md:px-8 first:pt-0">
            <h3 className="text-2xl font-display text-proofound-forest dark:text-foreground mb-4">
              Less self-claim
            </h3>
            <p className="text-muted-foreground leading-relaxed text-lg max-w-sm">
              Vague summaries, pedigree shorthand, and keyword theater stop doing most of the work.
            </p>
          </div>

          {/* Column 2 */}
          <div className="flex flex-col items-center text-center pt-8 md:pt-0 md:px-8">
            <h3 className="text-2xl font-display text-proofound-forest dark:text-foreground mb-4">
              More evidence
            </h3>
            <p className="text-muted-foreground leading-relaxed text-lg max-w-sm">
              Outcomes, artifacts, context, and scoped trust signals become the center of review.
            </p>
          </div>

          {/* Column 3 */}
          <div className="flex flex-col items-center text-center pt-8 md:pt-0 md:px-8">
            <h3 className="text-2xl font-display text-proofound-forest dark:text-foreground mb-4">
              Safer early review
            </h3>
            <p className="text-muted-foreground leading-relaxed text-lg max-w-sm">
              Organizations can review proof first and reveal identity only when mutual interest
              exists.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
