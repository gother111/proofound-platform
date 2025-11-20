/**
 * Draggable Dashboard Component
 *
 * Allows users to reorder dashboard widgets via drag-and-drop
 * Persists layout to database
 *
 * REQUIRES: npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
 */

'use client';

import { useState, useEffect } from 'react';
import { WhileAwayCard } from './WhileAwayCard';
import { GoalsCard } from './GoalsCard';
import { TasksCard } from './TasksCard';
import { ProjectsCard } from './ProjectsCard';
import { MatchingResultsCard } from './MatchingResultsCard';
import { ImpactSnapshotCard } from './ImpactSnapshotCard';
import { ExploreCard } from './ExploreCard';
import { GapMapWidget } from './GapMapWidget';
import { NextBestActionsWidget } from './NextBestActionsWidget';
import { Button } from '@/components/ui/button';
import { Settings2, Save, RotateCcw, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { DashboardWidget, AVAILABLE_WIDGETS, WidgetSize } from '@/lib/dashboard/layout';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';

// Try to import dnd-kit packages, fallback to null if not installed
let DndContext: any = null;
let SortableContext: any = null;
let useSortable: any = null;
let verticalListSortingStrategy: any = null;
let CSS: any = null;

try {
  const dndCore = require('@dnd-kit/core');
  const dndSortable = require('@dnd-kit/sortable');
  const dndUtilities = require('@dnd-kit/utilities');

  DndContext = dndCore.DndContext;
  SortableContext = dndSortable.SortableContext;
  useSortable = dndSortable.useSortable;
  verticalListSortingStrategy = dndSortable.verticalListSortingStrategy;
  CSS = dndUtilities.CSS;
} catch (e) {
  console.warn('@dnd-kit packages not installed. Drag-and-drop will be disabled.');
}

interface DraggableDashboardProps {
  initialLayout?: DashboardWidget[];
}

export function DraggableDashboard({ initialLayout }: DraggableDashboardProps) {
  const [layout, setLayout] = useState<DashboardWidget[]>(initialLayout || []);
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isWidgetPickerOpen, setIsWidgetPickerOpen] = useState(false);

  useEffect(() => {
    // Fetch user's layout from API
    async function fetchLayout() {
      try {
        const response = await fetch('/api/dashboard/layout');
        if (response.ok) {
          const data = await response.json();
          setLayout(data.widgets || []);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard layout:', error);
      } finally {
        setLoading(false);
      }
    }

    if (!initialLayout) {
      fetchLayout();
    } else {
      setLoading(false);
    }
  }, [initialLayout]);

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      setLayout((items) => {
        const oldIndex = items.findIndex((item) => item.widgetId === active.id);
        const newIndex = items.findIndex((item) => item.widgetId === over.id);

        const newItems = [...items];
        const [moved] = newItems.splice(oldIndex, 1);
        newItems.splice(newIndex, 0, moved);

        // Update positions
        return newItems.map((item, index) => ({
          ...item,
          position: index,
        }));
      });
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/dashboard/layout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ widgets: layout }),
      });

      if (response.ok) {
        toast.success('Dashboard layout saved!');
        setEditMode(false);
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
        setLayout(data.widgets || []);
        toast.success('Layout reset to default');
      }
    } catch (error) {
      console.error('Error resetting layout:', error);
      toast.error('Failed to reset layout');
    }
  };

  const handleToggleWidget = (widgetId: string, checked: boolean) => {
    setLayout((prev) => {
      const existingIndex = prev.findIndex((w) => w.widgetId === widgetId);
      
      if (existingIndex >= 0) {
        // Toggle visibility of existing widget
        const newLayout = [...prev];
        newLayout[existingIndex] = {
          ...newLayout[existingIndex],
          visible: checked,
        };
        return newLayout;
      } else if (checked) {
        // Add new widget
        const config = AVAILABLE_WIDGETS[widgetId];
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

  const getWidgetComponent = (widgetId: string) => {
    switch (widgetId) {
      case 'while-away':
        return <WhileAwayCard />;
      case 'goals':
        return <GoalsCard />;
      case 'tasks':
        return <TasksCard />;
      case 'projects':
        return <ProjectsCard />;
      case 'matching-results':
        return <MatchingResultsCard />;
      case 'impact-snapshot':
        return <ImpactSnapshotCard />;
      case 'explore':
        return <ExploreCard />;
      case 'gap-map':
        return <GapMapWidget />;
      case 'next-best-actions':
        return <NextBestActionsWidget />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="animate-pulse bg-white rounded-lg h-64 border border-gray-200"
          ></div>
        ))}
      </div>
    );
  }

  // Filter to only show visible widgets
  const visibleWidgets = layout.filter((w) => w.visible);

  // Show empty state if no widgets
  if (visibleWidgets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 bg-white rounded-lg border border-gray-200">
        <p className="text-lg font-medium text-[#2D3330] mb-2">No dashboard widgets configured</p>
        <p className="text-sm text-[#6B6760] text-center mb-4">
          Customize your dashboard to see the information that matters most to you
        </p>
        <Button onClick={() => setEditMode(true)} className="bg-[#1C4D3A] hover:bg-[#1C4D3A]/90">
          <Settings2 className="w-4 h-4 mr-2" />
          Configure Dashboard
        </Button>
      </div>
    );
  }

  // If dnd-kit is not installed, render static layout
  if (!DndContext || !SortableContext) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-[#6B6760]">
            Install @dnd-kit packages to enable drag-and-drop customization
          </p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {visibleWidgets.map((widget) => (
            <div key={widget.widgetId}>{getWidgetComponent(widget.widgetId)}</div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Edit Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {editMode && (
            <p className="text-sm text-[#6B6760]">
              Drag widgets to reorder • {layout.filter((w) => w.visible).length} widgets shown
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {editMode && (
            <>
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
                className="bg-[#4A5943] text-white hover:bg-[#3C4936]"
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
                : 'bg-[#4A5943] text-white hover:bg-[#3C4936]'
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {visibleWidgets.map((widget) => (
              <SortableWidget key={widget.widgetId} id={widget.widgetId} editMode={editMode}>
                {getWidgetComponent(widget.widgetId)}
              </SortableWidget>
            ))}
          </div>
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
                const isVisible = layout.find(
                  (w) => w.widgetId === widget.id && w.visible
                );
                return (
                  <div key={widget.id} className="flex items-start space-x-3 p-2 rounded hover:bg-muted/50">
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
                      <p className="text-xs text-muted-foreground">
                        {widget.description}
                      </p>
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
}: {
  id: string;
  children: React.ReactNode;
  editMode: boolean;
}) {
  // If dnd-kit is not available, render without drag functionality
  if (!useSortable || !CSS) {
    return <div>{children}</div>;
  }

  // Create a separate component to call hooks unconditionally
  return (
    <SortableItem id={id} editMode={editMode}>
      {children}
    </SortableItem>
  );
}

// Separate component that always calls hooks
function SortableItem({
  id,
  children,
  editMode,
}: {
  id: string;
  children: React.ReactNode;
  editMode: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: editMode ? 'grab' : 'default',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(editMode ? attributes : {})}
      {...(editMode ? listeners : {})}
      className={editMode ? 'ring-2 ring-[#4A5943] ring-offset-2 rounded-lg' : ''}
    >
      {children}
    </div>
  );
}
