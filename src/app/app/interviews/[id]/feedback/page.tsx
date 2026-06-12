import { notFound } from 'next/navigation';
import FeedbackForm from '@/components/feedback/FeedbackForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type FeedbackQuestion = {
  id: string;
  prompt: string;
  question_type: 'scale' | 'text';
  scale_min?: number | null;
  scale_max?: number | null;
  required: boolean;
  sort_order?: number;
  helper_text?: string | null;
};

type FeedbackTemplate = {
  id: string;
  name: string;
  direction: 'candidate_to_org' | 'org_to_candidate';
  description?: string | null;
  questions: FeedbackQuestion[];
};

type FeedbackAnswer = {
  id: string;
  question_id: string;
  score?: number | null;
  text_answer?: string | null;
};

type FeedbackResponse = {
  id: string;
  template_id: string;
  direction: 'candidate_to_org' | 'org_to_candidate';
  submitted_by?: string | null;
  created_at?: string;
  answers?: FeedbackAnswer[];
};

type FeedbackApiResponse = {
  interview: { id: string; status?: string };
  templates: FeedbackTemplate[];
  responses: FeedbackResponse[];
};

function feedbackDirectionLabel(direction: FeedbackResponse['direction']) {
  return direction === 'candidate_to_org'
    ? 'Participant → Organization'
    : 'Organization → Participant';
}

async function loadFeedback(interviewId: string): Promise<FeedbackApiResponse | null> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || '';
  const res = await fetch(`${baseUrl}/api/feedback/${interviewId}`, { cache: 'no-store' });
  if (!res.ok) return null;
  return res.json();
}

function ResponseList({
  responses,
  templates,
}: {
  responses: FeedbackResponse[];
  templates: FeedbackTemplate[];
}) {
  if (!responses.length) {
    return (
      <Card className="border-dashed border-proofound-stone/80 bg-white/75">
        <CardContent className="space-y-2 p-4 sm:p-5">
          <p className="text-sm font-semibold text-proofound-charcoal">
            Feedback is waiting on submissions
          </p>
          <p className="text-sm leading-6 text-muted-foreground">
            Submit the relevant feedback form above. Once feedback is shared, anonymized responses
            appear here for the interview record.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {responses.map((response) => {
        const template = templates.find((t) => t.id === response.template_id);
        return (
          <Card key={response.id}>
            <CardHeader>
              <CardTitle className="text-base">
                {template?.name || 'Feedback'} · {feedbackDirectionLabel(response.direction)}
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Shared{' '}
                {response.created_at ? new Date(response.created_at).toLocaleString() : 'recently'}{' '}
                (anonymized)
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              {(response.answers || []).map((answer) => {
                const question = template?.questions.find((q) => q.id === answer.question_id);
                return (
                  <div key={answer.id} className="rounded-md border bg-muted/40 p-3">
                    <p className="text-sm font-medium">{question?.prompt || 'Question'}</p>
                    {answer.score !== null && answer.score !== undefined ? (
                      <p className="text-sm text-muted-foreground">Rating: {answer.score}</p>
                    ) : null}
                    {answer.text_answer ? (
                      <p className="text-sm text-muted-foreground">{answer.text_answer}</p>
                    ) : null}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export default async function InterviewFeedbackPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await loadFeedback(id);

  if (!data) {
    notFound();
  }

  const yourResponses = new Set(
    (data?.responses || []).filter((r) => r.submitted_by).map((r) => r.direction)
  );

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">Interview feedback</h1>
        <p className="text-sm text-muted-foreground">
          Share structured, anonymous feedback and view what the other side shared once submitted.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {data?.templates.map((template) => (
          <FeedbackForm
            key={template.id}
            template={template}
            interviewId={data.interview.id}
            alreadySubmitted={yourResponses.has(template.direction)}
          />
        ))}
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Shared feedback</h2>
        <ResponseList responses={data?.responses || []} templates={data?.templates || []} />
      </div>
    </div>
  );
}
