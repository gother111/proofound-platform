import { headers } from 'next/headers';
import { Card, CardContent } from '@/components/ui/card';
import { PublicSnippetView } from '@/components/profile/PublicSnippetView';
import {
  buildPublicSnippetViewModel,
  extractSnippetViewMeta,
  getSnippetByToken,
  recordSnippetView,
  type SnippetFormat,
} from '@/lib/profile/public-snippet';

export const dynamic = 'force-dynamic';

const VALID_FORMATS: SnippetFormat[] = ['mini', 'card', 'full'];

function resolveFormat(format: string | undefined, fallback: SnippetFormat): SnippetFormat {
  if (!format) {
    return fallback;
  }
  return VALID_FORMATS.includes(format as SnippetFormat) ? (format as SnippetFormat) : fallback;
}

function InvalidEmbedState() {
  return (
    <div className="min-h-[140px] bg-[#F7F6F1] p-3">
      <Card className="border-slate-200">
        <CardContent className="py-8 text-center text-sm text-slate-600">
          This shared profile snippet is unavailable.
        </CardContent>
      </Card>
    </div>
  );
}

export default async function PublicProfileSnippetEmbedPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ format?: string }>;
}) {
  const [{ token }, { format }] = await Promise.all([params, searchParams]);

  const snippet = await getSnippetByToken(token);
  if (!snippet) {
    return <InvalidEmbedState />;
  }

  const viewModel = await buildPublicSnippetViewModel(snippet);
  if (!viewModel) {
    return <InvalidEmbedState />;
  }

  const headerStore = await headers();
  await recordSnippetView(snippet.id, extractSnippetViewMeta(headerStore));

  const effectiveFormat = resolveFormat(format, snippet.format);

  return <PublicSnippetView viewModel={{ ...viewModel, format: effectiveFormat }} compact={true} />;
}
