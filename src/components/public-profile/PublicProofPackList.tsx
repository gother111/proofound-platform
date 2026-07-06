'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, ExternalLink, CheckCircle2, CircleDot } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PublicEvidenceItem {
  title: string;
  description?: string | null;
  semanticsNote?: string | null;
  href?: string | null;
}

interface PublicProofPack {
  id: string;
  title: string;
  contextLabel?: string | null;
  verificationStatus: string;
  freshnessState: string;
  outcomesSummary?: string | null;
  verificationSummary?: string | null;
  summary?: string | null;
  ownershipStatement?: string | null;
  selectedEvidence: PublicEvidenceItem[];
}

interface PublicProofPackListProps {
  proofPacks: PublicProofPack[];
}

export function PublicProofPackList({ proofPacks }: PublicProofPackListProps) {
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <div className="space-y-4">
      {proofPacks.map((pack) => {
        const isExpanded = expandedIds[pack.id] || false;
        const detailsId = `proof-context-${pack.id}`;
        const hasExtraDetails =
          pack.verificationSummary ||
          (pack.summary && pack.summary !== pack.outcomesSummary) ||
          pack.selectedEvidence.length > 0;
        const trustSignals = getTrustSignals(pack);

        return (
          <article
            key={pack.id}
            className="group rounded-xl border border-white/40 bg-white/40 p-4 shadow-sm transition-all duration-300 hover:bg-white/60 hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-display text-lg font-semibold tracking-tight text-[#2D3330] sm:text-xl">
                  {pack.title}
                </h3>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {pack.contextLabel || 'Selected Proof Pack'}
                </p>
              </div>

              <div className="flex-shrink-0">
                {pack.verificationStatus === 'verified' ||
                pack.verificationStatus === 'partially_verified' ? (
                  <CheckCircle2 className="h-5 w-5 text-proofound-forest" />
                ) : (
                  <CircleDot className="h-5 w-5 text-muted-foreground/50" />
                )}
              </div>
            </div>

            {pack.outcomesSummary ? (
              <div className="mt-3 text-sm text-foreground leading-relaxed font-medium">
                {pack.outcomesSummary}
              </div>
            ) : pack.summary ? (
              <div className="mt-3 text-sm text-foreground leading-relaxed">{pack.summary}</div>
            ) : null}

            <div className="mt-4 space-y-3 border-t border-[#EFECE5]/60 pt-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div
                  className="flex min-w-0 flex-1 flex-wrap gap-1.5"
                  aria-label={`Proof trust signals for ${pack.title}`}
                >
                  {trustSignals.map((signal) => (
                    <span
                      key={`${pack.id}-${signal.label}`}
                      className={cn(
                        'inline-flex max-w-full items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold leading-5',
                        signal.tone === 'positive'
                          ? 'border-[#D7E8DE] bg-[#F3FAF6] text-proofound-forest'
                          : signal.tone === 'warning'
                            ? 'border-[#E8D9BE] bg-[#FFF8EA] text-[#7A5520]'
                            : 'border-[#E2DDD3] bg-[#F8F6F0] text-muted-foreground'
                      )}
                    >
                      <span className="truncate">{signal.label}</span>
                    </span>
                  ))}
                </div>

                {hasExtraDetails && (
                  <button
                    type="button"
                    onClick={() => toggleExpand(pack.id)}
                    aria-expanded={isExpanded}
                    aria-controls={detailsId}
                    aria-label={`${isExpanded ? 'Hide' : 'Show'} proof context for ${pack.title}`}
                    className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-md px-3 text-xs font-semibold text-proofound-forest transition-colors hover:bg-proofound-forest/5 hover:text-[#143829] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-proofound-forest focus-visible:ring-offset-2 sm:ml-0"
                  >
                    <span>{isExpanded ? 'Hide proof context' : 'Show proof context'}</span>
                    {isExpanded ? (
                      <ChevronUp className="h-3 w-3" />
                    ) : (
                      <ChevronDown className="h-3 w-3" />
                    )}
                  </button>
                )}
              </div>

              {pack.ownershipStatement ? (
                <p className="text-xs leading-5 text-muted-foreground">
                  <span className="font-semibold text-foreground/80">Role:</span>{' '}
                  {pack.ownershipStatement}
                </p>
              ) : null}
            </div>

            {hasExtraDetails && isExpanded && (
              <div
                id={detailsId}
                className="mt-3 space-y-4 border-t border-[#EFECE5]/80 pt-4 animate-accordion-down overflow-hidden"
              >
                {pack.summary && pack.summary !== pack.outcomesSummary && (
                  <div className="space-y-1">
                    <h4 className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                      Proof context
                    </h4>
                    <p className="text-sm text-foreground/90 leading-relaxed">{pack.summary}</p>
                  </div>
                )}

                {pack.verificationSummary && (
                  <div className="space-y-1">
                    <h4 className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                      Verification scope
                    </h4>
                    <p className="text-sm text-foreground/90 leading-relaxed">
                      {pack.verificationSummary}
                    </p>
                  </div>
                )}

                {pack.selectedEvidence.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                      Public-safe evidence
                    </h4>
                    <ul className="space-y-2">
                      {pack.selectedEvidence.map((item) => (
                        <li
                          key={item.title}
                          className="rounded-lg border border-white/50 bg-[#FBF9F6]/60 px-3 py-2 transition-all hover:bg-white/80"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-foreground truncate">
                                {item.title}
                              </p>
                              {item.description && (
                                <p className="mt-0.5 text-xs text-muted-foreground">
                                  {item.description}
                                </p>
                              )}
                              {item.semanticsNote && (
                                <p className="mt-0.5 text-[11px] text-muted-foreground italic">
                                  {item.semanticsNote}
                                </p>
                              )}
                            </div>
                            {item.href && (
                              <a
                                href={item.href}
                                target="_blank"
                                rel="noreferrer"
                                aria-label={`Open ${item.title}`}
                                className="inline-flex min-h-11 shrink-0 items-center gap-1 rounded-md px-2 text-xs font-semibold text-proofound-forest transition-colors hover:bg-proofound-forest/5 hover:text-[#143829] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-proofound-forest focus-visible:ring-offset-2"
                              >
                                Open evidence
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}

type TrustSignal = {
  label: string;
  tone: 'positive' | 'neutral' | 'warning';
};

function getTrustSignals(pack: PublicProofPack): TrustSignal[] {
  const signals: TrustSignal[] = [
    {
      label: getVerificationLabel(pack.verificationStatus),
      tone: getVerificationTone(pack.verificationStatus),
    },
  ];
  const freshness = getFreshnessLabel(pack.freshnessState);

  if (freshness) {
    signals.push(freshness);
  }

  return signals;
}

function getVerificationLabel(status: string) {
  switch (status) {
    case 'verified':
      return 'Verified evidence';
    case 'partially_verified':
      return 'Partially verified';
    case 'disputed':
      return 'Verification disputed';
    default:
      return 'Not independently verified';
  }
}

function getVerificationTone(status: string): TrustSignal['tone'] {
  switch (status) {
    case 'verified':
    case 'partially_verified':
      return 'positive';
    case 'disputed':
      return 'warning';
    default:
      return 'neutral';
  }
}

function getFreshnessLabel(state: string): TrustSignal | null {
  switch (state) {
    case 'current':
      return { label: 'Current', tone: 'positive' };
    case 'recent':
    case 'fresh':
      return { label: 'Fresh', tone: 'positive' };
    case 'review_soon':
      return { label: 'Review soon', tone: 'neutral' };
    case 'stale':
      return { label: 'Needs refresh', tone: 'warning' };
    case 'expired':
      return { label: 'Expired', tone: 'warning' };
    default:
      return null;
  }
}
