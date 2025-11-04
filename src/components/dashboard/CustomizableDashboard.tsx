/**
 * Customizable Dashboard Component
 *
 * Allows users to add/remove widgets, drag-and-drop to rearrange, and save layout
 * Implements PRD requirement for personalized dashboard experience
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Layout, 
  Plus, 
  GripVertical, 
  X, 
  Save, 
  RotateCcw,
  TrendingUp,
  Target,
  Heart,
  Briefcase,
  Calendar,
} from 'lucide-react';
import { toast } from 'sonner';

interface DashboardWidget {
  id: string;
  type: string;
  title: string;
  description: string;
  icon: any;
  size: 'small' | 'medium' | 'large';
  enabled: boolean;
  order: number;
}

interface CustomizableDashboardProps {
  userId: string;
  persona: 'individual' | 'org_member';
}

const AVAILABLE_WIDGETS = {
  individual: [
    {
      id: 'goals',
      type: 'goals',
      title: 'Active Goals',
      description: 'Track your current career goals',
      icon: Target,
      size: 'medium' as const,
    },
    {
      id: 'matching',
      type: 'matching',
      title: 'Top Matches',
      description: 'Your best opportunity matches',
      icon: TrendingUp,
      size: 'large' as const,
    },
    {
      id: 'wellbeing',
      type: 'wellbeing',
      title: 'Well-Being Check',
      description: 'Recent stress & control levels',
      icon: Heart,
      size: 'small' as const,
    },
    {
      id: 'schedule',
      type: 'schedule',
      title: 'Work Schedule',
      description: 'Weekly hours and burnout risk',
      icon: Calendar,
      size: 'medium' as const,
    },
    {
      id: 'skills-gap',
      type: 'skills-gap',
      title: 'Skills Gap',
      description: 'Skills to develop for your goals',
      icon: Briefcase,
      size: 'medium' as const,
    },
  ],
  org_member: [
    {
      id: 'assignments',
      type: 'assignments',
      title: 'Active Assignments',
      description: 'Your published opportunities',
      icon: Briefcase,
      size: 'large' as const,
    },
    {
      id: 'candidates',
      type: 'candidates',
      title: 'Top Candidates',
      description: 'Best matches for your roles',
      icon: TrendingUp,
      size: 'medium' as const,
    },
    {
      id: 'org-goals',
      type: 'org-goals',
      title: 'Organization Goals',
      description: 'Track organizational objectives',
      icon: Target,
      size: 'medium' as const,
    },
  ],
};

const PERSONA_PRESETS = {
  individual: {
    'Job Seeker': ['goals', 'matching', 'skills-gap', 'wellbeing'],
    'Career Builder': ['matching', 'skills-gap', 'goals', 'schedule'],
    'Well-Being Focused': ['wellbeing', 'schedule', 'matching', 'goals'],
  },
  org_member: {
    'Recruiter': ['candidates', 'assignments', 'org-goals'],
    'Hiring Manager': ['assignments', 'candidates', 'org-goals'],
  },
};

export function CustomizableDashboard({ userId, persona }: CustomizableDashboardProps) {
  const [widgets, setWidgets] = useState<DashboardWidget[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showAddWidget, setShowAddWidget] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const availableWidgets = AVAILABLE_WIDGETS[persona] || [];

  useEffect(() => {
    fetchLayout();
  }, []);

  const fetchLayout = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/dashboard/layout');
      if (response.ok) {
        const data = await response.json();
        if (data.widgets && data.widgets.length > 0) {
          setWidgets(data.widgets);
        } else {
          // Load default layout
          loadDefaultLayout();
        }
      } else {
        loadDefaultLayout();
      }
    } catch (error) {
      console.error('Failed to fetch dashboard layout:', error);
      loadDefaultLayout();
    } finally {
      setIsLoading(false);
    }
  };

  const loadDefaultLayout = () => {
    const defaultWidgets = availableWidgets.slice(0, 4).map((widget, index) => ({
      ...widget,
      enabled: true,
      order: index,
    }));
    setWidgets(defaultWidgets);
  };

  const handleSaveLayout = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/dashboard/layout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ widgets }),
      });

      if (!response.ok) {
        throw new Error('Failed to save layout');
      }

      toast.success('Dashboard layout saved');
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Failed to save layout:', error);
      toast.error('Failed to save dashboard layout');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddWidget = (widgetId: string) => {
    const widgetTemplate = availableWidgets.find((w) => w.id === widgetId);
    if (!widgetTemplate) return;

    const newWidget: DashboardWidget = {
      ...widgetTemplate,
      enabled: true,
      order: widgets.length,
    };

    setWidgets([...widgets, newWidget]);
    setHasUnsavedChanges(true);
    setShowAddWidget(false);
    toast.success(`${widgetTemplate.title} added to dashboard`);
  };

  const handleRemoveWidget = (widgetId: string) => {
    setWidgets((prev) =>
      prev
        .filter((w) => w.id !== widgetId)
        .map((w, index) => ({ ...w, order: index }))
    );
    setHasUnsavedChanges(true);
    toast.info('Widget removed');
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newWidgets = [...widgets];
    const draggedWidget = newWidgets[draggedIndex];
    newWidgets.splice(draggedIndex, 1);
    newWidgets.splice(index, 0, draggedWidget);

    // Update order
    newWidgets.forEach((w, i) => {
      w.order = i;
    });

    setWidgets(newWidgets);
    setDraggedIndex(index);
    setHasUnsavedChanges(true);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleApplyPreset = (presetName: string) => {
    const preset = PERSONA_PRESETS[persona][presetName as keyof typeof PERSONA_PRESETS[typeof persona]];
    if (!preset) return;

    const presetWidgets = preset
      .map((widgetId, index) => {
        const template = availableWidgets.find((w) => w.id === widgetId);
        if (!template) return null;
        return {
          ...template,
          enabled: true,
          order: index,
        };
      })
      .filter((w): w is DashboardWidget => w !== null);

    setWidgets(presetWidgets);
    setHasUnsavedChanges(true);
    toast.success(`${presetName} preset applied`);
  };

  const handleResetToDefault = () => {
    loadDefaultLayout();
    setHasUnsavedChanges(true);
    toast.info('Reset to default layout');
  };

  const enabledWidgets = widgets.filter((w) => w.enabled);
  const availableToAdd = availableWidgets.filter(
    (aw) => !widgets.some((w) => w.id === aw.id)
  );

  if (isLoading) {
    return (
      <div className="text-center py-8 text-[#6B6760] dark:text-muted-foreground">
        Loading dashboard...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Dashboard Controls */}
      <Card className="border-proofound-stone dark:border-border rounded-2xl">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="font-['Crimson_Pro'] text-proofound-charcoal dark:text-foreground flex items-center gap-2">
                <Layout className="w-5 h-5" />
                Customize Dashboard
              </CardTitle>
              <CardDescription className="text-proofound-charcoal/70 dark:text-muted-foreground">
                Drag widgets to rearrange, add new ones, or apply presets
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetToDefault}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </Button>
              <Button
                onClick={handleSaveLayout}
                disabled={!hasUnsavedChanges || isSaving}
                className="bg-[#1C4D3A] text-white"
                size="sm"
              >
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save Layout'}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Preset Selection */}
          <div className="flex items-center gap-3">
            <Label className="text-sm font-medium">Quick Presets:</Label>
            <div className="flex flex-wrap gap-2">
              {Object.keys(PERSONA_PRESETS[persona]).map((presetName) => (
                <Button
                  key={presetName}
                  variant="outline"
                  size="sm"
                  onClick={() => handleApplyPreset(presetName)}
                >
                  {presetName}
                </Button>
              ))}
            </div>
          </div>

          {/* Add Widget Button */}
          {availableToAdd.length > 0 && (
            <Dialog open={showAddWidget} onOpenChange={setShowAddWidget}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Widget ({availableToAdd.length} available)
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Widget</DialogTitle>
                  <DialogDescription>
                    Choose a widget to add to your dashboard
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-2">
                  {availableToAdd.map((widget) => {
                    const Icon = widget.icon;
                    return (
                      <button
                        key={widget.id}
                        onClick={() => handleAddWidget(widget.id)}
                        className="w-full text-left p-3 rounded-lg border border-[#E8E6DD] dark:border-border hover:bg-[#F7F6F1] dark:hover:bg-background/50"
                      >
                        <div className="flex items-start gap-3">
                          <Icon className="w-5 h-5 text-[#1C4D3A] mt-0.5" />
                          <div className="flex-1">
                            <p className="font-medium text-[#2D3330] dark:text-foreground">
                              {widget.title}
                            </p>
                            <p className="text-sm text-[#6B6760] dark:text-muted-foreground">
                              {widget.description}
                            </p>
                          </div>
                          <Badge variant="outline">{widget.size}</Badge>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </DialogContent>
            </Dialog>
          )}

          {hasUnsavedChanges && (
            <Badge variant="outline" className="border-yellow-500 text-yellow-700 bg-yellow-50">
              Unsaved changes
            </Badge>
          )}
        </CardContent>
      </Card>

      {/* Widgets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {enabledWidgets.map((widget, index) => {
          const Icon = widget.icon;
          return (
            <div
              key={widget.id}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={`
                ${widget.size === 'large' ? 'md:col-span-2' : ''}
                ${widget.size === 'small' ? 'md:col-span-1' : ''}
                ${draggedIndex === index ? 'opacity-50' : ''}
                transition-opacity cursor-move
              `}
            >
              <Card className="border-proofound-stone dark:border-border rounded-2xl hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <GripVertical className="w-4 h-4 text-[#6B6760] cursor-grab active:cursor-grabbing" />
                      <Icon className="w-5 h-5 text-[#1C4D3A]" />
                      <CardTitle className="text-lg font-['Crimson_Pro']">
                        {widget.title}
                      </CardTitle>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveWidget(widget.id)}
                      className="h-8 w-8"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  <CardDescription>{widget.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-[#6B6760] dark:text-muted-foreground text-sm">
                    Widget content will be displayed here
                  </div>
                </CardContent>
              </Card>
            </div>
          );
        })}
      </div>

      {enabledWidgets.length === 0 && (
        <Card className="border-dashed border-2 border-[#E8E6DD] dark:border-border rounded-2xl">
          <CardContent className="py-12 text-center">
            <Layout className="w-12 h-12 mx-auto mb-4 text-[#6B6760]" />
            <p className="text-[#2D3330] dark:text-foreground font-medium mb-2">
              No widgets added yet
            </p>
            <p className="text-sm text-[#6B6760] dark:text-muted-foreground mb-4">
              Add widgets to customize your dashboard experience
            </p>
            <Button onClick={() => setShowAddWidget(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Widget
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

