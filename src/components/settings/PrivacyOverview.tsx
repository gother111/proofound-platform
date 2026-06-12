'use client';

import { useCallback, useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Shield,
  Download,
  Eye,
  Trash2,
  FileText,
  Database,
  Activity,
  MessagesSquare,
  Target,
  Settings,
  AlertTriangle,
  RefreshCcw,
} from 'lucide-react';
import { DataBreakdown } from '@/components/privacy/DataBreakdown';
import { DataExportFeedback } from '@/components/privacy/DataExportFeedback';
import { AuditLogTable } from './AuditLogTable';
import { DeleteAccount } from './DeleteAccount';
import { VisibilitySettingsModal } from '../privacy/VisibilitySettingsModal';
import { apiFetch } from '@/lib/api/fetch';
import { dispatchClientErrorDiagnostic } from '@/lib/client-diagnostics';
import { CLIENT_FF_DEFAULTS } from '@/lib/featureFlags';
import { buildUserExportDownloadFilename } from '@/lib/privacy/export-download';

interface PrivacyOverviewProps {
  userId: string;
  fullPageNavigation?: boolean;
}

type VisibilityCounts = {
  public: number;
  network_only: number;
  match_only: number;
  private: number;
};

const EMPTY_VISIBILITY_COUNTS: VisibilityCounts = {
  public: 0,
  network_only: 0,
  match_only: 0,
  private: 0,
};

