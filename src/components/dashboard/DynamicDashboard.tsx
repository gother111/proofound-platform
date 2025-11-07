/**
 * Dynamic Dashboard Component
 *
 * Renders dashboard tiles based on user's customized layout
 * Loads layout from dashboard_layouts table
 *
 * PRD References:
 * - Part 5: F2 - Dashboard Customization
 * - Part 7: Dashboard loads < 2.0s P75
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings, Loader2, AlertCircle } from 'lucide-react';
import { DashboardCustomizer, type DashboardWidget } from './DashboardCustomizer';

interface DynamicDashboardProps {
  userId: string;
}

export function DynamicDashboard({ userId }: DynamicDashboardProps) {
  const [layout, setLayout] = useState<DashboardWidget[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCustomizer, setShowCustomizer] = useState(false);

  useEffect(() => {
    loadLayout();
  }, [userId]);

  const loadLayout = async () => {
    try {
      const response = await fetch('/api/dashboard/layout');
      if (response.ok) {
        const data = await response.json();
        setLayout(data.layout || []);
      }
    } catch (error) {
      console.error('Failed to load dashboard layout:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 text-[#1C4D3A] animate-spin" />
      </div>
    );
  }

  const visibleWidgets = layout.filter((w) => w.visible).sort((a, b) => a.position - b.position);

  return (
    <div className="space-y-6">
      {/* Customizer Toggle */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-[#2D3330]">Dashboard</h2>
        <Button variant="outline" size="sm" onClick={() => setShowCustomizer(!showCustomizer)}>
          <Settings className="h-4 w-4 mr-2" />
          {showCustomizer ? 'Close' : 'Customize'}
        </Button>
      </div>

      {/* Customizer */}
      {showCustomizer && (
        <DashboardCustomizer
          userId={userId}
          onClose={() => {
            setShowCustomizer(false);
            loadLayout(); // Reload layout after customization
          }}
        />
      )}

      {/* Dashboard Widgets */}
      {!showCustomizer && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleWidgets.map((widget) => (
            <DashboardWidgetRenderer key={widget.widgetId} widget={widget} />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!showCustomizer && visibleWidgets.length === 0 && (
        <Card>
          <CardContent className="pt-12 pb-12 text-center">
            <AlertCircle className="h-12 w-12 text-[#9B9891] mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-[#2D3330] mb-2">No Dashboard Widgets</h3>
            <p className="text-sm text-[#6B6760] mb-4">
              Customize your dashboard to add widgets that matter to you.
            </p>
            <Button onClick={() => setShowCustomizer(true)}>
              <Settings className="h-4 w-4 mr-2" />
              Customize Dashboard
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/**
 * Widget Renderer - renders the appropriate component for each widget type
 */
function DashboardWidgetRenderer({ widget }: { widget: DashboardWidget }) {
  const sizeClasses = {
    small: 'col-span-1',
    default: 'md:col-span-1',
    large: 'md:col-span-2',
  };

  const widgetContent = getWidgetContent(widget.widgetId);

  return (
    <div className={sizeClasses[widget.size]}>
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <span>{widgetContent.icon}</span>
            <span>{widgetContent.title}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>{widgetContent.content}</CardContent>
      </Card>
    </div>
  );
}

/**
 * Get widget content based on widget ID
 */
function getWidgetContent(widgetId: string): {
  icon: string;
  title: string;
  content: React.ReactNode;
} {
  const widgets: Record<string, { icon: string; title: string; content: React.ReactNode }> = {
    matches: {
      icon: '🎯',
      title: 'Top Matches',
      content: (
        <div className="text-sm text-[#6B6760]">
          <p className="mb-2">Your best matching opportunities</p>
          <div className="space-y-2">
            <div className="p-3 bg-[#F5F4F0] rounded">
              <p className="font-medium text-[#2D3330]">Senior Engineer @ TechCorp</p>
              <p className="text-xs text-[#9B9891]">95% match</p>
            </div>
            <div className="p-3 bg-[#F5F4F0] rounded">
              <p className="font-medium text-[#2D3330]">Product Lead @ ImpactCo</p>
              <p className="text-xs text-[#9B9891]">92% match</p>
            </div>
          </div>
        </div>
      ),
    },
    applications: {
      icon: '📝',
      title: 'Applications',
      content: (
        <div className="text-sm text-[#6B6760]">
          <p>Track your application status</p>
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between">
              <span>In Review</span>
              <span className="font-semibold text-[#2D3330]">3</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Interviews</span>
              <span className="font-semibold text-[#2D3330]">1</span>
            </div>
          </div>
        </div>
      ),
    },
    'expertise-depth': {
      icon: '⚡',
      title: 'Expertise Depth',
      content: (
        <div className="text-sm text-[#6B6760]">
          <p>Your skill proficiency levels</p>
          <div className="mt-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs">L4 Skills</span>
              <span className="text-xs font-semibold text-[#2D3330]">12</span>
            </div>
            <div className="h-2 bg-[#F5F4F0] rounded-full overflow-hidden">
              <div className="h-full w-3/4 bg-[#1C4D3A]" />
            </div>
          </div>
        </div>
      ),
    },
    'next-action': {
      icon: '💡',
      title: 'Next Best Action',
      content: (
        <div className="text-sm text-[#6B6760]">
          <p className="mb-3">Recommended next steps to improve your profile:</p>
          <ul className="space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-[#1C4D3A]">→</span>
              <span>Add 3 more L4 skills to reach activation threshold</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#1C4D3A]">→</span>
              <span>Upload proof for your top skills</span>
            </li>
          </ul>
        </div>
      ),
    },
    'zen-hub': {
      icon: '🧘',
      title: 'Well-Being Check',
      content: (
        <div className="text-sm text-[#6B6760]">
          <p>How are you feeling today?</p>
          <div className="mt-4 flex items-center justify-center gap-4">
            <button className="text-3xl hover:scale-110 transition-transform">😊</button>
            <button className="text-3xl hover:scale-110 transition-transform">😐</button>
            <button className="text-3xl hover:scale-110 transition-transform">😔</button>
          </div>
        </div>
      ),
    },
    'profile-completion': {
      icon: '📊',
      title: 'Profile Progress',
      content: (
        <div className="text-sm text-[#6B6760]">
          <p className="mb-3">Your profile is 75% complete</p>
          <div className="h-3 bg-[#F5F4F0] rounded-full overflow-hidden mb-2">
            <div className="h-full w-3/4 bg-[#1C4D3A]" />
          </div>
          <p className="text-xs">Add 5 more skills to reach 100%</p>
        </div>
      ),
    },
    'recent-activity': {
      icon: '📌',
      title: 'Recent Activity',
      content: (
        <div className="text-sm text-[#6B6760] space-y-2">
          <div className="flex items-start gap-2">
            <span className="text-xs text-[#9B9891]">2h ago</span>
            <span>Applied to Senior Engineer role</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-xs text-[#9B9891]">1d ago</span>
            <span>Added React skill</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-xs text-[#9B9891]">2d ago</span>
            <span>Completed well-being check-in</span>
          </div>
        </div>
      ),
    },
  };

  return (
    widgets[widgetId] || {
      icon: '📦',
      title: widgetId,
      content: <p className="text-sm text-[#9B9891]">Widget content coming soon</p>,
    }
  );
}
