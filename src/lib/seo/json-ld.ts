import { getPublicSiteUrl } from '@/lib/seo/public-metadata';

export type JsonLd = Record<string, unknown>;

type BreadcrumbItem = {
  name: string;
  path: string;
};

type StaticPageJsonLdOptions = {
  path: string;
  title: string;
  description: string;
  breadcrumbs?: BreadcrumbItem[];
};

type PublicPersonJsonLdOptions = {
  path: string;
  name: string;
  description: string;
  skills?: string[];
  imagePath?: string | null;
};

type PublicOrganizationJsonLdOptions = {
  path: string;
  name: string;
  description: string;
  operatingRegion?: string | null;
};

function toAbsoluteUrl(pathOrUrl: string): string {
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) {
    return pathOrUrl;
  }

  const siteUrl = getPublicSiteUrl();
  const normalizedPath = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`;
  return `${siteUrl}${normalizedPath === '/' ? '' : normalizedPath}`;
}

export function buildProofoundOrganizationJsonLd(description?: string): JsonLd {
  const siteUrl = getPublicSiteUrl();

  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Proofound',
    url: siteUrl,
    logo: `${siteUrl}/logo.png`,
    sameAs: [],
    description:
      description ||
      'Proofound is a proof-first hiring corridor centered on Proof Packs, privacy-safe review, and public trust surfaces derived from real work.',
  };
}

export function buildProofoundWebsiteJsonLd(description?: string): JsonLd {
  const siteUrl = getPublicSiteUrl();

  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Proofound',
    url: siteUrl,
    description:
      description ||
      'Proof Packs, privacy-safe candidate review, public proof portfolios, and organization trust pages for stronger signal than CVs.',
  };
}

export function buildWebPageJsonLd({ path, title, description }: StaticPageJsonLdOptions): JsonLd {
  const siteUrl = getPublicSiteUrl();

  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: title,
    url: toAbsoluteUrl(path),
    description,
    isPartOf: {
      '@type': 'WebSite',
      url: siteUrl,
      name: 'Proofound',
    },
  };
}

export function buildBreadcrumbJsonLd(items: BreadcrumbItem[]): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: toAbsoluteUrl(item.path),
    })),
  };
}

export function buildStaticPageJsonLd({
  path,
  title,
  description,
  breadcrumbs,
}: StaticPageJsonLdOptions): JsonLd[] {
  const breadcrumbItems =
    breadcrumbs && breadcrumbs.length > 0
      ? breadcrumbs
      : path === '/'
        ? [{ name: 'Home', path: '/' }]
        : [
            { name: 'Home', path: '/' },
            { name: title, path },
          ];

  return [
    buildProofoundOrganizationJsonLd(),
    buildProofoundWebsiteJsonLd(),
    buildWebPageJsonLd({ path, title, description }),
    buildBreadcrumbJsonLd(breadcrumbItems),
  ];
}

export function buildPublicPersonPortfolioJsonLd({
  path,
  name,
  description,
  skills = [],
  imagePath,
}: PublicPersonJsonLdOptions): JsonLd {
  const person: JsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name,
    url: toAbsoluteUrl(path),
    description,
  };

  if (skills.length > 0) {
    person.knowsAbout = skills;
  }

  if (imagePath) {
    person.image = toAbsoluteUrl(imagePath);
  }

  return person;
}

export function buildPublicOrganizationPortfolioJsonLd({
  path,
  name,
  description,
  operatingRegion,
}: PublicOrganizationJsonLdOptions): JsonLd {
  const organization: JsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name,
    url: toAbsoluteUrl(path),
    description,
  };

  if (operatingRegion) {
    organization.areaServed = operatingRegion;
  }

  return organization;
}
