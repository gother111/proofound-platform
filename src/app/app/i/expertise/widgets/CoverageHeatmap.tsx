'use client';

import { AlertCircle } from 'lucide-react';

interface CoverageHeatmapProps {
  data: Array<{
    count: number;
    avgLevel: number;
    l1: number;
    l2: number;
    l2Name?: string;
  }>;
  onCellClick: (l1: number, l2: number) => void;
}

const L1_NAMES: Record<number, string> = {
  1: 'Universal Capabilities',
  2: 'Functional Competencies',
  3: 'Tools & Technologies',
  4: 'Languages & Culture',
  5: 'Methods & Practices',
  6: 'Domain Knowledge',
};

// Helper to generate color based on level (1-5)
function getLevelColor(avgLevel: number): string {
  if (avgLevel === 0) return 'bg-proofound-parchment border-dashed border-proofound-stone';
  if (avgLevel < 2) return 'bg-proofound-stone text-proofound-charcoal';
  if (avgLevel < 3) return 'bg-[#E0D5C7] text-proofound-charcoal'; // Sand
  if (avgLevel < 4) return 'bg-proofound-ochre/60 text-proofound-charcoal';
  if (avgLevel < 4.5) return 'bg-proofound-sage text-white';
  return 'bg-proofound-forest text-white';
}

export function CoverageHeatmap({ data, onCellClick }: CoverageHeatmapProps) {
  // Empty state
  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[300px] text-center p-6">
        <AlertCircle className="w-12 h-12 text-muted-foreground mb-3" />
        <p className="text-sm text-muted-foreground">No skills to display</p>
        <p className="text-xs text-muted-foreground mt-1">Add your first skill to see coverage</p>
      </div>
    );
  }

  // Group data by L1
  const groupedData: Record<
    number,
    Array<{ l2: number; count: number; avgLevel: number; l2Name?: string }>
  > = {};

  data.forEach((item) => {
    if (!groupedData[item.l1]) {
      groupedData[item.l1] = [];
    }
    groupedData[item.l1].push({
      l2: item.l2,
      count: item.count,
      avgLevel: item.avgLevel,
      l2Name: item.l2Name,
    });
  });

  const visibleL1Entries = Object.entries(L1_NAMES).filter(([l1Id]) => {
    const l1Data = groupedData[Number(l1Id)] || [];
    return l1Data.length > 0;
  });

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold font-display text-proofound-charcoal">
          Coverage Heatmap
        </h3>
        <div className="flex items-center gap-2 text-xs font-sans">
          <span className="text-muted-foreground">Level:</span>
          <div className="flex gap-1">
            <div className="w-4 h-4 bg-proofound-stone rounded-sm" title="1-2"></div>
            <div className="w-4 h-4 bg-proofound-ochre/60 rounded-sm" title="2-4"></div>
            <div className="w-4 h-4 bg-proofound-forest rounded-sm" title="4-5"></div>
          </div>
        </div>
      </div>

      <div className="space-y-6 overflow-x-auto pb-2">
        {visibleL1Entries.map(([l1Id, l1Name]) => {
          const l1Data = groupedData[Number(l1Id)] || [];

          return (
            <div key={l1Id} className="space-y-3">
              <h4 className="text-sm font-semibold text-proofound-charcoal font-display border-b border-proofound-stone pb-1">
                {l1Name}
              </h4>

              <div className="flex flex-wrap gap-3">
                {l1Data.map((item) => (
                  <button
                    key={`${l1Id}-${item.l2}`}
                    onClick={() => onCellClick(Number(l1Id), item.l2)}
                    className={`
                      flex flex-col items-center justify-center
                      min-w-[100px] h-24 p-3 rounded-xl border border-transparent
                      hover:scale-105 transition-all duration-200 shadow-sm
                      ${getLevelColor(item.avgLevel)}
                    `}
                    title={`${item.l2Name || `Category ${item.l2}`}: ${item.count} skills, avg level ${item.avgLevel.toFixed(1)}`}
                  >
                    <span className="text-xs text-center line-clamp-2 mb-1 font-medium leading-tight">
                      {item.l2Name || `Category ${item.l2}`}
                    </span>
                    <span className="text-xl font-bold font-display">{item.count}</span>
                    <span className="text-[10px] opacity-80 uppercase tracking-wider mt-1">
                      Lvl {item.avgLevel.toFixed(1)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 p-4 rounded-xl bg-proofound-parchment text-xs text-muted-foreground border border-proofound-stone">
        <p>
          <strong>How to read:</strong> Each cell shows skills in a specific domain and category.
          The number indicates skill count, and the color represents average competency level (1-5).
        </p>
      </div>
    </div>
  );
}
