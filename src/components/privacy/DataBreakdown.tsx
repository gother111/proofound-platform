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
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchDataBreakdown();
  }, []);

  const fetchDataBreakdown = async () => {
    try {
      // TODO: Create API endpoint to fetch data counts
      // For now, using mock data structure
      const mockCategories: DataCategory[] = [
        {
          id: 'profile',
          name: 'Profile Information',
          description: 'Your personal profile data and settings',
          icon: <User className="h-5 w-5" />,
          count: 1,
          tier: 'PII',
          items: [
            'Display name',
            'Email address',
            'Avatar image',
            'Handle/username',
            'Location (if provided)',
            'Bio/description',
          ],
        },
        {
          id: 'professional',
          name: 'Professional Data',
          description: 'Skills, experience, projects, and education',
          icon: <Briefcase className="h-5 w-5" />,
          count: 0, // Will be fetched from API
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
          id: 'messages',
          name: 'Conversations',
          description: 'Message history and conversation data',
          icon: <MessageSquare className="h-5 w-5" />,
          count: 0,
          tier: 'Sensitive',
          items: ['Conversation threads', 'Message content', 'Identity reveal history'],
        },
        {
          id: 'analytics',
          name: 'Analytics & Activity',
          description: 'Your activity logs and usage patterns',
          icon: <BarChart3 className="h-5 w-5" />,
          count: 0,
          tier: 'Semi-Public',
          items: [
            'Login history (anonymized)',
            'Feature usage statistics',
            'Match history',
            'Search queries',
          ],
        },
        {
          id: 'verification',
          name: 'Verification & Trust',
          description: 'Verification requests and badges',
          icon: <Shield className="h-5 w-5" />,
          count: 0,
          tier: 'Public',
          items: ['Verification requests', 'Verified claims', 'Trust badges'],
        },
      ];

      setCategories(mockCategories);
    } catch (error) {
      console.error('Failed to fetch data breakdown:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportData = async () => {
    try {
      setExporting(true);

      const response = await fetch('/api/user/export');
      if (!response.ok) throw new Error('Export failed');

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
      console.error('Export failed:', error);
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

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">Loading data breakdown...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Your Data Breakdown</CardTitle>
            <CardDescription>Detailed view of all data we store about you</CardDescription>
          </div>
          <Button onClick={handleExportData} disabled={exporting}>
            <Download className="mr-2 h-4 w-4" />
            {exporting ? 'Exporting...' : 'Export All Data'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
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
                        {category.tier}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{category.description}</p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="ml-13 space-y-2 pt-2">
                  <p className="text-sm font-semibold text-muted-foreground">
                    Data stored in this category:
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
                      <p className="font-semibold text-red-900 dark:text-red-100">
                        Personally Identifiable Information (PII)
                      </p>
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
          <p className="font-semibold mb-2">Data Retention Policy</p>
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
