import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { PublicSnippetCard } from '@/components/profile/PublicSnippetCard';
import {
  recordProfileSnippetView,
  resolvePublicSnippet,
} from '@/lib/profile/public-snippet-resolver';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

const EMBED_FORMATS = new Set(['mini', 'card', 'full']);

type EmbedFormat = 'mini' | 'card' | 'full';

function parseViewerIp(forwardedFor: string | null, realIp: string | null) {
  if (forwardedFor) {
    return forwardedFor.split(',')[0]?.trim() || null;
  }

  return realIp;
}

function getFormatFromQuery(format: string | string[] | undefined): EmbedFormat | undefined {
  if (!format) {
    return undefined;
  }

  const value = Array.isArray(format) ? format[0] : format;
  if (!value || !EMBED_FORMATS.has(value)) {
    return undefined;
  }

  return value as EmbedFormat;
}

export default async function PublicTokenProfileEmbedPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ format?: string | string[] }>;
}) {
  const { token } = await params;
  const query = await searchParams;
  const result = await resolvePublicSnippet(token);

  if (result.status !== 'ok') {
    notFound();
  }

  const headersList = await headers();
  await recordProfileSnippetView(result.snippet.snippetId, {
    viewerIp: parseViewerIp(headersList.get('x-forwarded-for'), headersList.get('x-real-ip')),
    viewerUserAgent: headersList.get('user-agent'),
    referrer: headersList.get('referer'),
  });

  const format = getFormatFromQuery(query.format) || result.snippet.format;

  return (
    <main className="min-h-screen bg-transparent p-2">
      <PublicSnippetCard snippet={result.snippet} format={format} compact />
    </main>
  );
}
