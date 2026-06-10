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

  const getTrustLine = (pack: PublicProofPack) => {
    const parts: string[] = [];

    if (pack.verificationStatus === 'verified') {
      parts.push('Verified evidence');
    } else if (pack.verificationStatus === 'partially_verified') {
      parts.push('Partially verified');
    } else if (pack.verificationStatus === 'disputed') {
      parts.push('Verification disputed');
    } else {
      parts.push('Self-claimed');
    }

    if (pack.freshnessState === 'fresh') {
      parts.push('Fresh');
    } else if (pack.freshnessState === 'review_soon') {
      parts.push('Review soon');
    } else if (pack.freshnessState === 'stale') {
      parts.push('Needs refresh');
    } else if (pack.freshnessState === 'expired') {
      parts.push('Expired');
    }

    if (pack.ownershipStatement) {
      parts.push(pack.ownershipStatement);
    }

    return parts.join(' / ');
  };

  return (
    <div className="space-y-4">
      {proofPacks.map((pack) => {
        const isExpanded = expandedIds[pack.id] || false;
        const hasExtraDetails =
          pack.verificationSummary ||
          (pack.summary && pack.summary !== pack.outcomesSummary) ||
          pack.selectedEvidence.length > 0;

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

            {hasExtraDetails && isExpanded && (
              <div className="mt-4 space-y-4 border-t border-[#EFECE5]/80 pt-4 animate-accordion-down overflow-hidden">
                {pack.summary && pack.summary !== pack.outcomesSummary && (
                  <div className="space-y-1">
                    <h4 className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                      Detailed Summary
                    </h4>
                    <p className="text-sm text-foreground/90 leading-relaxed">{pack.summary}</p>
                  </div>
                )}

                {pack.verificationSummary && (
                  <div className="space-y-1">
                    <h4 className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                      Trust Details
                    </h4>
                    <p className="text-sm text-foreground/90 leading-relaxed">
                      {pack.verificationSummary}
                    </p>
                  </div>
                )}

                {pack.selectedEvidence.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                      Supporting Evidence
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
                                className="inline-flex items-center gap-1 text-xs font-semibold text-proofound-forest hover:text-[#143829]"
                              >
                                Open
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

            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-[#EFECE5]/60 pt-3">
              <span className="text-xs font-medium text-muted-foreground/80 tracking-wide">
                {getTrustLine(pack)}
              </span>

              {hasExtraDetails && (
                <button
                  type="button"
                  onClick={() => toggleExpand(pack.id)}
                  aria-expanded={isExpanded}
                  className="-mr-2 inline-flex min-h-8 items-center gap-1.5 rounded-md px-2 text-xs font-semibold text-proofound-forest transition-colors hover:bg-proofound-forest/5 hover:text-[#143829] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-proofound-forest focus-visible:ring-offset-2"
                >
                  <span>{isExpanded ? 'Hide details' : 'Show details'}</span>
                  {isExpanded ? (
                    <ChevronUp className="h-3 w-3" />
                  ) : (
                    <ChevronDown className="h-3 w-3" />
                  )}
                </button>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}
