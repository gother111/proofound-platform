import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, PlayCircle, RefreshCcw } from 'lucide-react';

export type PrepSessionView = {
  session: {
    id: string;
    status: string;
    tipsViewed: boolean;
    questionsPracticed: number;
    isPrivate: boolean;
    createdAt?: string;
  } | null;
  interview: {
    id: string;
    status: string;
    scheduledAt: string;
    duration: number;
    platform: string;
    meetingUrl?: string;
    matchId: string;
  };
  assignment: {
    id: string;
    role: string;
    outcomes?: any;
    mustHaveSkills?: any;
    niceToHaveSkills?: any;
  };
};

type Props = {
  data: PrepSessionView;
  onStart: (interviewId: string) => Promise<void> | void;
  onSelect: (sessionId: string | null, record: PrepSessionView) => void;
};

const formatCountdown = (dateStr: string) => {
  const target = new Date(dateStr).getTime();
  const diffMs = target - Date.now();
  if (isNaN(diffMs)) return 'Date TBD';
  if (diffMs <= 0) return 'Starting soon';
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ${hours % 24}h`;
  const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${mins}m`;
};

const statusTone: Record<string, { bg: string; fg: string }> = {
  scheduled: { bg: '#E8F5E9', fg: '#2E7D32' },
  completed: { bg: '#E3F2FD', fg: '#1565C0' },
  cancelled: { bg: '#FFF3E0', fg: '#E65100' },
  in_progress: { bg: '#FFF8E1', fg: '#F57F17' },
};

export function InterviewPrepCard({ data, onStart, onSelect }: Props) {
  const isPrepared = !!data.session;
  const countdown = useMemo(() => formatCountdown(data.interview.scheduledAt), [data.interview]);
  const tone = statusTone[data.interview.status] || statusTone.scheduled;

  return (
    <Card className="p-5 bg-white/80 dark:bg-[#1f1c19] border border-[#E8E6DD] dark:border-[#3C332C] shadow-sm flex flex-col gap-3">
      <div className="flex justify-between items-start gap-3">
        <div className="space-y-1">
          <p className="text-sm text-[#6B6760]">Upcoming interview</p>
          <h3 className="text-lg font-semibold text-[#2D3330] dark:text-[#E8E6DD]">
            {data.assignment.role}
          </h3>
          <div className="flex items-center gap-2 text-sm text-[#6B6760]">
            <Calendar className="h-4 w-4" />
            <span>{new Date(data.interview.scheduledAt).toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-[#6B6760]">
            <Clock className="h-4 w-4" />
            <span>
              {data.interview.duration} min • {data.interview.platform}
            </span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Badge
            className="rounded-full px-3 py-1 text-xs"
            style={{ backgroundColor: tone.bg, color: tone.fg }}
          >
            {data.interview.status}
          </Badge>
          <div className="text-xs text-[#6B6760]">
            Starts in <span className="font-semibold text-[#1C4D3A]">{countdown}</span>
          </div>
        </div>
      </div>

      {isPrepared ? (
        <div className="flex items-center justify-between gap-3 rounded-lg bg-[#F7F6F1] dark:bg-[#2F2823] px-4 py-3">
          <div className="text-sm text-[#2D3330] dark:text-[#E8E6DD]">
            <div className="font-semibold">Prep status: {data.session?.status}</div>
            <div className="text-xs text-[#6B6760]">
              Tips viewed: {data.session?.tipsViewed ? 'Yes' : 'No'} • Questions practiced:{' '}
              {data.session?.questionsPracticed ?? 0}
            </div>
          </div>
          <Button
            size="sm"
            className="bg-[#1C4D3A] text-white"
            onClick={() => onSelect(data.session?.id ?? null, data)}
          >
            <RefreshCcw className="h-4 w-4 mr-2" />
            Continue
          </Button>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-3 rounded-lg bg-[#E8F5E9] dark:bg-[#1f2d23] px-4 py-3">
          <div className="text-sm text-[#2D3330] dark:text-[#E8E6DD]">
            <div className="font-semibold">No prep started yet</div>
            <div className="text-xs text-[#2E7D32]">
              Start prep to unlock tips and practice questions for this assignment.
            </div>
          </div>
          <Button size="sm" variant="outline" onClick={() => onStart(data.interview.id)}>
            <PlayCircle className="h-4 w-4 mr-2" />
            Start Prep
          </Button>
        </div>
      )}
    </Card>
  );
}
