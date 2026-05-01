import { headers } from 'next/headers';
import type { JsonLd } from '@/lib/seo/json-ld';

export function serializeJsonLdForHtml(value: JsonLd): string {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

export async function JsonLdScripts({
  items,
  idPrefix = 'jsonld',
}: {
  items: JsonLd[];
  idPrefix?: string;
}) {
  if (!items.length) {
    return null;
  }

  const nonce = (await headers()).get('x-nonce') ?? undefined;

  return (
    <>
      {items.map((item, index) => (
        <script
          key={`${idPrefix}-${index}`}
          id={`${idPrefix}-${index}`}
          nonce={nonce}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLdForHtml(item) }}
        />
      ))}
    </>
  );
}
