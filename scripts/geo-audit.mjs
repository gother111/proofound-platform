#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const DEFAULT_BASE_URL = 'https://proofound.io';
const PUBLIC_SURFACES = [
  { label: 'Homepage', path: '/' },
  { label: 'About', path: '/about' },
  { label: 'Manifesto', path: '/manifesto' },
  { label: 'Careers', path: '/careers' },
  { label: 'Contact', path: '/contact' },
  { label: 'Support', path: '/support' },
  { label: 'Privacy', path: '/privacy' },
  { label: 'Terms', path: '/terms' },
  { label: 'Cookies', path: '/cookies' },
  { label: 'Cookie Settings', path: '/cookies/settings' },
];
const CRITICAL_AI_CRAWLERS = [
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  'ClaudeBot',
  'PerplexityBot',
];

function normalizeBaseUrl(rawUrl) {
  try {
    const url = new URL(rawUrl || DEFAULT_BASE_URL);
    return url.toString().replace(/\/$/, '');
  } catch {
    return DEFAULT_BASE_URL;
  }
}

function parseArgs(argv) {
  const args = argv.slice(2);
  let outputPath = null;
  const positional = [];

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--output') {
      outputPath = args[index + 1] || null;
      index += 1;
      continue;
    }

    positional.push(arg);
  }

  return {
    baseUrl: normalizeBaseUrl(positional[0] || DEFAULT_BASE_URL),
    outputPath,
  };
}

function absoluteUrl(baseUrl, pagePath) {
  if (pagePath.startsWith('http://') || pagePath.startsWith('https://')) {
    return pagePath;
  }

  return `${baseUrl}${pagePath === '/' ? '' : pagePath}`;
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      'user-agent': 'Proofound-GEO-Audit/1.0',
      accept: 'text/html,text/plain,application/xml;q=0.9,*/*;q=0.8',
    },
    redirect: 'follow',
  });

  return {
    url,
    response,
    body: await response.text(),
  };
}

function extractTag(html, regex) {
  const match = html.match(regex);
  return match?.[1]?.trim() || null;
}

function countMatches(value, regex) {
  return (value.match(regex) || []).length;
}

