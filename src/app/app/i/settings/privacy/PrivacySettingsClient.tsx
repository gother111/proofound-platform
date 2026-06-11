'use client';

import { useState, useEffect } from 'react';
import { IndividualFieldVisibilityControls } from '@/components/profile/IndividualFieldVisibilityControls';
import { PrivacyOverview } from '@/components/settings/PrivacyOverview';
import { DataBreakdown } from '@/components/privacy/DataBreakdown';
import { AuditLogTable } from '@/components/privacy/AuditLogTable';
import { DeleteAccountSection } from '@/components/privacy/DeleteAccountSection';
import { toast } from 'sonner';
import { AppSurface } from '@/components/ui/v2/AppSurface';
import { dispatchClientErrorDiagnostic } from '@/lib/client-diagnostics';
import { PrivacySettingsLoadingShell } from './PrivacySettingsLoadingShell';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

export function PrivacySettingsClient() {
  const [initialVisibility, setInitialVisibility] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [visibilityLoadError, setVisibilityLoadError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch existing visibility settings
    async function fetchVisibility() {
      try {
        setVisibilityLoadError(null);
        const response = await fetch('/api/profile/visibility');
        if (!response.ok) {
          throw new Error('Visibility preferences could not be loaded.');
        }
        const data = await response.json();
        setInitialVisibility(data);
      } catch (error) {
        dispatchClientErrorDiagnostic('privacy_settings.client.visibility_fetch_failed', error);
        setVisibilityLoadError(
          error instanceof Error && error.message
            ? error.message
            : 'Visibility preferences could not be loaded.'
        );
        toast.error('Failed to load privacy settings');
      } finally {
        setLoading(false);
      }
    }

    fetchVisibility();
  }, []);

  const handleSave = async (visibility: any) => {
    try {
      const response = await fetch('/api/profile/visibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(visibility),
      });

      if (!response.ok) {
        throw new Error('Failed to save');
      }

      return Promise.resolve();
    } catch (error) {
      dispatchClientErrorDiagnostic('privacy_settings.client.visibility_save_failed', error);
      return Promise.reject(error);
    }
  };

  if (loading) {
    return <PrivacySettingsLoadingShell status="Preparing privacy settings..." />;
  }

  return (
    <AppSurface>
      <div className="mx-auto w-full min-w-0 max-w-4xl">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-semibold text-foreground">Privacy Settings</h1>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Control Public Page details, assignment-review visibility, and data controls
          </p>
        </div>

        <div className="space-y-6">
          {visibilityLoadError ? (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Privacy preferences need a refresh</AlertTitle>
              <AlertDescription>
                {visibilityLoadError} The controls below are showing safe defaults until the latest
                saved preferences can be loaded.
              </AlertDescription>
            </Alert>
          ) : null}

          {/* Privacy Overview */}
          <PrivacyOverview userId="current" fullPageNavigation />

          {/* Data Breakdown */}
          <section id="privacy-data" className="scroll-mt-24" tabIndex={-1}>
            <DataBreakdown />
          </section>

          {/* Field Visibility Controls */}
          <section id="privacy-field-visibility" className="scroll-mt-24" tabIndex={-1}>
            <IndividualFieldVisibilityControls
              userId="current"
              initialVisibility={initialVisibility || {}}
              onSave={handleSave}
            />
          </section>

          {/* Audit Log */}
          <section id="privacy-activity" className="scroll-mt-24" tabIndex={-1}>
            <AuditLogTable />
          </section>

          {/* Delete Account */}
          <section id="privacy-delete" className="scroll-mt-24" tabIndex={-1}>
            <DeleteAccountSection />
          </section>
        </div>
      </div>
    </AppSurface>
  );
}
