'use client';

/**
 * DataBreakdown Component
 *
 * Shows detailed breakdown of user data stored in the system.
 * Organized by data category with expandable accordions.
 *
 * Reference: DATA_SECURITY_PRIVACY_ARCHITECTURE.md Section 13.2
 */

import { useState, useEffect } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, User, Briefcase, MessageSquare, BarChart3, Shield } from 'lucide-react';
import { dispatchClientErrorDiagnostic } from '@/lib/client-diagnostics';
import { buildUserExportDownloadFilename } from '@/lib/privacy/export-download';

interface DataInventoryPayload {
  counts?: Partial<Record<'profile' | 'professional' | 'proof' | 'matching' | 'activity', number>>;
}

interface DataCategory {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  count: number;
  tier: 'PII' | 'Sensitive' | 'Semi-Public' | 'Public';
  items: string[];
}

export function DataBreakdown() {
  const [categories, setCategories] = useState<DataCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const fetchDataBreakdown = async () => {
      try {
        setError(null);

        const response = await fetch('/api/user/data-inventory');
        if (!response.ok) {
          throw new Error('Data inventory unavailable');
        }

        const payload = (await response.json()) as DataInventoryPayload;
        const categories = buildDataCategories(payload.counts);

        setCategories(categories);
      } catch (error) {
        dispatchClientErrorDiagnostic('privacy.data_breakdown.load_failed', error);
        setError('Your data inventory could not load. You can still try downloading your data.');
        setCategories(buildDataCategories());
      } finally {
        setLoading(false);
      }
    };

    fetchDataBreakdown();
  }, []);

  const handleExportData = async () => {
    try {
      setExporting(true);

      const response = await fetch('/api/user/export');
      if (!response.ok) throw new Error('Export failed');

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
      dispatchClientErrorDiagnostic('privacy.data_breakdown.export_failed', error);
      alert('Failed to export data. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'PII':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'Sensitive':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400';
      case 'Semi-Public':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'Public':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getTierLabel = (tier: DataCategory['tier']) => {
    switch (tier) {
      case 'PII':
        return 'Personal';
      case 'Sensitive':
        return 'Private';
      case 'Semi-Public':
        return 'Shared in some places';
      case 'Public':
        return 'Public';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">Loading your data...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <CardTitle>Your data</CardTitle>
            <CardDescription>
              A detailed view of what Proofound stores for your account
            </CardDescription>
          </div>
          <Button onClick={handleExportData} disabled={exporting} className="w-full sm:w-auto">
            <Download className="mr-2 h-4 w-4" />
            {exporting ? 'Preparing...' : 'Download my data'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-100">
            {error}
          </div>
        )}
        <Accordion type="single" collapsible className="w-full">
          {categories.map((category) => (
            <AccordionItem key={category.id} value={category.id}>
              <AccordionTrigger>
                <div className="flex items-center gap-3 text-left">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                    {category.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{category.name}</span>
                      <Badge className={getTierColor(category.tier)} variant="secondary">
                        {getTierLabel(category.tier)}
                      </Badge>
                      <Badge variant="outline">{formatCount(category.count)}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{category.description}</p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="ml-13 space-y-2 pt-2">
                  <p className="text-sm font-semibold text-muted-foreground">
                    Included in this category:
                  </p>
                  <ul className="space-y-1 text-sm">
                    {category.items.map((item, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-muted-foreground">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>

                  {category.tier === 'PII' && (
                    <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm dark:border-red-900 dark:bg-red-950/20">
                      <p className="font-semibold text-red-900 dark:text-red-100">Personal data</p>
                      <p className="text-red-800 dark:text-red-200">
                        This data can directly identify you. We protect it with the highest security
                        measures.
                      </p>
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <div className="mt-6 rounded-lg border bg-muted/50 p-4 text-sm">
          <p className="font-semibold mb-2">How long we keep data</p>
          <ul className="space-y-1 text-muted-foreground">
            <li>• Profile data: Retained while account is active</li>
            <li>• Messages: Retained for 3 years, then archived</li>
            <li>• Analytics: Anonymized after 90 days</li>
            <li>
              • Deleted accounts: Processed immediately with deletion/anonymization safeguards
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

function formatCount(count: number): string {
  return `${count} ${count === 1 ? 'record' : 'records'}`;
}

function buildDataCategories(counts: DataInventoryPayload['counts'] = {}): DataCategory[] {
  return [
    {
      id: 'profile',
      name: 'Profile information',
      description: 'Your personal profile data and settings',
      icon: <User className="h-5 w-5" />,
      count: counts.profile ?? 0,
      tier: 'PII',
      items: [
        'Display name',
        'Email address',
        'Avatar image',
        'Profile link name',
        'Location (if provided)',
        'Bio/description',
      ],
    },
    {
      id: 'professional',
      name: 'Professional information',
      description: 'Skills, experience, projects, and education',
      icon: <Briefcase className="h-5 w-5" />,
      count: counts.professional ?? 0,
      tier: 'Semi-Public',
      items: [
        'Skills and capabilities',
        'Work experience',
        'Projects',
        'Education history',
        'Volunteering activities',
        'Impact stories',
      ],
    },
    {
      id: 'proof',
      name: 'Proof and verification',
      description: 'Proof Packs, uploaded proof, submissions, and verification records',
      icon: <MessageSquare className="h-5 w-5" />,
      count: counts.proof ?? 0,
      tier: 'Sensitive',
      items: [
        'Proof Packs',
        'Proof artifacts',
        'Assignment submissions',
        'Verification records',
        'Owner-safe verification log entries',
      ],
    },
    {
      id: 'matching',
      name: 'Matching activity',
      description: 'Match records and interest signals connected to your account',
      icon: <BarChart3 className="h-5 w-5" />,
      count: counts.matching ?? 0,
      tier: 'Semi-Public',
      items: ['Match records', 'Interest signals', 'Assignment-related matching activity'],
    },
    {
      id: 'activity',
      name: 'Product activity',
      description: 'Account activity events retained for operations and security',
      icon: <Shield className="h-5 w-5" />,
      count: counts.activity ?? 0,
      tier: 'Sensitive',
      items: ['Activity events', 'Pseudonymized technical metadata', 'Export lifecycle records'],
    },
  ];
}
