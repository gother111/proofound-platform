import { describe, expect, it } from 'vitest';

import { serializeJsonLdForHtml } from '@/components/seo/JsonLdScripts';
import {
  buildBreadcrumbJsonLd,
  buildPublicOrganizationPortfolioJsonLd,
  buildPublicPersonPortfolioJsonLd,
  buildStaticPageJsonLd,
} from '@/lib/seo/json-ld';

describe('public JSON-LD helpers', () => {
  it('builds static page graph entries for public pages', () => {
    const items = buildStaticPageJsonLd({
      path: '/',
      title: 'Proofound | Proof-first assignment review',
      description:
        'Proof-first assignment review corridor with privacy-safe review and public trust surfaces.',
    });

    expect(items).toHaveLength(4);
    expect(items[0]['@type']).toBe('Organization');
    expect(items[1]['@type']).toBe('WebSite');
    expect(items[2]['@type']).toBe('WebPage');
    expect(items[3]['@type']).toBe('BreadcrumbList');
  });

  it('builds safe person portfolio JSON-LD using only public fields', () => {
    const item = buildPublicPersonPortfolioJsonLd({
      path: '/portfolio/jane',
      name: 'Jane Doe',
      description: 'Proof-first portfolio',
      skills: ['Research Ops', 'Strategy'],
    });

    expect(item['@type']).toBe('Person');
    expect(item.name).toBe('Jane Doe');
    expect(item.knowsAbout).toEqual(['Research Ops', 'Strategy']);
    expect(item.url).toContain('/portfolio/jane');
  });

  it('builds organization portfolio JSON-LD without inferred sameAs links', () => {
    const item = buildPublicOrganizationPortfolioJsonLd({
      path: '/portfolio/org/acme',
      name: 'Acme',
      description: 'Trust card',
      operatingRegion: 'EU',
    });

    expect(item['@type']).toBe('Organization');
    expect(item.name).toBe('Acme');
    expect(item.areaServed).toBe('EU');
    expect(item.sameAs).toBeUndefined();
  });

  it('escapes script-closing sequences when serializing JSON-LD for HTML', () => {
    const serialized = serializeJsonLdForHtml({
      '@context': 'https://schema.org',
      '@type': 'Thing',
      name: '</script><script>alert(1)</script>',
    });

    expect(serialized).toContain('\\u003c/script>\\u003cscript>alert(1)\\u003c/script>');
    expect(serialized).not.toContain('</script>');
  });

  it('builds breadcrumb lists with absolute item URLs', () => {
    const item = buildBreadcrumbJsonLd([
      { name: 'Home', path: '/' },
      { name: 'Privacy', path: '/privacy' },
    ]);

    expect(item['@type']).toBe('BreadcrumbList');
    expect((item.itemListElement as Array<Record<string, unknown>>)[1].item).toContain('/privacy');
  });
});
