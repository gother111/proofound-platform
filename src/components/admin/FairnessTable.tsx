'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { DownloadIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FairnessComparison {
  cohortA: {
    name: string;
    introductionRate: number;
    contractRate: number;
    sampleSize: number;
  };
  cohortB: {
    name: string;
    introductionRate: number;
    contractRate: number;
    sampleSize: number;
  };
  introductionGap: number;
  contractGap: number;
  pValueIntroduction: number;
  pValueContract: number;
  isSignificant: boolean;
}

export interface FairnessTableProps {
  comparisons: FairnessComparison[];
  loading?: boolean;
  onExport?: () => void;
  className?: string;
}

export function FairnessTable({ comparisons, loading, onExport, className }: FairnessTableProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-muted-foreground">Loading fairness data...</p>
      </div>
    );
  }

  if (comparisons.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-muted-foreground">
          No fairness comparisons available. Need demographic opt-in data to calculate gaps.
        </p>
      </div>
    );
  }

  const formatRate = (rate: number) => `${rate.toFixed(1)}%`;
  const formatGap = (gap: number) => {
    const sign = gap > 0 ? '+' : '';
    return `${sign}${gap.toFixed(1)}pp`;
  };
  const formatPValue = (p: number) => p.toFixed(3);

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Fairness Gap Analysis</h3>
        {onExport && (
          <Button variant="outline" size="sm" onClick={onExport}>
            <DownloadIcon className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        )}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Comparison</TableHead>
              <TableHead className="text-right">Intro Rate A</TableHead>
              <TableHead className="text-right">Intro Rate B</TableHead>
              <TableHead className="text-right">Intro Gap</TableHead>
              <TableHead className="text-right">p-value</TableHead>
              <TableHead className="text-right">Contract Rate A</TableHead>
              <TableHead className="text-right">Contract Rate B</TableHead>
              <TableHead className="text-right">Contract Gap</TableHead>
              <TableHead className="text-right">p-value</TableHead>
              <TableHead className="text-center">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {comparisons.map((comparison, index) => {
              const isIntroSignificant = comparison.pValueIntroduction < 0.05;
              const isContractSignificant = comparison.pValueContract < 0.05;
              const hasNegativeGap = comparison.introductionGap < -5 || comparison.contractGap < -5;
              const isConcerning = comparison.isSignificant && hasNegativeGap;

              return (
                <TableRow key={index} className={cn(isConcerning && 'bg-red-50')}>
                  <TableCell className="font-medium">
                    {comparison.cohortA.name} vs {comparison.cohortB.name}
                    <div className="text-xs text-muted-foreground">
                      n={comparison.cohortA.sampleSize} / n={comparison.cohortB.sampleSize}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">{formatRate(comparison.cohortA.introductionRate)}</TableCell>
                  <TableCell className="text-right">{formatRate(comparison.cohortB.introductionRate)}</TableCell>
                  <TableCell
                    className={cn(
                      'text-right font-medium',
                      comparison.introductionGap > 0 && 'text-green-600',
                      comparison.introductionGap < 0 && 'text-red-600'
                    )}
                  >
                    {formatGap(comparison.introductionGap)}
                  </TableCell>
                  <TableCell
                    className={cn(
                      'text-right text-xs',
                      isIntroSignificant && 'font-bold text-amber-600'
                    )}
                  >
                    {formatPValue(comparison.pValueIntroduction)}
                    {isIntroSignificant && ' *'}
                  </TableCell>
                  <TableCell className="text-right">{formatRate(comparison.cohortA.contractRate)}</TableCell>
                  <TableCell className="text-right">{formatRate(comparison.cohortB.contractRate)}</TableCell>
                  <TableCell
                    className={cn(
                      'text-right font-medium',
                      comparison.contractGap > 0 && 'text-green-600',
                      comparison.contractGap < 0 && 'text-red-600'
                    )}
                  >
                    {formatGap(comparison.contractGap)}
                  </TableCell>
                  <TableCell
                    className={cn(
                      'text-right text-xs',
                      isContractSignificant && 'font-bold text-amber-600'
                    )}
                  >
                    {formatPValue(comparison.pValueContract)}
                    {isContractSignificant && ' *'}
                  </TableCell>
                  <TableCell className="text-center">
                    {isConcerning ? (
                      <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-700">
                        ⚠️ Concern
                      </span>
                    ) : comparison.isSignificant ? (
                      <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700">
                        Significant
                      </span>
                    ) : (
                      <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                        ✓ OK
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <div className="text-xs text-muted-foreground space-y-1">
        <p>* p-value &lt; 0.05 indicates statistical significance</p>
        <p>Gap = (Cohort A rate - Cohort B rate) in percentage points (pp)</p>
        <p>
          ⚠️ Concern = Statistically significant negative gap (&lt;-5pp) for underrepresented cohort
        </p>
      </div>
    </div>
  );
}

