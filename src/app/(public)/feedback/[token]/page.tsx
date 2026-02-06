import { notFound } from 'next/navigation';
import FeedbackForm from '@/components/feedback/FeedbackForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-10">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Interview feedback</CardTitle>
          <p className="text-sm text-muted-foreground">
            Share quick feedback. Your name will be hidden from the other side.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {expired ? (
            <p className="text-sm text-destructive">This feedback link has expired.</p>
          ) : alreadyUsed ? (
            <p className="text-sm text-emerald-700">Feedback already submitted. Thank you!</p>
          ) : template ? (
            <FeedbackForm
              template={template}
              interviewId={tokenData?.interview?.id}
              token={tokenData?.token}
              alreadySubmitted={alreadyUsed}
            />
          ) : (
            <p className="text-sm text-destructive">Could not load the feedback form.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