function stripHtml(value) {
  return value
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function average(values) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function analyzePageHtml(html) {
  const title = extractTag(html, /<title[^>]*>([\s\S]*?)<\/title>/i);
  const canonical = extractTag(
    html,
    /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["'][^>]*>/i
  );
  const description =
    extractTag(html, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["'][^>]*>/i) ||
    extractTag(html, /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["'][^>]*>/i);
  const ogTitle =
    extractTag(html, /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["'][^>]*>/i) ||
    extractTag(html, /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["'][^>]*>/i);
  const twitterTitle =
    extractTag(html, /<meta[^>]+name=["']twitter:title["'][^>]+content=["']([^"']+)["'][^>]*>/i) ||
    extractTag(html, /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:title["'][^>]*>/i);
  const robots =
    extractTag(html, /<meta[^>]+name=["']robots["'][^>]+content=["']([^"']+)["'][^>]*>/i) ||
    extractTag(html, /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']robots["'][^>]*>/i);

  const paragraphs = [...html.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)]
    .map((match) => stripHtml(match[1] || ''))
    .filter(Boolean);
  const paragraphWordCounts = paragraphs.map(
    (paragraph) => paragraph.split(/\s+/).filter(Boolean).length
  );
  const citationReadyBlocks = paragraphWordCounts.filter(
    (count) => count >= 40 && count <= 180
  ).length;
  const jsonLdCount = countMatches(html, /<script[^>]+type=["']application\/ld\+json["'][^>]*>/gi);
  const headings = {
    h1: countMatches(html, /<h1\b[^>]*>/gi),
    h2: countMatches(html, /<h2\b[^>]*>/gi),
    h3: countMatches(html, /<h3\b[^>]*>/gi),
  };
  const listCount = countMatches(html, /<(ul|ol)\b[^>]*>/gi);
  const hasCanonical = Boolean(canonical);
  const hasDescription = Boolean(description);
  const hasOpenGraph = Boolean(ogTitle);
  const hasTwitter = Boolean(twitterTitle);

  const metadataScore =
    [hasCanonical, hasDescription, hasOpenGraph, hasTwitter].filter(Boolean).length * 25;
  const schemaScore = Math.min(jsonLdCount * 25, 100);
  const citabilityScore = Math.min(
    100,
    Math.round(
      citationReadyBlocks * 18 +
        Math.min(headings.h2 + headings.h3, 5) * 8 +
        Math.min(listCount, 4) * 6 +
        Math.min(average(paragraphWordCounts), 120) * 0.2
    )
  );
  const overallScore = Math.round(
    metadataScore * 0.45 + schemaScore * 0.3 + citabilityScore * 0.25
  );

  return {
    title,
    canonical,
    description,
    ogTitle,
    twitterTitle,
    robots,
    jsonLdCount,
    headings,
    listCount,
    citationReadyBlocks,
    averageParagraphWords: Number(average(paragraphWordCounts).toFixed(1)),
    metadataScore,
    schemaScore,
    citabilityScore,
    overallScore,
  };
}

function parseRobotsDirectives(robotsTxt) {
  const lines = robotsTxt
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'));

  const directivesByAgent = new Map();
  let currentAgents = [];

  for (const line of lines) {
    const separatorIndex = line.indexOf(':');
    if (separatorIndex === -1) continue;
    const key = line.slice(0, separatorIndex).trim().toLowerCase();
    const value = line.slice(separatorIndex + 1).trim();

    if (key === 'user-agent') {
      currentAgents = [value];
      if (!directivesByAgent.has(value)) {
        directivesByAgent.set(value, []);
      }
      continue;
    }

    if (currentAgents.length === 0) continue;

    for (const agent of currentAgents) {
      const directives = directivesByAgent.get(agent) || [];
      directives.push({ key, value });
      directivesByAgent.set(agent, directives);
    }
  }

  const sitemapLines = lines
    .filter((line) => line.toLowerCase().startsWith('sitemap:'))
    .map((line) => line.slice('sitemap:'.length).trim());

  const crawlerStatuses = CRITICAL_AI_CRAWLERS.map((crawler) => {
    const specific = directivesByAgent.get(crawler) || [];
    const wildcard = directivesByAgent.get('*') || [];
    const directives = specific.length > 0 ? specific : wildcard;
    const blocked = directives.some(
      (directive) => directive.key === 'disallow' && directive.value === '/'
    );

    return {
      crawler,
      blocked,
      usingWildcard: specific.length === 0,
    };
  });

  return {
    sitemapLines,
    crawlerStatuses,
    score: Math.max(
      0,
      100 -
        crawlerStatuses.filter((item) => item.blocked).length * 20 -
        (sitemapLines.length === 0 ? 10 : 0)
    ),
  };
}

function analyzeSitemap(xml) {
  const urlCount = countMatches(xml, /<url>/gi);
  const portfolioCount = countMatches(xml, /\/portfolio\//gi);
  return {
    urlCount,
    portfolioCount,
  };
}

function formatStatus(response) {
  return `${response.status} ${response.statusText}`.trim();
}

function buildReport({ baseUrl, timestamp, llmsChecks, robotsCheck, sitemapCheck, pageChecks }) {
  const lines = [
    '# Proofound GEO Audit',
    '',
    `- Base URL: ${baseUrl}`,
    `- Generated at (UTC): ${timestamp}`,
    '',
    '## Summary',
    '',
    `- Pages audited: ${pageChecks.length}`,
    `- llms.txt: ${formatStatus(llmsChecks.standard.response)}`,
    `- llms-full.txt: ${formatStatus(llmsChecks.full.response)}`,
    `- robots.txt score: ${robotsCheck.score}/100`,
    `- sitemap.xml URLs: ${sitemapCheck.urlCount}`,
    '',
    '## Public Page Findings',
    '',
  ];

  for (const page of pageChecks) {
    lines.push(`### ${page.label}`);
    lines.push('');
    lines.push(`- URL: ${page.url}`);
    lines.push(`- Status: ${formatStatus(page.response)}`);
    lines.push(`- Canonical: ${page.analysis.canonical || 'Missing'}`);
    lines.push(`- Robots meta: ${page.analysis.robots || 'Not set in HTML response'}`);
    lines.push(
      `- GEO score: ${page.analysis.overallScore}/100 (metadata ${page.analysis.metadataScore}, schema ${page.analysis.schemaScore}, citability ${page.analysis.citabilityScore})`
    );
    lines.push(
      `- JSON-LD blocks: ${page.analysis.jsonLdCount}; headings H1/H2/H3: ${page.analysis.headings.h1}/${page.analysis.headings.h2}/${page.analysis.headings.h3}; lists: ${page.analysis.listCount}`
    );
    lines.push(
      `- Citation-ready paragraph blocks: ${page.analysis.citationReadyBlocks}; avg paragraph words: ${page.analysis.averageParagraphWords}`
    );
    lines.push('');
  }

  lines.push('## AI Crawler Access');
  lines.push('');
  for (const crawler of robotsCheck.crawlerStatuses) {
    lines.push(
      `- ${crawler.crawler}: ${crawler.blocked ? 'Blocked' : 'Allowed'}${crawler.usingWildcard ? ' (wildcard rules)' : ''}`
    );
  }
  lines.push(
    `- Sitemap references: ${robotsCheck.sitemapLines.length > 0 ? robotsCheck.sitemapLines.join(', ') : 'Missing'}`
  );
  lines.push('');
  lines.push('## Sitemap');
  lines.push('');
  lines.push(`- Total URLs: ${sitemapCheck.urlCount}`);
  lines.push(`- Portfolio URLs: ${sitemapCheck.portfolioCount}`);
  lines.push('');
  lines.push('## Recommended Next Steps');
  lines.push('');
  lines.push('- Review any pages missing canonical or robots metadata.');
  lines.push('- Keep JSON-LD server-rendered and limited to publicly visible facts.');
  lines.push('- Re-run this audit after metadata or public copy changes.');
  lines.push('');

  return `${lines.join('\n')}\n`;
}

async function main() {
  const { baseUrl, outputPath } = parseArgs(process.argv);
  const pageChecks = [];

  for (const surface of PUBLIC_SURFACES) {
    const url = absoluteUrl(baseUrl, surface.path);
    const result = await fetchText(url);
    pageChecks.push({
      ...surface,
      url,
      response: result.response,
      analysis: analyzePageHtml(result.body),
    });
  }

  const [llmsStandard, llmsFull, robots, sitemap] = await Promise.all([
    fetchText(absoluteUrl(baseUrl, '/llms.txt')),
    fetchText(absoluteUrl(baseUrl, '/llms-full.txt')),
    fetchText(absoluteUrl(baseUrl, '/robots.txt')),
    fetchText(absoluteUrl(baseUrl, '/sitemap.xml')),
  ]);

  const report = buildReport({
    baseUrl,
    timestamp: new Date().toISOString(),
    llmsChecks: {
      standard: llmsStandard,
      full: llmsFull,
    },
    robotsCheck: parseRobotsDirectives(robots.body),
    sitemapCheck: analyzeSitemap(sitemap.body),
    pageChecks,
  });

  if (outputPath) {
    const absoluteOutputPath = path.resolve(process.cwd(), outputPath);
    fs.mkdirSync(path.dirname(absoluteOutputPath), { recursive: true });
    fs.writeFileSync(absoluteOutputPath, report, 'utf8');
    console.log(absoluteOutputPath);
    return;
  }

  process.stdout.write(report);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
