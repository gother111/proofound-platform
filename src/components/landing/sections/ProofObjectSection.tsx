'use client';

const layers = [
  {
    label: 'Outcome',
    body: 'What changed in a way someone can actually understand.',
  },
  {
    label: 'Context',
    body: 'What the person owned, where, and under what constraints.',
  },
  {
    label: 'Evidence',
    body: 'What someone can inspect instead of simply taking it on faith.',
  },
  {
    label: 'Verification',
    body: 'What kind of trust exists, and how strong it really is.',
  },
];

export function ProofObjectSection() {
  return (
    <section className="overflow-hidden bg-[var(--landing-dark)] py-36 text-[var(--landing-surface-soft)]">
      <div className="mx-auto grid max-w-[1240px] gap-16 px-6 lg:grid-cols-[0.88fr_1.12fr] lg:px-10">
        <div className="max-w-[34rem]">
          <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--landing-accent)]">
            The proof object
          </span>
          <h2 className="mt-5 font-display text-[3rem] leading-[1.02] tracking-[-0.03em] text-[var(--landing-surface-soft)] md:text-[3.5rem]">
            Every real claim should resolve to evidence.
          </h2>
          <p className="mt-6 text-[1.08rem] leading-8 text-[color:var(--landing-surface)]">
            Show one large, editorial-scale proof record visual. The point is not volume. It is a
            calmer claim surface that can be inspected.
          </p>

          <div className="mt-12 grid gap-7">
            {layers.map((layer) => (
              <div
                key={layer.label}
                className="border-l border-[color:var(--landing-accent)]/35 pl-5"
              >
                <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--landing-accent)]">
                  {layer.label}
                </div>
                <p className="mt-2 text-sm leading-7 text-[color:var(--landing-surface)]">
                  {layer.body}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(220,180,130,0.12),transparent_48%)]" />
          <div className="relative w-full max-w-[760px] rounded-[44px] border border-white/10 bg-[#67655f] p-5 shadow-[0_40px_140px_rgba(0,0,0,0.34)] md:p-8">
            <div className="rounded-[32px] border border-white/10 bg-[var(--landing-surface-soft)] p-6 text-[var(--landing-dark)] md:p-8">
              <div className="flex flex-col gap-4 border-b border-[var(--landing-border-soft)] pb-6 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--landing-clay)]">
                    Proof record
                  </div>
                  <div className="mt-3 font-display text-[2rem] leading-none">
                    Onboarding redesign
                  </div>
                </div>
                <div className="rounded-full border border-[var(--landing-border)] bg-[var(--landing-surface)] px-4 py-2 text-xs uppercase tracking-[0.18em] text-[var(--landing-muted)]">
                  Review-safe export
                </div>
              </div>

              <div className="mt-7 grid gap-5">
                <div className="grid gap-5 lg:grid-cols-[1.12fr_0.88fr]">
                  <div className="rounded-[28px] bg-[#f8f4ee] p-6 shadow-[0_14px_32px_rgba(94,94,94,0.05)]">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--landing-clay)]">
                      Outcome
                    </div>
                    <div className="mt-4 max-w-[9ch] font-display text-[3rem] leading-[0.94] text-[var(--landing-dark)]">
                      Reduced onboarding time by 31%
                    </div>
                    <div className="mt-6 border-l-2 border-[var(--landing-clay)]/45 pl-4 text-sm leading-7 text-[var(--landing-text)]">
                      Before: fragmented handoffs across product, success, and ops.
                      <br />
                      After: one documented path with measured completion lift.
                    </div>
                  </div>

                  <div className="border-l border-[var(--landing-border)] pl-5">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--landing-muted)]">
                      Review rail
                    </div>
                    <div className="mt-4 space-y-4 text-sm leading-7 text-[var(--landing-text)]">
                      <div>Operations lead</div>
                      <div>Assignment operations</div>
                      <div>Team of 6</div>
                      <div>12-week delivery window</div>
                      <div className="pt-2 text-[var(--landing-action)]">
                        Peer-attested with review metadata attached
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-[28px] bg-[var(--landing-blush)] p-6">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--landing-clay)]">
                    Artifact excerpt
                  </div>
                  <div className="rounded-[22px] bg-[var(--landing-surface-soft)] p-5 shadow-[0_14px_30px_rgba(94,94,94,0.035)]">
                    <div className="h-2.5 w-[78%] rounded-full bg-[var(--landing-surface-strong)]" />
                    <div className="mt-3 h-2.5 w-[55%] rounded-full bg-[var(--landing-surface)]" />
                    <div className="mt-4 grid grid-cols-3 gap-2">
                      <div className="h-14 rounded-[12px] bg-[var(--landing-surface)]" />
                      <div className="h-14 rounded-[12px] bg-[var(--landing-surface)]" />
                      <div className="h-14 rounded-[12px] bg-[var(--landing-surface)]" />
                    </div>
                    <div className="mt-4 border-l-2 border-[var(--landing-clay)]/45 pl-4 text-sm leading-7 text-[var(--landing-text)]">
                      Implementation sequence and stakeholder sign-off attached here for inspection.
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-5 rounded-[24px] border border-[var(--landing-border)] bg-[var(--landing-surface)] px-5 py-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--landing-muted)]">
                      Verification
                    </div>
                    <div className="mt-2 text-base font-medium text-[var(--landing-dark)]">
                      Peer-attested with review metadata attached
                    </div>
                  </div>
                  <div className="rounded-full border border-[var(--landing-action)]/20 bg-[var(--landing-action)]/10 px-4 py-2 text-sm text-[var(--landing-action)]">
                    Trust strength: reviewed
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
