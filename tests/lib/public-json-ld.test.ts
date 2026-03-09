import { describe, expect, it } from 'vitest';

import {
  buildBreadcrumbJsonLd,
  buildPublicOrganizationPortfolioJsonLd,
  buildPublicPersonPortfolioJsonLd,
  buildStaticPageJsonLd,
} from '@/lib/seo/json-ld';

describe('public JSON-LD helpers', () => {
  it('builds static page graph entries for public pages', () => {
    const items = buildStaticPageJsonLd({
      path: '/about',
      title: 'About Proofound',
      description: 'Learn about Proofound.',
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

  it('builds breadcrumb lists with absolute item URLs', () => {
    const item = buildBreadcrumbJsonLd([
      { name: 'Home', path: '/' },
      { name: 'Support', path: '/support' },
    ]);

    expect(item['@type']).toBe('BreadcrumbList');
    expect((item.itemListElement as Array<Record<string, unknown>>)[1].item).toContain('/support');
  });
});
