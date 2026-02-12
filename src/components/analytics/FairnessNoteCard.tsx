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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

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
  assignmentId: _assignmentId,
  metrics,
  totalApplicants,
  totalSelected,
  generatedAt,
}: FairnessNoteCardProps) {
  // Identify cohorts with significant gaps (> 10% difference)
  const significantGaps = metrics.filter((m) => Math.abs(m.representationGap) > 10);

  const hasWarnings = significantGaps.some((m) => m.representationGap < -10);

  return (
    <Card className="border-proofound-stone/90">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'rounded-lg p-2',
                hasWarnings ? 'bg-destructive/10 text-destructive' : 'bg-success/15 text-success'
              )}
            >
              <Scale className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg">Fairness Note</CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">
                Generated {new Date(generatedAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="text-muted-foreground transition-colors hover:text-foreground">
                  <Info className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-sm">
                <p className="text-xs">
                  Fairness metrics analyze demographic representation in your hiring pipeline.
                  Significant gaps (&gt;10%) are flagged for review. Based on anonymized opt-in data
                  only.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Summary */}
        <div className="rounded-lg bg-muted/40 p-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="mb-1 text-xs text-muted-foreground">Total Applicants</p>
              <p className="font-semibold text-foreground">{totalApplicants}</p>
            </div>
            <div>
              <p className="mb-1 text-xs text-muted-foreground">Selected</p>
              <p className="font-semibold text-foreground">{totalSelected}</p>
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
                  {significantGaps.filter((m) => m.representationGap < -10).length} cohort(s) are
                  underrepresented compared to their application rate. Review your selection
                  criteria for potential bias.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Metrics Table */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-foreground">Cohort Representation</h4>

          {metrics.map((metric) => {
            const isUnderrepresented = metric.representationGap < -10;
            const isOverrepresented = metric.representationGap > 10;
            const isBalanced = Math.abs(metric.representationGap) <= 10;

            return (
              <div
                key={metric.cohort}
                className="space-y-2 rounded-lg border border-proofound-stone/90 p-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">{metric.cohort}</span>
                    {isBalanced && (
                      <Badge
                        variant="secondary"
                        className="border-success/20 bg-success/15 text-xs text-success"
                      >
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Balanced
                      </Badge>
                    )}
                    {isUnderrepresented && (
                      <Badge
                        variant="secondary"
                        className="border-destructive/20 bg-destructive/10 text-xs text-destructive"
                      >
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        Gap
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">n={metric.sampleSize}</span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <p className="mb-1 text-muted-foreground">Application Rate</p>
                    <p className="font-medium text-foreground">
                      {metric.applicationRate.toFixed(1)}%
                    </p>
                  </div>
                  <div>
                    <p className="mb-1 text-muted-foreground">Selection Rate</p>
                    <p className="font-medium text-foreground">
                      {metric.selectionRate.toFixed(1)}%
                    </p>
                  </div>
                </div>

                {/* Gap Indicator */}
                {Math.abs(metric.representationGap) > 1 && (
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Representation Gap</span>
                      <span
                        className={cn(
                          'font-medium',
                          isUnderrepresented
                            ? 'text-destructive'
                            : isOverrepresented
                              ? 'text-warning'
                              : 'text-success'
                        )}
                      >
                        {metric.representationGap > 0 ? '+' : ''}
                        {metric.representationGap.toFixed(1)}%
                      </span>
                    </div>
                    <Progress
                      value={50 + metric.representationGap}
                      className="h-1.5"
                      indicatorClassName={cn(
                        isUnderrepresented
                          ? 'bg-destructive'
                          : isOverrepresented
                            ? 'bg-warning'
                            : 'bg-success'
                      )}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer Note */}
        <div className="border-t border-proofound-stone/90 pt-3 text-xs text-muted-foreground">
          <p>
            <strong>Note:</strong> Metrics based on anonymized opt-in demographic data. Small sample
            sizes (n{'<'}30) may show statistical noise. Use as one input among many in your
            decision-making process.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