export function PrivacyOverview({ userId, fullPageNavigation = false }: PrivacyOverviewProps) {
  const [showDataBreakdown, setShowDataBreakdown] = useState(false);
  const [showAuditLog, setShowAuditLog] = useState(false);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  const [showVisibilitySettings, setShowVisibilitySettings] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportFeedback, setExportFeedback] = useState<{
    kind: 'success' | 'error';
    title: string;
    message: string;
  } | null>(null);
  const [privacySummaryEnabled, setPrivacySummaryEnabled] = useState(
    CLIENT_FF_DEFAULTS.privacySummary
  );
  const [visibilityCounts, setVisibilityCounts] =
    useState<VisibilityCounts>(EMPTY_VISIBILITY_COUNTS);
  const [visibilitySummaryLoading, setVisibilitySummaryLoading] = useState(true);
  const [visibilitySummaryError, setVisibilitySummaryError] = useState<string | null>(null);

  const focusPageSection = (sectionId: string, block: ScrollLogicalPosition = 'start') => {
    const section = document.getElementById(sectionId);
    if (!section) return;

    section.scrollIntoView({ behavior: 'smooth', block });
    section.focus({ preventScroll: true });
  };

  const showInlineOrFocus = (
    sectionId: string,
    showInlineSection: () => void,
    block?: ScrollLogicalPosition
  ) => {
    if (fullPageNavigation) {
      focusPageSection(sectionId, block);
      return;
    }

    showInlineSection();
  };

  const loadVisibilitySummary = useCallback(async () => {
    setVisibilitySummaryLoading(true);
    setVisibilitySummaryError(null);

    try {
      const flagsResponse = await fetch('/api/feature-flags');
      let summaryEnabled = CLIENT_FF_DEFAULTS.privacySummary;
      if (flagsResponse.ok) {
        const flagsPayload = await flagsResponse.json();
        summaryEnabled = flagsPayload?.flags?.privacySummary !== false;
      }

      setPrivacySummaryEnabled(summaryEnabled);
      if (!summaryEnabled) return;

      const response = await apiFetch('/api/profile/privacy-settings');
      if (!response.ok) {
        throw new Error('Visibility summary request failed');
      }

      const payload = await response.json();
      const fieldVisibility = (payload?.fieldVisibility || {}) as Record<string, string>;
      const counts: VisibilityCounts = { ...EMPTY_VISIBILITY_COUNTS };
      Object.values(fieldVisibility).forEach((level) => {
        if (level === 'public') counts.public += 1;
        if (level === 'network_only') counts.network_only += 1;
        if (level === 'match_only') counts.match_only += 1;
        if (level === 'private') counts.private += 1;
      });
      setVisibilityCounts(counts);
    } catch (error) {
      setPrivacySummaryEnabled(CLIENT_FF_DEFAULTS.privacySummary);
      setVisibilitySummaryError(
        'We could not refresh this summary. Your saved field controls are still available below.'
      );
      dispatchClientErrorDiagnostic('settings.privacy_overview.visibility_summary_failed', error);
    } finally {
      setVisibilitySummaryLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadVisibilitySummary();
  }, [loadVisibilitySummary]);

  const getVisibilitySummaryText = (count: number) => {
    if (visibilitySummaryLoading) return 'Loading...';
    if (visibilitySummaryError) return 'Needs refresh';

    return `${count} ${count === 1 ? 'section' : 'sections'}`;
  };

  const handleExportData = async () => {
    setIsExporting(true);
    setExportFeedback(null);
    try {
      const response = await fetch('/api/user/export');
      if (!response.ok) {
        throw new Error('Export failed');
      }

      // Get the filename from the response headers or create one
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = buildUserExportDownloadFilename();
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setExportFeedback({
        kind: 'success',
        title: 'Export started',
        message:
          'Your data export is downloading. Keep this file private because it can include personal, proof, and assignment-review records.',
      });
    } catch (error) {
      dispatchClientErrorDiagnostic('settings.privacy_overview.export_failed', error);
      setExportFeedback({
        kind: 'error',
        title: 'Export could not start',
        message: 'We could not prepare your data export. Please try again in a moment.',
      });
    } finally {
      setIsExporting(false);
    }
  };

  if (showDataBreakdown) {
    return (
      <div>
        <Button variant="outline" onClick={() => setShowDataBreakdown(false)} className="mb-4">
          ← Back to Privacy Overview
        </Button>
        <DataBreakdown />
      </div>
    );
  }

  if (showAuditLog) {
    return (
      <div>
        <Button variant="outline" onClick={() => setShowAuditLog(false)} className="mb-4">
          ← Back to Privacy Overview
        </Button>
        <AuditLogTable userId={userId} />
      </div>
    );
  }

  if (showDeleteAccount) {
    return (
      <div>
        <Button variant="outline" onClick={() => setShowDeleteAccount(false)} className="mb-4">
          ← Back to Privacy Overview
        </Button>
        <DeleteAccount userId={userId} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card
        variant="bento"
        className="border-proofound-stone dark:border-border rounded-2xl bg-gradient-to-br from-proofound-parchment to-white dark:from-slate-800 dark:to-slate-900"
      >
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <div className="w-fit shrink-0 rounded-lg bg-proofound-forest/10 p-3 dark:bg-proofound-forest/20">
              <Shield className="h-6 w-6 text-proofound-forest dark:text-proofound-parchment" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-2xl font-['Crimson_Pro'] font-semibold text-proofound-charcoal dark:text-foreground mb-2">
                Your Privacy Controls
              </h2>
              <p className="break-words text-proofound-charcoal/70 dark:text-muted-foreground mb-4">
                Review what can appear on your Public Page, what stays private until assignment
                review, and where export or deletion controls live.
              </p>
              <div className="grid grid-cols-1 gap-3 sm:flex sm:flex-wrap">
                <Button
                  onClick={() => setShowVisibilitySettings(true)}
                  className="w-full justify-center bg-proofound-forest hover:bg-proofound-forest/90 sm:w-auto"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Privacy settings
                </Button>
                <Button
                  variant="outline"
                  onClick={handleExportData}
                  disabled={isExporting}
                  className="w-full justify-center sm:w-auto"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {isExporting ? 'Preparing...' : 'Download my data'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => showInlineOrFocus('privacy-activity', () => setShowAuditLog(true))}
                  className="w-full justify-center sm:w-auto"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View account history
                </Button>
              </div>
              {exportFeedback ? (
                <DataExportFeedback
                  kind={exportFeedback.kind}
                  title={exportFeedback.title}
                  className="mt-4"
                  actionLabel={exportFeedback.kind === 'error' ? 'Retry export' : undefined}
                  actionDisabled={isExporting}
                  onAction={exportFeedback.kind === 'error' ? handleExportData : undefined}
                >
                  {exportFeedback.message}
                </DataExportFeedback>
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Categories */}
      {privacySummaryEnabled ? (
        <Card variant="bento" className="border-proofound-stone dark:border-border rounded-xl">
          <CardHeader>
            <CardTitle className="text-xl font-['Crimson_Pro']">What others can see</CardTitle>
            <CardDescription>
              Visibility summary across Public Page, trusted review context, assignment review, and
              private sections
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {visibilitySummaryError ? (
              <div
                role="alert"
                aria-live="polite"
                className="rounded-xl border border-[#FCD34D] bg-[#FFFBEB] p-4 dark:border-yellow-800 dark:bg-yellow-950/20"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex min-w-0 gap-3">
                    <AlertTriangle
                      className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#D97706]"
                      aria-hidden="true"
                    />
                    <div>
                      <p className="font-medium text-[#92400E] dark:text-yellow-100">
                        Visibility summary needs a refresh
                      </p>
                      <p className="mt-1 text-sm text-[#92400E] dark:text-yellow-200">
                        {visibilitySummaryError}
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      void loadVisibilitySummary();
                    }}
                    className="w-full border-[#D97706] text-[#92400E] hover:bg-[#FEF3C7] sm:w-auto dark:border-yellow-700 dark:text-yellow-100 dark:hover:bg-yellow-950/40"
                  >
                    <RefreshCcw className="h-4 w-4" aria-hidden="true" />
                    Retry summary
                  </Button>
                </div>
              </div>
            ) : null}
            <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2 md:grid-cols-4">
              <div className="rounded-lg border p-3">
                <p className="font-medium">Public</p>
                <p className="text-muted-foreground">
                  {getVisibilitySummaryText(visibilityCounts.public)}
                </p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="font-medium">Trusted review context</p>
                <p className="text-muted-foreground">
                  {getVisibilitySummaryText(visibilityCounts.network_only)}
                </p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="font-medium">Assignment review</p>
                <p className="text-muted-foreground">
                  {getVisibilitySummaryText(visibilityCounts.match_only)}
                </p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="font-medium">Private</p>
                <p className="text-muted-foreground">
                  {getVisibilitySummaryText(visibilityCounts.private)}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowVisibilitySettings(true)}>
                Preview visibility
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card variant="bento" className="border-proofound-stone dark:border-border rounded-xl">
        <CardHeader>
          <CardTitle className="text-lg font-['Crimson_Pro']">Quick privacy fixes</CardTitle>
          <CardDescription>
            Three fast actions to review Public Page and assignment-review visibility before sharing
            proof.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-2 md:grid-cols-3">
          <Button
            variant="outline"
            className="h-auto py-3 text-left"
            onClick={() =>
              showInlineOrFocus('privacy-field-visibility', () => setShowVisibilitySettings(true))
            }
          >
            <span className="font-medium">Review field visibility</span>
          </Button>
          <Button
            variant="outline"
            className="h-auto py-3 text-left"
            onClick={() => showInlineOrFocus('privacy-activity', () => setShowAuditLog(true))}
          >
            <span className="font-medium">Check privacy audit log</span>
          </Button>
          <Button
            variant="outline"
            className="h-auto py-3 text-left"
            onClick={handleExportData}
            disabled={isExporting}
          >
            <span className="font-medium">
              {isExporting ? 'Exporting data...' : 'Export and inspect my data'}
            </span>
          </Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Profile Data */}
        <Card
          variant="bento"
          className="border-proofound-stone dark:border-border rounded-xl hover:shadow-md transition-shadow"
        >
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-proofound-parchment p-2 dark:bg-proofound-parchment/10">
                  <Database className="h-5 w-5 text-proofound-forest dark:text-proofound-parchment" />
                </div>
                <div>
                  <CardTitle className="text-lg font-['Crimson_Pro']">Profile data</CardTitle>
                  <p className="text-xs text-proofound-charcoal/60 dark:text-muted-foreground mt-0.5">
                    Personal
                  </p>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-proofound-charcoal/70 dark:text-muted-foreground mb-3">
              <strong>Includes:</strong> Name, email, location, bio, avatar
            </p>
            <p className="text-sm text-proofound-charcoal/70 dark:text-muted-foreground mb-3">
              <strong>Purpose:</strong> Create your profile and support assignment-review
              preferences
            </p>
            <p className="text-sm text-proofound-charcoal/70 dark:text-muted-foreground">
              <strong>Visibility:</strong> Controlled by your profile settings
            </p>
          </CardContent>
        </Card>

        {/* Proof skills and evidence */}
        <Card
          variant="bento"
          className="border-proofound-stone dark:border-border rounded-xl hover:shadow-md transition-shadow"
        >
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-proofound-forest/10 p-2 dark:bg-proofound-forest/20">
                  <Target className="h-5 w-5 text-proofound-forest dark:text-proofound-parchment" />
                </div>
                <div>
                  <CardTitle className="text-lg font-['Crimson_Pro']">
                    Proof skills and work evidence
                  </CardTitle>
                  <p className="text-xs text-proofound-charcoal/60 dark:text-muted-foreground mt-0.5">
                    Sensitive
                  </p>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-proofound-charcoal/70 dark:text-muted-foreground mb-3">
              <strong>Includes:</strong> Skills, experience, education, proof, verifications
            </p>
            <p className="text-sm text-proofound-charcoal/70 dark:text-muted-foreground mb-3">
              <strong>Purpose:</strong> Support proof-led assignment reviews with evidence you
              control
            </p>
            <p className="text-sm text-proofound-charcoal/70 dark:text-muted-foreground">
              <strong>Visibility:</strong> Available only inside assignment-review surfaces that
              match your visibility and reveal state
            </p>
          </CardContent>
        </Card>

        {/* Projects & Work History */}
        <Card
          variant="bento"
          className="border-proofound-stone dark:border-border rounded-xl hover:shadow-md transition-shadow"
        >
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-[#F8E7D4] p-2 dark:bg-proofound-terracotta/20">
                  <FileText className="h-5 w-5 text-proofound-terracotta dark:text-proofound-parchment" />
                </div>
                <div>
                  <CardTitle className="text-lg font-['Crimson_Pro']">
                    Projects & work history
                  </CardTitle>
                  <p className="text-xs text-proofound-charcoal/60 dark:text-muted-foreground mt-0.5">
                    Sensitive
                  </p>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-proofound-charcoal/70 dark:text-muted-foreground mb-3">
              <strong>Includes:</strong> Projects, experiences, impact stories
            </p>
            <p className="text-sm text-proofound-charcoal/70 dark:text-muted-foreground mb-3">
              <strong>Purpose:</strong> Provide context for Proof Packs and assignment-specific
              review
            </p>
            <p className="text-sm text-proofound-charcoal/70 dark:text-muted-foreground">
              <strong>Retention:</strong> 90 days after account deletion
            </p>
          </CardContent>
        </Card>

        {/* Assignment review history */}
        <Card
          variant="bento"
          className="border-proofound-stone dark:border-border rounded-xl hover:shadow-md transition-shadow"
        >
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-proofound-stone/40 p-2 dark:bg-proofound-stone/10">
                  <MessagesSquare className="h-5 w-5 text-proofound-forest dark:text-proofound-parchment" />
                </div>
                <div>
                  <CardTitle className="text-lg font-['Crimson_Pro']">
                    Assignment review history
                  </CardTitle>
                  <p className="text-xs text-proofound-charcoal/60 dark:text-muted-foreground mt-0.5">
                    Operational
                  </p>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-proofound-charcoal/70 dark:text-muted-foreground mb-3">
              <strong>Includes:</strong> Assignment reviews, proof submissions, conversations
            </p>
            <p className="text-sm text-proofound-charcoal/70 dark:text-muted-foreground mb-3">
              <strong>Purpose:</strong> Connect you with assignment-review workflows
            </p>
            <p className="text-sm text-proofound-charcoal/70 dark:text-muted-foreground">
              <strong>Retention:</strong> Immediate deletion request handling with required legal
              safeguards
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Card */}
      <Card variant="bento" className="border-proofound-stone dark:border-border rounded-xl">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
              <Activity className="h-5 w-5 text-slate-600 dark:text-slate-300" />
            </div>
            <div>
              <CardTitle className="text-lg font-['Crimson_Pro']">Analytics</CardTitle>
              <CardDescription>Privacy-protected product usage</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-proofound-charcoal/70 dark:text-muted-foreground">
            <strong>Includes:</strong> Page views, clicks, and privacy-protected usage details
          </p>
          <p className="text-sm text-proofound-charcoal/70 dark:text-muted-foreground">
            <strong>Purpose:</strong> Improve product quality and user experience
          </p>
          <p className="text-sm text-proofound-charcoal/70 dark:text-muted-foreground">
            <strong>Retention:</strong> Auto-deleted after 90 days
          </p>
          <div className="bg-blue-50 dark:bg-slate-800 border border-blue-200 dark:border-blue-900 rounded-lg p-3 mt-4">
            <p className="text-xs text-blue-800 dark:text-blue-300">
              Network details are protected before storage and cannot be read back as your original
              device or address information.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Your Rights */}
      <Card variant="bento" className="border-proofound-stone dark:border-border rounded-xl">
        <CardHeader>
          <CardTitle className="text-xl font-['Crimson_Pro']">Your rights</CardTitle>
          <CardDescription>
            Under GDPR and CCPA, you have the following rights over your data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">Right to access</p>
              <p className="text-xs text-proofound-charcoal/60 dark:text-muted-foreground">
                Download your data
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Right to deletion</p>
              <p className="text-xs text-proofound-charcoal/60 dark:text-muted-foreground">
                Delete your account immediately and irreversibly
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Right to portability</p>
              <p className="text-xs text-proofound-charcoal/60 dark:text-muted-foreground">
                Move your data in a reusable format
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Right to object</p>
              <p className="text-xs text-proofound-charcoal/60 dark:text-muted-foreground">
                Opt out of marketing communications anytime
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Button
          variant="outline"
          className="h-auto py-4 flex-col items-start"
          onClick={() => showInlineOrFocus('privacy-data', () => setShowDataBreakdown(true))}
        >
          <Database className="h-5 w-5 mb-2" />
          <span className="font-medium">View your data</span>
          <span className="text-xs text-muted-foreground mt-1">
            Review stored data categories and export your data
          </span>
        </Button>

        <Button
          variant="outline"
          className="h-auto py-4 flex-col items-start"
          onClick={() => showInlineOrFocus('privacy-activity', () => setShowAuditLog(true))}
        >
          <Eye className="h-5 w-5 mb-2" />
          <span className="font-medium">View account history</span>
          <span className="text-xs text-muted-foreground mt-1">
            Last 50 actions with timestamps
          </span>
        </Button>

        <Button
          variant="outline"
          className="h-auto py-4 flex-col items-start border-red-200 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950"
          onClick={() =>
            showInlineOrFocus('privacy-delete', () => setShowDeleteAccount(true), 'end')
          }
        >
          <Trash2 className="h-5 w-5 mb-2 text-red-600 dark:text-red-400" />
          <span className="font-medium text-red-600 dark:text-red-400">Delete Account</span>
          <span className="text-xs text-muted-foreground mt-1">Permanently remove your data</span>
        </Button>
      </div>

      {/* Learn More */}
      <Card variant="bento" className="border-proofound-stone dark:border-border rounded-xl">
        <CardContent className="pt-6">
          <p className="text-sm text-proofound-charcoal/70 dark:text-muted-foreground">
            Learn more about how we protect your privacy in our{' '}
            <a href="/privacy-policy" className="text-proofound-forest hover:underline">
              Privacy Policy
            </a>{' '}
            or contact us at{' '}
            <a href="mailto:privacy@proofound.io" className="text-proofound-forest hover:underline">
              privacy@proofound.io
            </a>
          </p>
        </CardContent>
      </Card>

      {/* Visibility Settings Modal */}
      <VisibilitySettingsModal
        open={showVisibilitySettings}
        onOpenChange={setShowVisibilitySettings}
      />
    </div>
  );
}
