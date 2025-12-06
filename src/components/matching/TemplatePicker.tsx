'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Loader2, Wand2 } from 'lucide-react';
import type { AssignmentTemplate, TemplateStep } from '@/actions/assignmentTemplates';
import { TEMPLATE_STEP_LABELS } from './assignment-steps/templateMapping';

interface TemplatePickerProps {
  orgId: string;
  appliedTemplateId?: string | null;
  onApply: (template: AssignmentTemplate) => void;
  onClear: () => void;
}

const STEP_ORDER: TemplateStep[] = [
  'business_value',
  'target_outcomes',
  'weight_matrix',
  'practicals',
  'expertise',
];

export function TemplatePicker({
  orgId,
  appliedTemplateId,
  onApply,
  onClear,
}: TemplatePickerProps) {
  const [templates, setTemplates] = useState<AssignmentTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/assignments/templates?orgId=${orgId}`);
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Failed to load templates');
        }
        setTemplates(data.templates || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load templates');
      } finally {
        setLoading(false);
      }
    };

    fetchTemplates();
  }, [orgId]);

  const grouped = useMemo(() => {
    return templates.reduce<Record<string, AssignmentTemplate[]>>((acc, template) => {
      const family = template.roleFamily || 'Other';
      acc[family] = acc[family] ? [...acc[family], template] : [template];
      return acc;
    }, {});
  }, [templates]);

  return (
    <Card className="border-proofound-stone dark:border-border rounded-2xl shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <div>
          <CardTitle className="text-lg font-semibold text-proofound-charcoal dark:text-foreground">
            Templates by Role Family
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Apply a preset to pre-fill parts of the 5-step flow. You can edit anything afterward.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onClear} disabled={!appliedTemplateId}>
            Clear template
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {loading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading templates...
          </div>
        )}

        {error && !loading && (
          <div className="text-sm text-destructive">Could not load templates: {error}</div>
        )}

        {!loading && !error && templates.length === 0 && (
          <div className="text-sm text-muted-foreground">No templates available yet.</div>
        )}

        {!loading &&
          !error &&
          Object.entries(grouped).map(([family, list], index) => (
            <div key={family} className="space-y-3">
              {index > 0 && <Separator />}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-proofound-charcoal dark:text-foreground">
                    {family}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Templates tuned for this role family
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {list.map((template) => {
                  const isApplied = appliedTemplateId === template.id;
                  return (
                    <Card
                      key={template.id}
                      className={`border ${isApplied ? 'border-proofound-forest/70' : ''}`}
                    >
                      <CardHeader className="space-y-2 pb-2">
                        <div className="flex items-center justify-between gap-2">
                          <CardTitle className="text-base font-semibold flex items-center gap-2">
                            <Wand2 className="w-4 h-4 text-proofound-forest" />
                            {template.name}
                          </CardTitle>
                          <div className="flex items-center gap-2">
                            {template.isGlobal && <Badge variant="outline">Global</Badge>}
                            {isApplied && (
                              <Badge className="bg-proofound-forest text-white">Applied</Badge>
                            )}
                          </div>
                        </div>
                        {template.description && (
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {template.description}
                          </p>
                        )}
                      </CardHeader>
                      <CardContent className="space-y-3 pt-0">
                        <div className="flex flex-wrap gap-1">
                          {STEP_ORDER.filter((step) => template.appliesToSteps.includes(step)).map(
                            (step) => (
                              <Badge key={step} variant="secondary" className="text-xs">
                                {TEMPLATE_STEP_LABELS[step]}
                              </Badge>
                            )
                          )}
                        </div>

                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant={isApplied ? 'secondary' : 'default'}
                            size="sm"
                            onClick={() => onApply(template)}
                          >
                            {isApplied ? 'Re-apply' : 'Apply'}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
      </CardContent>
    </Card>
  );
}
