/**
 * Draggable Dashboard Component
 *
 * Allows users to reorder dashboard widgets via drag-and-drop
 * Persists layout to database
 *
 * REQUIRES: npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
 */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { DndContext } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';
import { WhileAwayCard } from './WhileAwayCard';
import { GoalsCard } from './GoalsCard';
import { TasksCard } from './TasksCard';
import { MatchingResultsCard } from './MatchingResultsCard';
import { ImpactSnapshotCard } from './ImpactSnapshotCard';
import { ExploreCard } from './ExploreCard';
import { NextBestActionsWidget } from './NextBestActionsWidget';
import { ProfileActivationCard } from './ProfileActivationCard';
import { MatchingReadinessCard } from './MatchingReadinessCard';
import { InterviewsFeedbackCard } from './InterviewsFeedbackCard';
import { MomentumMetricsCard } from './MomentumMetricsCard';
import { ZenSnapshotCard } from './ZenSnapshotCard';
import { NotificationsCard } from './NotificationsCard';
import { Button } from '@/components/ui/button';
import { Settings2, Save, RotateCcw, Plus } from 'lucide-react';
import { toast } from 'sonner';
import {
  DashboardWidget,
  AVAILABLE_WIDGETS,
  PRESET_LAYOUTS,
  DEFAULT_LAYOUT,
  sanitizeLayout,
} from '@/lib/dashboard/layout';
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
import { WidgetGridSkeleton } from './WidgetGridSkeleton';

interface DraggableDashboardProps {
  initialLayout?: DashboardWidget[];
  initialData?: any;
  onError?: (message: string) => void;
  onLoadingChange?: (isLoading: boolean) => void;
}

