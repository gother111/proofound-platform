/**
 * Next Best Actions Widget
 *
 * Shows personalized recommendations to improve profile completeness
 * and increase matching opportunities (PRD F2 requirement)
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Circle,
  Upload,
  UserCheck,
  Target,
  FileText,
  Award,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api/fetch';

interface NextBestAction {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  category: 'profile' | 'expertise' | 'verification' | 'matching';
  actionUrl: string;
  completed: boolean;
  icon?: string;
}

interface ProfileCompleteness {
  percentage: number;
  missing: string[];
  actions: NextBestAction[];
}

type NextBestActionsWidgetProps = {
  useMockData?: boolean;
  onActionClick?: (actionId: string) => void;
};

export function NextBestActionsWidget({ useMockData, onActionClick }: NextBestActionsWidgetProps) {
  const [completeness, setCompleteness] = useState<ProfileCompleteness | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (useMockData) {
      setCompleteness({
        percentage: 72,
        missing: ['proof'],
        actions: [
          {
            id: 'add-proof',
            title: 'Upload proof for AI Ops',
            description: 'Add a link or PDF to verify your AI Ops work.',
            priority: 'high',
            category: 'verification',
            actionUrl: '/app/i/profile?tab=proofs',
            completed: false,
          },
          {
            id: 'add-values',
            title: 'Add values & causes',
            description: 'Choose up to 5 values to improve PAC.',
            priority: 'medium',
            category: 'profile',
            actionUrl: '/app/i/profile',
            completed: false,
          },
        ],
      });
      setLoading(false);
      return;
    }

    async function fetchNextBestActions() {
      try {
        const response = await apiFetch('/api/profile/completeness');
        if (response.ok) {
          const data = await response.json();
          setCompleteness(data);
        }
      } catch (error) {
        console.error('Failed to fetch next best actions:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchNextBestActions();
  }, []);

  const getIcon = (action: NextBestAction) => {
    switch (action.category) {
      case 'profile':
        return <FileText className="h-4 w-4" />;
      case 'expertise':
        return <Target className="h-4 w-4" />;
      case 'verification':
        return <UserCheck className="h-4 w-4" />;
      case 'matching':
        return <Award className="h-4 w-4" />;
      default:
        return <Circle className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'low':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5 text-[#1C4D3A]" />
            Next Best Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-2 bg-gray-200 rounded w-full mb-4"></div>
            </div>
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-12 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const percentage = completeness?.percentage || 0;
  const actions = completeness?.actions || [];
  const topActions = actions.slice(0, 5); // Show top 5 actions

  // Determine profile status
  const getProfileStatus = () => {
    if (percentage >= 80) return { text: 'Excellent', color: 'text-green-600' };
    if (percentage >= 60) return { text: 'Matchable', color: 'text-blue-600' };
    if (percentage >= 40) return { text: 'In Progress', color: 'text-yellow-600' };
    return { text: 'Getting Started', color: 'text-gray-600' };
  };

  const status = getProfileStatus();

  return (
    <Card>
      <CardHeader className="space-y-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5 text-[#1C4D3A]" />
            Next Best Actions
          </CardTitle>
          <Badge variant="outline" className={status.color}>
            {status.text}
          </Badge>
        </div>

        {/* Profile Completeness */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-[#6B6760]">Profile Completeness</span>
            <span className="font-semibold text-[#2D3330]">{percentage}%</span>
          </div>
          <Progress value={percentage} className="h-2" />
          {percentage < 60 && (
            <p className="text-xs text-[#6B6760]">
              Reach 60% to become matchable and start receiving opportunities
            </p>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {topActions.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle2 className="h-12 w-12 mx-auto text-green-500 mb-3" />
            <p className="text-sm font-medium text-[#2D3330] mb-1">Profile Complete!</p>
            <p className="text-xs text-[#6B6760]">
              Great job! Your profile is optimized for matching.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {topActions.map((action, index) => (
              <button
                key={action.id}
                onClick={() => router.push(action.actionUrl)}
                onMouseUp={() => onActionClick?.(action.id)}
                className="w-full text-left p-3 rounded-lg border border-[#E8E6DD] hover:border-[#1C4D3A] hover:bg-[#F7F6F1] transition-all group"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    {action.completed ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-[#1C4D3A] flex items-center justify-center">
                        <span className="text-xs font-semibold text-[#1C4D3A]">{index + 1}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-[#2D3330] group-hover:text-[#1C4D3A]">
                        {action.title}
                      </span>
                      {action.priority === 'high' && (
                        <Badge
                          variant="outline"
                          className="text-xs px-1.5 py-0 bg-red-50 text-red-600 border-red-200"
                        >
                          High Priority
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-[#6B6760]">{action.description}</p>
                  </div>

                  <div className="flex-shrink-0">
                    <ArrowRight className="h-4 w-4 text-[#A8B69D] group-hover:text-[#1C4D3A] transition-colors" />
                  </div>
                </div>
              </button>
            ))}

            {actions.length > 5 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/app/i/profile')}
                className="w-full text-[#1C4D3A] hover:bg-[#EEF1EA]"
              >
                View All {actions.length} Actions
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
