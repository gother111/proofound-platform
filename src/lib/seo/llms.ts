import { getPublicSiteUrl } from '@/lib/seo/public-metadata';

type LlmsEntry = {
  title: string;
  path: string;
  description: string;
};

type LlmsSection = {
  heading: string;
  entries: LlmsEntry[];
};

const BASE_SECTIONS: LlmsSection[] = [
  {
    heading: 'Core Pages',
    entries: [
      {
        title: 'Homepage',
        path: '/',
        description:
          'Overview of Proofound, its public proof portfolio model, and the trust-first product positioning.',
      },
      {
        title: 'About Proofound',
        path: '/about',
        description:
          'Explains the trust, privacy, and fairness principles behind the Proofound platform.',
      },
      {
        title: 'Proofound Manifesto',
        path: '/manifesto',
        description:
          'Product philosophy and operating commitments for evidence-first credibility and accountable matching.',
      },
      {
        title: 'Careers at Proofound',
        path: '/careers',
        description:
          'Hiring page describing team values, operating model, and the kinds of work Proofound is building.',
      },
    ],
  },
  {
    heading: 'Support',
    entries: [
      {
        title: 'Contact Proofound',
        path: '/contact',
        description:
          'Primary contact route for support, partnerships, and product questions with response expectations.',
      },
      {
        title: 'Support',
        path: '/support',
        description:
          'Support routing guidance for product issues, accessibility feedback, privacy requests, and security concerns.',
      },
    ],
  },
  {
    heading: 'Legal',
    entries: [
      {
        title: 'Privacy Policy',
        path: '/privacy',
        description:
          'How Proofound processes personal data, applies consent controls, and supports user rights requests.',
      },
      {
        title: 'Terms of Service',
        path: '/terms',
        description:
          'Service rules covering eligibility, acceptable use, moderation, deletion, and legal responsibilities.',
      },
      {
        title: 'Cookie Policy',
        path: '/cookies',
        description:
          'Cookie categories, consent model, and privacy-preserving defaults for Proofound web usage.',
      },
      {
        title: 'Cookie Settings',
        path: '/cookies/settings',
        description:
          'Operational page for managing cookie consent choices and reviewing essential versus optional categories.',
      },
    ],
  },
];

const FULL_SECTIONS: LlmsSection[] = [
  ...BASE_SECTIONS,
  {
    heading: 'Technical Surfaces',
    entries: [
      {
        title: 'robots.txt',
        path: '/robots.txt',
        description:
          'Crawler directives for public web surfaces, including sitemap discovery and protected path exclusions.',
      },
      {
        title: 'sitemap.xml',
        path: '/sitemap.xml',
        description:
          'XML sitemap containing public static pages and only those portfolios explicitly allowed to be indexed.',
      },
    ],
  },
];

function formatEntry(entry: LlmsEntry): string {
  const siteUrl = getPublicSiteUrl();
  const normalizedPath = entry.path === '/' ? '' : entry.path;
  return `- [${entry.title}](${siteUrl}${normalizedPath}): ${entry.description}`;
}

export function renderLlmsTxt({ detailed = false }: { detailed?: boolean } = {}): string {
  const siteUrl = getPublicSiteUrl();
  const sections = detailed ? FULL_SECTIONS : BASE_SECTIONS;
  const lines: string[] = [
    '# Proofound',
    '',
    '> Proofound is a trust-first platform for public proof portfolios, privacy-safe credibility signals, and accountable collaboration workflows.',
    '',
  ];

  for (const section of sections) {
    lines.push(`## ${section.heading}`);
    lines.push('');
    for (const entry of section.entries) {
      lines.push(formatEntry(entry));
    }
    lines.push('');
  }

  lines.push('## Key Facts');
  lines.push('');
  lines.push(
    '- Proofound supports public proof portfolios for both individuals and organizations.'
  );
  lines.push('- Public portfolio visibility is explicit and privacy-constrained by default.');
  lines.push(
    '- Search indexing is limited to portfolios that satisfy Proofound publication requirements.'
  );
  lines.push(
    '- Matching and collaboration workflows exist, but public proof portfolios are the primary public web surface.'
  );
  lines.push('');
  lines.push('## Contact');
  lines.push('');
  lines.push(`- Website: ${siteUrl}`);
  lines.push('- General contact: hello@proofound.io');
  lines.push('');
  lines.push('## Optional');
  lines.push('');
  lines.push(
    '- Public portfolios are available on direct URLs only when the owner or organization explicitly publishes public-safe content.'
  );
  lines.push(
    '- Dynamic portfolio routes are privacy-gated and should not be assumed to be indexable unless the portfolio is explicitly marked searchable.'
  );
  lines.push('');

  return `${lines.join('\n').trim()}\n`;
}
