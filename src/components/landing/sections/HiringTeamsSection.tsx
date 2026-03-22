'use client';

export function HiringTeamsSection() {
  return (
    <section className="w-full py-24 bg-[#E0D5C7]/10 dark:bg-muted/5 relative z-10 border-t border-border/40">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="mb-20 md:text-center flex flex-col items-center">
          <span className="inline-block text-proofound-forest dark:text-[#D4C4A8] font-medium tracking-[0.1em] text-xs mb-4 uppercase border border-proofound-forest/10 dark:border-[#D4C4A8]/20 rounded-full px-4 py-1.5 bg-proofound-forest/5 dark:bg-[#D4C4A8]/5">
            For hiring teams
          </span>
          <h2 className="text-4xl md:text-5xl lg:text-[3.5rem] font-display text-proofound-forest dark:text-white mb-6 leading-tight">
            Better assignments <br className="hidden md:block" /> create better shortlists.
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto text-center">
            Proofound is not another talent feed. It helps lean teams define the work clearly,
            review fewer stronger candidates, and waste less interview time.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
          {/* Card 1 */}
          <div className="bg-card/60 backdrop-blur-sm border border-border/40 hover:border-proofound-forest/20 p-8 lg:p-10 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.02)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.06)] transition-all duration-500 hover:-translate-y-1">
            <h3 className="text-2xl font-display text-proofound-forest dark:text-foreground mb-4">
              Clearer inputs
            </h3>
            <p className="text-muted-foreground leading-relaxed text-lg">
              Define the work, expected outcomes, and useful evidence before applications start.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-card/60 backdrop-blur-sm border border-border/40 hover:border-proofound-forest/20 p-8 lg:p-10 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.02)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.06)] transition-all duration-500 hover:-translate-y-1">
            <h3 className="text-2xl font-display text-proofound-forest dark:text-foreground mb-4">
              Better early review
            </h3>
            <p className="text-muted-foreground leading-relaxed text-lg">
              Review proof-backed candidates instead of drowning in polished generic claims.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-card/60 backdrop-blur-sm border border-border/40 hover:border-proofound-forest/20 p-8 lg:p-10 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.02)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.06)] transition-all duration-500 hover:-translate-y-1">
            <h3 className="text-2xl font-display text-proofound-forest dark:text-foreground mb-4">
              Faster decisions
            </h3>
            <p className="text-muted-foreground leading-relaxed text-lg">
              Interview fewer people and use the same structured corridor again on the next role.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
