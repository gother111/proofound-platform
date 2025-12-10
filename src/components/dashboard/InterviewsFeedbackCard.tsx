/**
 * Interviews & Feedback Tile
 *
 * Shows interview schedule, pending feedback, and SLA status (48h feedback window).
 */

'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { apiFetch } from '@/lib/api/fetch';
import { AlarmClock, CheckCircle2, Clock4, MessageSquare } from 'lucide-react';
import Link from 'next/link';

type InterviewsResponse = {
  interviews?: {
    id: string;
    status?: string;
    scheduled_at?: string;
    feedbackSubmitted?: boolean;
    feedback_due_at?: string;
  }[];
};

type InterviewsFeedbackCardProps = {
  useMockData?: boolean;
  onActionClick?: (actionId: string) => void;
};

export function InterviewsFeedbackCard({
  useMockData,
  onActionClick,
}: InterviewsFeedbackCardProps) {
  const [data, setData] = useState<InterviewsResponse['interviews']>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (useMockData) {
      setData([
        { id: '1', status: 'scheduled', scheduled_at: new Date().toISOString() },
        {
          id: '2',
          status: 'completed',
          feedbackSubmitted: false,
          feedback_due_at: new Date(Date.now() + 36 * 60 * 60 * 1000).toISOString(),
        },
      ]);
      setLoading(false);
      return;
    }

    async function load() {
      try {
        const response = await apiFetch('/api/interviews');
        if (!response.ok) throw new Error('Failed to fetch interviews');
        const json = (await response.json()) as InterviewsResponse;
        setData(json.interviews || []);
      } catch (error) {
        console.error(error);
        setData([]);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [useMockData]);

  const counts = useMemo(() => {
    const upcoming = data.filter((i) => i.status === 'scheduled').length;
    const pendingFeedback = data.filter(
      (i) => i.status === 'completed' && !i.feedbackSubmitted
    ).length;

    const breaching = data.filter((i) => {
      if (i.status !== 'completed' || i.feedbackSubmitted) return false;
      if (!i.feedback_due_at) return false;
      return new Date(i.feedback_due_at).getTime() < Date.now();
    }).length;

    return { upcoming, pendingFeedback, breaching };
  }, [data]);

  const slaBadge = (() => {
    if (counts.breaching > 0) return { tone: 'bg-rose-50 text-rose-700', label: 'SLA breached' };
    if (counts.pendingFeedback > 0)
      return { tone: 'bg-amber-50 text-amber-700', label: 'Feedback due' };
    return { tone: 'bg-emerald-50 text-emerald-700', label: 'On track' };
  })();

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div className="space-y-1">
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock4 className="h-5 w-5 text-[#1C4D3A]" />
            Interviews & Feedback
          </CardTitle>
          <p className="text-sm text-muted-foreground">Keep 7d interviews & 48h feedback moving.</p>
        </div>
        <Badge className={`text-xs ${slaBadge.tone}`}>{slaBadge.label}</Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="rounded-lg border border-[#E8E6DD] p-3">
            <p className="text-xs text-muted-foreground">Scheduled</p>
            <p className="text-2xl font-semibold text-[#2D3330]">
              {loading ? '—' : counts.upcoming}
            </p>
          </div>
          <div className="rounded-lg border border-[#E8E6DD] p-3">
            <p className="text-xs text-muted-foreground">Feedback due</p>
            <p className="text-2xl font-semibold text-[#2D3330]">
              {loading ? '—' : counts.pendingFeedback}
            </p>
          </div>
          <div className="rounded-lg border border-[#E8E6DD] p-3">
            <p className="text-xs text-muted-foreground">Breaches</p>
            <p className="text-2xl font-semibold text-[#2D3330]">
              {loading ? '—' : counts.breaching}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <Link
            href="/app/i/matching"
            className="flex items-center justify-between rounded-lg border border-[#E8E6DD] px-3 py-2 hover:border-[#1C4D3A] hover:bg-[#F7F6F1] text-sm"
            onClick={() => onActionClick?.('schedule-interview')}
          >
            <span className="text-[#2D3330]">Schedule next interview</span>
            <AlarmClock className="h-4 w-4 text-[#9B9891]" />
          </Link>
          <Link
            href="/app/i/matching?tab=feedback"
            className="flex items-center justify-between rounded-lg border border-[#E8E6DD] px-3 py-2 hover:border-[#1C4D3A] hover:bg-[#F7F6F1] text-sm"
            onClick={() => onActionClick?.('send-feedback')}
          >
            <span className="text-[#2D3330]">Send interview feedback</span>
            <MessageSquare className="h-4 w-4 text-[#9B9891]" />
          </Link>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          SLA: 7d to interview, 48h to decision/feedback.
        </div>

        <Button
          variant="outline"
          size="sm"
          className="w-full border-[#1C4D3A] text-[#1C4D3A] hover:bg-[#EEF1EA]"
          asChild
          onClick={() => onActionClick?.('view-feedback')}
        >
          <Link href="/app/i/matching?tab=feedback">View feedback history</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
