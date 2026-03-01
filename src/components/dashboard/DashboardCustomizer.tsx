/**
 * Dashboard Customizer Component
 *
 * Allows users to customize their dashboard with drag-and-drop
 * - Add/remove tiles
 * - Reorder tiles
 * - Change tile sizes
 *
 * PRD References:
 * - Part 5: F2 - Dashboard Customization
 * - Part 12: Task success ≥90%, drop-off <10%
 */

'use client';

import { useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { GlassCard } from '@/components/ui/glass-card';
import { Eye, EyeOff, Plus, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DashboardTile } from './DashboardTile';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';

export interface DashboardWidget {
  widgetId: string;
  position: number;
  visible: boolean;
  size: 'small' | 'default' | 'large';
  settings: Record<string, any>;
}

interface AvailableWidget {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  defaultSize: 'small' | 'default' | 'large';
}

const AVAILABLE_WIDGETS: AvailableWidget[] = [
  {
    id: 'matches',
    name: 'Top Matches',
    description: 'Your best matching opportunities',
    icon: '🎯',
    defaultSize: 'default',
  },
  {
    id: 'applications',
    name: 'Applications',
    description: 'Track your application status',
    icon: '📝',
    defaultSize: 'default',
  },
  {
    id: 'expertise-depth',
    name: 'Expertise Depth',
    description: 'Your skill proficiency levels',
    icon: '⚡',
    defaultSize: 'small',
  },
  {
    id: 'next-action',
    name: 'Next Best Action',
    description: 'Recommended next steps',
    icon: '💡',
    defaultSize: 'default',
  },
  {
    id: 'zen-hub',
    name: 'Well-Being Check',
    description: 'Quick well-being status',
    icon: '🧘',
    defaultSize: 'small',
  },
  {
    id: 'profile-completion',
    name: 'Profile Progress',
    description: 'Your profile completion status',
    icon: '📊',
    defaultSize: 'small',
  },
  {
    id: 'recent-activity',
    name: 'Recent Activity',
    description: 'Your latest actions and updates',
    icon: '📌',
    defaultSize: 'default',
  },
];

interface DashboardCustomizerProps {
  userId: string;
  onClose?: () => void;
}

export function DashboardCustomizer({ userId, onClose }: DashboardCustomizerProps) {
  const [widgets, setWidgets] = useState<DashboardWidget[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    loadLayout();
  }, [userId]);

  const loadLayout = async () => {
    try {
      const response = await fetch('/api/dashboard/layout');
      if (response.ok) {
        const data = await response.json();
        setWidgets(data.layout || []);
      }
    } catch (error) {
      console.error('Failed to load dashboard layout:', error);
      toast.error('Failed to load dashboard layout');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setWidgets((items) => {
        const oldIndex = items.findIndex((item) => item.widgetId === active.id);
        const newIndex = items.findIndex((item) => item.widgetId === over.id);

        const reordered = arrayMove(items, oldIndex, newIndex);
        // Update positions
        return reordered.map((item, index) => ({
          ...item,
          position: index,
        }));
      });
      setHasChanges(true);
    }
  };

  const handleToggleVisibility = (widgetId: string) => {
    setWidgets((items) =>
      items.map((item) => (item.widgetId === widgetId ? { ...item, visible: !item.visible } : item))
    );
    setHasChanges(true);
  };

  const handleAddWidget = (widgetDef: AvailableWidget) => {
    const exists = widgets.find((w) => w.widgetId === widgetDef.id);
    if (exists) {
      // Just make it visible
      handleToggleVisibility(widgetDef.id);
    } else {
      // Add new widget
      const newWidget: DashboardWidget = {
        widgetId: widgetDef.id,
        position: widgets.length,
        visible: true,
        size: widgetDef.defaultSize,
        settings: {},
      };
      setWidgets((items) => [...items, newWidget]);
      setHasChanges(true);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/dashboard/layout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ layout: widgets }),
      });

      if (!response.ok) {
        throw new Error('Failed to save layout');
      }

      toast.success('Dashboard layout saved successfully');
      setHasChanges(false);

      if (onClose) {
        onClose();
      }
    } catch (error) {
      console.error('Failed to save dashboard layout:', error);
      toast.error('Failed to save dashboard layout');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    loadLayout();
    setHasChanges(false);
    toast.info('Changes discarded');
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 bg-transparent">
        <GlassCard className="col-span-1 md:col-span-12">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Loading dashboard layout...</p>
          </CardContent>
        </GlassCard>
      </div>
    );
  }

  const visibleWidgets = widgets.filter((w) => w.visible);
  const hiddenWidgets = widgets.filter((w) => !w.visible);

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 bg-transparent">
      {/* Configuration Header */}
      <GlassCard className="col-span-1 md:col-span-12">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-proofound-forest" />
              <CardTitle>Customize Your Dashboard</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              {hasChanges && (
                <>
                  <Button variant="outline" size="sm" onClick={handleReset}>
                    Discard
                  </Button>
                  <Button size="sm" onClick={handleSave} disabled={isSaving}>
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </>
              )}
              {!hasChanges && onClose && (
                <Button variant="outline" size="sm" onClick={onClose}>
                  Close
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </GlassCard>

      <div className="col-span-1 md:col-span-12 grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Active Widgets */}
        <GlassCard className="col-span-1 md:col-span-8 border-primary/20 bg-primary/5">
          <CardHeader className="shrink-0 pb-4 border-b bg-background/50 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Eye className="h-4 w-4 text-primary" /> Active Widgets
              </h3>
              <Badge variant="secondary">{visibleWidgets.length} active</Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-3">
              {visibleWidgets.length > 0 ? (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={visibleWidgets.map((w) => w.widgetId)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2">
                      {visibleWidgets.map((widget) => {
                        // Find widget definition
                        const widgetDef = AVAILABLE_WIDGETS.find((w) => w.id === widget.widgetId);
                        return (
                          <DashboardTile
                            key={widget.widgetId}
                            id={widget.widgetId}
                            title={widgetDef?.name || widget.widgetId}
                            description={widgetDef?.description || ''}
                            icon={widgetDef?.icon || '📦'}
                            visible={widget.visible}
                            onToggleVisibility={() => handleToggleVisibility(widget.widgetId)}
                          />
                        );
                      })}
                    </div>
                  </SortableContext>
                </DndContext>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No active widgets. Add some from the available widgets below.
                </p>
              )}
            </div>
          </CardContent>
        </GlassCard>

        {/* Hidden Widgets */}
        <div className="col-span-1 md:col-span-4 flex flex-col gap-6">
          <GlassCard className="bg-muted/20">
            <CardHeader className="shrink-0 pb-4 border-b bg-background/50 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                  <EyeOff className="h-4 w-4" /> Available Widgets
                </h3>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-6">
                  {hiddenWidgets.length > 0 && (
                    <div className="space-y-3">
                      <div className="space-y-2">
                        {hiddenWidgets.map((widget) => {
                          const widgetDef = AVAILABLE_WIDGETS.find((w) => w.id === widget.widgetId);
                          return (
                            <div
                              key={widget.widgetId}
                              className="flex items-center justify-between p-3 bg-japandi-bg rounded-lg"
                            >
                              <div className="flex items-center gap-3">
                                <span className="text-2xl">{widgetDef?.icon || '📦'}</span>
                                <div>
                                  <p className="text-sm font-medium text-foreground">
                                    {widgetDef?.name || widget.widgetId}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {widgetDef?.description}
                                  </p>
                                </div>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleToggleVisibility(widget.widgetId)}
                              >
                                Show
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="space-y-3 pt-4 border-t border-proofound-stone">
                    <h3 className="text-sm font-semibold text-foreground">Library</h3>
                    <div className="grid grid-cols-1 gap-3">
                      {AVAILABLE_WIDGETS.filter(
                        (widgetDef) => !widgets.find((w) => w.widgetId === widgetDef.id)
                      ).map((widgetDef) => (
                        <div
                          key={widgetDef.id}
                          className="flex items-center justify-between p-3 border border-proofound-stone rounded-lg hover:border-proofound-forest transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{widgetDef.icon}</span>
                            <div>
                              <p className="text-sm font-medium text-foreground">
                                {widgetDef.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {widgetDef.description}
                              </p>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAddWidget(widgetDef)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </CardContent>
          </GlassCard>

          {/* Help Text */}
          <GlassCard className="bg-primary/5 border-primary/20">
            <CardContent className="p-4">
              <p className="font-medium text-primary mb-1">💡 Customization Tips</p>
              <ul className="list-disc list-inside space-y-0.5 text-primary text-sm">
                <li>Drag widgets to reorder them</li>
                <li>Toggle visibility to hide widgets you don't use</li>
                <li>Add new widgets from the available widgets section</li>
                <li>Your layout is saved automatically</li>
              </ul>
            </CardContent>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
