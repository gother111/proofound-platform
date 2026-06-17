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
import { AlertTriangle, Lock, TrendingUp, Megaphone, CheckCircle2 } from 'lucide-react';
import {
  getCookiePreferences,
  saveCookiePreferences,
  CookiePreferences as CookiePreferencesType,
} from '@/lib/cookies/consent';
import { toast } from 'sonner';
import { dispatchClientErrorDiagnostic } from '@/lib/client-diagnostics';

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
      'Help us understand how Proofound is working so we can improve product quality and fix bugs.',
    icon: TrendingUp,
    locked: false,
    examples: 'Page views, feature usage, performance metrics',
  },
  {
    id: 'marketing' as const,
    title: 'Marketing Cookies',
    description:
      'Used only for relevant Proofound updates and campaign measurement when you allow them.',
    icon: Megaphone,
    locked: false,
    examples: 'Campaign attribution, consented update measurement',
  },
];

const COOKIE_PREFERENCES_SAVE_FAILED_MESSAGE =
  'Cookie preferences could not be fully saved. Your choices are still shown here; please try again before leaving.';

interface CookiePreferencesProps {
  onSave?: () => void;
}

export function CookiePreferencesLoading() {
  return (
    <div
      aria-busy="true"
      aria-live="polite"
      className="rounded-2xl border border-proofound-stone/80 bg-white/80 p-5 shadow-sm"
      role="status"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        Consent controls
      </p>
      <h2 className="mt-2 font-display text-xl font-semibold text-proofound-charcoal">
        Loading cookie preferences
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
        Your saved choices are being read from this browser. Essential security cookies stay on;
        optional analytics and marketing remain unchanged while preferences load.
      </p>
    </div>
  );
}

export function CookiePreferences({ onSave }: CookiePreferencesProps) {
  // State for cookie preferences
  const [preferences, setPreferences] = useState<CookiePreferencesType | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

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
    setSaveError(null);
  };

  // Handle save
  const handleSave = async () => {
    if (!preferences) return;

    setIsSaving(true);
    setSaveError(null);
    try {
      await saveCookiePreferences({
        essential: true,
        analytics: preferences.analytics,
        marketing: preferences.marketing,
      });

      toast.success('Cookie preferences saved successfully');
      setHasChanges(false);
      setSaveError(null);

      // Callback for parent component
      if (onSave) {
        onSave();
      }
    } catch (error) {
      dispatchClientErrorDiagnostic('cookies.preferences.save_failed', error);
      setSaveError(COOKIE_PREFERENCES_SAVE_FAILED_MESSAGE);
      toast.error(COOKIE_PREFERENCES_SAVE_FAILED_MESSAGE);
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
    setSaveError(null);
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
    setSaveError(null);
  };

  if (!preferences) {
    return (
      <div className="py-6">
        <CookiePreferencesLoading />
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

      {saveError ? (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <p>{saveError}</p>
        </div>
      ) : null}

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
