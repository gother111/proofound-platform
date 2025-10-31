'use client';

import { AlertCircle } from 'lucide-react';

interface CoverageHeatmapProps {
  data: Array<{
    count: number;
    avgLevel: number;
    l1: number;
    l2: number;
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
  if (avgLevel === 0) return 'bg-gray-100 dark:bg-gray-800';
  if (avgLevel < 2) return 'bg-red-200 dark:bg-red-900/40';
  if (avgLevel < 3) return 'bg-orange-200 dark:bg-orange-900/40';
  if (avgLevel < 4) return 'bg-yellow-200 dark:bg-yellow-900/40';
  if (avgLevel < 4.5) return 'bg-green-200 dark:bg-green-900/40';
  return 'bg-emerald-300 dark:bg-emerald-900/50';
}

// Helper to get text color
function getTextColor(avgLevel: number): string {
  if (avgLevel === 0) return 'text-gray-400';
  if (avgLevel < 3) return 'text-gray-700 dark:text-gray-300';
  return 'text-gray-900 dark:text-gray-100';
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
  const groupedData: Record<number, Array<{ l2: number; count: number; avgLevel: number }>> = {};
  
  data.forEach(item => {
    if (!groupedData[item.l1]) {
      groupedData[item.l1] = [];
    }
    groupedData[item.l1].push({
      l2: item.l2,
      count: item.count,
      avgLevel: item.avgLevel,
    });
  });

  // Get all unique L2 IDs across all L1s
  const allL2Ids = Array.from(new Set(data.map(d => d.l2))).sort((a, b) => a - b);
  const maxL2Count = allL2Ids.length;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Coverage Heatmap</h3>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-muted-foreground">Level:</span>
          <div className="flex gap-1">
            <div className="w-4 h-4 bg-red-200 dark:bg-red-900/40 rounded" title="1-2"></div>
            <div className="w-4 h-4 bg-yellow-200 dark:bg-yellow-900/40 rounded" title="2-4"></div>
            <div className="w-4 h-4 bg-emerald-300 dark:bg-emerald-900/50 rounded" title="4-5"></div>
          </div>
        </div>
      </div>

      <div className="space-y-4 overflow-x-auto">
        {Object.entries(L1_NAMES).map(([l1Id, l1Name]) => {
          const l1Data = groupedData[Number(l1Id)] || [];
          
          return (
            <div key={l1Id} className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">
                {l1Name}
              </h4>
              
              <div className="flex flex-wrap gap-2">
                {l1Data.length === 0 ? (
                  <div className="text-xs text-muted-foreground italic">
                    No skills yet
                  </div>
                ) : (
                  l1Data.map(item => (
                    <button
                      key={`${l1Id}-${item.l2}`}
                      onClick={() => onCellClick(Number(l1Id), item.l2)}
                      className={`
                        flex flex-col items-center justify-center
                        min-w-[60px] h-16 p-2 rounded-lg border
                        hover:ring-2 hover:ring-primary/50 transition-all
                        ${getLevelColor(item.avgLevel)}
                        ${getTextColor(item.avgLevel)}
                      `}
                      title={`L2-${item.l2}: ${item.count} skills, avg level ${item.avgLevel.toFixed(1)}`}
                    >
                      <span className="text-xs font-mono">L2-{item.l2}</span>
                      <span className="text-lg font-bold">{item.count}</span>
                      <span className="text-xs opacity-75">
                        {item.avgLevel.toFixed(1)}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 p-3 rounded-lg bg-muted/50 text-xs text-muted-foreground">
        <p>
          <strong>How to read:</strong> Each cell shows skills in a specific L1 domain and L2 category.
          The number indicates skill count, and the color represents average competency level (1-5).
        </p>
      </div>
    </div>
  );
}


