'use client';

/**
 * Cookie Preferences Component
 *
 * Displays granular cookie category toggles for user control
 * Shows Essential (locked), Analytics, and Marketing cookies
 * Allows users to enable/disable optional categories
 *
 * Used in: /cookies/settings page
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Lock, TrendingUp, Megaphone, CheckCircle2 } from 'lucide-react';
import {
  getCookiePreferences,
  saveCookiePreferences,
  CookiePreferences as CookiePreferencesType,
} from '@/lib/cookies/consent';
import { toast } from 'sonner';

// Cookie category configuration
const COOKIE_CATEGORIES = [
  {
    id: 'essential' as const,
    title: 'Essential Cookies',
    description:
      'Required for authentication and core functionality. These cookies are necessary for the website to work and cannot be disabled.',
    icon: Lock,
    locked: true,
    examples: 'Session management, security, CSRF protection',
  },
  {
    id: 'analytics' as const,
    title: 'Analytics Cookies',
    description:
      'Help us understand how you use our platform so we can improve your experience. We use this data to optimize performance and fix bugs.',
    icon: TrendingUp,
    locked: false,
    examples: 'Page views, feature usage, performance metrics',
  },
  {
    id: 'marketing' as const,
    title: 'Marketing Cookies',
    description:
      'Used to show you relevant content and advertisements. These cookies help us understand which campaigns work best.',
    icon: Megaphone,
    locked: false,
    examples: 'Ad targeting, campaign tracking, social media pixels',
  },
];

interface CookiePreferencesProps {
  onSave?: () => void;
}

export function CookiePreferences({ onSave }: CookiePreferencesProps) {
  // State for cookie preferences
  const [preferences, setPreferences] = useState<CookiePreferencesType | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Load preferences on mount
  useEffect(() => {
    const currentPreferences = getCookiePreferences();
    setPreferences(currentPreferences);
  }, []);

  // Handle toggle change
  const handleToggle = (categoryId: 'essential' | 'analytics' | 'marketing') => {
    if (!preferences) return;

    // Can't toggle essential cookies
    if (categoryId === 'essential') {
      toast.error('Essential cookies cannot be disabled');
      return;
    }

    setPreferences({
      ...preferences,
      [categoryId]: !preferences[categoryId],
    });
    setHasChanges(true);
  };

  // Handle save
  const handleSave = async () => {
    if (!preferences) return;

    setIsSaving(true);
    try {
      await saveCookiePreferences({
        essential: true,
        analytics: preferences.analytics,
        marketing: preferences.marketing,
      });

      toast.success('Cookie preferences saved successfully');
      setHasChanges(false);

      // Callback for parent component
      if (onSave) {
        onSave();
      }
    } catch (error) {
      console.error('Failed to save preferences:', error);
      toast.error('Failed to save preferences. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle accept all
  const handleAcceptAll = async () => {
    if (!preferences) return;

    setPreferences({
      ...preferences,
      essential: true,
      analytics: true,
      marketing: true,
    });
    setHasChanges(true);
  };

  // Handle reject all (except essential)
  const handleRejectAll = async () => {
    if (!preferences) return;

    setPreferences({
      ...preferences,
      essential: true,
      analytics: false,
      marketing: false,
    });
    setHasChanges(true);
  };

  if (!preferences) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Loading preferences...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quick actions */}
      <div className="flex gap-3">
        <Button onClick={handleAcceptAll} variant="default" size="sm" disabled={isSaving}>
          Accept All
        </Button>
        <Button onClick={handleRejectAll} variant="outline" size="sm" disabled={isSaving}>
          Reject All (Essential Only)
        </Button>
      </div>

      {/* Cookie categories */}
      <div className="space-y-4">
        {COOKIE_CATEGORIES.map((category) => {
          const Icon = category.icon;
          const isEnabled = preferences[category.id];

          return (
            <Card key={category.id} className={category.locked ? 'border-muted' : ''}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div
                      className={`mt-1 p-2 rounded-lg ${
                        category.locked
                          ? 'bg-muted text-muted-foreground'
                          : isEnabled
                            ? 'bg-primary/10 text-primary'
                            : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base">{category.title}</CardTitle>
                        {category.locked && (
                          <span className="text-xs text-muted-foreground">(Always Active)</span>
                        )}
                      </div>
                      <CardDescription className="mt-1.5 text-sm">
                        {category.description}
                      </CardDescription>
                    </div>
                  </div>

                  {/* Toggle switch */}
                  <div className="flex items-center gap-2 ml-4">
                    <Switch
                      id={category.id}
                      checked={isEnabled}
                      onCheckedChange={() => handleToggle(category.id)}
                      disabled={category.locked || isSaving}
                      className={category.locked ? 'opacity-60' : ''}
                    />
                    <Label htmlFor={category.id} className="sr-only">
                      Toggle {category.title}
                    </Label>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-0 pb-4">
                <div className="ml-14">
                  <p className="text-xs text-muted-foreground">
                    <strong>Examples:</strong> {category.examples}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Save button */}
      <div className="flex items-center justify-between pt-4 border-t">
        <div className="flex items-center gap-2 text-sm">
          {hasChanges ? (
            <>
              <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-muted-foreground">Unsaved changes</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="text-muted-foreground">All changes saved</span>
            </>
          )}
        </div>

        <Button onClick={handleSave} disabled={!hasChanges || isSaving} size="lg">
          {isSaving ? 'Saving...' : 'Save Preferences'}
        </Button>
      </div>

      {/* Last updated timestamp */}
      <div className="text-xs text-muted-foreground text-center pt-2">
        Last updated: {new Date(preferences.timestamp).toLocaleString()}
      </div>
    </div>
  );
}
