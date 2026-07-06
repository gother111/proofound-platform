/**
 * Schedule Interview Button
 *
 * Trigger button for opening the interview scheduling modal.
 * Can be placed in match cards, messages, or dedicated interview pages.
 */

'use client';

import { useState } from 'react';
import { Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScheduleInterviewModal } from './ScheduleInterviewModal';

interface ScheduleInterviewButtonProps {
  matchId: string;
  matchAgreedAt: Date;
  existingInterviewsCount?: number;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'touch';
  className?: string;
  onScheduled?: (interview: { id: string; scheduledAt: string; meetingUrl: string }) => void;
}

export function ScheduleInterviewButton({
  matchId,
  matchAgreedAt,
  existingInterviewsCount = 0,
  variant = 'default',
  size = 'default',
  className,
  onScheduled,
}: ScheduleInterviewButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const isReschedule = existingInterviewsCount > 0;

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={() => setIsModalOpen(true)}
        style={variant === 'default' ? { backgroundColor: '#1C4D3A', color: 'white' } : undefined}
      >
        <Calendar className="w-4 h-4 mr-2" />
        {isReschedule ? 'Reschedule Interview' : 'Schedule Interview'}
      </Button>

      <ScheduleInterviewModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        matchId={matchId}
        matchAgreedAt={matchAgreedAt}
        existingInterviewsCount={existingInterviewsCount}
        onScheduled={(interview) => {
          if (onScheduled) {
            onScheduled(interview);
          }
          setIsModalOpen(false);
        }}
      />
    </>
  );
}
