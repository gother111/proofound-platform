'use client';

const points = [
  {
    title: 'Clearer inputs',
    body: 'Define the work, expected outcomes, and useful evidence before applications start.',
  },
  {
    title: 'Better early review',
    body: 'Review proof-backed submissions instead of drowning in polished claims.',
  },
  {
    title: 'Faster downstream decisions',
    body: 'Bring fewer, better-prepared submissions into interviews and use the same corridor again on the next role.',
  },
];

export function HiringTeamsSection() {
  return (
    <section className="border-y border-[var(--landing-border-soft)] bg-[var(--landing-surface)] py-32">
      <div className="mx-auto grid max-w-[1240px] gap-14 px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-10">
        <div className="max-w-[33rem]">
          <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--landing-action)]">
            For review teams
          </span>
          <h2 className="mt-5 max-w-[11ch] font-display text-[3rem] leading-[1.02] tracking-[-0.03em] text-[var(--landing-dark)] md:text-[3.45rem]">
            Better assignments create better shortlists.
          </h2>
          <p className="mt-5 text-[1.08rem] leading-8 text-[var(--landing-text)]">
            Proofound is not another sourcing feed. It helps lean teams define the work clearly,
            review fewer stronger proof submissions, and waste less interview time.
          </p>
        </div>

        <div className="grid gap-0 border-t border-[var(--landing-border)]">
          {points.map((point, index) => (
            <article
              key={point.title}
              className="grid gap-5 border-b border-[var(--landing-border)] py-8 md:grid-cols-[88px_1fr] md:items-start"
            >
              <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--landing-muted)] md:pt-2">
                0{index + 1}
              </div>
              <div>
                <h3 className="max-w-[14ch] font-display text-[2.15rem] leading-[1.04] text-[var(--landing-dark)]">
                  {point.title}
                </h3>
                <p className="mt-4 max-w-[32rem] text-[1rem] leading-8 text-[var(--landing-text)]">
                  {point.body}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
