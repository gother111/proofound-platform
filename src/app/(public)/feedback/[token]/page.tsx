import Link from 'next/link';
import FeedbackForm from '@/components/feedback/FeedbackForm';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  buildVisualFeedbackTokenResponse,
  feedbackVisualFixturesEnabled,
} from '@/lib/feedback/visual-fixtures';

type TokenData = {
  token: string;
  direction: 'candidate_to_org' | 'org_to_candidate';
  expiresAt?: string;
  usedAt?: string | null;
  template?: any;
  questions?: any[];
  interview?: { id: string; status?: string; scheduled_at?: string };
};

type FeedbackTokenNoticeProps = {
  tone: 'error' | 'success';
  title: string;
  message: string;
  details?: string[];
  actionLabel?: string;
};

async function loadTokenData(token: string): Promise<TokenData | null> {
  if (feedbackVisualFixturesEnabled()) {
    const visualResponse = buildVisualFeedbackTokenResponse(token);
    if (visualResponse) {
      return visualResponse;
    }
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || '';
  const response = await fetch(`${baseUrl}/api/feedback/token/${token}`, { cache: 'no-store' });
  if (!response.ok) return null;
  return response.json();
}

function FeedbackTokenNotice({
  tone,
  title,
  message,
  details = [],
  actionLabel = 'Return home',
}: FeedbackTokenNoticeProps) {
  const isError = tone === 'error';

  return (
    <div
      role={isError ? 'alert' : 'status'}
      aria-live={isError ? 'assertive' : 'polite'}
      className={`rounded-xl border p-4 text-sm leading-6 ${
        isError
          ? 'border-amber-300 bg-amber-50 text-amber-950'
          : 'border-[#D7E8DE] bg-[#F3FAF6] text-proofound-forest'
      }`}
    >
      <p className="font-semibold">{title}</p>
      <p className="mt-1">{message}</p>
      {details.length > 0 ? (
        <ul className="mt-3 list-disc space-y-1 pl-4">
          {details.map((detail) => (
            <li key={detail}>{detail}</li>
          ))}
        </ul>
      ) : null}
      <Link
        href="/"
        className="mt-4 inline-flex min-h-11 items-center justify-center rounded-lg border border-proofound-stone bg-white px-4 py-2 text-sm font-semibold text-proofound-charcoal shadow-sm transition-colors hover:border-proofound-forest/40 hover:text-proofound-forest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-proofound-forest focus-visible:ring-offset-2"
      >
        {actionLabel}
      </Link>
    </div>
  );
}

export default async function FeedbackTokenPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const tokenData = await loadTokenData(token);

  if (!tokenData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-proofound-parchment px-4 py-10">
        <Card className="w-full max-w-md rounded-[24px] border-proofound-stone bg-white/95 shadow-[0_4px_24px_rgba(29,51,48,0.08)]">
          <CardHeader className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-proofound-forest">
              Feedback link
            </p>
            <h1 className="font-display text-2xl font-semibold leading-tight tracking-tight text-proofound-charcoal">
              Unable to load feedback request
            </h1>
            <p className="text-sm leading-6 text-muted-foreground">
              This link cannot collect feedback right now. Nothing was submitted from this page.
            </p>
          </CardHeader>
          <CardContent>
            <FeedbackTokenNotice
              tone="error"
              title="Feedback link unavailable"
              message="The request may be expired, already revoked, or mistyped. Nothing was submitted from this page."
              details={[
                'Ask the sender for a fresh feedback request if you still need to respond.',
                'You do not need a Proofound account to answer a valid feedback link.',
              ]}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  const template = tokenData?.template
    ? {
        ...tokenData.template,
        questions: tokenData.questions || [],
      }
    : null;

  const expired = tokenData?.expiresAt ? new Date(tokenData.expiresAt) < new Date() : false;
  const alreadyUsed = Boolean(tokenData?.usedAt);

  return (
    <div className="flex min-h-screen items-center justify-center bg-proofound-parchment px-4 py-10">
      <Card className="w-full max-w-3xl rounded-[24px] border-proofound-stone bg-white/95 shadow-[0_4px_24px_rgba(29,51,48,0.08)]">
        <CardHeader className="space-y-2">
          <h1 className="font-display text-2xl font-semibold leading-none tracking-tight text-proofound-charcoal">
            Interview feedback
          </h1>
          <p className="text-sm leading-6 text-muted-foreground">
            Share quick feedback. Your response is anonymized for the review workflow.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {expired ? (
            <FeedbackTokenNotice
              tone="error"
              title="Feedback link expired"
              message="This request can no longer accept a response. Nothing was submitted from this page."
              details={[
                'Ask the sender to issue a new feedback request if feedback is still needed.',
              ]}
            />
          ) : alreadyUsed ? (
            <FeedbackTokenNotice
              tone="success"
              title="Feedback already submitted"
              message="We have already recorded feedback for this request. You can close this page."
              actionLabel="Return to Proofound"
            />
          ) : template ? (
            <FeedbackForm
              template={template}
              interviewId={tokenData?.interview?.id}
              token={tokenData?.token}
              alreadySubmitted={alreadyUsed}
              surface="embedded"
            />
          ) : (
            <FeedbackTokenNotice
              tone="error"
              title="Feedback form unavailable"
              message="The request loaded, but its question set is missing. Nothing was submitted from this page."
              details={[
                'Ask the sender to resend the feedback request.',
                'Your name remains hidden unless a valid form is submitted.',
              ]}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
