import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { PublicSnippetCard } from '@/components/profile/PublicSnippetCard';
import {
  recordProfileSnippetView,
  resolvePublicSnippet,
} from '@/lib/profile/public-snippet-resolver';

export const dynamic = 'force-dynamic';

function parseViewerIp(forwardedFor: string | null, realIp: string | null) {
  if (forwardedFor) {
    return forwardedFor.split(',')[0]?.trim() || null;
  }

  return realIp;
}

export default async function PublicTokenProfilePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
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

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 dark:bg-slate-950">
      <div className="mx-auto w-full max-w-3xl">
        <PublicSnippetCard snippet={result.snippet} />
      </div>
    </main>
  );
}
