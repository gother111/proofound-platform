'use client';

/**
 * Organization home corridor client
 *
 * Provides a narrow launch-corridor view for organization home.
 */

import { useState, useEffect, useCallback } from 'react';
import { TasksCard } from '@/components/dashboard/TasksCard';
import { OrgMatchingCard } from '@/components/dashboard/OrgMatchingCard';
import { OrgReadinessCard } from '@/components/dashboard/org/OrgReadinessCard';
import { TeamRolesCard } from '@/components/dashboard/TeamRolesCard';
import { ExploreCard } from '@/components/dashboard/ExploreCard';
import { WhileAwayCard } from '@/components/dashboard/WhileAwayCard';
import { Button } from '@/components/ui/button';
import { Settings2, Save, RotateCcw, Plus } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { sanitizeLayout } from '@/lib/dashboard/layout';
import { WidgetGridSkeleton } from '@/components/dashboard/WidgetGridSkeleton';
import { normalizeAuthorizedOrgRole } from '@/lib/authz';

interface OrgDashboardClientProps {
  orgSlug: string;
  orgId: string;
  userRole: string;
  initialData?: any;
}

interface DashboardWidget {
  widgetId: string;
  position: number;
  visible: boolean;
  size: 'small' | 'default' | 'large';
  settings: Record<string, any>;
}

// Org-specific available widgets
const ORG_AVAILABLE_WIDGETS: Record<
  string,
  { id: string; name: string; description: string; defaultSize: 'small' | 'default' | 'large' }
> = {
  'org-pipeline': {
    id: 'org-pipeline',
    name: 'Assignment review corridor',
    description: 'Proof-backed review, shortlist, and intro state',
    defaultSize: 'large',
  },
  'org-readiness': {
    id: 'org-readiness',
    name: 'Assignment Readiness',
    description: 'Assignment checks, pilot supply signals, and next corridor actions',
    defaultSize: 'large',
  },
  team: {
    id: 'team',
    name: 'Team',
    description: 'Organization team members',
    defaultSize: 'default',
  },
  tasks: {
    id: 'tasks',
    name: 'Tasks',
    description: 'Upcoming tasks and to-dos',
    defaultSize: 'default',
  },
  'while-away': {
    id: 'while-away',
    name: 'While You Were Away',
    description: 'Recent activity updates',
    defaultSize: 'large',
  },
  explore: {
    id: 'explore',
    name: 'Explore',
    description: 'Review the next launch-safe corridor step',
    defaultSize: 'default',
  },
};

const ORG_LAYOUT_WIDGET_CONFIG = Object.fromEntries(
  Object.values(ORG_AVAILABLE_WIDGETS).map((widget) => [
    widget.id,
    {
      defaultSize: widget.defaultSize,
      availableSizes: ['small', 'default', 'large'] as const,
    },
  ])
);

// Default organization corridor layout
const DEFAULT_ORG_LAYOUT: DashboardWidget[] = [
  { widgetId: 'org-pipeline', position: 0, visible: true, size: 'large', settings: {} },
  { widgetId: 'org-readiness', position: 1, visible: true, size: 'large', settings: {} },
  { widgetId: 'team', position: 2, visible: true, size: 'default', settings: {} },
  { widgetId: 'tasks', position: 3, visible: true, size: 'default', settings: {} },
];

// Org preset layouts per PRD O8
const ORG_PRESET_LAYOUTS: Record<
  string,
  { label: string; description: string; widgets: DashboardWidget[] }
> = {
  recruiter: {
    label: 'Recruiter',
    description: 'Focus on candidate pipeline',
    widgets: [
      { widgetId: 'org-pipeline', position: 0, visible: true, size: 'large', settings: {} },
      { widgetId: 'org-readiness', position: 1, visible: true, size: 'large', settings: {} },
      { widgetId: 'team', position: 2, visible: true, size: 'default', settings: {} },
      { widgetId: 'while-away', position: 3, visible: true, size: 'default', settings: {} },
      { widgetId: 'tasks', position: 4, visible: true, size: 'default', settings: {} },
    ],
  },
  'hiring-manager': {
    label: 'Hiring Manager',
    description: 'Focus on launch-safe assignment flow',
    widgets: [
      { widgetId: 'org-pipeline', position: 0, visible: true, size: 'large', settings: {} },
      { widgetId: 'org-readiness', position: 1, visible: true, size: 'large', settings: {} },
      { widgetId: 'team', position: 2, visible: true, size: 'default', settings: {} },
      { widgetId: 'tasks', position: 3, visible: true, size: 'default', settings: {} },
    ],
  },
  executive: {
    label: 'Executive',
    description: 'High-level launch overview',
    widgets: [
      { widgetId: 'org-readiness', position: 0, visible: true, size: 'large', settings: {} },
      { widgetId: 'org-pipeline', position: 1, visible: true, size: 'large', settings: {} },
      { widgetId: 'team', position: 2, visible: true, size: 'default', settings: {} },
      { widgetId: 'while-away', position: 3, visible: true, size: 'default', settings: {} },
    ],
  },
  balanced: {
    label: 'Balanced',
    description: 'All key widgets',
    widgets: DEFAULT_ORG_LAYOUT,
  },
};

