import { headers } from 'next/headers';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { OrgShortlistClient } from '@/components/shortlist/OrgShortlistClient';
import type { ShortlistItem } from '@/components/shortlist/OrgShortlistClient';

export const dynamic = 'force-dynamic';

export default async function OrgShortlistPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const headersList = await headers();
  const host = headersList.get('host');
  const protocol = headersList.get('x-forwarded-proto') ?? 'http';
  const baseUrl = host ? `${protocol}://${host}` : '';

  const response = await fetch(`${baseUrl}/api/org/${slug}/shortlist`, {
    headers: {
      cookie: headersList.get('cookie') ?? '',
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    return (
      <div className="p-6">
        <Card className="p-6">
          <h1 className="text-xl font-semibold text-proofound-charcoal mb-2">Shortlist</h1>
          <p className="text-sm text-muted-foreground">
            Unable to load shortlist right now. Please refresh and try again.
          </p>
        </Card>
      </div>
    );
  }

  const data = (await response.json()) as { items?: ShortlistItem[] };
  const items = data.items ?? [];

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-proofound-charcoal">Shortlist</h1>
        <Badge variant="outline">
          {items.length} candidate{items.length === 1 ? '' : 's'}
        </Badge>
      </div>

      {items.length === 0 ? (
        <Card className="p-6">
          <p className="text-sm text-muted-foreground">
            No candidates shortlisted yet. Encourage candidates to express interest from the Matching
            tab.
          </p>
        </Card>
      ) : (
        <OrgShortlistClient items={items} />
      )}
    </div>
  );
}
