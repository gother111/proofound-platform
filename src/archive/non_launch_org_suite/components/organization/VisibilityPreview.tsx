'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { VisibilityLevelBadge } from './VisibilityLevelBadge';
import { Eye, Globe, Users, MessageCircle, Lock } from 'lucide-react';

interface VisibilitySettings {
  displayName: string;
  mission: string;
  vision: string;
  causes: string;
  workCulture: string;
  structure: string;
  projects: string;
  partnerships: string;
  goals: string;
  impact: string;
}

interface VisibilityPreviewProps {
  settings: VisibilitySettings;
}

const FIELD_LABELS = {
  displayName: 'Organization name',
  mission: 'Mission statement',
  vision: 'Vision statement',
  causes: 'Causes',
  workCulture: 'Work culture',
  structure: 'Team structure',
  projects: 'Projects',
  partnerships: 'Partnerships',
  goals: 'Goals',
  impact: 'Impact overview',
};

const VIEWER_TYPES = [
  {
    key: 'public',
    label: 'Public',
    shortLabel: 'Public',
    icon: Globe,
    description: 'Anyone browsing',
  },
  {
    key: 'post_match',
    label: 'After match',
    shortLabel: 'Match',
    icon: Users,
    description: 'People after a match is made',
  },
  {
    key: 'post_conversation_start',
    label: 'After conversation',
    shortLabel: 'Chat',
    icon: MessageCircle,
    description: 'People after a conversation starts',
  },
  {
    key: 'internal_only',
    label: 'Team only',
    shortLabel: 'Team',
    icon: Lock,
    description: 'People on your organization team',
  },
];

function getVisibleFields(settings: VisibilitySettings, viewerLevel: string): string[] {
  const visibilityHierarchy = ['public', 'post_match', 'post_conversation_start', 'internal_only'];
  const viewerIndex = visibilityHierarchy.indexOf(viewerLevel);

  return Object.entries(settings)
    .filter(([_, level]) => {
      const fieldIndex = visibilityHierarchy.indexOf(level);
      return fieldIndex <= viewerIndex;
    })
    .map(([field]) => field);
}

export function VisibilityPreview({ settings }: VisibilityPreviewProps) {
  return (
    <Card className="border-border rounded-3xl shadow-sm hover:shadow-md transition-shadow duration-300">
      <CardHeader>
        <CardTitle className="font-['Crimson_Pro'] text-proofound-charcoal dark:text-foreground flex items-center gap-2">
          <Eye className="h-5 w-5" />
          Visibility preview
        </CardTitle>
        <CardDescription>See what different viewers can access</CardDescription>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="public" className="w-full">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
            {VIEWER_TYPES.map((type) => {
              const Icon = type.icon;
              return (
                <TabsTrigger key={type.key} value={type.key}>
                  <Icon className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">{type.label}</span>
                  <span className="sm:hidden">{type.shortLabel}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {VIEWER_TYPES.map((type) => {
            const visibleFields = getVisibleFields(settings, type.key);

            return (
              <TabsContent key={type.key} value={type.key} className="space-y-4">
                <div className="p-4 bg-muted/30 rounded-lg">
                  <p className="text-sm">
                    <strong>{type.label}:</strong> {type.description}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Can see {visibleFields.length} of {Object.keys(settings).length} sections
                  </p>
                </div>

                <div className="space-y-2">
                  {Object.entries(FIELD_LABELS).map(([field, label]) => {
                    const isVisible = visibleFields.includes(field);
                    const level = settings[field as keyof VisibilitySettings];

                    return (
                      <div
                        key={field}
                        className={`flex items-center justify-between p-3 rounded-lg border ${
                          isVisible
                            ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-900/30'
                            : 'bg-muted/50 border-border opacity-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {isVisible ? (
                            <Eye className="h-4 w-4 text-green-600 dark:text-green-400" />
                          ) : (
                            <Lock className="h-4 w-4 text-gray-400" />
                          )}
                          <span className="text-sm font-medium">{label}</span>
                        </div>
                        <VisibilityLevelBadge level={level as any} />
                      </div>
                    );
                  })}
                </div>
              </TabsContent>
            );
          })}
        </Tabs>
      </CardContent>
    </Card>
  );
}
