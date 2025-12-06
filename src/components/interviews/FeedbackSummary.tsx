'use client';

import { AuthorRole, FeedbackEntry } from './InterviewFeedbackForm';

interface FeedbackSummaryProps {
  viewerRole: AuthorRole;
  mine: FeedbackEntry | null;
  theirs: FeedbackEntry | null;
  decisionRecorded: boolean;
}

function RatingRow({ label, value }: { label: string; value?: number }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-[#2D3330]">{label}</span>
      <span className="rounded-md bg-[#F0EFE9] px-2 py-1 text-xs font-semibold text-[#1C4D3A]">
        {value ?? '—'}
      </span>
    </div>
  );
}

function FeedbackCard({
  title,
  feedback,
  placeholder,
}: {
  title: string;
  feedback: FeedbackEntry | null;
  placeholder: string;
}) {
  if (!feedback) {
    return (
      <div className="rounded-lg border border-dashed border-gray-200 bg-white p-3">
        <p className="text-sm font-medium text-[#2D3330]">{title}</p>
        <p className="text-sm text-[#6B6760]">{placeholder}</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-[#2D3330]">{title}</p>
        <span className="text-[11px] text-[#6B6760]">
          {new Date(feedback.createdAt).toLocaleDateString()}
        </span>
      </div>
      <div className="space-y-2">
        <RatingRow label="Fairness" value={feedback.fairnessRating} />
        <RatingRow label="Clarity" value={feedback.clarityRating} />
        <RatingRow label="Overall" value={feedback.experienceRating} />
      </div>
      <div className="rounded-md bg-[#F8F7F2] p-2 text-sm text-[#2D3330]">{feedback.comments}</div>
    </div>
  );
}

export function FeedbackSummary({
  viewerRole,
  mine,
  theirs,
  decisionRecorded,
}: FeedbackSummaryProps) {
  const otherLabel = viewerRole === 'candidate' ? 'Organization feedback' : 'Candidate feedback';
  const yourLabel = viewerRole === 'candidate' ? 'Your feedback' : 'Your team’s feedback';

  return (
    <div className="grid gap-3 md:grid-cols-2">
      <FeedbackCard
        title={yourLabel}
        feedback={mine}
        placeholder="Share how the interview felt to you."
      />
      <FeedbackCard
        title={otherLabel}
        feedback={decisionRecorded ? theirs : null}
        placeholder={
          decisionRecorded
            ? 'Waiting for feedback from the other side.'
            : 'Hidden until a final decision is recorded.'
        }
      />
    </div>
  );
}
