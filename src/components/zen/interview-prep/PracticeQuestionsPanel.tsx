import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';

export type PracticeQuestionRow = {
  id?: string;
  questionType: 'behavioral' | 'technical' | 'role_specific' | 'values_based';
  questionText: string;
  contextHint?: string | null;
  displayOrder?: number | null;
};

type Props = {
  questions: PracticeQuestionRow[];
  onMarkPracticed?: (count: number) => void;
  isLoading?: boolean;
};

export function PracticeQuestionsPanel({ questions, onMarkPracticed, isLoading }: Props) {
  const sortedQuestions = useMemo(
    () => [...(questions || [])].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0)),
    [questions]
  );
  const [activeIndex, setActiveIndex] = useState(0);
  const [draftAnswer, setDraftAnswer] = useState('');
  const [rating, setRating] = useState<number>(0);
  const [practicedCount, setPracticedCount] = useState(0);
  const current = sortedQuestions[activeIndex] ?? null;
  const progress =
    sortedQuestions.length > 0 ? Math.round(((activeIndex + 1) / sortedQuestions.length) * 100) : 0;
  const answerInputId = useMemo(
    () => `practice-answer-${current?.id ?? activeIndex}`,
    [current?.id, activeIndex]
  );

  if (isLoading) {
    return (
      <Card className="p-6 bg-white/70 dark:bg-[#1f1c19] border border-[#E8E6DD] dark:border-[#3C332C]">
        <div className="animate-pulse h-5 w-32 bg-[#E8E6DD] dark:bg-[#2F2823] rounded mb-4" />
        <div className="animate-pulse h-24 w-full bg-[#E8E6DD] dark:bg-[#2F2823] rounded" />
      </Card>
    );
  }

  if (!current) {
    return (
      <Card className="p-6 bg-white/70 dark:bg-[#1f1c19] border border-dashed border-[#E8E6DD] text-sm text-[#6B6760]">
        Generate practice questions to get started.
      </Card>
    );
  }

  const handleSave = () => {
    const nextCount = practicedCount + 1;
    setPracticedCount(nextCount);
    onMarkPracticed?.(nextCount);
  };

  return (
    <Card className="p-6 bg-white/70 dark:bg-[#1f1c19] border border-[#E8E6DD] dark:border-[#3C332C] space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {current.questionType.replace('_', ' ')}
          </Badge>
          <p className="text-sm text-[#6B6760]">
            Question {activeIndex + 1} of {sortedQuestions.length}
          </p>
        </div>
        <Progress value={progress} className="w-32" />
      </div>

      <div className="space-y-2">
        <h4 className="text-lg font-semibold text-[#2D3330] dark:text-[#E8E6DD]">
          {current.questionText}
        </h4>
        {current.contextHint && (
          <p className="text-sm text-[#6B6760] dark:text-[#C9C2B8]">{current.contextHint}</p>
        )}
      </div>

      <div className="space-y-2">
        <label
          htmlFor={answerInputId}
          className="text-sm font-medium text-[#2D3330] dark:text-[#E8E6DD]"
        >
          Jot a quick answer (private)
        </label>
        <Textarea
          id={answerInputId}
          value={draftAnswer}
          onChange={(e) => setDraftAnswer(e.target.value)}
          placeholder="Bullet a quick STAR response..."
          className="min-h-[140px]"
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm text-[#6B6760]">
          <span>Self-rating (1-5)</span>
          <span className="font-semibold text-[#1C4D3A]">{rating || '—'}</span>
        </div>
        <Slider
          value={[rating]}
          min={0}
          max={5}
          step={1}
          onValueChange={(value) => setRating(value[0] ?? 0)}
        />
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-[#6B6760]">
          <Sparkles className="h-4 w-4 text-[#1C4D3A]" />
          <span>Private practice — not shared or used in matching.</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={activeIndex === 0}
            onClick={() => setActiveIndex((idx) => Math.max(0, idx - 1))}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          <Button variant="outline" size="sm" onClick={handleSave}>
            Save response
          </Button>
          <Button
            size="sm"
            className="bg-[#1C4D3A] text-white"
            disabled={activeIndex === sortedQuestions.length - 1}
            onClick={() => setActiveIndex((idx) => Math.min(sortedQuestions.length - 1, idx + 1))}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