export function DraggableDashboard({
  initialLayout,
  initialData,
  onError,
  onLoadingChange,
}: DraggableDashboardProps) {
  const [layout, setLayout] = useState<DashboardWidget[]>(initialLayout || []);
  const [widgetVisibility, setWidgetVisibility] = useState<Record<string, boolean>>({});
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isWidgetPickerOpen, setIsWidgetPickerOpen] = useState(false);
  const [mockMode, setMockMode] = useState(false);
  const [hasTrackedView, setHasTrackedView] = useState(false);

  const loadStartRef = useRef<number>(typeof performance !== 'undefined' ? performance.now() : 0);
  const userLayoutRef = useRef<DashboardWidget[] | null>(initialLayout || null);
  const onErrorRef = useRef(onError);
  const onLoadingChangeRef = useRef(onLoadingChange);
  const sanitizeWidgets = useCallback(
    (widgets: DashboardWidget[] | null | undefined) =>
      sanitizeLayout(widgets, {
        defaultLayout: DEFAULT_LAYOUT,
        availableWidgets: AVAILABLE_WIDGETS,
      }),
    []
  );

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  useEffect(() => {
    onLoadingChangeRef.current = onLoadingChange;
  }, [onLoadingChange]);

  useEffect(() => {
    onLoadingChangeRef.current?.(loading);
  }, [loading]);

  useEffect(() => {
    // Fetch user's layout from API
    async function fetchLayout() {
      try {
        const response = await fetch('/api/dashboard/layout');
        if (response.ok) {
          const data = await response.json();
          const widgets = (data.widgets as DashboardWidget[] | undefined) || [];
          const sanitizedWidgets = sanitizeWidgets(widgets);
          setLayout(sanitizedWidgets);
          setWidgetVisibility({});
          userLayoutRef.current = sanitizedWidgets;
        } else {
          const sanitizedDefault = sanitizeWidgets(DEFAULT_LAYOUT);
          setLayout(sanitizedDefault);
          setWidgetVisibility({});
          userLayoutRef.current = sanitizedDefault;
        }
      } catch (error) {
        console.error('Failed to fetch dashboard layout:', error);
        onErrorRef.current?.('Failed to load dashboard layout');
        const sanitizedDefault = sanitizeWidgets(DEFAULT_LAYOUT);
        setLayout(sanitizedDefault);
        setWidgetVisibility({});
        userLayoutRef.current = sanitizedDefault;
      } finally {
        setLoading(false);
      }
    }

    if (!initialLayout) {
      fetchLayout();
    } else {
      const sanitizedInitialLayout = sanitizeWidgets(initialLayout);
      setLayout(sanitizedInitialLayout);
      setWidgetVisibility({});
      userLayoutRef.current = sanitizedInitialLayout;
      setLoading(false);
    }
  }, [initialLayout, sanitizeWidgets]);

  const logDashboardEvent = useCallback(
    async (
      eventType:
        | 'dashboard_viewed'
        | 'dashboard_tile_added'
        | 'dashboard_tile_removed'
        | 'dashboard_tile_reordered'
        | 'next_best_action_clicked',
      properties?: Record<string, any>
    ) => {
      try {
        await fetch('/api/analytics/dashboard', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventType,
            properties: {
              ...properties,
              fromMock: mockMode,
            },
          }),
        });
      } catch (error) {
        console.error('Failed to log dashboard event', error);
        onErrorRef.current?.('Failed to log dashboard event');
      }
    },
    [mockMode]
  );

  useEffect(() => {
    const handleMockToggle = (event: Event) => {
      const detail = (event as CustomEvent).detail as { enabled?: boolean } | undefined;
      if (typeof detail?.enabled === 'boolean') {
        const enabled = detail.enabled;
        setMockMode(enabled);

        if (enabled) {
          setLayout((currentLayout) => {
            if (currentLayout.length) {
              userLayoutRef.current = currentLayout;
            }
            return sanitizeWidgets(DEFAULT_LAYOUT);
          });
          setWidgetVisibility({});
          setLoading(false);
        } else {
          setLayout(sanitizeWidgets(userLayoutRef.current || DEFAULT_LAYOUT));
          setWidgetVisibility({});
        }
      }
    };

    window.addEventListener('dashboard-mock-mode', handleMockToggle as EventListener);
    return () =>
      window.removeEventListener('dashboard-mock-mode', handleMockToggle as EventListener);
  }, [sanitizeWidgets]);

  useEffect(() => {
    if (!loading && !hasTrackedView) {
      const loadMs =
        typeof performance !== 'undefined' ? performance.now() - loadStartRef.current : undefined;
      logDashboardEvent('dashboard_viewed', {
        tiles: layout.filter((w) => w.visible).map((w) => w.widgetId),
        load_ms: loadMs,
      });
      setHasTrackedView(true);
    }
  }, [loading, hasTrackedView, layout, logDashboardEvent]);

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    setLayout((items) => {
      const oldIndex = items.findIndex((item) => item.widgetId === active.id);
      const newIndex = items.findIndex((item) => item.widgetId === over.id);

      if (oldIndex < 0 || newIndex < 0) return items;

      const newItems = [...items];
      const [moved] = newItems.splice(oldIndex, 1);
      newItems.splice(newIndex, 0, moved);

      const reordered = newItems.map((item, index) => ({
        ...item,
        position: index,
      }));

      logDashboardEvent('dashboard_tile_reordered', {
        widgetId: active.id,
        oldIndex,
        newIndex,
      });

      return reordered;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/dashboard/layout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Ensure cookies are sent
        body: JSON.stringify({ widgets: layout }),
      });

      if (response.ok) {
        toast.success('Dashboard layout saved!');
        setEditMode(false);
        userLayoutRef.current = layout;
      } else {
        toast.error('Failed to save layout');
      }
    } catch (error) {
      console.error('Error saving layout:', error);
      toast.error('Failed to save layout');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    try {
      const response = await fetch('/api/dashboard/layout');
      if (response.ok) {
        const data = await response.json();
        const sanitizedWidgets = sanitizeWidgets(
          (data.widgets as DashboardWidget[] | undefined) || []
        );
        setLayout(sanitizedWidgets);
        setWidgetVisibility({});
        userLayoutRef.current = sanitizedWidgets;
        toast.success('Layout reset to default');
      }
    } catch (error) {
      console.error('Error resetting layout:', error);
      toast.error('Failed to reset layout');
    }
  };

  const handleApplyPreset = (presetKey: string) => {
    const preset = PRESET_LAYOUTS[presetKey];
    if (preset) {
      setLayout(preset.widgets);
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

    let eventType: 'dashboard_tile_added' | 'dashboard_tile_removed' | null = null;
    setLayout((prev) => {
      const existingIndex = prev.findIndex((w) => w.widgetId === widgetId);

      if (existingIndex >= 0) {
        // Toggle visibility of existing widget
        const newLayout = [...prev];
        newLayout[existingIndex] = {
          ...newLayout[existingIndex],
          visible: checked,
        };
        eventType = checked ? 'dashboard_tile_added' : 'dashboard_tile_removed';
        return newLayout;
      } else if (checked) {
        // Add new widget
        const config = AVAILABLE_WIDGETS[widgetId];
        if (!config) return prev;

        eventType = 'dashboard_tile_added';
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

    if (eventType) {
      logDashboardEvent(eventType, { widgetId });
    }
  };

  const handleWidgetVisibilityChange = useCallback((widgetId: string, visible: boolean) => {
    setWidgetVisibility((previous) => {
      if (previous[widgetId] === visible) return previous;
      return { ...previous, [widgetId]: visible };
    });
  }, []);

  const getWidgetComponent = (widgetId: string) => {
    switch (widgetId) {
      case 'while-away':
        return (
          <WhileAwayCard
            initialData={initialData?.whileAway}
            onVisibilityChange={(visible) => handleWidgetVisibilityChange(widgetId, visible)}
          />
        );
      case 'goals':
        return (
          <GoalsCard
            initialData={initialData?.goals}
            onVisibilityChange={(visible) => handleWidgetVisibilityChange(widgetId, visible)}
          />
        );
      case 'tasks':
        return <TasksCard persona="individual" initialData={initialData?.tasks} />;
      case 'matching-results':
        return <MatchingResultsCard />;
      case 'impact-snapshot':
        return <ImpactSnapshotCard />;
      case 'explore':
        return <ExploreCard initialData={initialData?.explore} />;
      case 'next-best-actions':
        return (
          <NextBestActionsWidget
            useMockData={mockMode}
            initialData={initialData?.proofReadiness}
            onActionClick={(actionId) =>
              logDashboardEvent('next_best_action_clicked', { actionId })
            }
          />
        );
      case 'profile-activation':
        return <ProfileActivationCard useMockData={mockMode} initialData={initialData} />;
      case 'matching-readiness':
        return (
          <MatchingReadinessCard
            useMockData={mockMode}
            initialData={initialData?.skillGaps}
            onActionClick={(actionId) =>
              logDashboardEvent('next_best_action_clicked', { actionId })
            }
          />
        );
      case 'interviews-feedback':
        return (
          <InterviewsFeedbackCard
            useMockData={mockMode}
            initialData={initialData?.interviews}
            onActionClick={(actionId) =>
              logDashboardEvent('next_best_action_clicked', { actionId })
            }
          />
        );
      case 'momentum-metrics':
        return <MomentumMetricsCard useMockData={mockMode} initialData={initialData?.momentum} />;
      case 'zen-snapshot':
        return <ZenSnapshotCard useMockData={mockMode} />;
      case 'notifications':
        return (
          <NotificationsCard
            useMockData={mockMode}
            onVisibilityChange={(visible) => handleWidgetVisibilityChange(widgetId, visible)}
          />
        );
      default:
        return null;
    }
  };

  if (loading) {
    return <WidgetGridSkeleton variant="individualDashboard" />;
  }

  // Filter to only show visible widgets
  const visibleWidgets = layout.filter((w) => w.visible && widgetVisibility[w.widgetId] !== false);

  // Show empty state if no widgets
  if (visibleWidgets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 bg-white rounded-lg border border-gray-200">
        <p className="text-lg font-medium text-foreground mb-2">No dashboard widgets configured</p>
        <p className="text-sm text-muted-foreground text-center mb-4">
          Customize your dashboard to see the information that matters most to you
        </p>
        <Button
          onClick={() => setEditMode(true)}
          className="bg-proofound-forest hover:bg-proofound-forest/90"
        >
          <Settings2 className="w-4 h-4 mr-2" />
          Configure Dashboard
        </Button>
      </div>
    );
  }

  // Framer Motion Variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  return (
    <div className="space-y-4">
      {/* Edit Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {editMode && (
            <p className="text-sm text-muted-foreground">
              Drag widgets to reorder • {layout.filter((w) => w.visible).length} widgets shown
            </p>
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
                  {Object.entries(PRESET_LAYOUTS).map(([key, preset]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex flex-col items-start">
                        <span className="font-medium">{preset.label}</span>
                        <span className="text-xs text-muted-foreground">{preset.description}</span>
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

      {/* Dashboard Widgets */}
      <DndContext onDragEnd={handleDragEnd}>
        <SortableContext
          items={visibleWidgets.map((w) => w.widgetId)}
          strategy={verticalListSortingStrategy}
        >
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 grid-flow-dense auto-rows-min"
          >
            {(() => {
              // Smart Layout Algorithm
              // Calculate optimal positions and sizes to eliminate gaps
              let currentColumn = 0;

              return visibleWidgets.map((widget, index) => {
                const isLast = index === visibleWidgets.length - 1;

                // Determine base size
                let baseSize = widget.size;
                // Force Next Best Actions to be full width if not specified
                if (widget.widgetId === 'next-best-actions' && baseSize !== 'full') {
                  baseSize = 'full';
                }

                // Map size to columns
                const sizeMap: Record<string, number> = {
                  small: 1,
                  default: 1,
                  large: 2,
                  full: 3,
                };

                let colSpan = sizeMap[baseSize] || 1;

                // Check if it fits in current row
                if (currentColumn + colSpan > 3) {
                  // Wrap to next row
                  currentColumn = 0;
                }

                // Smart expansion:
                // If this is the last widget, expand it to fill the remaining space in the row
                // OR if it's a full-width widget that wrapped, it takes 3 cols
                if (isLast) {
                  const remainingInRow = 3 - currentColumn;
                  // If it fits, expand to fill. If it wrapped (currentColumn=0), it takes full width (3)
                  if (remainingInRow > 0) {
                    colSpan = remainingInRow;
                  }
                }

                // Update current column for next iteration
                currentColumn = (currentColumn + colSpan) % 3;

                // Generate class name
                let colSpanClass = 'md:col-span-1'; // Default for tablet

                // Desktop classes based on calculated colSpan
                if (colSpan === 3) colSpanClass += ' lg:col-span-3';
                else if (colSpan === 2) colSpanClass += ' lg:col-span-2';
                else colSpanClass += ' lg:col-span-1';

                // Tablet logic (simple 2-col grid)
                // If it's a large/full widget, make it span 2 on tablet
                if (baseSize === 'large' || baseSize === 'full') {
                  colSpanClass =
                    'md:col-span-2 ' +
                    colSpanClass
                      .split(' ')
                      .filter((c) => !c.startsWith('md:'))
                      .join(' ');
                }

                return (
                  <SortableWidget
                    key={widget.widgetId}
                    id={widget.widgetId}
                    editMode={editMode}
                    className={`${colSpanClass} min-h-[300px]`}
                  >
                    <div className="h-full">{getWidgetComponent(widget.widgetId)}</div>
                  </SortableWidget>
                );
              });
            })()}
          </motion.div>
        </SortableContext>
      </DndContext>

      {/* Widget Picker Dialog */}
      <Dialog open={isWidgetPickerOpen} onOpenChange={setIsWidgetPickerOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Manage Widgets</DialogTitle>
            <DialogDescription>
              Select the widgets you want to display on your dashboard.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-4">
              {Object.values(AVAILABLE_WIDGETS).map((widget) => {
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

// Sortable widget wrapper
function SortableWidget({
  id,
  children,
  editMode,
  className,
}: {
  id: string;
  children: React.ReactNode;
  editMode: boolean;
  className?: string;
}) {
  // Create a separate component to call hooks unconditionally
  return (
    <SortableItem id={id} editMode={editMode} className={className}>
      {children}
    </SortableItem>
  );
}

// Separate component that always calls hooks
function SortableItem({
  id,
  children,
  editMode,
  className,
}: {
  id: string;
  children: React.ReactNode;
  editMode: boolean;
  className?: string;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: editMode ? 'grab' : 'default',
    zIndex: isDragging ? 50 : 'auto', // Ensure dragged item is on top
  };

  return (
    <motion.div
      id={`widget-${id}`}
      ref={setNodeRef}
      style={style}
      variants={{
        hidden: { opacity: 0, y: 10 },
        show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
      }}
      animate={
        isDragging
          ? {
              scale: 1.02,
              rotate: 1,
              zIndex: 50,
              boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
            }
          : { scale: 1, rotate: 0, zIndex: 1, boxShadow: 'none' }
      }
      {...(editMode ? attributes : {})}
      {...(editMode ? listeners : {})}
      className={`${className || ''} ${editMode ? 'ring-2 ring-[#1C4D3A] ring-offset-2 rounded-lg' : ''}`}
    >
      {children}
    </motion.div>
  );
}
