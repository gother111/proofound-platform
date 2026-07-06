'use client';

import { useCallback, useEffect, useState } from 'react';
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
import { AlertTriangle, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

const PRIVACY_SECTION_IDS = new Set([
  'privacy-data',
  'privacy-field-visibility',
  'privacy-activity',
  'privacy-delete',
]);
const PRIVACY_ANCHOR_OFFSET_PX = 24;
const PRIVACY_VISIBILITY_LOAD_RETRY_MESSAGE = 'Saved privacy preferences could not be loaded.';
const PRIVACY_VISIBILITY_LOAD_TOAST_DESCRIPTION =
  'Safe defaults are shown until retry succeeds. Retry before editing visibility controls.';

function getScrollableParent(element: HTMLElement): HTMLElement | null {
  let parent = element.parentElement;

  while (parent && parent !== document.body) {
    const overflowY = window.getComputedStyle(parent).overflowY;
    const canScroll = overflowY === 'auto' || overflowY === 'scroll';

    if (canScroll && parent.scrollHeight > parent.clientHeight) {
      return parent;
    }

    parent = parent.parentElement;
  }

  return null;
}

export function PrivacySettingsClient() {
  const [initialVisibility, setInitialVisibility] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [visibilityRefreshing, setVisibilityRefreshing] = useState(false);
  const [visibilityLoadError, setVisibilityLoadError] = useState<string | null>(null);

  const fetchVisibility = useCallback(async ({ initial = false }: { initial?: boolean } = {}) => {
    if (initial) {
      setLoading(true);
    } else {
      setVisibilityRefreshing(true);
    }

    try {
      if (initial) {
        setVisibilityLoadError(null);
      }

      const response = await fetch('/api/profile/visibility');
      if (!response.ok) {
        throw new Error('Visibility preferences could not be loaded.');
      }
      const data = await response.json();
      setInitialVisibility(data);
      setVisibilityLoadError(null);
    } catch (error) {
      dispatchClientErrorDiagnostic('privacy_settings.client.visibility_fetch_failed', error);
      setVisibilityLoadError(PRIVACY_VISIBILITY_LOAD_RETRY_MESSAGE);
      toast.error('Privacy preferences need a refresh', {
        description: PRIVACY_VISIBILITY_LOAD_TOAST_DESCRIPTION,
      });
    } finally {
      if (initial) {
        setLoading(false);
      } else {
        setVisibilityRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    void fetchVisibility({ initial: true });
  }, [fetchVisibility]);

  useEffect(() => {
    if (loading || typeof window === 'undefined') return;

    const sectionId = window.location.hash.replace('#', '');
    if (!PRIVACY_SECTION_IDS.has(sectionId)) return;

    const focusHashedSection = (behavior: ScrollBehavior) => {
      const section = document.getElementById(sectionId);
      if (!section) return;

      const scrollParent = getScrollableParent(section);
      if (scrollParent) {
        const parentRect = scrollParent.getBoundingClientRect();
        const sectionRect = section.getBoundingClientRect();
        const nextScrollTop =
          scrollParent.scrollTop + sectionRect.top - parentRect.top - PRIVACY_ANCHOR_OFFSET_PX;

        if (typeof scrollParent.scrollTo === 'function') {
          scrollParent.scrollTo({ top: nextScrollTop, behavior });
        } else {
          scrollParent.scrollTop = nextScrollTop;
        }
      } else {
        section.scrollIntoView({ behavior, block: 'start' });
      }
      section.focus({ preventScroll: true });
    };

    const animationFrame = window.requestAnimationFrame(() => focusHashedSection('smooth'));
    const settleTimer = window.setTimeout(() => focusHashedSection('auto'), 350);
    const lateSettleTimer = window.setTimeout(() => focusHashedSection('auto'), 900);
    let mutationSettleTimer: number | null = null;
    const observerTarget = document.getElementById('main-content') || document.body;
    const mutationObserver =
      typeof window.MutationObserver === 'function'
        ? new window.MutationObserver(() => {
            if (mutationSettleTimer) {
              window.clearTimeout(mutationSettleTimer);
            }

            mutationSettleTimer = window.setTimeout(() => focusHashedSection('auto'), 120);
          })
        : null;
    mutationObserver?.observe(observerTarget, { childList: true, subtree: true });
    const observerStopTimer = window.setTimeout(() => mutationObserver?.disconnect(), 7000);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.clearTimeout(settleTimer);
      window.clearTimeout(lateSettleTimer);
      window.clearTimeout(observerStopTimer);
      if (mutationSettleTimer) {
        window.clearTimeout(mutationSettleTimer);
      }
      mutationObserver?.disconnect();
    };
  }, [loading]);

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
                <span>
                  {visibilityLoadError} The controls below are showing safe defaults until the
                  latest saved preferences can be loaded.
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => void fetchVisibility()}
                  disabled={visibilityRefreshing}
                  className="mt-3 min-h-[44px] w-full gap-2 bg-white/70 sm:w-auto"
                >
                  <RefreshCcw className="h-4 w-4" aria-hidden="true" />
                  {visibilityRefreshing ? 'Retrying...' : 'Retry privacy preferences'}
                </Button>
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
              controlsDisabledReason={
                visibilityLoadError
                  ? 'Saved privacy preferences did not load, so Proofound is showing safe defaults here. Retry privacy preferences before editing to avoid overwriting saved visibility choices.'
                  : null
              }
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
