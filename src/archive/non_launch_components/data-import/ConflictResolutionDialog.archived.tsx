/**
 * Conflict Resolution Dialog
 *
 * UI for resolving data import conflicts
 * Allows users to choose merge strategy for each conflict
 */

'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { AlertTriangle, CheckCircle2, FileJson, ArrowRight } from 'lucide-react';
import { internalValueLabel } from '@/lib/copy/labels';

interface DataConflict {
  field: string;
  path: string;
  existingValue: any;
  importValue: any;
  conflictType: string;
  suggestedStrategy: string;
  description: string;
}

interface ConflictResolutionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  conflicts: DataConflict[];
  analysis: {
    totalConflicts: number;
    autoResolvable: number;
    requiresManual: number;
  };
  onResolve: (resolutions: Map<string, string>) => void;
}

export function ConflictResolutionDialog({
  isOpen,
  onClose,
  conflicts,
  analysis,
  onResolve,
}: ConflictResolutionDialogProps) {
  const [resolutions, setResolutions] = useState<Map<string, string>>(
    new Map(conflicts.map((c) => [c.path, c.suggestedStrategy]))
  );

  const [isResolving, setIsResolving] = useState(false);

  const handleStrategyChange = (path: string, strategy: string) => {
    const newResolutions = new Map(resolutions);
    newResolutions.set(path, strategy);
    setResolutions(newResolutions);
  };

  const handleResolve = async () => {
    setIsResolving(true);
    try {
      await onResolve(resolutions);
      onClose();
    } finally {
      setIsResolving(false);
    }
  };

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return '(empty)';
    if (Array.isArray(value)) return `[${value.length} items]`;
    if (typeof value === 'object') return 'Multiple details';
    return String(value);
  };

  const getConflictIcon = (type: string) => {
    switch (type) {
      case 'different_value':
        return <AlertTriangle className="h-5 w-5 text-orange-600" />;
      case 'array_overlap':
        return <FileJson className="h-5 w-5 text-blue-600" />;
      case 'missing_in_existing':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'missing_in_import':
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-gray-600" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Review import differences</DialogTitle>
          <DialogDescription>
            We found {analysis.totalConflicts} difference
            {analysis.totalConflicts !== 1 ? 's' : ''} between your current data and the import.
            Choose what should happen for each one.
          </DialogDescription>
        </DialogHeader>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg border p-3">
            <p className="text-sm text-gray-600 dark:text-gray-400">Total differences</p>
            <p className="text-2xl font-bold">{analysis.totalConflicts}</p>
          </div>
          <div className="rounded-lg border p-3 bg-green-50 dark:bg-green-900/10">
            <p className="text-sm text-green-700 dark:text-green-400">
              Can be handled automatically
            </p>
            <p className="text-2xl font-bold text-green-700 dark:text-green-400">
              {analysis.autoResolvable}
            </p>
          </div>
          <div className="rounded-lg border p-3 bg-orange-50 dark:bg-orange-900/10">
            <p className="text-sm text-orange-700 dark:text-orange-400">Needs review</p>
            <p className="text-2xl font-bold text-orange-700 dark:text-orange-400">
              {analysis.requiresManual}
            </p>
          </div>
        </div>

        {/* Conflicts List */}
        <ScrollArea className="max-h-[50vh]">
          <div className="space-y-4">
            {conflicts.map((conflict, index) => (
              <div key={conflict.path} className="rounded-lg border p-4 space-y-3">
                <div className="flex items-start gap-3">
                  {getConflictIcon(conflict.conflictType)}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm">{internalValueLabel(conflict.field)}</h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {internalValueLabel(conflict.path.split('.').pop())}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{conflict.description}</p>
                  </div>
                  <Badge
                    variant={conflict.suggestedStrategy === 'manual' ? 'destructive' : 'secondary'}
                    className="text-xs"
                  >
                    {internalValueLabel(conflict.conflictType)}
                  </Badge>
                </div>

                {/* Value Comparison */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="rounded bg-gray-50 dark:bg-gray-800 p-3">
                    <p className="font-medium mb-1 text-gray-700 dark:text-gray-300">
                      Current value
                    </p>
                    <div className="text-xs overflow-auto max-h-20 text-gray-600 dark:text-gray-400">
                      {formatValue(conflict.existingValue)}
                    </div>
                  </div>
                  <div className="rounded bg-blue-50 dark:bg-blue-900/10 p-3">
                    <p className="font-medium mb-1 text-blue-700 dark:text-blue-300">
                      Imported value
                    </p>
                    <div className="text-xs overflow-auto max-h-20 text-blue-600 dark:text-blue-400">
                      {formatValue(conflict.importValue)}
                    </div>
                  </div>
                </div>

                {/* Resolution Strategy */}
                <Separator />
                <div>
                  <Label className="text-sm font-medium mb-2">What should happen?</Label>
                  <RadioGroup
                    value={resolutions.get(conflict.path) || 'merge'}
                    onValueChange={(value) => handleStrategyChange(conflict.path, value)}
                  >
                    <div className="space-y-2 mt-2">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="keep_existing" id={`keep-${index}`} />
                        <Label htmlFor={`keep-${index}`} className="font-normal cursor-pointer">
                          Keep current value
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="overwrite" id={`overwrite-${index}`} />
                        <Label
                          htmlFor={`overwrite-${index}`}
                          className="font-normal cursor-pointer"
                        >
                          Use imported value
                        </Label>
                      </div>
                      {conflict.conflictType === 'array_overlap' && (
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="merge" id={`merge-${index}`} />
                          <Label htmlFor={`merge-${index}`} className="font-normal cursor-pointer">
                            Combine both where possible
                          </Label>
                        </div>
                      )}
                    </div>
                  </RadioGroup>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isResolving}>
            Cancel
          </Button>
          <Button onClick={handleResolve} disabled={isResolving}>
            {isResolving ? 'Applying...' : 'Apply Resolutions & Import'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
