'use client';

const columns = [
  {
    title: 'Less self-claim',
    body: 'Vague summaries, pedigree shorthand, and keyword theater stop doing most of the work.',
  },
  {
    title: 'More evidence',
    body: 'Outcomes, artifacts, context, and scoped verification checks become the center of review.',
  },
  {
    title: 'Safer early review',
    body: 'Organizations can review proof first and reveal identity only when it matters.',
  },
];

export function TranslationBandSection() {
  return (
    <section className="border-y border-[var(--landing-border-soft)] bg-[var(--landing-surface-soft)] py-20">
      <div className="mx-auto max-w-[1240px] px-6 lg:px-10">
        <div className="mb-12">
          <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--landing-clay)]">
            What changes when proof comes first
          </span>
        </div>

        <div className="grid gap-10 md:grid-cols-3 md:gap-8">
          {columns.map((column, index) => (
            <div
              key={column.title}
              className={`border-[var(--landing-border)] md:px-6 ${
                index > 0 ? 'md:border-l md:pl-8' : 'md:pl-0'
              }`}
            >
              <div className="mb-6 text-[11px] uppercase tracking-[0.22em] text-[var(--landing-muted)]">
                0{index + 1}
              </div>
              <h2 className="max-w-[11ch] font-display text-[2.35rem] leading-[1.02] text-[var(--landing-dark)]">
                {column.title}
              </h2>
              <p className="mt-5 max-w-[23rem] text-[1rem] leading-8 text-[var(--landing-text)]">
                {column.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
