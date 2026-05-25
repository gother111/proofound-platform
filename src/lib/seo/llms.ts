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
          'Overview of the proof-first assignment review corridor, including Proof Packs, privacy-safe review, and structured assignment flow.',
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
    '> Proofound is a proof-first assignment review corridor centered on Proof Packs, privacy-safe review, direct-link Public Pages, and organization trust pages.',
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
    '- Proofound supports direct-link Public Pages for individuals and trust pages for organizations.'
  );
  lines.push(
    '- Public Page visibility is explicit, non-indexed for MVP, and privacy-constrained by default.'
  );
  lines.push(
    '- Individual Public Pages stay out of search indexing; organization trust pages require publication requirements.'
  );
  lines.push(
    '- Assignment review stays blind by default until a reveal step is needed inside the proof-review workflow.'
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
    '- Public Pages and organization trust pages are available on direct URLs only when the owner or organization explicitly publishes public-safe content.'
  );
  lines.push(
    '- Dynamic portfolio routes are privacy-gated and should not be assumed to be indexable unless publication settings explicitly allow indexing.'
  );
  lines.push('');

  return `${lines.join('\n').trim()}\n`;
}
