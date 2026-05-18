import { notFound } from 'next/navigation';
import FeedbackForm from '@/components/feedback/FeedbackForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

export default async function FeedbackTokenPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const tokenData = await loadTokenData(token);

  if (!tokenData) {
    notFound();
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
          <CardTitle className="font-display text-2xl text-proofound-charcoal">
            Interview feedback
          </CardTitle>
          <p className="text-sm leading-6 text-muted-foreground">
            Share quick feedback. Your name will be hidden from the other side.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {expired ? (
            <p className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm leading-6 text-destructive">
              This feedback link has expired.
            </p>
          ) : alreadyUsed ? (
            <p className="rounded-xl border border-[#D7E8DE] bg-[#F3FAF6] p-4 text-sm leading-6 text-proofound-forest">
              Feedback already submitted. Thank you.
            </p>
          ) : template ? (
            <FeedbackForm
              template={template}
              interviewId={tokenData?.interview?.id}
              token={tokenData?.token}
              alreadySubmitted={alreadyUsed}
              surface="embedded"
            />
          ) : (
            <p className="text-sm text-destructive">Could not load the feedback form.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
