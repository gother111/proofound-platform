'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, Download, Eye, Trash2, FileText, Database, Activity, MessagesSquare, Target } from 'lucide-react';
import { DataBreakdown } from './DataBreakdown';
import { AuditLogTable } from './AuditLogTable';
import { DeleteAccount } from './DeleteAccount';

interface PrivacyOverviewProps {
  userId: string;
}

export function PrivacyOverview({ userId }: PrivacyOverviewProps) {
  const [showDataBreakdown, setShowDataBreakdown] = useState(false);
  const [showAuditLog, setShowAuditLog] = useState(false);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

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
      a.download = `proofound-data-export-${new Date().toISOString().split('T')[0]}.json`;
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
        <Button
          variant="outline"
          onClick={() => setShowDataBreakdown(false)}
          className="mb-4"
        >
          ← Back to Privacy Overview
        </Button>
        <DataBreakdown userId={userId} />
      </div>
    );
  }

  if (showAuditLog) {
    return (
      <div>
        <Button
          variant="outline"
          onClick={() => setShowAuditLog(false)}
          className="mb-4"
        >
          ← Back to Privacy Overview
        </Button>
        <AuditLogTable userId={userId} />
      </div>
    );
  }

  if (showDeleteAccount) {
    return (
      <div>
        <Button
          variant="outline"
          onClick={() => setShowDeleteAccount(false)}
          className="mb-4"
        >
          ← Back to Privacy Overview
        </Button>
        <DeleteAccount userId={userId} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-proofound-stone dark:border-border rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-900">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Shield className="h-6 w-6 text-blue-600 dark:text-blue-300" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-['Crimson_Pro'] font-semibold text-proofound-charcoal dark:text-foreground mb-2">
                Your Privacy Controls
              </h2>
              <p className="text-proofound-charcoal/70 dark:text-muted-foreground mb-4">
                Proofound is built with privacy at its core. Here&apos;s what data we collect and how you control it.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={handleExportData}
                  disabled={isExporting}
                  className="bg-proofound-forest hover:bg-proofound-forest/90"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {isExporting ? 'Exporting...' : 'Download My Data'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowAuditLog(true)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Audit Log
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Profile Data */}
        <Card className="border-proofound-stone dark:border-border rounded-xl hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                  <Database className="h-5 w-5 text-purple-600 dark:text-purple-300" />
                </div>
                <div>
                  <CardTitle className="text-lg font-['Crimson_Pro']">Profile Data</CardTitle>
                  <p className="text-xs text-proofound-charcoal/60 dark:text-muted-foreground mt-0.5">
                    Tier 1 PII
                  </p>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-proofound-charcoal/70 dark:text-muted-foreground mb-3">
              <strong>Fields:</strong> Name, email, location, bio, avatar
            </p>
            <p className="text-sm text-proofound-charcoal/70 dark:text-muted-foreground mb-3">
              <strong>Purpose:</strong> Create your profile and match you with opportunities
            </p>
            <p className="text-sm text-proofound-charcoal/70 dark:text-muted-foreground">
              <strong>Visibility:</strong> Controlled by your profile settings
            </p>
          </CardContent>
        </Card>

        {/* Skills & Expertise */}
        <Card className="border-proofound-stone dark:border-border rounded-xl hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                  <Target className="h-5 w-5 text-green-600 dark:text-green-300" />
                </div>
                <div>
                  <CardTitle className="text-lg font-['Crimson_Pro']">Skills & Expertise</CardTitle>
                  <p className="text-xs text-proofound-charcoal/60 dark:text-muted-foreground mt-0.5">
                    Tier 2 Sensitive
                  </p>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-proofound-charcoal/70 dark:text-muted-foreground mb-3">
              <strong>Fields:</strong> Skills, experience, education, verifications
            </p>
            <p className="text-sm text-proofound-charcoal/70 dark:text-muted-foreground mb-3">
              <strong>Purpose:</strong> Power the matching algorithm
            </p>
            <p className="text-sm text-proofound-charcoal/70 dark:text-muted-foreground">
              <strong>Visibility:</strong> Visible to matched organizations
            </p>
          </CardContent>
        </Card>

        {/* Projects & Work History */}
        <Card className="border-proofound-stone dark:border-border rounded-xl hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 dark:bg-amber-900 rounded-lg">
                  <FileText className="h-5 w-5 text-amber-600 dark:text-amber-300" />
                </div>
                <div>
                  <CardTitle className="text-lg font-['Crimson_Pro']">Projects & Work History</CardTitle>
                  <p className="text-xs text-proofound-charcoal/60 dark:text-muted-foreground mt-0.5">
                    Tier 2 Sensitive
                  </p>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-proofound-charcoal/70 dark:text-muted-foreground mb-3">
              <strong>Fields:</strong> Projects, experiences, impact stories
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
        <Card className="border-proofound-stone dark:border-border rounded-xl hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <MessagesSquare className="h-5 w-5 text-blue-600 dark:text-blue-300" />
                </div>
                <div>
                  <CardTitle className="text-lg font-['Crimson_Pro']">Match History</CardTitle>
                  <p className="text-xs text-proofound-charcoal/60 dark:text-muted-foreground mt-0.5">
                    Tier 3 Operational
                  </p>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-proofound-charcoal/70 dark:text-muted-foreground mb-3">
              <strong>Fields:</strong> Matches, applications, conversations
            </p>
            <p className="text-sm text-proofound-charcoal/70 dark:text-muted-foreground mb-3">
              <strong>Purpose:</strong> Connect you with opportunities
            </p>
            <p className="text-sm text-proofound-charcoal/70 dark:text-muted-foreground">
              <strong>Retention:</strong> 30 days after account deletion
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Card */}
      <Card className="border-proofound-stone dark:border-border rounded-xl">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
              <Activity className="h-5 w-5 text-slate-600 dark:text-slate-300" />
            </div>
            <div>
              <CardTitle className="text-lg font-['Crimson_Pro']">Analytics</CardTitle>
              <CardDescription>Tier 3 Pseudonymized</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-proofound-charcoal/70 dark:text-muted-foreground">
            <strong>Fields:</strong> Page views, clicks, session data (all with hashed IPs only)
          </p>
          <p className="text-sm text-proofound-charcoal/70 dark:text-muted-foreground">
            <strong>Purpose:</strong> Improve product quality and user experience
          </p>
          <p className="text-sm text-proofound-charcoal/70 dark:text-muted-foreground">
            <strong>Retention:</strong> Auto-deleted after 90 days
          </p>
          <div className="bg-blue-50 dark:bg-slate-800 border border-blue-200 dark:border-blue-900 rounded-lg p-3 mt-4">
            <p className="text-xs text-blue-800 dark:text-blue-300">
              ℹ️ All IP addresses and user agents are hashed (SHA-256) before storage, making them irreversible and GDPR-compliant under Article 4(5) - Pseudonymization.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Your Rights */}
      <Card className="border-proofound-stone dark:border-border rounded-xl">
        <CardHeader>
          <CardTitle className="text-xl font-['Crimson_Pro']">Your Rights</CardTitle>
          <CardDescription>
            Under GDPR and CCPA, you have the following rights over your data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">✅ Right to Access</p>
              <p className="text-xs text-proofound-charcoal/60 dark:text-muted-foreground">
                Download all your data in JSON format
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">✅ Right to Erasure</p>
              <p className="text-xs text-proofound-charcoal/60 dark:text-muted-foreground">
                Delete your account with 30-day grace period
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">✅ Right to Portability</p>
              <p className="text-xs text-proofound-charcoal/60 dark:text-muted-foreground">
                Export data in machine-readable JSON format
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">✅ Right to Object</p>
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
          onClick={() => setShowDataBreakdown(true)}
        >
          <Database className="h-5 w-5 mb-2" />
          <span className="font-medium">View Data Breakdown</span>
          <span className="text-xs text-muted-foreground mt-1">
            See exactly what we have on you
          </span>
        </Button>

        <Button
          variant="outline"
          className="h-auto py-4 flex-col items-start"
          onClick={() => setShowAuditLog(true)}
        >
          <Eye className="h-5 w-5 mb-2" />
          <span className="font-medium">View Audit Log</span>
          <span className="text-xs text-muted-foreground mt-1">
            Last 50 actions with timestamps
          </span>
        </Button>

        <Button
          variant="outline"
          className="h-auto py-4 flex-col items-start border-red-200 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950"
          onClick={() => setShowDeleteAccount(true)}
        >
          <Trash2 className="h-5 w-5 mb-2 text-red-600 dark:text-red-400" />
          <span className="font-medium text-red-600 dark:text-red-400">Delete Account</span>
          <span className="text-xs text-muted-foreground mt-1">
            Permanently remove your data
          </span>
        </Button>
      </div>

      {/* Learn More */}
      <Card className="border-proofound-stone dark:border-border rounded-xl">
        <CardContent className="pt-6">
          <p className="text-sm text-proofound-charcoal/70 dark:text-muted-foreground">
            Learn more about how we protect your privacy in our{' '}
            <a href="/privacy-policy" className="text-proofound-forest hover:underline">
              Privacy Policy
            </a>
            {' '}or contact us at{' '}
            <a href="mailto:privacy@proofound.com" className="text-proofound-forest hover:underline">
              privacy@proofound.com
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

