'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

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

interface L1GridProps {
  domains: L1Domain[];
  onDomainClick: (catId: number) => void;
}

const DOMAIN_COLORS: Record<number, { bg: string; border: string; text: string }> = {
  1: { bg: 'bg-[#EEF1EA]', border: 'border-[#7A9278]', text: 'text-[#4A5943]' }, // U - Universal
  2: { bg: 'bg-[#FFF4E6]', border: 'border-[#D4A574]', text: 'text-[#8B6F47]' }, // F - Functional
  3: { bg: 'bg-[#E8F3F8]', border: 'border-[#6B9AB8]', text: 'text-[#3E5C73]' }, // T - Tools
  4: { bg: 'bg-[#F5EEF8]', border: 'border-[#9B7BA8]', text: 'text-[#6B4C7A]' }, // L - Languages
  5: { bg: 'bg-[#FFF0F0]', border: 'border-[#C76B4A]', text: 'text-[#8B4A36]' }, // M - Methods
  6: { bg: 'bg-[#F0F8F0]', border: 'border-[#6B9B6B]', text: 'text-[#3E5C3E]' }, // D - Domain
};

export function L1Grid({ domains, onDomainClick }: L1GridProps) {
  const [expandedDomain, setExpandedDomain] = useState<number | null>(null);

  const handleDomainClick = (catId: number) => {
    if (expandedDomain === catId) {
      setExpandedDomain(null);
    } else {
      setExpandedDomain(catId);
      onDomainClick(catId);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {domains.map((domain) => {
        const colors = DOMAIN_COLORS[domain.catId] || DOMAIN_COLORS[1];
        const isExpanded = expandedDomain === domain.catId;

        return (
          <Card
            key={domain.catId}
            className={`border ${colors.border} bg-white/90 p-6 cursor-pointer transition-all hover:shadow-md ${
              isExpanded ? 'ring-2 ring-offset-2 ring-[#4A5943]' : ''
            }`}
            onClick={() => handleDomainClick(domain.catId)}
          >
            {/* Domain Icon & Name */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`${colors.bg} ${colors.text} rounded-lg p-3 text-2xl font-bold`}>
                  {domain.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-[#2D3330]">{domain.nameI18n.en}</h3>
                  <p className="text-xs text-[#6B6760]">{domain.skillCount} skills</p>
                </div>
              </div>
              {isExpanded ? (
                <ChevronUp className="h-5 w-5 text-[#6B6760]" />
              ) : (
                <ChevronDown className="h-5 w-5 text-[#6B6760]" />
              )}
            </div>

            {/* Stats Row */}
            <div className="space-y-3">
              {/* Average Level */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#6B6760]">Avg level</span>
                <Badge variant="outline" className={`${colors.border} ${colors.text}`}>
                  {domain.avgLevel.toFixed(1)} / 5.0
                </Badge>
              </div>

              {/* Recency Mix */}
              <div>
                <span className="text-xs text-[#6B6760] mb-2 block">Recency</span>
                <div className="flex gap-1 h-2 rounded-full overflow-hidden">
                  {domain.recencyMix.active > 0 && (
                    <div
                      className="bg-[#7A9278]"
                      style={{ width: `${domain.recencyMix.active}%` }}
                      title={`Active: ${domain.recencyMix.active}%`}
                    />
                  )}
                  {domain.recencyMix.recent > 0 && (
                    <div
                      className="bg-[#D4A574]"
                      style={{ width: `${domain.recencyMix.recent}%` }}
                      title={`Recent: ${domain.recencyMix.recent}%`}
                    />
                  )}
                  {domain.recencyMix.rusty > 0 && (
                    <div
                      className="bg-[#C76B4A]"
                      style={{ width: `${domain.recencyMix.rusty}%` }}
                      title={`Rusty: ${domain.recencyMix.rusty}%`}
                    />
                  )}
                </div>
                <div className="flex gap-3 mt-2 text-xs">
                  <span className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-[#7A9278]" />
                    Active ({domain.recencyMix.active}%)
                  </span>
                  <span className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-[#D4A574]" />
                    Recent ({domain.recencyMix.recent}%)
                  </span>
                  <span className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-[#C76B4A]" />
                    Rusty ({domain.recencyMix.rusty}%)
                  </span>
                </div>
              </div>
            </div>

            {/* Expanded state hint */}
            {isExpanded && (
              <div className="mt-4 pt-4 border-t border-[#D8D2C8]">
                <p className="text-xs text-[#4A5943] italic">
                  Loading L2 categories...
                </p>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}

