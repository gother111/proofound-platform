'use client';

const points = [
  {
    title: 'Blind by default',
    body: 'Early review focuses on proof and capability before identity-heavy cues.',
  },
  {
    title: 'Progressive reveal',
    body: 'Context and identity reveal in stages, not all at once.',
  },
  {
    title: 'Explainable review',
    body: 'Reason-coded signals matter more than black-box ranking theater.',
  },
];

export function PrivacySafeReviewSection() {
  return (
    <section className="bg-[var(--landing-bg)] py-32">
      <div className="mx-auto max-w-[1240px] px-6 lg:px-10">
        <div className="grid gap-12 lg:grid-cols-[0.94fr_1.06fr] lg:items-start">
          <div className="max-w-[35rem]">
            <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--landing-action)]">
              Privacy-safe review
            </span>
            <h2 className="mt-5 font-display text-[3rem] leading-[1.02] tracking-[-0.03em] text-[var(--landing-dark)] md:text-[3.45rem]">
              Public does not mean exposed.
            </h2>
            <p className="mt-5 text-[1.08rem] leading-8 text-[var(--landing-text)]">
              Proofound separates Public Page publication from review-stage reveal. Early review is
              blind by default. Identity-bearing reveal happens only when it is needed and approved.
            </p>
          </div>

          <div className="grid gap-10">
            <div className="border-y border-[var(--landing-border-soft)] py-8">
              <div className="grid gap-8 md:grid-cols-[0.78fr_1.22fr]">
                <div className="border-l border-[var(--landing-border)] pl-5">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--landing-muted)]">
                    Traditional review
                  </div>
                  <div className="mt-4 space-y-3 text-sm leading-7 text-[var(--landing-muted)]">
                    <div>Full name</div>
                    <div>Photo</div>
                    <div>School prestige</div>
                    <div>Polished summary</div>
                  </div>
                </div>

                <div className="bg-[var(--landing-action)] px-6 py-6 text-[var(--landing-surface-soft)]">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--landing-accent)]">
                    Proofound review
                  </div>
                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    <div className="border-t border-white/14 pt-4 text-sm">Outcome first</div>
                    <div className="border-t border-white/14 pt-4 text-sm">Context in view</div>
                    <div className="border-t border-white/14 pt-4 text-sm">
                      Evidence inspectable
                    </div>
                    <div className="border-t border-white/14 pt-4 text-sm">Reveal later</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              {points.map((point) => (
                <article key={point.title} className="border-t border-[var(--landing-border)] pt-6">
                  <h3 className="font-display text-[1.7rem] leading-tight text-[var(--landing-dark)]">
                    {point.title}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-[var(--landing-text)]">{point.body}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
