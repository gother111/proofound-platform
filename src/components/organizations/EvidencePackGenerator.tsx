/**
 * Evidence Pack PDF Generator
 *
 * Generates comprehensive impact reports for organizations to share with:
 * - Donors
 * - Investors
 * - Board members
 * - Grant committees
 *
 * Includes:
 * - Organization profile & mission
 * - Active assignments & hires
 * - Candidate quality metrics
 * - Diversity & fairness stats
 * - Impact stories
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  FileText,
  Download,
  Calendar,
  TrendingUp,
  Users,
  Target,
  Award,
  Info,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api/fetch';

interface EvidencePackGeneratorProps {
  organizationId: string;
  organizationName: string;
}

const REPORT_SECTIONS = [
  { id: 'overview', label: 'Organization Overview', description: 'Mission, values, and impact goals', default: true },
  { id: 'assignments', label: 'Active Assignments', description: 'Current open roles and opportunities', default: true },
  { id: 'hires', label: 'Recent Hires', description: 'Successful placements and outcomes', default: true },
  { id: 'metrics', label: 'Quality Metrics', description: 'Match scores, time-to-fill, retention', default: true },
  { id: 'diversity', label: 'Diversity & Fairness', description: 'DEI statistics and fairness metrics', default: true },
  { id: 'impact', label: 'Impact Stories', description: 'Success stories and testimonials', default: false },
  { id: 'financial', label: 'Financial Summary', description: 'Budget allocation and cost savings', default: false },
];

const DATE_RANGES = [
  { value: '30', label: 'Last 30 Days' },
  { value: '90', label: 'Last 90 Days' },
  { value: '180', label: 'Last 6 Months' },
  { value: '365', label: 'Last Year' },
  { value: 'custom', label: 'Custom Range' },
];

export function EvidencePackGenerator({
  organizationId,
  organizationName,
}: EvidencePackGeneratorProps) {
  const [selectedSections, setSelectedSections] = useState<string[]>(
    REPORT_SECTIONS.filter((s) => s.default).map((s) => s.id)
  );
  const [dateRange, setDateRange] = useState('90');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [reportTitle, setReportTitle] = useState(`${organizationName} Impact Report`);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);

  const handleToggleSection = (sectionId: string) => {
    setSelectedSections((prev) =>
      prev.includes(sectionId)
        ? prev.filter((id) => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const handleGenerate = async () => {
    if (selectedSections.length === 0) {
      toast.error('Please select at least one section');
      return;
    }

    setIsGenerating(true);
    setGeneratedUrl(null);

    try {
      const response = await apiFetch('/api/organizations/evidence-pack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId,
          sections: selectedSections,
          dateRange,
          customStartDate: dateRange === 'custom' ? customStartDate : null,
          customEndDate: dateRange === 'custom' ? customEndDate : null,
          title: reportTitle,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate report');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      setGeneratedUrl(url);

      // Auto-download
      const link = document.createElement('a');
      link.href = url;
      link.download = `${reportTitle.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Evidence Pack generated successfully!');

      // Log analytics
      await apiFetch('/api/analytics/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_type: 'evidence_pack_generated',
          event_data: {
            organizationId,
            sections: selectedSections,
            dateRange,
          },
        }),
      });
    } catch (error) {
      console.error('Failed to generate evidence pack:', error);
      toast.error('Failed to generate report. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-proofound-stone dark:border-border rounded-2xl">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="font-['Crimson_Pro'] text-proofound-charcoal dark:text-foreground flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Evidence Pack Generator
              </CardTitle>
              <CardDescription className="text-proofound-charcoal/70 dark:text-muted-foreground">
                Create comprehensive impact reports for donors, investors, and stakeholders
              </CardDescription>
            </div>
            <Badge variant="outline" className="border-[#1C4D3A] text-[#1C4D3A]">
              PDF Report
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Report Title */}
          <div>
            <Label htmlFor="reportTitle">Report Title</Label>
            <Input
              id="reportTitle"
              value={reportTitle}
              onChange={(e) => setReportTitle(e.target.value)}
              placeholder="Enter report title"
            />
          </div>

          {/* Date Range */}
          <div>
            <Label htmlFor="dateRange">Time Period</Label>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DATE_RANGES.map((range) => (
                  <SelectItem key={range.value} value={range.value}>
                    {range.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Custom Date Range */}
          {dateRange === 'custom' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Section Selection */}
          <div>
            <Label className="mb-3 block">Report Sections</Label>
            <div className="space-y-3">
              {REPORT_SECTIONS.map((section) => {
                const isSelected = selectedSections.includes(section.id);
                return (
                  <div
                    key={section.id}
                    className={`flex items-start space-x-3 p-3 rounded-lg border ${
                      isSelected
                        ? 'border-[#1C4D3A] bg-[#E8F5E1]'
                        : 'border-[#E8E6DD] bg-white'
                    }`}
                  >
                    <Checkbox
                      id={section.id}
                      checked={isSelected}
                      onCheckedChange={() => handleToggleSection(section.id)}
                    />
                    <div className="flex-1">
                      <Label
                        htmlFor={section.id}
                        className="font-medium cursor-pointer flex items-center gap-2"
                      >
                        {section.label}
                        {section.default && (
                          <Badge variant="outline" className="text-xs">
                            Recommended
                          </Badge>
                        )}
                      </Label>
                      <p className="text-xs text-[#6B6760] dark:text-muted-foreground mt-1">
                        {section.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Info Alert */}
          <Alert className="border-blue-300 bg-blue-50">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-sm">
              <strong>What's included:</strong> The Evidence Pack includes aggregate metrics,
              anonymized candidate data (PRD-compliant), and visual charts. No personally
              identifiable information (PII) is included unless explicitly permitted.
            </AlertDescription>
          </Alert>

          {/* Preview Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-[#F7F6F1] dark:bg-background/50 rounded-lg border border-[#E8E6DD] dark:border-border">
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <Target className="w-4 h-4 text-[#1C4D3A]" />
              </div>
              <p className="text-2xl font-bold text-[#2D3330] dark:text-foreground">12</p>
              <p className="text-xs text-[#6B6760] dark:text-muted-foreground">Active Assignments</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <Users className="w-4 h-4 text-[#1C4D3A]" />
              </div>
              <p className="text-2xl font-bold text-[#2D3330] dark:text-foreground">48</p>
              <p className="text-xs text-[#6B6760] dark:text-muted-foreground">Quality Matches</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <Award className="w-4 h-4 text-[#1C4D3A]" />
              </div>
              <p className="text-2xl font-bold text-[#2D3330] dark:text-foreground">8</p>
              <p className="text-xs text-[#6B6760] dark:text-muted-foreground">Recent Hires</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <TrendingUp className="w-4 h-4 text-[#1C4D3A]" />
              </div>
              <p className="text-2xl font-bold text-[#2D3330] dark:text-foreground">87%</p>
              <p className="text-xs text-[#6B6760] dark:text-muted-foreground">Match Quality</p>
            </div>
          </div>

          {/* Generate Button */}
          <div className="flex items-center justify-between pt-4 border-t border-[#E8E6DD] dark:border-border">
            <div className="flex items-center gap-2 text-sm text-[#6B6760] dark:text-muted-foreground">
              <CheckCircle2 className="w-4 h-4" />
              <span>{selectedSections.length} section{selectedSections.length !== 1 ? 's' : ''} selected</span>
            </div>
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || selectedSections.length === 0}
              className="bg-[#1C4D3A] text-white"
            >
              <Download className="w-4 h-4 mr-2" />
              {isGenerating ? 'Generating...' : 'Generate PDF'}
            </Button>
          </div>

          {/* Generated Report Link */}
          {generatedUrl && (
            <Alert className="border-green-300 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="flex items-center justify-between">
                <span className="text-sm font-medium">Report generated successfully!</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = generatedUrl;
                    link.download = `${reportTitle.replace(/\s+/g, '_')}.pdf`;
                    link.click();
                  }}
                  className="border-green-300 text-green-700"
                >
                  Download Again
                </Button>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Usage Guidelines */}
      <Card className="border-proofound-stone dark:border-border rounded-2xl">
        <CardHeader>
          <CardTitle className="text-lg font-['Crimson_Pro']">Best Practices</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-[#6B6760] dark:text-muted-foreground">
            <p>• <strong>Grant Applications:</strong> Include Overview, Metrics, and Diversity sections</p>
            <p>• <strong>Investor Pitches:</strong> Focus on Assignments, Hires, and Financial Summary</p>
            <p>• <strong>Board Reports:</strong> All sections recommended for comprehensive view</p>
            <p>• <strong>Quarterly Updates:</strong> Use 90-day range with all metrics enabled</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

