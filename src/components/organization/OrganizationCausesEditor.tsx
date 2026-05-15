'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { X, Plus, Save, Heart, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api/fetch';

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
  'Healthcare Access',
  'Environmental Conservation',
  'Digital Rights',
  'Housing Security',
  'Workers Rights',
];

interface OrganizationCausesEditorProps {
  orgId: string;
  initialCauses?: string[];
  canEdit?: boolean;
}

export function OrganizationCausesEditor({
  orgId,
  initialCauses = [],
  canEdit = true,
}: OrganizationCausesEditorProps) {
  const [causes, setCauses] = useState<string[]>(initialCauses);
  const [newCause, setNewCause] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

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

    setCauses([...causes, trimmedCause]);
    setNewCause('');
    setError(null);
    setHasChanges(true);
  };

  const handleAddCustomCause = () => {
    handleAddCause(newCause);
  };

  const handleDeleteCause = (cause: string) => {
    setCauses(causes.filter((c) => c !== cause));
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (causes.length === 0) {
      setError('Please add at least one cause');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const response = await apiFetch(`/api/organizations/${orgId}/causes`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ causes }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save causes');
      }

      setHasChanges(false);
      toast.success('Causes updated successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save causes');
      toast.error('Failed to save causes');
    } finally {
      setIsSaving(false);
    }
  };

  const availableSuggestions = SUGGESTED_CAUSES.filter((cause) => !causes.includes(cause));

  return (
    <Card className="border-black/5 dark:border-white/5 rounded-3xl shadow-sm hover:shadow-md transition-shadow duration-300">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="font-['Crimson_Pro'] text-proofound-charcoal dark:text-foreground flex items-center gap-2">
              <Heart className="h-5 w-5" />
              Causes We Support
            </CardTitle>
            <CardDescription className="mt-1">
              The issues and movements your organization is passionate about (max 5)
            </CardDescription>
          </div>
          {canEdit && hasChanges && (
            <Button
              onClick={handleSave}
              disabled={isSaving}
              size="sm"
              className="bg-proofound-forest hover:bg-proofound-forest/90 text-white"
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Current Causes */}
        {causes.length > 0 && (
          <div className="space-y-2">
            <Label>Your Causes ({causes.length}/5)</Label>
            <div className="flex flex-wrap gap-2">
              {causes.map((cause) => (
                <Badge
                  key={cause}
                  variant="outline"
                  className="px-3 py-1.5 text-sm group"
                  style={{
                    backgroundColor: 'rgba(122, 146, 120, 0.1)',
                    borderColor: 'rgba(122, 146, 120, 0.3)',
                    color: 'rgb(122, 146, 120)',
                  }}
                >
                  {cause}
                  {canEdit && (
                    <button
                      type="button"
                      onClick={() => handleDeleteCause(cause)}
                      className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {causes.length === 0 && (
          <div className="text-center py-8 px-4 border-2 border-dashed rounded-lg">
            <Heart className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              {canEdit
                ? 'Add causes to help candidates understand your mission alignment'
                : 'No causes defined yet'}
            </p>
          </div>
        )}

        {canEdit && (
          <>
            {/* Add Custom Cause */}
            <div className="space-y-2">
              <Label htmlFor="new-cause">Add Custom Cause</Label>
              <div className="flex gap-2">
                <Input
                  id="new-cause"
                  value={newCause}
                  onChange={(e) => setNewCause(e.target.value)}
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
              {error && <p className="text-xs text-red-500">{error}</p>}
            </div>

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

        {/* Info Banner */}
        <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg flex gap-3">
          <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900 dark:text-blue-300">
            <p className="font-medium mb-1">Used for organization context</p>
            <p className="text-blue-700 dark:text-blue-400">
              Causes help candidates understand the organization trust page and assignment context.
              Choose up to 5 causes so the profile stays focused.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
