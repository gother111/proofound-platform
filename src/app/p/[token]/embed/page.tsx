import { headers } from 'next/headers';
import { PublicProfileSection } from '@/components/public-profile/PublicProfileSection';
import { PublicProfileShell } from '@/components/public-profile/PublicProfileShell';
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
    <PublicProfileShell compact={true} maxWidthClassName="max-w-3xl">
      <PublicProfileSection title="Shared profile status">
        <p className="text-sm text-[#6B6760]">This shared profile snippet is unavailable.</p>
      </PublicProfileSection>
    </PublicProfileShell>
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
