'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WorkNormsForm } from './WorkNormsForm';
import { AccessibilityCommitments } from './AccessibilityCommitments';
import { toast } from 'sonner';
import { Coffee, Heart, AlertCircle, Save } from 'lucide-react';
import { apiFetch } from '@/lib/api/fetch';

interface WorkNorms {
  asyncSyncBalance?: number;
  meetingLoad?: 'low' | 'medium' | 'high';
  coreHoursStart?: string;
  coreHoursEnd?: string;
  coreHoursTimezone?: string;
  workingDays?: string;
  flexibilityLevel?: 'strict' | 'moderate' | 'flexible';
  responseTimeExpectation?: string;
  collaborationTools?: string[];
}

interface AccessibilityCommitmentsData {
  physicalAccessibility?: string;
  digitalAccessibility?: string;
  accommodationsOffered?: string[];
  inclusionInitiatives?: string;
  wellbeingSupport?: string;
}

interface WorkCulture {
  workNorms?: WorkNorms;
  accessibility?: AccessibilityCommitmentsData;
  lastUpdated?: string;
}

interface CultureEditorProps {
  orgId: string;
  initialCulture?: WorkCulture;
  canEdit?: boolean;
}

export function CultureEditor({ orgId, initialCulture, canEdit = true }: CultureEditorProps) {
  const [culture, setCulture] = useState<WorkCulture>(
    initialCulture || { workNorms: {}, accessibility: {} }
  );
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (initialCulture) {
      setCulture(initialCulture);
    }
  }, [initialCulture]);

  const handleWorkNormsChange = (norms: WorkNorms) => {
    setCulture((prev) => ({ ...prev, workNorms: norms }));
    setHasChanges(true);
  };

  const handleAccessibilityChange = (commitments: AccessibilityCommitmentsData) => {
    setCulture((prev) => ({ ...prev, accessibility: commitments }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await apiFetch(`/api/organizations/${orgId}/culture`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(culture),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to save culture');
      }

      const updated = await response.json();
      setCulture(updated.workCulture);
      setHasChanges(false);
      toast.success('Work culture updated successfully');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save culture');
    } finally {
      setIsSaving(false);
    }
  };

  const isEmpty =
    !culture.workNorms ||
    Object.keys(culture.workNorms).length === 0 ||
    !culture.accessibility ||
    Object.keys(culture.accessibility).length === 0;

  if (isEmpty && !canEdit) {
    return (
      <Card className="border-black/5 dark:border-white/5 rounded-3xl shadow-sm hover:shadow-md transition-shadow duration-300">
        <CardContent className="p-12">
          <div className="text-center">
            <Coffee className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-muted-foreground">
              Work culture information has not been defined yet.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-black/5 dark:border-white/5 rounded-3xl shadow-sm hover:shadow-md transition-shadow duration-300">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="font-['Crimson_Pro'] text-proofound-charcoal dark:text-foreground flex items-center gap-2">
              <Coffee className="h-5 w-5" />
              Work Culture
            </CardTitle>
            <CardDescription className="mt-1">
              Define work norms and accessibility commitments for candidates and team members
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

      <CardContent>
        {isEmpty && canEdit ? (
          <div className="text-center py-12 px-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-proofound-forest/10 to-proofound-sage/10 flex items-center justify-center mx-auto mb-4">
              <Coffee className="w-8 h-8 text-proofound-forest/60" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Define your work culture</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
              Help candidates understand how your team works by describing work norms, collaboration
              style, and accessibility commitments.
            </p>
            <p className="text-xs text-muted-foreground mb-4">Start by filling in the tabs below</p>
          </div>
        ) : null}

        <Tabs defaultValue="norms" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
            <TabsTrigger value="norms">
              <Coffee className="h-4 w-4 mr-2" />
              Work Norms
            </TabsTrigger>
            <TabsTrigger value="accessibility">
              <Heart className="h-4 w-4 mr-2" />
              Accessibility
            </TabsTrigger>
          </TabsList>

          <TabsContent value="norms" className="mt-0 space-y-6">
            <WorkNormsForm
              workNorms={culture.workNorms || {}}
              onChange={handleWorkNormsChange}
              disabled={!canEdit}
            />
          </TabsContent>

          <TabsContent value="accessibility" className="mt-0 space-y-6">
            <AccessibilityCommitments
              commitments={culture.accessibility || {}}
              onChange={handleAccessibilityChange}
              disabled={!canEdit}
            />
          </TabsContent>
        </Tabs>

        {/* Info Banner */}
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg flex gap-3">
          <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900 dark:text-blue-300">
            <p className="font-medium mb-1">Visible to candidates</p>
            <p className="text-blue-700 dark:text-blue-400">
              Your work culture information is shown to candidates during the matching process to
              help them assess fit before applying.
            </p>
          </div>
        </div>

        {canEdit && !hasChanges && culture.lastUpdated && (
          <p className="text-xs text-muted-foreground mt-4 text-center">
            Last updated: {new Date(culture.lastUpdated).toLocaleString()}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
