'use client';

export function EarlyProofSection() {
  return (
    <section className="w-full py-32 bg-background relative z-10 border-t border-border/40">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="mb-24">
          <span className="inline-block text-proofound-forest dark:text-[#D4C4A8] font-medium tracking-[0.1em] text-xs mb-4 uppercase border border-proofound-forest/10 dark:border-[#D4C4A8]/20 rounded-full px-4 py-1.5 bg-proofound-forest/5 dark:bg-[#D4C4A8]/5">
            Early proof
          </span>
          <h2 className="text-4xl md:text-5xl lg:text-[3.5rem] font-display text-proofound-forest dark:text-foreground mb-6 leading-[1.1]">
            What this looks like <br className="hidden md:block" /> in practice.
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl">
            Real outcomes from early usage, where structured proof separates concrete signal from
            generic noise.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
          {/* Story 1 */}
          <div className="group bg-card/60 backdrop-blur-sm border border-border/40 p-8 lg:p-14 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.02)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.06)] transition-all duration-500 hover:-translate-y-1">
            <h3 className="text-3xl font-display text-proofound-forest dark:text-foreground mb-6 leading-tight">
              From scattered links to one proof-backed profile
            </h3>
            <p className="text-muted-foreground leading-relaxed text-lg mb-10">
              A career-switching designer turns work samples, context, and stakeholder-backed proof
              into one calm public portfolio that is easier to trust than a résumé plus five
              separate links.
            </p>
            <div className="border border-border/40 shadow-sm rounded-2xl p-8 bg-background flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-proofound-forest/5 dark:bg-white/5" />
                <div className="flex-1 h-3 rounded bg-border/50" />
              </div>
              <div className="w-full h-8 rounded bg-border/30 mt-4" />
              <div className="w-full h-8 rounded bg-border/30" />
            </div>
          </div>

          {/* Story 2 */}
          <div className="group bg-card/60 backdrop-blur-sm border border-border/40 p-8 lg:p-14 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.02)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.06)] transition-all duration-500 hover:-translate-y-1">
            <h3 className="text-3xl font-display text-proofound-forest dark:text-foreground mb-6 leading-tight">
              From résumé pile to stronger shortlist
            </h3>
            <p className="text-muted-foreground leading-relaxed text-lg mb-10">
              A lean hiring team defines the work clearly, reviews proof before identity, and
              reaches structured interviews with fewer but higher-signal candidates.
            </p>
            <div className="border border-border/40 shadow-sm rounded-2xl p-8 bg-background flex flex-col gap-5">
              <div className="flex justify-between items-end border-b border-border/50 pb-5">
                <div className="space-y-3">
                  <div className="w-24 h-3 rounded bg-border/50" />
                  <div className="w-32 h-6 rounded bg-border/80" />
                </div>
                <div className="w-20 h-8 rounded-full bg-proofound-terracotta/10 flex items-center justify-center">
                  <span className="w-10 h-2 rounded bg-proofound-terracotta/40" />
                </div>
              </div>
              <div className="flex gap-4 pt-3">
                <div className="w-12 h-12 rounded bg-border/30" />
                <div className="w-12 h-12 rounded bg-border/30" />
                <div className="w-12 h-12 rounded bg-border/30" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
