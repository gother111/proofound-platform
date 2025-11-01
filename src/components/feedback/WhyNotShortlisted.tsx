/**
 * Why Not Shortlisted Component
 *
 * PRD I-22 + Persona #2 (Mateo - Career Switcher)
 * Displays actionable feedback when users are not shortlisted for roles
 * - Shows reasons for not being selected
 * - Provides specific actions to improve
 * - Links to Gap Map for skill development
 * - Estimates score improvement potential
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  AlertCircle,
  TrendingUp,
  CheckCircle2,
  ArrowRight,
  Target,
  Shield,
  Calendar,
  MapPin,
  DollarSign,
  ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';

interface FeedbackItem {
  category: 'skills' | 'verification' | 'availability' | 'location' | 'compensation';
  priority: 'critical' | 'high' | 'medium' | 'low';
  issue: string;
  action: string;
  estimatedImpact: number;
  details?: {
    link?: string;
    missingSkills?: any[];
    underLevelSkills?: any[];
    requiredGates?: string[];
  };
}

interface FeedbackResponse {
  assignmentTitle: string;
  currentMatchScore: number;
  potentialMatchScore: number;
  potentialImprovement: number;
  summary: string;
  feedback: FeedbackItem[];
  nextBestActions: FeedbackItem[];
  gapMapAvailable: boolean;
}

interface WhyNotShortlistedProps {
  assignmentId: string;
  assignmentTitle?: string;
}

export function WhyNotShortlisted({ assignmentId, assignmentTitle }: WhyNotShortlistedProps) {
  const [feedback, setFeedback] = useState<FeedbackResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchFeedback() {
      try {
        setLoading(true);
        const response = await fetch('/api/feedback/why-not-shortlisted', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ assignmentId }),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch feedback');
        }

        const data = await response.json();
        setFeedback(data);
      } catch (err) {
        console.error('Feedback error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load feedback');
      } finally {
        setLoading(false);
      }
    }

    fetchFeedback();
  }, [assignmentId]);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'skills':
        return <Target className="h-5 w-5" />;
      case 'verification':
        return <Shield className="h-5 w-5" />;
      case 'availability':
        return <Calendar className="h-5 w-5" />;
      case 'location':
        return <MapPin className="h-5 w-5" />;
      case 'compensation':
        return <DollarSign className="h-5 w-5" />;
      default:
        return <AlertCircle className="h-5 w-5" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'destructive';
      case 'high':
        return 'default';
      case 'medium':
        return 'secondary';
      case 'low':
        return 'outline';
      default:
        return 'outline';
    }
  };

  if (loading) {
    return (
      <Card className="border-proofound-stone dark:border-border rounded-xl">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-12">
            <div className="space-y-3 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-proofound-forest mx-auto"></div>
              <p className="text-sm text-proofound-charcoal/70 dark:text-muted-foreground">
                Analyzing your application...
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !feedback) {
    return (
      <Card className="border-proofound-stone dark:border-border rounded-xl">
        <CardContent className="pt-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Unable to load feedback</AlertTitle>
            <AlertDescription>
              {error || 'An error occurred while loading your feedback'}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="border-proofound-stone dark:border-border rounded-xl">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <CardTitle className="text-lg font-['Crimson_Pro']">
                  Why wasn&apos;t I shortlisted?
                </CardTitle>
              </div>
              <CardDescription className="text-base">
                {assignmentTitle || feedback.assignmentTitle}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Summary */}
          <Alert>
            <TrendingUp className="h-4 w-4" />
            <AlertTitle>Feedback Summary</AlertTitle>
            <AlertDescription>{feedback.summary}</AlertDescription>
          </Alert>

          {/* Score Progress */}
          <div className="space-y-3 p-4 bg-muted rounded-lg">
            <div className="flex items-center justify-between text-sm">
              <span className="text-proofound-charcoal/70 dark:text-muted-foreground">
                Current Match Score
              </span>
              <span className="font-semibold">
                {Math.round(feedback.currentMatchScore)}/100
              </span>
            </div>
            <Progress value={feedback.currentMatchScore} className="h-2" />

            {feedback.potentialImprovement > 0 && (
              <>
                <div className="flex items-center justify-between text-sm pt-2 border-t">
                  <span className="text-proofound-charcoal/70 dark:text-muted-foreground">
                    Potential Score (if you address all gaps)
                  </span>
                  <span className="font-semibold text-green-600 dark:text-green-400">
                    {Math.round(feedback.potentialMatchScore)}/100
                    <span className="text-xs ml-1">
                      (+{Math.round(feedback.potentialImprovement)})
                    </span>
                  </span>
                </div>
                <Progress value={feedback.potentialMatchScore} className="h-2" />
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Next Best Actions */}
      {feedback.nextBestActions.length > 0 && (
        <Card className="border-proofound-stone dark:border-border rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-900">
          <CardHeader>
            <CardTitle className="text-lg font-['Crimson_Pro'] flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              Top Actions to Take
            </CardTitle>
            <CardDescription>
              Focus on these high-impact improvements first
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {feedback.nextBestActions.map((item, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-4 bg-white dark:bg-slate-800 rounded-lg border border-proofound-stone dark:border-border"
              >
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg flex-shrink-0">
                  {getCategoryIcon(item.category)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={getPriorityColor(item.priority)} className="text-xs">
                      {item.priority}
                    </Badge>
                    <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                      +{item.estimatedImpact} points
                    </span>
                  </div>
                  <p className="font-medium text-sm mb-1">{item.action}</p>
                  {item.details?.link && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 text-xs text-proofound-forest hover:text-proofound-forest/80"
                      onClick={() => window.location.href = item.details!.link!}
                    >
                      Take action <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* All Feedback Items */}
      {feedback.feedback.length > feedback.nextBestActions.length && (
        <Card className="border-proofound-stone dark:border-border rounded-xl">
          <CardHeader>
            <CardTitle className="text-lg font-['Crimson_Pro']">
              All Improvement Opportunities
            </CardTitle>
            <CardDescription>
              Additional areas where you can strengthen your profile
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {feedback.feedback.slice(feedback.nextBestActions.length).map((item, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-3 border border-proofound-stone dark:border-border rounded-lg"
              >
                <div className="p-2 bg-muted rounded-lg flex-shrink-0">
                  {getCategoryIcon(item.category)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={getPriorityColor(item.priority)} className="text-xs">
                      {item.priority}
                    </Badge>
                    <span className="text-xs text-proofound-charcoal/60 dark:text-muted-foreground">
                      +{item.estimatedImpact} points potential
                    </span>
                  </div>
                  <p className="text-sm text-proofound-charcoal/70 dark:text-muted-foreground mb-1">
                    {item.issue}
                  </p>
                  <p className="text-sm font-medium">{item.action}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Gap Map CTA */}
      {feedback.gapMapAvailable && (
        <Card className="border-proofound-stone dark:border-border rounded-xl">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="font-medium">View your complete skill gap analysis</p>
                <p className="text-sm text-proofound-charcoal/70 dark:text-muted-foreground">
                  Get a detailed roadmap of skills to develop for your target roles
                </p>
              </div>
              <Button
                onClick={() => window.location.href = '/profile/gap-map'}
                className="bg-proofound-forest hover:bg-proofound-forest/90"
              >
                View Gap Map
                <ExternalLink className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
