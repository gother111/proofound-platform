'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, Calendar } from 'lucide-react';
import { toast } from 'sonner';

interface EvidencePackExportProps {
  organizationId: string;
  organizationName: string;
}

export function EvidencePackExport({ organizationId, organizationName }: EvidencePackExportProps) {
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState<'all' | 'ytd' | 'q1' | 'q2' | 'q3' | 'q4'>('ytd');

  const getDateRangeParams = () => {
    const now = new Date();
    const year = now.getFullYear();

    switch (dateRange) {
      case 'all':
        return {};
      case 'ytd':
        return {
          periodStart: new Date(year, 0, 1).toISOString(),
          periodEnd: now.toISOString(),
        };
      case 'q1':
        return {
          periodStart: new Date(year, 0, 1).toISOString(),
          periodEnd: new Date(year, 2, 31).toISOString(),
        };
      case 'q2':
        return {
          periodStart: new Date(year, 3, 1).toISOString(),
          periodEnd: new Date(year, 5, 30).toISOString(),
        };
      case 'q3':
        return {
          periodStart: new Date(year, 6, 1).toISOString(),
          periodEnd: new Date(year, 8, 30).toISOString(),
        };
      case 'q4':
        return {
          periodStart: new Date(year, 9, 1).toISOString(),
          periodEnd: new Date(year, 11, 31).toISOString(),
        };
    }
  };

  const handleExport = async () => {
    setLoading(true);
    try {
      const dateParams = getDateRangeParams();

      const response = await fetch('/api/evidence-pack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId,
          ...dateParams,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to generate Evidence Pack');
      }

      // Get HTML response
      const html = await response.text();

      // Create a blob and download
      const blob = new Blob([html], { type: 'text/html' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `evidence-pack-${organizationId}-${dateRange}.html`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Evidence Pack generated! Open the HTML file and print to PDF.');

    } catch (error) {
      console.error('Evidence Pack export error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate Evidence Pack');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-blue-600" />
          <CardTitle>Evidence Pack</CardTitle>
          <Badge variant="secondary" className="ml-auto">
            Donor/Investor Ready
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Generate a professional PDF report of your organization&apos;s impact metrics, outcomes, and
          supporting documentation.
        </p>

        <div>
          <div className="text-sm font-medium mb-2 flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Select Period
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <Button
              variant={dateRange === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDateRange('all')}
            >
              All Time
            </Button>
            <Button
              variant={dateRange === 'ytd' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDateRange('ytd')}
            >
              Year to Date
            </Button>
            <Button
              variant={dateRange === 'q1' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDateRange('q1')}
            >
              Q1 {new Date().getFullYear()}
            </Button>
            <Button
              variant={dateRange === 'q2' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDateRange('q2')}
            >
              Q2 {new Date().getFullYear()}
            </Button>
            <Button
              variant={dateRange === 'q3' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDateRange('q3')}
            >
              Q3 {new Date().getFullYear()}
            </Button>
            <Button
              variant={dateRange === 'q4' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDateRange('q4')}
            >
              Q4 {new Date().getFullYear()}
            </Button>
          </div>
        </div>

        <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm">
          <p className="font-medium mb-1">What&apos;s Included:</p>
          <ul className="space-y-1 text-muted-foreground">
            <li> Impact metrics and outcomes</li>
            <li> Beneficiary counts and timeframes</li>
            <li> Supporting artifacts and documentation</li>
            <li> Organization profile and metadata</li>
          </ul>
        </div>

        <Button
          onClick={handleExport}
          disabled={loading}
          className="w-full"
          size="lg"
        >
          <Download className="h-4 w-4 mr-2" />
          {loading ? 'Generating...' : 'Generate Evidence Pack'}
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          Opens as HTML. Use browser&apos;s &quot;Print to PDF&quot; to save as PDF.
        </p>
      </CardContent>
    </Card>
  );
}
