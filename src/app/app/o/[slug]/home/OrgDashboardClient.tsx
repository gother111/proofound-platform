'use client';

/**
 * Organization Dashboard Client
 *
 * Provides customizable dashboard for organization home page
 * Uses org-specific widgets and layout storage
 */

import { useState, useEffect, useCallback } from 'react';
import { OrgGoalsCard } from '@/components/dashboard/OrgGoalsCard';
import { TasksCard } from '@/components/dashboard/TasksCard';
import { ProjectsCard } from '@/components/dashboard/ProjectsCard';
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

interface OrgDashboardClientProps {
  orgSlug: string;
  orgId: string;
  userRole: string;
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
    name: 'Candidate Pipeline',
    description: 'Overview of candidate matches and shortlists',
    defaultSize: 'large',
  },
  'org-goals': {
    id: 'org-goals',
    name: 'Organization Goals',
    description: 'Track organizational objectives',
    defaultSize: 'default',
  },
  'org-readiness': {
    id: 'org-readiness',
    name: 'Assignment Readiness',
    description: 'Readiness score, demand signals, and recommended actions',
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
  projects: {
    id: 'projects',
    name: 'Projects',
    description: 'Active projects',
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
    description: 'Discover new opportunities',
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

// Default org dashboard layout
const DEFAULT_ORG_LAYOUT: DashboardWidget[] = [
  { widgetId: 'org-pipeline', position: 0, visible: true, size: 'large', settings: {} },
  { widgetId: 'org-readiness', position: 1, visible: true, size: 'large', settings: {} },
  { widgetId: 'org-goals', position: 2, visible: true, size: 'default', settings: {} },
  { widgetId: 'team', position: 3, visible: true, size: 'default', settings: {} },
  { widgetId: 'tasks', position: 4, visible: true, size: 'default', settings: {} },
  { widgetId: 'projects', position: 5, visible: true, size: 'default', settings: {} },
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
    description: 'Focus on assignments and goals',
    widgets: [
      { widgetId: 'org-pipeline', position: 0, visible: true, size: 'large', settings: {} },
      { widgetId: 'org-readiness', position: 1, visible: true, size: 'large', settings: {} },
      { widgetId: 'org-goals', position: 2, visible: true, size: 'default', settings: {} },
      { widgetId: 'team', position: 3, visible: true, size: 'default', settings: {} },
      { widgetId: 'projects', position: 4, visible: true, size: 'default', settings: {} },
    ],
  },
  executive: {
    label: 'Executive',
    description: 'High-level overview',
    widgets: [
      { widgetId: 'org-readiness', position: 0, visible: true, size: 'large', settings: {} },
      { widgetId: 'org-goals', position: 1, visible: true, size: 'large', settings: {} },
      { widgetId: 'org-pipeline', position: 2, visible: true, size: 'default', settings: {} },
      { widgetId: 'team', position: 3, visible: true, size: 'default', settings: {} },
    ],
  },
  balanced: {
    label: 'Balanced',
    description: 'All key widgets',
    widgets: DEFAULT_ORG_LAYOUT,
  },
};

export function OrgDashboardClient({ orgSlug, orgId, userRole }: OrgDashboardClientProps) {
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
        // For now, use local storage for org layouts (could extend API later)
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
      toast.success('Dashboard layout saved!');
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
    const canManageSettings = userRole === 'owner' || userRole === 'admin';

    switch (widgetId) {
      case 'org-pipeline':
        return (
          <OrgMatchingCard
            orgSlug={orgSlug}
            className="lg:col-span-2"
            onVisibilityChange={(visible) => handleWidgetVisibilityChange(widgetId, visible)}
          />
        );
      case 'org-goals':
        return (
          <OrgGoalsCard
            orgSlug={orgSlug}
            orgId={orgId}
            canManageSettings={canManageSettings}
            onVisibilityChange={(visible) => handleWidgetVisibilityChange(widgetId, visible)}
          />
        );
      case 'org-readiness':
        return <OrgReadinessCard orgRef={orgSlug} />;
      case 'team':
        return (
          <TeamRolesCard
            orgSlug={orgSlug}
            orgId={orgId}
            canManageSettings={canManageSettings}
            onVisibilityChange={(visible) => handleWidgetVisibilityChange(widgetId, visible)}
          />
        );
      case 'tasks':
        return <TasksCard />;
      case 'projects':
        return <ProjectsCard />;
      case 'while-away':
        return (
          <WhileAwayCard
            persona="organization"
            orgRef={orgSlug}
            onVisibilityChange={(visible) => handleWidgetVisibilityChange(widgetId, visible)}
          />
        );
      case 'explore':
        return <ExploreCard persona="organization" orgRef={orgSlug} />;
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
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="animate-pulse bg-white rounded-lg h-64 border border-gray-200" />
        ))}
      </div>
    );
  }

  const visibleWidgets = layout.filter((w) => w.visible && widgetVisibility[w.widgetId] !== false);

  // Only show customize button to admins/owners
  const canCustomize = userRole === 'owner' || userRole === 'admin';

  return (
    <div className="space-y-4">
      {/* Edit Controls */}
      {canCustomize && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {editMode && (
              <p className="text-sm text-[#6B6760]">{visibleWidgets.length} widgets shown</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {editMode && (
              <>
                {/* Preset Selector */}
                <Select onValueChange={handleApplyPreset}>
                  <SelectTrigger className="w-[160px] h-8 text-sm border-[#D8D2C8]">
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
                  className="border-[#D8D2C8] text-[#6B6760]"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Widgets
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReset}
                  className="border-[#D8D2C8] text-[#6B6760]"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-[#1C4D3A] text-white hover:bg-[#2D5F4A]"
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
                  ? 'border-[#D8D2C8] text-[#6B6760]'
                  : 'bg-[#1C4D3A] text-white hover:bg-[#2D5F4A]'
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
          <p className="text-lg font-medium text-[#2D3330] mb-2">No dashboard widgets configured</p>
          <p className="text-sm text-[#6B6760] text-center mb-4">
            Customize your organization dashboard to see the information that matters most
          </p>
          {canCustomize && (
            <Button
              onClick={() => setEditMode(true)}
              className="bg-[#1C4D3A] hover:bg-[#1C4D3A]/90"
            >
              <Settings2 className="w-4 h-4 mr-2" />
              Configure Dashboard
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
              Select the widgets you want to display on your organization dashboard.
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
