'use client';

import { EyeOff, Layers, MessageSquareText } from 'lucide-react';

export function PrivacySafeReviewSection() {
  return (
    <section className="w-full py-24 bg-background relative z-10 border-t border-border">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="mb-16">
          <span className="inline-block text-proofound-forest dark:text-[#D4C4A8] font-medium tracking-wide text-sm mb-4 uppercase">
            Privacy-safe review
          </span>
          <h2 className="text-3xl md:text-5xl font-display text-proofound-forest dark:text-foreground mb-6">
            Public does not mean exposed.
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl">
            Proofound separates public portfolio publication from review-stage reveal. Early review
            is blind by default. Identity-bearing reveal happens only when it is needed and
            approved.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 lg:gap-16 border-t border-border/50 pt-16">
          {/* Point 1 */}
          <div className="flex flex-col">
            <div className="w-12 h-12 bg-muted/50 rounded-xl flex items-center justify-center mb-6">
              <EyeOff className="w-6 h-6 text-proofound-forest dark:text-foreground" />
            </div>
            <h3 className="text-xl font-display text-proofound-forest dark:text-foreground mb-4">
              Blind by default
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              Early review focuses on proof and capability before identity-heavy cues bias the
              decision.
            </p>
          </div>

          {/* Point 2 */}
          <div className="flex flex-col">
            <div className="w-12 h-12 bg-muted/50 rounded-xl flex items-center justify-center mb-6">
              <Layers className="w-6 h-6 text-proofound-forest dark:text-foreground" />
            </div>
            <h3 className="text-xl font-display text-proofound-forest dark:text-foreground mb-4">
              Progressive reveal
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              Context and identity reveal in stages, not all at once. Candidates maintain control
              over exposure.
            </p>
          </div>

          {/* Point 3 */}
          <div className="flex flex-col">
            <div className="w-12 h-12 bg-muted/50 rounded-xl flex items-center justify-center mb-6">
              <MessageSquareText className="w-6 h-6 text-proofound-forest dark:text-foreground" />
            </div>
            <h3 className="text-xl font-display text-proofound-forest dark:text-foreground mb-4">
              Explainable review
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              Reason-coded signals matter more than black-box ranking theater. You see exactly why a
              candidate is a fit.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
