'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Shield,
  Download,
  Upload,
  Eye,
  Trash2,
  FileText,
  Database,
  Activity,
  MessagesSquare,
  Target,
  Settings,
} from 'lucide-react';
import { DataBreakdown } from '@/components/privacy/DataBreakdown';
import { AuditLogTable } from './AuditLogTable';
import { DeleteAccount } from './DeleteAccount';
import { EnhancedDataImportDialog } from './EnhancedDataImportDialog';
import { VisibilitySettingsModal } from '../privacy/VisibilitySettingsModal';
import { apiFetch } from '@/lib/api/fetch';
import { CLIENT_FF_DEFAULTS } from '@/lib/featureFlags';
import { buildUserExportDownloadFilename } from '@/lib/privacy/export-download';

interface PrivacyOverviewProps {
  userId: string;
  fullPageNavigation?: boolean;
}

export function PrivacyOverview({ userId, fullPageNavigation = false }: PrivacyOverviewProps) {
  const [showDataBreakdown, setShowDataBreakdown] = useState(false);
  const [showAuditLog, setShowAuditLog] = useState(false);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  const [showVisibilitySettings, setShowVisibilitySettings] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [privacySummaryEnabled, setPrivacySummaryEnabled] = useState(
    CLIENT_FF_DEFAULTS.privacySummary
  );
  const [visibilityCounts, setVisibilityCounts] = useState({
    public: 0,
    network_only: 0,
    match_only: 0,
    private: 0,
  });

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

  useEffect(() => {
    void (async () => {
      try {
        const flagsResponse = await fetch('/api/feature-flags');
        if (flagsResponse.ok) {
          const flagsPayload = await flagsResponse.json();
          setPrivacySummaryEnabled(flagsPayload?.flags?.privacySummary !== false);
        }

        const response = await apiFetch('/api/profile/privacy-settings');
        if (!response.ok) return;
        const payload = await response.json();
        const fieldVisibility = (payload?.fieldVisibility || {}) as Record<string, string>;
        const counts = {
          public: 0,
          network_only: 0,
          match_only: 0,
          private: 0,
        };
        Object.values(fieldVisibility).forEach((level) => {
          if (level === 'public') counts.public += 1;
          if (level === 'network_only') counts.network_only += 1;
          if (level === 'match_only') counts.match_only += 1;
          if (level === 'private') counts.private += 1;
        });
        setVisibilityCounts(counts);
      } catch (error) {
        console.error('Failed to load visibility summary', error);
      }
    })();
  }, []);

  const handleExportData = async () => {
    setIsExporting(true);
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
    } catch (error) {
      console.error('Failed to export data:', error);
      alert('Failed to export data. Please try again.');
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
        className="border-proofound-stone dark:border-border rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-900"
      >
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <div className="w-fit shrink-0 p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Shield className="h-6 w-6 text-blue-600 dark:text-blue-300" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-2xl font-['Crimson_Pro'] font-semibold text-proofound-charcoal dark:text-foreground mb-2">
                Your Privacy Controls
              </h2>
              <p className="break-words text-proofound-charcoal/70 dark:text-muted-foreground mb-4">
                Proofound is built with privacy at its core. Here&apos;s what data we collect and
                how you control it.
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
                  onClick={() => setShowImportDialog(true)}
                  className="w-full justify-center sm:w-auto"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Import data
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
              Visibility summary across Public, Connections, After match, and Private sections
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2 md:grid-cols-4">
              <div className="rounded-lg border p-3">
                <p className="font-medium">Public</p>
                <p className="text-muted-foreground">{visibilityCounts.public} sections</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="font-medium">Connections</p>
                <p className="text-muted-foreground">{visibilityCounts.network_only} sections</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="font-medium">After match</p>
                <p className="text-muted-foreground">{visibilityCounts.match_only} sections</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="font-medium">Private</p>
                <p className="text-muted-foreground">{visibilityCounts.private} sections</p>
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
            Three fast actions to review and correct visibility before sharing your profile.
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
                <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                  <Database className="h-5 w-5 text-purple-600 dark:text-purple-300" />
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
              <strong>Purpose:</strong> Create your profile and match you with opportunities
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
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                  <Target className="h-5 w-5 text-green-600 dark:text-green-300" />
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
              <strong>Purpose:</strong> Help match you with relevant opportunities
            </p>
            <p className="text-sm text-proofound-charcoal/70 dark:text-muted-foreground">
              <strong>Visibility:</strong> Visible to matched organizations
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
                <div className="p-2 bg-amber-100 dark:bg-amber-900 rounded-lg">
                  <FileText className="h-5 w-5 text-amber-600 dark:text-amber-300" />
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
              <strong>Purpose:</strong> Showcase your work and impact
            </p>
            <p className="text-sm text-proofound-charcoal/70 dark:text-muted-foreground">
              <strong>Retention:</strong> 90 days after account deletion
            </p>
          </CardContent>
        </Card>

        {/* Match History */}
        <Card
          variant="bento"
          className="border-proofound-stone dark:border-border rounded-xl hover:shadow-md transition-shadow"
        >
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <MessagesSquare className="h-5 w-5 text-blue-600 dark:text-blue-300" />
                </div>
                <div>
                  <CardTitle className="text-lg font-['Crimson_Pro']">Match history</CardTitle>
                  <p className="text-xs text-proofound-charcoal/60 dark:text-muted-foreground mt-0.5">
                    Operational
                  </p>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-proofound-charcoal/70 dark:text-muted-foreground mb-3">
              <strong>Includes:</strong> Matches, applications, conversations
            </p>
            <p className="text-sm text-proofound-charcoal/70 dark:text-muted-foreground mb-3">
              <strong>Purpose:</strong> Connect you with opportunities
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
            <a
              href="mailto:privacy@proofound.com"
              className="text-proofound-forest hover:underline"
            >
              privacy@proofound.com
            </a>
          </p>
        </CardContent>
      </Card>

      {/* Visibility Settings Modal */}
      <VisibilitySettingsModal
        open={showVisibilitySettings}
        onOpenChange={setShowVisibilitySettings}
      />

      {/* Enhanced Data Import Dialog */}
      <EnhancedDataImportDialog open={showImportDialog} onOpenChange={setShowImportDialog} />
    </div>
  );
}
