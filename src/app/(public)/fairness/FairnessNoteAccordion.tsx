/**
 * Fairness Note Accordion (Client Component)
 *
 * Interactive accordion for displaying fairness note details
 * Separated as client component to enable interactivity while keeping parent as server component
 */

'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, Info, TrendingUp, Shield } from 'lucide-react';

interface Finding {
  severity: 'critical' | 'moderate' | 'low' | 'none';
  category: string;
  description: string;
  cohorts: string;
  metric: string;
  gap: number;
  pValue: number;
}

interface Recommendation {
  priority: 'high' | 'medium' | 'low';
  action: string;
  rationale: string;
  targetDate?: string;
}

interface FairnessNote {
  id: string;
  releaseVersion: string;
  generatedAt: string | Date;
  publishedAt: string | Date | null;
  cohortData: any;
  findings: Finding[];
  recommendations: Recommendation[];
  hasSignificantGaps: boolean;
  minSampleSize: number;
  pValue: string | null;
}

interface Props {
  note: FairnessNote;
}

export function FairnessNoteAccordion({ note }: Props) {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'moderate':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'none':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertCircle className="w-4 h-4" />;
      case 'moderate':
        return <Info className="w-4 h-4" />;
      case 'low':
        return <TrendingUp className="w-4 h-4" />;
      case 'none':
        return <CheckCircle2 className="w-4 h-4" />;
      default:
        return <Info className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString: string | Date) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Accordion type="single" collapsible className="w-full">
      {/* Findings */}
      <AccordionItem value="findings">
        <AccordionTrigger>
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4" />
            Findings ({note.findings?.length || 0})
          </div>
        </AccordionTrigger>
        <AccordionContent>
          {note.findings && note.findings.length > 0 ? (
            <div className="space-y-3">
              {note.findings.map((finding, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-lg border ${getSeverityColor(finding.severity)}`}
                >
                  <div className="flex items-start gap-2">
                    {getSeverityIcon(finding.severity)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">
                          {finding.category}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {finding.severity}
                        </Badge>
                      </div>
                      <p className="font-medium mb-1">{finding.description}</p>
                      <p className="text-sm mb-2">
                        Cohorts: {finding.cohorts} • Metric: {finding.metric}
                      </p>
                      {finding.gap && (
                        <p className="text-sm">
                          Gap: {(finding.gap * 100).toFixed(1)}% • p-value:{' '}
                          {finding.pValue?.toFixed(4)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-4">
              No significant findings in this analysis period.
            </p>
          )}
        </AccordionContent>
      </AccordionItem>

      {/* Recommendations */}
      <AccordionItem value="recommendations">
        <AccordionTrigger>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Recommendations ({note.recommendations?.length || 0})
          </div>
        </AccordionTrigger>
        <AccordionContent>
          {note.recommendations && note.recommendations.length > 0 ? (
            <div className="space-y-3">
              {note.recommendations.map((rec, idx) => (
                <div key={idx} className="p-4 rounded-lg border bg-white">
                  <div className="flex items-start gap-3">
                    <Badge
                      variant={
                        rec.priority === 'high'
                          ? 'destructive'
                          : rec.priority === 'medium'
                            ? 'default'
                            : 'secondary'
                      }
                    >
                      {rec.priority}
                    </Badge>
                    <div className="flex-1">
                      <p className="font-medium mb-1">{rec.action}</p>
                      <p className="text-sm text-muted-foreground">{rec.rationale}</p>
                      {rec.targetDate && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Target: {formatDate(rec.targetDate)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-4">
              Continue monitoring fairness metrics in upcoming releases.
            </p>
          )}
        </AccordionContent>
      </AccordionItem>

      {/* Methodology */}
      <AccordionItem value="methodology">
        <AccordionTrigger>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Methodology
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <div className="space-y-3 text-sm">
            <p>
              <strong>Sample Size:</strong> Minimum {note.minSampleSize} matches per cohort
              required for statistical validity
            </p>
            <p>
              <strong>Statistical Threshold:</strong> p &lt; 0.05 for significance testing
              {note.pValue && ` (this analysis: p = ${parseFloat(note.pValue).toFixed(4)})`}
            </p>
            <p>
              <strong>Controlled Variables:</strong> Skills match, experience level, location
              preferences, and compensation alignment
            </p>
            <p>
              <strong>Data Privacy:</strong> All demographic data is opt-in only. Users must
              explicitly consent to participate in fairness tracking.
            </p>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

