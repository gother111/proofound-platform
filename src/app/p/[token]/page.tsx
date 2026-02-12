import { headers } from 'next/headers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PublicSnippetView } from '@/components/profile/PublicSnippetView';
import {
  buildPublicSnippetViewModel,
  extractSnippetViewMeta,
  getSnippetByToken,
  recordSnippetView,
} from '@/lib/profile/public-snippet';

export const dynamic = 'force-dynamic';

function InvalidSnippetState() {
  return (
    <div className="min-h-screen bg-[#F7F6F1] flex items-center justify-center p-6">
      <Card className="max-w-lg w-full border-slate-200">
        <CardHeader>
          <CardTitle className="text-xl">This shared profile is unavailable</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-slate-600">
          <p>The link may be expired, deleted, or invalid.</p>
          <p>Ask the owner to generate a new sharing link.</p>
        </CardContent>
      </Card>
    </div>
  );
}

export default async function PublicProfileSnippetPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const snippet = await getSnippetByToken(token);
  if (!snippet) {
    return <InvalidSnippetState />;
  }

  const viewModel = await buildPublicSnippetViewModel(snippet);
  if (!viewModel) {
    return <InvalidSnippetState />;
  }

  const headerStore = await headers();
  await recordSnippetView(snippet.id, extractSnippetViewMeta(headerStore));

  return <PublicSnippetView viewModel={viewModel} />;
}
