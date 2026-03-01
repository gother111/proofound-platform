import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { PublicProfileShell } from '@/components/public-profile/PublicProfileShell';
import { PublicProfileSection } from '@/components/public-profile/PublicProfileSection';
import { PublicSnippetView } from '@/components/profile/PublicSnippetView';
import {
  buildPublicSnippetViewModel,
  extractSnippetViewMeta,
  getSnippetByToken,
  recordSnippetView,
} from '@/lib/profile/public-snippet';
import {
  buildPublicProfileMetadata,
  buildUnavailablePublicProfileMetadata,
} from '@/lib/seo/public-profile-metadata';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const { token } = await params;
  const safePath = `/p/${encodeURIComponent(token)}`;

  try {
    const snippet = await getSnippetByToken(token);
    if (!snippet) {
      return buildUnavailablePublicProfileMetadata(safePath);
    }

    const viewModel = await buildPublicSnippetViewModel(snippet);
    if (!viewModel) {
      return buildUnavailablePublicProfileMetadata(safePath);
    }

    if (viewModel.redacted) {
      return buildPublicProfileMetadata({
        title: 'Profile is currently hidden | Proofound',
        description:
          'This public profile link is currently hidden by the owner and is temporarily unavailable.',
        path: safePath,
        ogTitle: 'Profile is currently hidden',
        ogDescription:
          'This public profile link is currently hidden by the owner and is temporarily unavailable.',
      });
    }

    const subtitle =
      typeof viewModel.subtitle === 'string' && viewModel.subtitle.trim().length > 0
        ? viewModel.subtitle.trim()
        : null;
    const about =
      typeof viewModel.about === 'string' && viewModel.about.trim().length > 0
        ? viewModel.about.trim().slice(0, 140)
        : null;

    return buildPublicProfileMetadata({
      title: `${viewModel.title} | Proofound Public Profile`,
      description:
        subtitle || about || `Explore this public ${viewModel.profileType} profile on Proofound.`,
      path: safePath,
      ogTitle: `${viewModel.title} on Proofound`,
      ogDescription:
        subtitle || about || `View this public ${viewModel.profileType} profile on Proofound.`,
    });
  } catch {
    return buildUnavailablePublicProfileMetadata(safePath);
  }
}

function InvalidSnippetState() {
  return (
    <PublicProfileShell maxWidthClassName="max-w-3xl">
      <PublicProfileSection title="Shared profile status">
        <p className="text-base font-semibold text-foreground">
          This shared profile is unavailable
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          The link may be expired, deleted, or invalid.
        </p>
        <p className="text-sm text-muted-foreground">
          Ask the owner to generate a new sharing link.
        </p>
      </PublicProfileSection>
    </PublicProfileShell>
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
