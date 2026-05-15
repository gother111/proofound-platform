'use client';

const stories = [
  {
    title: 'From scattered links to one proof-backed profile',
    body: 'A career-switching designer turns work samples, context, and stakeholder-backed proof into one calm Public Page proof snapshot that gives hiring teams stronger signal than CVs.',
    detail:
      'Each claim resolves to visible work, reviewer-backed context, and public-safe evidence that can travel cleanly into a structured assignment corridor.',
  },
  {
    title: 'From resume pile to stronger shortlist',
    body: 'A lean hiring team publishes a clearer assignment, pairs it with an org trust page, and reviews privacy-safe proof before identity to reach interviews with fewer but higher-signal candidates.',
    detail:
      'The shortlist stays explainable, the review stays proof-backed, and reveal only happens after the work clears the bar.',
  },
];

export function EarlyProofSection() {
  return (
    <section className="border-t border-[var(--landing-border-soft)] bg-[var(--landing-surface-soft)] py-32">
      <div className="mx-auto max-w-[1240px] px-6 lg:px-10">
        <div className="max-w-[760px]">
          <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--landing-action)]">
            Early proof
          </span>
          <h2 className="mt-5 font-display text-[3rem] leading-[1.02] tracking-[-0.03em] text-[var(--landing-dark)] md:text-[3.45rem]">
            What this looks like in practice.
          </h2>
          <p className="mt-5 text-[1.08rem] leading-8 text-[var(--landing-text)]">
            Use compact, credible proof stories that reinforce stronger signal than CVs.
          </p>
        </div>

        <div className="mt-16 grid gap-12 lg:grid-cols-2">
          {stories.map((story, index) => (
            <article key={story.title} className="border-t border-[var(--landing-border)] pt-8">
              <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--landing-clay)]">
                Story 0{index + 1}
              </div>
              <h3 className="mt-5 max-w-[16ch] font-display text-[2.15rem] leading-tight text-[var(--landing-dark)]">
                {story.title}
              </h3>
              <p className="mt-5 text-[1.02rem] leading-7 text-[var(--landing-text)]">
                {story.body}
              </p>

              <div className="mt-8 grid gap-5 md:grid-cols-[0.92fr_1.08fr]">
                <div className="border-l border-[var(--landing-border)] pl-5">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--landing-muted)]">
                    Snapshot
                  </div>
                  <div className="mt-4 space-y-3">
                    <div className="h-2.5 w-[72%] rounded-full bg-[var(--landing-surface-strong)]" />
                    <div className="h-2.5 w-[54%] rounded-full bg-[var(--landing-surface)]" />
                    <div className="border-l-2 border-[var(--landing-clay)]/40 pl-4 text-sm leading-7 text-[var(--landing-text)]">
                      {index === 0
                        ? 'Portfolio becomes one calm place to inspect work, context, and trust.'
                        : 'Review moves from resume pile to proof-backed shortlist before interviews.'}
                    </div>
                  </div>
                </div>
                <div className="border-l border-[var(--landing-border)] pl-5">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--landing-muted)]">
                    Review handoff
                  </div>
                  <p className="mt-3 text-sm leading-7 text-[var(--landing-text)]">
                    {story.detail}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
