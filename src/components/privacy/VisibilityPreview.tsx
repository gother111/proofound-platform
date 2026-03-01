/**
 * Visibility Preview Component
 *
 * Shows a preview of how profile appears to organizations based on visibility settings
 *
 * PRD References:
 * - Part 5: F4 - Field-level visibility
 * - Part 12: User must be able to preview their profile
 */

'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import type { VisibilityLevel } from './FieldVisibilityControl';

interface ProfileField {
  name: string;
  label: string;
  value: string | null;
  visibility: VisibilityLevel;
}

interface VisibilityPreviewProps {
  fields: ProfileField[];
  viewMode: 'public' | 'network_only' | 'match_only';
}

export function VisibilityPreview({ fields, viewMode }: VisibilityPreviewProps) {
  const visibleFields = fields.filter((field) => {
    if (viewMode === 'public') {
      return field.visibility === 'public';
    } else if (viewMode === 'network_only') {
      return field.visibility === 'public' || field.visibility === 'network_only';
    } else if (viewMode === 'match_only') {
      return (
        field.visibility === 'public' ||
        field.visibility === 'network_only' ||
        field.visibility === 'match_only'
      );
    }
    return false;
  });

  const hiddenFields = fields.filter((field) => !visibleFields.includes(field));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Preview: How Organizations See Your Profile</CardTitle>
          <Badge variant="outline" className="gap-1">
            {viewMode === 'public' ? (
              <>
                <Eye className="h-3 w-3" />
                <span>Public</span>
              </>
            ) : viewMode === 'network_only' ? (
              <>
                <Eye className="h-3 w-3" />
                <span>Network-only</span>
              </>
            ) : (
              <>
                <Eye className="h-3 w-3" />
                <span>Match-only</span>
              </>
            )}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Visible Fields */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Eye className="h-4 w-4 text-green-600" />
            Visible Information ({visibleFields.length})
          </h4>
          {visibleFields.length > 0 ? (
            <div className="space-y-2 pl-6">
              {visibleFields.map((field) => (
                <div key={field.name} className="text-sm">
                  <span className="font-medium text-muted-foreground">{field.label}:</span>{' '}
                  <span className="text-foreground">
                    {field.value || <span className="italic text-muted-foreground">Not set</span>}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground pl-6">
              No fields are visible in this view.
            </p>
          )}
        </div>

        {/* Hidden Fields */}
        {hiddenFields.length > 0 && (
          <div className="space-y-3 pt-3 border-t border-proofound-stone">
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <EyeOff className="h-4 w-4 text-amber-600" />
              Hidden Information ({hiddenFields.length})
            </h4>
            <div className="space-y-1 pl-6">
              {hiddenFields.map((field) => (
                <div key={field.name} className="text-sm text-muted-foreground">
                  <span className="font-medium">{field.label}</span>
                  {field.visibility === 'network_only' && viewMode === 'public' && (
                    <span className="text-xs ml-2">(shown in trusted network views)</span>
                  )}
                  {field.visibility === 'match_only' &&
                    (viewMode === 'public' || viewMode === 'network_only') && (
                      <span className="text-xs ml-2">(shown after a match)</span>
                    )}
                  {field.visibility === 'private' && (
                    <span className="text-xs ml-2">(always private)</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Info Banner */}
        <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-blue-900">
            <p className="font-medium mb-1">Privacy Controls</p>
            <p>Organizations see different information based on your relationship:</p>
            <ul className="list-disc list-inside mt-1 space-y-0.5">
              <li>
                <strong>Before match:</strong> Only "Public" fields
              </li>
              <li>
                <strong>Network view:</strong> "Public" + "Network-only" fields
              </li>
              <li>
                <strong>After match:</strong> "Public" + "Network-only" + "Match-only" fields
              </li>
              <li>
                <strong>Private fields:</strong> Never shared with organizations
              </li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
