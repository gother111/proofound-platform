/**
 * Redact Mode Toggle Component
 *
 * Enables/disables "redact mode" which hides all sensitive information
 * from the UI for privacy when sharing screen or presenting
 *
 * PRD References:
 * - Part 5: F4 - Redact mode for screen sharing
 * - Part 8: Privacy controls
 */

'use client';

import { useState } from 'react';
import { EyeOff, Eye } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';

interface RedactModeToggleProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  showLabel?: boolean;
}

export function RedactModeToggle({ enabled, onChange, showLabel = true }: RedactModeToggleProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleToggle = async (checked: boolean) => {
    setIsLoading(true);
    try {
      onChange(checked);

      if (checked) {
        toast.success('Redact mode enabled. Sensitive info is now hidden.');
      } else {
        toast.success('Redact mode disabled. All info is visible.');
      }
    } catch (error) {
      console.error('Failed to toggle redact mode:', error);
      toast.error('Failed to update redact mode');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-between space-x-3">
      <div className="flex items-center space-x-2">
        {enabled ? (
          <EyeOff className="h-4 w-4 text-amber-600" />
        ) : (
          <Eye className="h-4 w-4 text-muted-foreground" />
        )}
        {showLabel && (
          <div className="space-y-0.5">
            <Label htmlFor="redact-mode" className="text-sm font-medium text-foreground">
              Redact Mode
            </Label>
            <p className="text-xs text-muted-foreground">
              {enabled ? 'Sensitive information is hidden' : 'All information is visible'}
            </p>
          </div>
        )}
      </div>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div>
              <Switch
                id="redact-mode"
                checked={enabled}
                onCheckedChange={handleToggle}
                disabled={isLoading}
                aria-label="Toggle redact mode"
              />
            </div>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p className="text-sm">
              {enabled
                ? 'Disable redact mode to show all information normally'
                : 'Enable redact mode to hide sensitive information (useful when screen sharing or presenting)'}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
