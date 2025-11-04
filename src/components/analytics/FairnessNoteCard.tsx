/**
 * Fairness Note Card Component
 *
 * Displays fairness metrics for an assignment
 * Shows demographic parity and warns of significant gaps
 */

'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, CheckCircle2, Info, Scale } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface FairnessMetric {
  cohort: string;
  applicationRate: number; // % of total applications
  selectionRate: number; // % selected from this cohort
  representationGap: number; // Difference from expected representation
  sampleSize: number;
}

interface FairnessNoteCardProps {
  assignmentId: string;
  metrics: FairnessMetric[];
  totalApplicants: number;
  totalSelected: number;
  generatedAt: string;
}

export function FairnessNoteCard({
  assignmentId,
  metrics,
  totalApplicants,
  totalSelected,
  generatedAt,
}: FairnessNoteCardProps) {
  // Identify cohorts with significant gaps (> 10% difference)
  const significantGaps = metrics.filter(
    (m) => Math.abs(m.representationGap) > 10
  );

  const hasWarnings = significantGaps.some((m) => m.representationGap < -10);
  const hasPositiveGaps = significantGaps.some((m) => m.representationGap > 10);

  return (
    <Card className="border-[#E8E6DD]">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className="p-2 rounded-lg"
              style={{
                backgroundColor: hasWarnings ? '#FEF2F2' : '#F0FDF4',
              }}
            >
              <Scale
                className="h-5 w-5"
                style={{
                  color: hasWarnings ? '#DC2626' : '#16A34A',
                }}
              />
            </div>
            <div>
              <CardTitle className="text-lg">Fairness Note</CardTitle>
              <p className="text-xs text-[#6B6760] mt-1">
                Generated {new Date(generatedAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="text-[#6B6760] hover:text-[#2D3330]">
                  <Info className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-sm">
                <p className="text-xs">
                  Fairness metrics analyze demographic representation in your
                  hiring pipeline. Significant gaps (>10%) are flagged for review.
                  Based on anonymized opt-in data only.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Summary */}
        <div className="p-3 bg-[#F7F6F1] rounded-lg">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-[#6B6760] mb-1">Total Applicants</p>
              <p className="font-semibold text-[#2D3330]">{totalApplicants}</p>
            </div>
            <div>
              <p className="text-xs text-[#6B6760] mb-1">Selected</p>
              <p className="font-semibold text-[#2D3330]">{totalSelected}</p>
            </div>
          </div>
        </div>

        {/* Warnings */}
        {hasWarnings && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-red-900 dark:text-red-100 mb-1">
                  Representation Gaps Detected
                </p>
                <p className="text-xs text-red-800 dark:text-red-200">
                  {significantGaps.filter((m) => m.representationGap < -10).length} cohort(s)
                  are underrepresented compared to their application rate. Review your selection
                  criteria for potential bias.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Metrics Table */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-[#2D3330]">
            Cohort Representation
          </h4>

          {metrics.map((metric) => {
            const isUnderrepresented = metric.representationGap < -10;
            const isOverrepresented = metric.representationGap > 10;
            const isBalanced = Math.abs(metric.representationGap) <= 10;

            return (
              <div
                key={metric.cohort}
                className="p-3 rounded-lg border border-[#E8E6DD] space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-[#2D3330]">
                      {metric.cohort}
                    </span>
                    {isBalanced && (
                      <Badge
                        variant="secondary"
                        className="text-xs bg-green-100 text-green-800 border-green-200"
                      >
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Balanced
                      </Badge>
                    )}
                    {isUnderrepresented && (
                      <Badge
                        variant="secondary"
                        className="text-xs bg-red-100 text-red-800 border-red-200"
                      >
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        Gap
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs text-[#6B6760]">
                    n={metric.sampleSize}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <p className="text-[#6B6760] mb-1">Application Rate</p>
                    <p className="font-medium text-[#2D3330]">
                      {metric.applicationRate.toFixed(1)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-[#6B6760] mb-1">Selection Rate</p>
                    <p className="font-medium text-[#2D3330]">
                      {metric.selectionRate.toFixed(1)}%
                    </p>
                  </div>
                </div>

                {/* Gap Indicator */}
                {Math.abs(metric.representationGap) > 1 && (
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-[#6B6760]">Representation Gap</span>
                      <span
                        className="font-medium"
                        style={{
                          color: isUnderrepresented
                            ? '#DC2626'
                            : isOverrepresented
                              ? '#F59E0B'
                              : '#16A34A',
                        }}
                      >
                        {metric.representationGap > 0 ? '+' : ''}
                        {metric.representationGap.toFixed(1)}%
                      </span>
                    </div>
                    <Progress
                      value={50 + metric.representationGap}
                      className="h-1.5"
                      style={{
                        backgroundColor: '#E8E6DD',
                      }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer Note */}
        <div className="text-xs text-[#6B6760] pt-3 border-t border-[#E8E6DD]">
          <p>
            <strong>Note:</strong> Metrics based on anonymized opt-in demographic
            data. Small sample sizes (n&lt;30) may show statistical noise. Use as
            one input among many in your decision-making process.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

