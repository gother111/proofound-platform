'use client';

const steps = [
  {
    number: '01',
    title: 'Build proof',
    body: 'Candidates add context, outcomes, artifacts, and trust anchors through Proof Packs.',
  },
  {
    number: '02',
    title: 'Publish trust',
    body: 'A public proof portfolio or organization trust page becomes shareable without exposing review-stage data.',
  },
  {
    number: '03',
    title: 'Review safely',
    body: 'Organizations review stronger signal first, then move through intro, reveal, interview, and decision with explanation and consent built in.',
  },
];

export function ThreeStepCorridorSection() {
  return (
    <section className="bg-[var(--landing-bg)] py-32">
      <div className="mx-auto max-w-[1240px] px-6 lg:px-10">
        <div className="max-w-[780px]">
          <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--landing-clay)]">
            How it works
          </span>
          <h2 className="mt-5 font-display text-[3rem] leading-[1.02] tracking-[-0.03em] text-[var(--landing-dark)] md:text-[3.45rem]">
            Build proof. Publish trust. Review safely.
          </h2>
          <p className="mt-5 text-[1.08rem] leading-8 text-[var(--landing-text)]">
            Explain the product in three steps only.
          </p>
        </div>

        <div className="mt-16 grid gap-10 lg:grid-cols-3">
          {steps.map((step) => (
            <article
              key={step.number}
              className="flex min-h-[280px] flex-col justify-between border-t border-[var(--landing-border)] pt-8"
            >
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--landing-muted)]">
                  Step {step.number}
                </div>
                <h3 className="mt-8 font-display text-[2.15rem] leading-tight text-[var(--landing-dark)]">
                  {step.title}
                </h3>
                <p className="mt-4 text-[1.02rem] leading-7 text-[var(--landing-text)]">
                  {step.body}
                </p>
              </div>
              <div className="mt-10 h-px w-full bg-gradient-to-r from-[color:var(--landing-clay)]/45 via-[color:var(--landing-action)]/14 to-transparent" />
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
