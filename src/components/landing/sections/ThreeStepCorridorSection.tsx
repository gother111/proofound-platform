'use client';

export function ThreeStepCorridorSection() {
  return (
    <section className="w-full py-24 bg-background relative z-10 border-t border-border">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="mb-24 md:text-center flex flex-col items-center">
          <span className="inline-block text-proofound-terracotta font-semibold tracking-[0.1em] text-xs mb-4 uppercase border border-proofound-terracotta/20 rounded-full px-4 py-1.5 bg-proofound-terracotta/5">
            The canonical flow
          </span>
          <h2 className="text-4xl md:text-5xl lg:text-[3.5rem] font-display text-proofound-forest dark:text-foreground mb-6 leading-tight">
            How the corridor works.
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto text-center">
            A linear progression from gathering evidence to making a privacy-safe match.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-8 relative">
          {/* Subtle connecting line for desktop */}
          <div className="hidden md:block absolute top-[4.5rem] left-[15%] right-[15%] h-[1px] bg-gradient-to-r from-transparent via-border/60 to-transparent -z-10" />

          {/* Step 1 */}
          <div className="relative flex flex-col items-center text-center group">
            <div className="w-24 h-24 rounded-full bg-card border border-border/40 flex items-center justify-center mb-8 shadow-sm group-hover:shadow-[0_10px_30px_rgb(0,0,0,0.06)] transition-all duration-500 group-hover:-translate-y-1">
              <span className="text-[2.5rem] font-display text-proofound-terracotta leading-none">
                1
              </span>
            </div>
            <h3 className="text-2xl font-display text-proofound-forest dark:text-foreground mb-4">
              Build proof
            </h3>
            <p className="text-muted-foreground leading-relaxed max-w-[280px]">
              Candidates add context, outcomes, artifacts, and trust anchors through Proof Packs.
            </p>
          </div>

          {/* Step 2 */}
          <div className="relative flex flex-col items-center text-center group">
            <div className="w-24 h-24 rounded-full bg-card border border-border/40 flex items-center justify-center mb-8 shadow-sm group-hover:shadow-[0_10px_30px_rgb(0,0,0,0.06)] transition-all duration-500 group-hover:-translate-y-1">
              <span className="text-[2.5rem] font-display text-proofound-forest dark:text-[#D4C4A8] leading-none">
                2
              </span>
            </div>
            <h3 className="text-2xl font-display text-proofound-forest dark:text-foreground mb-4">
              Publish trust
            </h3>
            <p className="text-muted-foreground leading-relaxed max-w-[280px]">
              A public proof portfolio or organization trust page becomes shareable without exposing
              review-stage data.
            </p>
          </div>

          {/* Step 3 */}
          <div className="relative flex flex-col items-center text-center group">
            <div className="w-24 h-24 rounded-full bg-card border border-border/40 flex items-center justify-center mb-8 shadow-sm group-hover:shadow-[0_10px_30px_rgb(0,0,0,0.06)] transition-all duration-500 group-hover:-translate-y-1">
              <span className="text-[2.5rem] font-display text-proofound-forest dark:text-[#D4C4A8] leading-none">
                3
              </span>
            </div>
            <h3 className="text-2xl font-display text-proofound-forest dark:text-foreground mb-4">
              Review safely
            </h3>
            <p className="text-muted-foreground leading-relaxed max-w-[280px]">
              Organizations review stronger signal first, then move through intro, reveal,
              interview, and decision with explanation.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
