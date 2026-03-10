import type { JsonLd } from '@/lib/seo/json-ld';

export function serializeJsonLdForHtml(value: JsonLd): string {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

export function JsonLdScripts({
  items,
  idPrefix = 'jsonld',
}: {
  items: JsonLd[];
  idPrefix?: string;
}) {
  if (!items.length) {
    return null;
  }

  return (
    <>
      {items.map((item, index) => (
        <script
          key={`${idPrefix}-${index}`}
          id={`${idPrefix}-${index}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLdForHtml(item) }}
        />
      ))}
    </>
  );
}
