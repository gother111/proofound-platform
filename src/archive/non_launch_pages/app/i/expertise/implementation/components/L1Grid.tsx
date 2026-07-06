'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { sendDebugIngest } from '@/lib/debug-ingest';

interface L1Domain {
  catId: number;
  icon: string;
  slug: string;
  nameI18n: { en: string };
  descriptionI18n?: { en: string };
  skillCount: number;
  avgLevel: number;
  recencyMix: {
    active: number;
    recent: number;
    rusty: number;
  };
}

interface L2Category {
  catId: number;
  subcatId: number;
  slug: string;
  nameI18n: { en: string };
  l4Count: number;
}

interface L1GridProps {
  domains: L1Domain[];
  onDomainClick: (catId: number) => void;
  l2CategoriesPerL1: Record<number, L2Category[]>;
  onL2Click: (l2: L2Category) => void;
}

const DOMAIN_COLORS: Record<number, { bg: string; border: string; text: string }> = {
  1: { bg: 'bg-proofound-forest/5', border: 'border-[#7A9278]', text: 'text-proofound-forest' }, // U - Universal
  2: { bg: 'bg-[#FFF4E6]', border: 'border-[#D4A574]', text: 'text-[#8B6F47]' }, // F - Functional
  3: { bg: 'bg-[#E8F3F8]', border: 'border-[#6B9AB8]', text: 'text-[#3E5C73]' }, // T - Tools
  4: { bg: 'bg-[#F5EEF8]', border: 'border-[#9B7BA8]', text: 'text-[#6B4C7A]' }, // L - Languages
  5: { bg: 'bg-[#FFF0F0]', border: 'border-[#C76B4A]', text: 'text-[#8B4A36]' }, // M - Methods
  6: { bg: 'bg-[#F0F8F0]', border: 'border-[#6B9B6B]', text: 'text-[#3E5C3E]' }, // D - Domain
};

export function L1Grid({ domains, onDomainClick, l2CategoriesPerL1, onL2Click }: L1GridProps) {
  const [expandedDomain, setExpandedDomain] = useState<number | null>(null);

  const handleDomainClick = (catId: number) => {
    if (expandedDomain === catId) {
      setExpandedDomain(null);
      sendDebugIngest({
        sessionId: 'debug-session',
        runId: 'launch-readiness',
        hypothesisId: 'H2',
        location: 'L1Grid.tsx:toggle',
        message: 'Collapse domain',
        data: { catId },
      });
    } else {
      setExpandedDomain(catId);
      onDomainClick(catId);
      sendDebugIngest({
        sessionId: 'debug-session',
        runId: 'launch-readiness',
        hypothesisId: 'H2',
        location: 'L1Grid.tsx:toggle',
        message: 'Expand domain',
        data: { catId },
      });
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Tip: tap a domain to see a plain-English description, common synonyms, and its categories.
        If the wording feels unfamiliar, pick the closest match—examples will appear as you drill
        down.
      </p>
      <div className="flex overflow-x-auto snap-x snap-mandatory pb-4 md:grid md:grid-cols-2 lg:grid-cols-3 gap-6 hide-scrollbar">
        {domains.map((domain) => {
          const colors = DOMAIN_COLORS[domain.catId] || DOMAIN_COLORS[1];
          const isExpanded = expandedDomain === domain.catId;
          const l2Categories = l2CategoriesPerL1[domain.catId] || [];

          return (
            <Card
              variant="bento"
              key={domain.catId}
              className={`snap-center min-w-[85vw] md:min-w-0 md:w-auto border ${colors.border} p-6 cursor-pointer rounded-xl ${
                isExpanded ? 'ring-2 ring-offset-2 ring-proofound-forest shadow-lg' : ''
              }`}
              onClick={() => handleDomainClick(domain.catId)}
            >
              {/* Domain Icon & Name */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div
                    className={`${colors.bg} ${colors.text} rounded-xl p-3 text-2xl font-bold shadow-inner`}
                  >
                    {domain.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-proofound-charcoal text-lg font-display">
                      {domain.nameI18n?.en || 'Unknown'}
                    </h3>
                    <p className="text-sm text-muted-foreground font-sans">
                      {domain.skillCount} skills • tap for examples & synonyms
                    </p>
                  </div>
                </div>
                {isExpanded ? (
                  <ChevronUp className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                )}
              </div>

              {/* Stats Row */}
              <div className="space-y-4">
                {/* Average Level */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground font-medium">Avg level</span>
                  <Badge
                    variant="outline"
                    className={`${colors.border} ${colors.text} bg-white font-semibold`}
                  >
                    {domain.avgLevel.toFixed(1)} / 5.0
                  </Badge>
                </div>

                {/* Recency Mix */}
                <div>
                  <span className="text-xs text-muted-foreground mb-2 block font-medium uppercase tracking-wider">
                    Recency
                  </span>
                  <div className="flex gap-1 h-2.5 rounded-full overflow-hidden bg-gray-100">
                    {domain.recencyMix.active > 0 && (
                      <div
                        className="bg-proofound-sage"
                        style={{ width: `${domain.recencyMix.active}%` }}
                        title={`Active: ${domain.recencyMix.active}%`}
                      />
                    )}
                    {domain.recencyMix.recent > 0 && (
                      <div
                        className="bg-proofound-ochre"
                        style={{ width: `${domain.recencyMix.recent}%` }}
                        title={`Recent: ${domain.recencyMix.recent}%`}
                      />
                    )}
                    {domain.recencyMix.rusty > 0 && (
                      <div
                        className="bg-proofound-terracotta"
                        style={{ width: `${domain.recencyMix.rusty}%` }}
                        title={`Rusty: ${domain.recencyMix.rusty}%`}
                      />
                    )}
                  </div>
                  <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-proofound-sage" />
                      Active
                    </span>
                    <span className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-proofound-ochre" />
                      Recent
                    </span>
                    <span className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-proofound-terracotta" />
                      Rusty
                    </span>
                  </div>
                </div>
              </div>

              {/* Expanded L2 Categories */}
              {isExpanded && (
                <div className="mt-6 pt-4 border-t border-proofound-stone">
                  {l2Categories.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic text-center py-2">
                      No categories with skills in this domain.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {l2Categories.map((l2) => {
                        return (
                          <button
                            key={l2.subcatId}
                            onClick={(e) => {
                              e.stopPropagation();
                              onL2Click(l2);
                            }}
                            className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-proofound-parchment transition-colors rounded-lg border border-transparent hover:border-proofound-stone group"
                          >
                            <div className="flex-1">
                              <p className="font-medium text-proofound-charcoal text-sm group-hover:text-proofound-forest transition-colors">
                                {l2.nameI18n?.en || 'Unknown'}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge
                                variant="secondary"
                                className="text-xs bg-gray-100 text-gray-600 group-hover:bg-white group-hover:text-proofound-forest transition-colors"
                              >
                                {l2.l4Count}
                              </Badge>
                              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-proofound-forest transition-colors" />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
