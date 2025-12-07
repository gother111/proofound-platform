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
import { motion } from 'framer-motion';
import { DashboardCustomizer, type DashboardWidget } from './DashboardCustomizer';
import { ExpertiseDepthWidget } from './ExpertiseDepthWidget';

interface DynamicDashboardProps {
  userId: string;
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

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
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  const visibleWidgets = layout.filter((w) => w.visible).sort((a, b) => a.position - b.position);

  return (
    <div className="space-y-6">
      {/* Customizer Toggle */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold font-display text-foreground">Dashboard</h2>
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
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 grid-flow-dense auto-rows-min"
        >
          {visibleWidgets.map((widget) => (
            <DashboardWidgetRenderer key={widget.widgetId} widget={widget} />
          ))}
        </motion.div>
      )}

      {/* Empty State */}
      {!showCustomizer && visibleWidgets.length === 0 && (
        <Card className="glass-card">
          <CardContent className="pt-12 pb-12 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold font-display text-foreground mb-2">
              No Dashboard Widgets
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
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
    full: 'col-span-full',
  };

  const widgetContent = getWidgetContent(widget.widgetId);

  // Force "Next Best Action" to be full width to avoid gaps
  const size = widget.widgetId === 'next-action' ? 'full' : widget.size;

  return (
    <motion.div variants={item} className={sizeClasses[size] || sizeClasses.default}>
      <Card className="h-full min-h-[300px] glass-card hover:shadow-md hover:scale-[1.01] transition-all duration-300">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2 font-display text-foreground">
            <span>{widgetContent.icon}</span>
            <span>{widgetContent.title}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>{widgetContent.content}</CardContent>
      </Card>
    </motion.div>
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
        <div className="text-sm text-muted-foreground">
          <p className="mb-2">Your best matching opportunities</p>
          <div className="space-y-2">
            <div className="p-3 bg-secondary/10 rounded border border-secondary/20">
              <p className="font-medium text-foreground">Senior Engineer @ TechCorp</p>
              <p className="text-xs text-muted-foreground">95% match</p>
            </div>
            <div className="p-3 bg-secondary/10 rounded border border-secondary/20">
              <p className="font-medium text-foreground">Product Lead @ ImpactCo</p>
              <p className="text-xs text-muted-foreground">92% match</p>
            </div>
          </div>
        </div>
      ),
    },
    applications: {
      icon: '📝',
      title: 'Applications',
      content: (
        <div className="text-sm text-muted-foreground">
          <p>Track your application status</p>
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between">
              <span>In Review</span>
              <span className="font-semibold text-foreground">3</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Interviews</span>
              <span className="font-semibold text-foreground">1</span>
            </div>
          </div>
        </div>
      ),
    },
    'expertise-depth': {
      icon: '⚡',
      title: 'Expertise Depth',
      content: <ExpertiseDepthWidget />,
    },
    'next-action': {
      icon: '💡',
      title: 'Next Best Action',
      content: (
        <div className="text-sm text-muted-foreground">
          <p className="mb-3">Recommended next steps to improve your profile:</p>
          <ul className="space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-primary">→</span>
              <span>Add 3 more L4 skills to reach activation threshold</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">→</span>
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
        <div className="text-sm text-muted-foreground">
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
        <div className="text-sm text-muted-foreground">
          <p className="mb-3">Your profile is 75% complete</p>
          <div className="h-3 bg-secondary/10 rounded-full overflow-hidden mb-2">
            <div className="h-full w-3/4 bg-primary" />
          </div>
          <p className="text-xs">Add 5 more skills to reach 100%</p>
        </div>
      ),
    },
    'recent-activity': {
      icon: '📌',
      title: 'Recent Activity',
      content: (
        <div className="text-sm text-muted-foreground space-y-2">
          <div className="flex items-start gap-2">
            <span className="text-xs text-muted-foreground">2h ago</span>
            <span>Applied to Senior Engineer role</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-xs text-muted-foreground">1d ago</span>
            <span>Added React skill</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-xs text-muted-foreground">2d ago</span>
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
      content: <p className="text-sm text-muted-foreground">Widget content coming soon</p>,
    }
  );
}
