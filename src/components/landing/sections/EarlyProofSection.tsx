'use client';

const stories = [
  {
    title: 'From scattered links to one proof-backed profile',
    body: 'A career-switching designer turns work samples, context, and stakeholder-backed proof into one calm public portfolio that is easier to trust than a resume plus five separate links.',
    detail:
      'Placeholder structure designed so pilot evidence can replace this copy later without redesigning the section.',
  },
  {
    title: 'From resume pile to stronger shortlist',
    body: 'A lean hiring team defines the work clearly, reviews proof before identity, and reaches interviews with fewer but higher-signal candidates.',
    detail:
      'The card leaves room for future pilot notes, reviewer quotes, or before-and-after workflow proof.',
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
            Use compact, credible before-and-after stories instead of generic logo soup.
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
                    Pilot-ready placeholder
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
