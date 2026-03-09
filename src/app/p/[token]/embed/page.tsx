import { headers } from 'next/headers';
import { PublicProfileSection } from '@/components/public-profile/PublicProfileSection';
import { PublicProfileShell } from '@/components/public-profile/PublicProfileShell';
import { PublicSnippetView } from '@/components/profile/PublicSnippetView';
import { buildPortfolioRobots } from '@/lib/portfolio/public-contract';
import { buildPublicProfileMetadata } from '@/lib/seo/public-profile-metadata';
import {
  buildPublicSnippetViewModel,
  extractSnippetViewMeta,
  getSnippetByToken,
  recordUnavailableSnippetView,
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
        <p className="text-sm text-muted-foreground">This shared profile snippet is unavailable.</p>
      </PublicProfileSection>
    </PublicProfileShell>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return buildPublicProfileMetadata({
    title: 'Proofound share embed',
    description: 'Embeddable public profile snippet on Proofound.',
    path: `/p/${encodeURIComponent(token)}/embed`,
    canonicalPath: null,
    robots: buildPortfolioRobots('public_noindex'),
  });
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
  const headerStore = await headers();
  const requestMeta = extractSnippetViewMeta(headerStore);

  if (!snippet) {
    await recordUnavailableSnippetView({
      token,
      requestMeta,
      source: 'public_snippet_embed',
    });
    return <InvalidEmbedState />;
  }

  const viewModel = await buildPublicSnippetViewModel(snippet);
  if (!viewModel) {
    await recordUnavailableSnippetView({
      token,
      requestMeta,
      source: 'public_snippet_embed',
      reasonCode: 'snippet_render_unavailable',
    });
    return <InvalidEmbedState />;
  }

  await recordSnippetView(snippet, requestMeta, 'public_snippet_embed');

  const effectiveFormat = resolveFormat(format, snippet.format);

  return <PublicSnippetView viewModel={{ ...viewModel, format: effectiveFormat }} compact={true} />;
}
