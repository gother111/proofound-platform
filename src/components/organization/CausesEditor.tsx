'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { X, Plus } from 'lucide-react';

const SUGGESTED_CAUSES = [
  'Climate Justice',
  'Economic Equity',
  'Education Access',
  'Clean Energy',
  'Social Innovation',
  'Mental Health',
  'Food Security',
  'Racial Justice',
  'Gender Equality',
  'Youth Empowerment',
  'Disability Rights',
  'Environmental Justice',
  'Healthcare Access',
  'Housing Equity',
  'Workers Rights',
];

interface OrganizationCausesEditorProps {
  causes: string[];
  onChange: (causes: string[]) => void;
  disabled?: boolean;
}

export function OrganizationCausesEditor({
  causes,
  onChange,
  disabled,
}: OrganizationCausesEditorProps) {
  const [newCause, setNewCause] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleAddCause = (cause: string) => {
    const trimmedCause = cause.trim();

    if (!trimmedCause) {
      setError('Cause cannot be empty');
      return;
    }

    if (causes.includes(trimmedCause)) {
      setError('Cause already added');
      return;
    }

    if (causes.length >= 5) {
      setError('Choose up to 5 causes.');
      return;
    }

    onChange([...causes, trimmedCause]);
    setNewCause('');
    setError(null);
  };

  const handleAddCustomCause = () => {
    handleAddCause(newCause);
  };

  const handleDeleteCause = (cause: string) => {
    onChange(causes.filter((c) => c !== cause));
  };

  const availableSuggestions = SUGGESTED_CAUSES.filter((cause) => !causes.includes(cause));

  return (
    <div className="space-y-4">
      <div>
        <Label>Causes We Champion</Label>
        <p className="text-xs text-muted-foreground mt-1">
          The issues and movements your organization is dedicated to (up to 5)
        </p>
      </div>

      {/* Current Causes */}
      {causes.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {causes.map((cause) => (
            <Badge
              key={cause}
              variant="outline"
              className="px-3 py-1.5 text-sm group relative"
              style={{
                backgroundColor: 'rgba(122, 146, 120, 0.1)',
                borderColor: 'rgba(122, 146, 120, 0.3)',
                color: 'rgb(122, 146, 120)',
              }}
            >
              {cause}
              {!disabled && (
                <button
                  type="button"
                  onClick={() => handleDeleteCause(cause)}
                  className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label={`Remove ${cause}`}
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </Badge>
          ))}
        </div>
      )}

      {!disabled && (
        <>
          {/* Add Custom Cause */}
          <Card className="p-4 border-2 border-dashed">
            <div className="space-y-3">
              <Label htmlFor="new-cause">Add Custom Cause</Label>
              <div className="flex gap-2">
                <Input
                  id="new-cause"
                  value={newCause}
                  onChange={(e) => {
                    setNewCause(e.target.value);
                    setError(null);
                  }}
                  placeholder="e.g., Ocean Conservation"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCustomCause();
                    }
                  }}
                  disabled={causes.length >= 5}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddCustomCause}
                  disabled={causes.length >= 5}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add
                </Button>
              </div>
              {error && <p className="text-xs text-destructive">{error}</p>}
            </div>
          </Card>

          {/* Suggested Causes */}
          {availableSuggestions.length > 0 && causes.length < 5 && (
            <div className="space-y-2">
              <Label>Quick Add (suggested)</Label>
              <div className="flex flex-wrap gap-2">
                {availableSuggestions.slice(0, 10).map((cause) => (
                  <Button
                    key={cause}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddCause(cause)}
                    className="rounded-full text-xs"
                    disabled={causes.length >= 5}
                  >
                    + {cause}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Counter */}
      <p className="text-xs text-muted-foreground">
        {causes.length}/5 causes added
        {causes.length >= 5 && ' (maximum reached)'}
      </p>

      {/* Info */}
      {causes.length === 0 && !disabled && (
        <Card className="p-4 bg-muted/30">
          <p className="text-sm text-muted-foreground">
            Tip: select causes that clarify your organization&apos;s context. These help candidates
            understand the work, but they do not drive individual matching scores.
          </p>
        </Card>
      )}
    </div>
  );
}