export function OrgDashboardClient({
  orgSlug,
  orgId,
  userRole,
  initialData,
}: OrgDashboardClientProps) {
  const normalizedUserRole = normalizeAuthorizedOrgRole(userRole);
  const [layout, setLayout] = useState<DashboardWidget[]>(DEFAULT_ORG_LAYOUT);
  const [widgetVisibility, setWidgetVisibility] = useState<Record<string, boolean>>({});
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isWidgetPickerOpen, setIsWidgetPickerOpen] = useState(false);
  const sanitizeOrgLayout = useCallback(
    (widgets: DashboardWidget[] | null | undefined) =>
      sanitizeLayout(widgets, {
        defaultLayout: DEFAULT_ORG_LAYOUT,
        availableWidgets: ORG_LAYOUT_WIDGET_CONFIG,
      }),
    []
  );

  // Fetch org dashboard layout
  useEffect(() => {
    async function fetchLayout() {
      try {
        // For now, use local storage for org layouts.
        const stored = localStorage.getItem(`org-dashboard-layout-${orgId}`);
        if (stored) {
          const parsed = JSON.parse(stored) as DashboardWidget[];
          setLayout(sanitizeOrgLayout(parsed));
        } else {
          setLayout(sanitizeOrgLayout(DEFAULT_ORG_LAYOUT));
        }
        setWidgetVisibility({});
      } catch (error) {
        console.error('Failed to fetch org dashboard layout:', error);
        setLayout(sanitizeOrgLayout(DEFAULT_ORG_LAYOUT));
        setWidgetVisibility({});
      } finally {
        setLoading(false);
      }
    }

    fetchLayout();
  }, [orgId, sanitizeOrgLayout]);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Save to local storage (could be extended to API)
      const sanitizedLayout = sanitizeOrgLayout(layout);
      setLayout(sanitizedLayout);
      localStorage.setItem(`org-dashboard-layout-${orgId}`, JSON.stringify(sanitizedLayout));
      toast.success('Home layout saved.');
      setEditMode(false);
    } catch (error) {
      console.error('Error saving layout:', error);
      toast.error('Failed to save layout');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setLayout(sanitizeOrgLayout(DEFAULT_ORG_LAYOUT));
    setWidgetVisibility({});
    localStorage.removeItem(`org-dashboard-layout-${orgId}`);
    toast.success('Layout reset to default');
  };

  const handleApplyPreset = (presetKey: string) => {
    const preset = ORG_PRESET_LAYOUTS[presetKey];
    if (preset) {
      setLayout(sanitizeOrgLayout(preset.widgets));
      setWidgetVisibility({});
      toast.success(`Applied ${preset.label} preset`);
    }
  };

  const handleToggleWidget = (widgetId: string, checked: boolean) => {
    if (checked) {
      setWidgetVisibility((previous) => {
        if (!(widgetId in previous)) return previous;
        const next = { ...previous };
        delete next[widgetId];
        return next;
      });
    }

    setLayout((prev) => {
      const existingIndex = prev.findIndex((w) => w.widgetId === widgetId);

      if (existingIndex >= 0) {
        const newLayout = [...prev];
        newLayout[existingIndex] = {
          ...newLayout[existingIndex],
          visible: checked,
        };
        return newLayout;
      } else if (checked) {
        const config = ORG_AVAILABLE_WIDGETS[widgetId];
        if (!config) return prev;

        return [
          ...prev,
          {
            widgetId,
            visible: true,
            position: prev.length,
            size: config.defaultSize,
            settings: {},
          },
        ];
      }

      return prev;
    });
  };

  const handleWidgetVisibilityChange = useCallback((widgetId: string, visible: boolean) => {
    setWidgetVisibility((previous) => {
      if (previous[widgetId] === visible) return previous;
      return { ...previous, [widgetId]: visible };
    });
  }, []);

  const getWidgetComponent = (widgetId: string) => {
    const canManageSettings =
      normalizedUserRole === 'org_owner' || normalizedUserRole === 'org_manager';

    switch (widgetId) {
      case 'org-pipeline':
        return (
          <OrgMatchingCard
            orgSlug={orgSlug}
            className="lg:col-span-2"
            initialData={initialData?.pipeline}
            onVisibilityChange={(visible) => handleWidgetVisibilityChange(widgetId, visible)}
          />
        );
      case 'org-readiness':
        return <OrgReadinessCard orgRef={orgSlug} initialData={initialData?.readiness} />;
      case 'team':
        return (
          <TeamRolesCard
            orgSlug={orgSlug}
            orgId={orgId}
            canManageSettings={canManageSettings}
            initialData={initialData?.team}
            onVisibilityChange={(visible) => handleWidgetVisibilityChange(widgetId, visible)}
          />
        );
      case 'tasks':
        return (
          <TasksCard persona="organization" orgRef={orgSlug} initialData={initialData?.momentum} />
        );
      case 'while-away':
        return (
          <WhileAwayCard
            persona="organization"
            orgRef={orgSlug}
            initialData={initialData?.updates}
            onVisibilityChange={(visible) => handleWidgetVisibilityChange(widgetId, visible)}
          />
        );
      case 'explore':
        return (
          <ExploreCard
            persona="organization"
            orgRef={orgSlug}
            initialData={initialData?.momentum}
          />
        );
      default:
        return null;
    }
  };

  // Get column span for a widget
  const getWidgetSpan = (widget: DashboardWidget): string => {
    if (widget.size === 'large') return 'lg:col-span-2';
    return '';
  };

  if (loading) {
    return <WidgetGridSkeleton variant="organizationDashboard" />;
  }

  const visibleWidgets = layout.filter((w) => w.visible && widgetVisibility[w.widgetId] !== false);

  // Only show customize button to managers/owners.
  const canCustomize = normalizedUserRole === 'org_owner' || normalizedUserRole === 'org_manager';

  return (
    <div className="space-y-4">
      {/* Edit Controls */}
      {canCustomize && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {editMode && (
              <p className="text-sm text-muted-foreground">{visibleWidgets.length} widgets shown</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {editMode && (
              <>
                {/* Preset Selector */}
                <Select onValueChange={handleApplyPreset}>
                  <SelectTrigger className="w-[160px] h-8 text-sm border-border">
                    <SelectValue placeholder="Quick presets..." />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ORG_PRESET_LAYOUTS).map(([key, preset]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex flex-col items-start">
                          <span className="font-medium">{preset.label}</span>
                          <span className="text-xs text-muted-foreground">
                            {preset.description}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsWidgetPickerOpen(true)}
                  className="border-border text-muted-foreground"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Widgets
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReset}
                  className="border-border text-muted-foreground"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-proofound-forest text-white hover:bg-proofound-forest/90"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Layout'}
                </Button>
              </>
            )}
            <Button
              variant={editMode ? 'outline' : 'default'}
              size="sm"
              onClick={() => setEditMode(!editMode)}
              className={
                editMode
                  ? 'border-border text-muted-foreground'
                  : 'bg-proofound-forest text-white hover:bg-proofound-forest/90'
              }
            >
              <Settings2 className="h-4 w-4 mr-2" />
              {editMode ? 'Cancel' : 'Customize'}
            </Button>
          </div>
        </div>
      )}

      {/* Dashboard Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {visibleWidgets.map((widget) => (
          <div
            key={widget.widgetId}
            className={`${getWidgetSpan(widget)} ${editMode ? 'ring-2 ring-[#1C4D3A] ring-offset-2 rounded-lg' : ''}`}
          >
            {getWidgetComponent(widget.widgetId)}
          </div>
        ))}
      </div>

      {visibleWidgets.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 px-4 bg-white rounded-lg border border-gray-200">
          <p className="text-lg font-medium text-foreground mb-2">No home sections configured</p>
          <p className="text-sm text-muted-foreground text-center mb-4">
            Restore the launch-corridor sections to keep trust, assignments, and review visible.
          </p>
          {canCustomize && (
            <Button
              onClick={() => setEditMode(true)}
              className="bg-proofound-forest hover:bg-proofound-forest/90"
            >
              <Settings2 className="w-4 h-4 mr-2" />
              Configure home
            </Button>
          )}
        </div>
      )}

      {/* Widget Picker Dialog */}
      <Dialog open={isWidgetPickerOpen} onOpenChange={setIsWidgetPickerOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Manage Widgets</DialogTitle>
            <DialogDescription>
              Select the sections you want to display on your organization home.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-4">
              {Object.values(ORG_AVAILABLE_WIDGETS).map((widget) => {
                const isVisible = layout.find((w) => w.widgetId === widget.id && w.visible);
                return (
                  <div
                    key={widget.id}
                    className="flex items-start space-x-3 p-2 rounded hover:bg-muted/50"
                  >
                    <Checkbox
                      id={`widget-${widget.id}`}
                      checked={!!isVisible}
                      onCheckedChange={(checked) =>
                        handleToggleWidget(widget.id, checked as boolean)
                      }
                    />
                    <div className="grid gap-1.5 leading-none">
                      <Label
                        htmlFor={`widget-${widget.id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {widget.name}
                      </Label>
                      <p className="text-xs text-muted-foreground">{widget.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button onClick={() => setIsWidgetPickerOpen(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
