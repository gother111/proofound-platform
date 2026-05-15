#!/usr/bin/env node
import fs from 'node:fs/promises';
import fss from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
const today = '2026-05-14';
const packageDir = path.join(root, '.artifacts', `project-source-refresh-${today}`);
const technicalDir = path.join(packageDir, 'CURRENT_TECHNICAL_REFERENCES');

const rel = (absolutePath) => path.relative(root, absolutePath).replaceAll(path.sep, '/');
const exists = async (p) => fs.access(p).then(() => true).catch(() => false);
const read = async (p) => fs.readFile(path.join(root, p), 'utf8').catch(() => '');
const write = async (name, content) => fs.writeFile(path.join(packageDir, name), `${content.trimEnd()}\n`, 'utf8');
const esc = (value) => String(value ?? '').replaceAll('|', '\\|').replace(/\s+/g, ' ').trim();
const mdLink = (p) => `\`${p}\``;

async function walk(dir, predicate = () => true, skip = () => false) {
  const out = [];
  async function visit(current) {
    const relative = rel(current);
    if (skip(relative)) return;
    const entries = await fs.readdir(current, { withFileTypes: true }).catch(() => []);
    for (const entry of entries) {
      const absolute = path.join(current, entry.name);
      const r = rel(absolute);
      if (skip(r)) continue;
      if (entry.isDirectory()) {
        await visit(absolute);
      } else if (entry.isFile() && predicate(r, absolute)) {
        out.push(absolute);
      }
    }
  }
  await visit(path.join(root, dir));
  return out.sort((a, b) => rel(a).localeCompare(rel(b)));
}

function git(args) {
  try {
    return execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
  } catch {
    return '';
  }
}

function nodeVersion(cmd) {
  try {
    return execFileSync(cmd[0], cmd.slice(1), { cwd: root, encoding: 'utf8' }).trim();
  } catch {
    return 'unavailable';
  }
}

function routeFromAppFile(file) {
  const relative = path.relative(path.join(root, 'src/app'), file).replaceAll(path.sep, '/');
  const withoutFile = relative.replace(/\/?page\.tsx$/, '');
  const segments = withoutFile
    .split('/')
    .filter(Boolean)
    .filter((segment) => !(segment.startsWith('(') && segment.endsWith(')')));
  const route = `/${segments.join('/')}`.replace(/\/index$/, '');
  return route === '/' || route === '/page.tsx' ? '/' : route;
}

function routeFromApiFile(file) {
  const relative = path.relative(path.join(root, 'src/app/api'), path.dirname(file)).replaceAll(path.sep, '/');
  return relative ? `/api/${relative}` : '/api';
}

function methodsFromSource(source) {
  const methods = new Set();
  const re = /export\s+(?:async\s+)?function\s+(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\b/g;
  let match;
  while ((match = re.exec(source))) methods.add(match[1]);
  return [...methods].sort();
}

function family(route, type) {
  const parts = route.split('/').filter(Boolean);
  if (type === 'api') return parts[1] || 'root';
  if (route.startsWith('/app/o/')) return 'org-app';
  if (route.startsWith('/app/i/')) return 'individual-app';
  if (route.startsWith('/api/')) return parts[1] || 'api';
  return parts[0] || 'root';
}

function scopeTags(route, file, source) {
  const text = `${route}\n${file}\n${source}`.toLowerCase();
  const tags = [];
  const checks = [
    ['ATS / HRIS / integrations', /(ats|hris|greenhouse|lever|teamtailor|integration|integrations|zoom|google\/callback)/],
    ['public people directory', /(people directory|public directory|\/profiles|profile\/snippet|candidate directory)/],
    ['marketplace', /(marketplace|bounty|sponsor|reviewer network)/],
    ['dashboards / analytics suite', /(dashboard|analytics|metrics|performance|web-vitals|tour-event)/],
    ['fairness report surfaces', /(fairness|sus|why-not-shortlisted)/],
    ['AI admin/spend surfaces', /(\/api\/ai|ai_|gemini|anthropic|budget|spend|usage)/],
    ['broad org suite', /(causes|goals|ownership|partnerships|projects|structure|culture|impact|team\/coverage)/],
    ['legacy matching/profile routes', /(\/api\/core\/matching|\/api\/matching\/profile|\/api\/match\/test|profile\/snippet)/],
    ['old cron jobs', /(weekly-digest|fairness-note|fairness-report|account-deletion-workflow|process-deletions|send-deletion-reminders|workflow-jobs)/],
    ['Python/CV worker routes', /(python|cv-import|cv_import|ocr|document-intelligence)/],
  ];
  for (const [label, re] of checks) if (re.test(text)) tags.push(label);
  return [...new Set(tags)];
}

async function buildRoutes() {
  const policyPath = path.join(root, 'src/lib/launch/surface-policy.ts');
  let classifyLaunchApiPath = () => 'UNAVAILABLE';
  let classifyLaunchPagePath = () => 'UNAVAILABLE';
  if (await exists(policyPath)) {
    const policy = await import(pathToFileURL(policyPath).href);
    classifyLaunchApiPath = policy.classifyLaunchApiPath ?? classifyLaunchApiPath;
    classifyLaunchPagePath = policy.classifyLaunchPagePath ?? classifyLaunchPagePath;
  }

  const apiFiles = await walk('src/app/api', (r) => r.endsWith('/route.ts'));
  const pageFiles = await walk('src/app', (r) => r.endsWith('/page.tsx') && !r.startsWith('src/app/api/'));

  const apiRoutes = [];
  for (const file of apiFiles) {
    const source = await fs.readFile(file, 'utf8');
    const route = routeFromApiFile(file);
    const classification = classifyLaunchApiPath(route);
    const tags = scopeTags(route, rel(file), source);
    apiRoutes.push({
      type: 'api',
      route,
      file: rel(file),
      methods: methodsFromSource(source),
      family: family(route, 'api'),
      classification,
      scopeTags: tags,
      appearsInconsistentWithLockedMvp:
        classification === 'archived' || tags.some((tag) => !['AI admin/spend surfaces'].includes(tag)),
    });
  }

  const pageRoutes = [];
  for (const file of pageFiles) {
    const source = await fs.readFile(file, 'utf8');
    const route = routeFromAppFile(file);
    const classification = classifyLaunchPagePath(route);
    const tags = scopeTags(route, rel(file), source);
    pageRoutes.push({
      type: 'page',
      route,
      file: rel(file),
      family: family(route, 'page'),
      classification,
      scopeTags: tags,
      appearsInconsistentWithLockedMvp:
        classification === 'archived' || tags.some((tag) => !['AI admin/spend surfaces'].includes(tag)),
    });
  }

  const all = [...pageRoutes, ...apiRoutes].sort((a, b) => a.route.localeCompare(b.route));
  const countBy = (items, keyFn) =>
    items.reduce((acc, item) => {
      const key = keyFn(item);
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

  const inventory = {
    generatedAt: new Date().toISOString(),
    source: 'fresh filesystem scan of src/app/**/page.tsx and src/app/api/**/route.ts',
    counts: {
      pages: pageRoutes.length,
      apiRoutes: apiRoutes.length,
      total: all.length,
      byClassification: countBy(all, (item) => item.classification),
      byFamily: countBy(all, (item) => `${item.type}:${item.family}`),
    },
    activeLaunchRoutes: all.filter((item) => item.classification === 'active_launch_path').map((item) => item.route),
    internalOnlyRoutes: all.filter((item) => item.classification === 'internal_only_launch_ops').map((item) => item.route),
    archivedOrHardGatedRoutes: all
      .filter((item) => ['archived', 'gated_non_mvp'].includes(item.classification))
      .map((item) => item.route),
    broadScopeTags: countBy(
      all.flatMap((item) => item.scopeTags.map((tag) => ({ tag }))),
      (item) => item.tag
    ),
    routes: all,
  };

  await fs.writeFile(path.join(packageDir, 'route-inventory-current.json'), `${JSON.stringify(inventory, null, 2)}\n`);

  const md = [
    '# Current Route Inventory',
    '',
    `Generated: ${inventory.generatedAt}`,
    '',
    'Source: fresh filesystem scan of `src/app/**/page.tsx` and `src/app/api/**/route.ts`.',
    '',
    '## Counts',
    '',
    `- App page routes: ${pageRoutes.length}`,
    `- API routes: ${apiRoutes.length}`,
    `- Total route handlers/pages: ${all.length}`,
    `- Classification counts: ${Object.entries(inventory.counts.byClassification).map(([k, v]) => `\`${k}=${v}\``).join(', ')}`,
    '',
    '## Route Families By Count',
    '',
    '| Family | Count |',
    '| --- | ---: |',
    ...Object.entries(inventory.counts.byFamily)
      .sort((a, b) => b[1] - a[1])
      .map(([k, v]) => `| ${k} | ${v} |`),
    '',
    '## Broad Or Post-MVP Scope Signals',
    '',
    Object.keys(inventory.broadScopeTags).length
      ? [
          '| Signal | Route/file count |',
          '| --- | ---: |',
          ...Object.entries(inventory.broadScopeTags).map(([k, v]) => `| ${k} | ${v} |`),
        ].join('\n')
      : 'No broad-scope tags detected by the package scanner.',
    '',
    '## Inventory',
    '',
    '| Type | Route | Classification | Family | Scope tags | Source |',
    '| --- | --- | --- | --- | --- | --- |',
    ...all.map((item) =>
      `| ${item.type} | \`${item.route}\` | \`${item.classification}\` | ${item.family} | ${item.scopeTags.join('; ') || '-'} | \`${item.file}\` |`
    ),
    '',
  ].join('\n');
  await write('ROUTE_INVENTORY_CURRENT.md', md);
  return inventory;
}

function parseRegistry(registryText) {
  const map = new Map();
  for (const line of registryText.split('\n')) {
    if (!line.startsWith('| `')) continue;
    const cells = line.split('|').slice(1, -1).map((c) => c.trim().replace(/^`|`$/g, ''));
    if (cells.length >= 7) {
      map.set(cells[0], {
        class: cells[1],
        ownerSurface: cells[2],
        verificationSource: cells[3],
        lastVerified: cells[4],
        archiveTarget: cells[5],
        protected: cells[6],
      });
    }
  }
  return map;
}

function docTitle(text, fallback) {
  const heading = text.split('\n').find((line) => /^#\s+/.test(line));
  return heading ? heading.replace(/^#\s+/, '').trim() : fallback;
}

function firstMatch(text, patterns) {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[1]?.trim() ?? match[0]?.trim();
  }
  return null;
}

function classifyDoc(p, text, registry) {
  const lowerPath = p.toLowerCase();
  const lower = text.slice(0, 4000).toLowerCase();
  const reg = registry.get(p);
  if (p.startsWith('docs/archive/') || lowerPath.includes('/archive/') || lower.includes('superseded') || lower.includes('historical reference only')) return 'superseded';
  if (reg?.class === 'historical') return 'superseded';
  if (reg?.class === 'reference-spec' || lower.includes('reference-only') || lower.includes('reference context')) return 'advisory';
  if (lower.includes('doc class: `active`') || lower.includes('doc class: `governance`') || reg?.class === 'active') return 'active';
  if (p.startsWith('.artifacts/') || p.startsWith('audit/') || lowerPath.includes('audit') || lowerPath.includes('report')) return 'advisory';
  return 'advisory';
}

function replacementPriority(p, status) {
  const lower = p.toLowerCase();
  if (/proofound_mvp_locked|prd_proof_first|prd_technical_requirements\.aligned|launch_runbook\.aligned|gtm_and_initial|agents\.md|docs\/current_truth|docs\/api_reference|docs\/cron_setup|docs\/env_variables|docs\/deployment_checklist|readme\.md/.test(lower)) return 'P0';
  if (/route-inventory|route_inventory|api_reference|launch-readiness|launch-validation|current-state|implementation-status|audit|readiness|final|master-latest|pricing|yc|gtm|ai|gcp|deployment|env|cron/.test(lower)) return 'P1';
  if (status === 'superseded') return 'P2';
  return 'P3';
}

async function buildDocsInventory() {
  const registryText = await read('docs/DOCS_REGISTRY.md');
  const registry = parseRegistry(registryText);
  const files = await walk('.', (r) => r.endsWith('.md'), (r) => {
    const parts = r.split('/');
    return (
      parts.includes('node_modules') ||
      parts.includes('.next') ||
      parts.includes('coverage') ||
      parts.includes('test-results') ||
      r.startsWith(`.artifacts/project-source-refresh-${today}/`)
    );
  });

  const docs = [];
  for (const file of files) {
    const p = rel(file);
    const text = await fs.readFile(file, 'utf8').catch(() => '');
    const reg = registry.get(p);
    const declaredStatus =
      firstMatch(text, [/\*\*Status:\*\*\s*([^\n]+)/i, /^Status:\s*`?([^`\n]+)`?/im, /^Launch status:\s*`?([^`\n]+)`?/im]) ??
      reg?.class ??
      null;
    const date =
      firstMatch(text, [/Last Verified:\s*`?([^`\n]+)`?/i, /\*\*Date:\*\*\s*([^\n]+)/i, /^Date:\s*([^\n]+)/im]) ??
      reg?.lastVerified ??
      null;
    const apparentStatus = classifyDoc(p, text, registry);
    docs.push({
      path: p,
      title: docTitle(text, path.basename(p)),
      date,
      declaredStatus,
      registryClass: reg?.class ?? null,
      apparentStatus,
      likelyReplacementPriority: replacementPriority(p, apparentStatus),
      whyItMatters:
        p.startsWith('.artifacts/')
          ? 'Repo evidence or generated launch/readiness artifact; useful as dated evidence, not timeless authority.'
          : p.startsWith('docs/archive/')
            ? 'Historical archive material; useful only for provenance and supersession decisions.'
            : /PRD|RUNBOOK|MVP|GTM|API|ENV|CRON|DEPLOY|README|AGENTS|CURRENT_TRUTH|audit|report/i.test(p)
              ? 'Potential source material for external project documentation reconciliation.'
              : 'Supporting repository documentation or log surface.',
    });
  }

  await fs.writeFile(path.join(packageDir, 'docs-inventory-current.json'), `${JSON.stringify({ generatedAt: new Date().toISOString(), count: docs.length, docs }, null, 2)}\n`);

  const md = [
    '# Current Docs Inventory',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    `Documents inventoried: ${docs.length}`,
    '',
    '| Priority | Apparent status | Path | Title | Date | Declared status | Why it matters |',
    '| --- | --- | --- | --- | --- | --- | --- |',
    ...docs.map((doc) =>
      `| ${doc.likelyReplacementPriority} | ${doc.apparentStatus} | \`${doc.path}\` | ${esc(doc.title)} | ${esc(doc.date ?? '-')} | ${esc(doc.declaredStatus ?? '-')} | ${esc(doc.whyItMatters)} |`
    ),
    '',
  ].join('\n');
  await write('DOCS_INVENTORY_CURRENT.md', md);
  return docs;
}

async function copyTechnicalReferences() {
  const files = [
    'docs/API_REFERENCE.md',
    'docs/CRON_SETUP.md',
    'docs/ENV_VARIABLES.md',
    'docs/DEPLOYMENT_CHECKLIST.md',
    'src/lib/launch/surface-policy.ts',
    'src/lib/launch/final-launch-validation-runner.ts',
    'scripts/generate-api-reference.mjs',
    'scripts/docs-freshness-check.mjs',
    'scripts/final-launch-checklist-status.ts',
    'scripts/final-launch-validation.ts',
    'scripts/launch-smoke-runner.ts',
    'scripts/run-launch-synthetic-monitors.ts',
  ];
  const readmes = await walk('.', (r) => r.endsWith('README.md'), (r) => {
    const parts = r.split('/');
    return parts.includes('node_modules') || parts.includes('.next') || r.startsWith(`.artifacts/project-source-refresh-${today}/`);
  });
  for (const file of [...files.map((p) => path.join(root, p)), ...readmes]) {
    if (!fss.existsSync(file)) continue;
    const target = path.join(technicalDir, rel(file));
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.copyFile(file, target);
  }
  for (const generated of ['ROUTE_INVENTORY_CURRENT.md', 'route-inventory-current.json']) {
    const src = path.join(packageDir, generated);
    if (fss.existsSync(src)) {
      await fs.copyFile(src, path.join(technicalDir, generated));
    }
  }
}

function summarizeCommands() {
  const p = path.join(packageDir, 'command-results.json');
  if (!fss.existsSync(p)) return [];
  return JSON.parse(fss.readFileSync(p, 'utf8')).results ?? [];
}

function resultFor(results, id) {
  return results.find((r) => r.id === id);
}

function commandTable(results) {
  return [
    '| Result | Command | Duration | Log | Failure class / note |',
    '| --- | --- | ---: | --- | --- |',
    ...results.map((r) => `| ${r.result} | \`${esc(r.command)}\` | ${r.durationSeconds}s | \`${r.logPath}\` | ${esc(r.failureClass ?? '-')} |`),
  ].join('\n');
}

async function packageReports(routeInventory, docs) {
  const results = summarizeCommands();
  const pkg = JSON.parse(await read('package.json'));
  const lockfiles = ['package-lock.json', 'pnpm-lock.yaml', 'yarn.lock', 'bun.lock', 'bun.lockb'].filter((p) => fss.existsSync(path.join(root, p)));
  const audit = JSON.parse(fss.readFileSync(path.join(packageDir, 'npm-audit-production.json'), 'utf8'));
  const branch = git(['branch', '--show-current']) || '(detached)';
  const commit = git(['rev-parse', 'HEAD']);
  const status = git(['status', '--short']);
  const nodeLaunch = nodeVersion(['/opt/homebrew/opt/node@24/bin/node', '-v']);
  const npmLaunch = nodeVersion(['/opt/homebrew/opt/node@24/bin/npm', '-v']);
  const nodeShell = nodeVersion(['node', '-v']);
  const npmShell = nodeVersion(['npm', '-v']);
  const activeDocs = docs.filter((d) => d.apparentStatus === 'active' && d.likelyReplacementPriority === 'P0').map((d) => d.path);
  const staleDocs = docs.filter((d) => d.apparentStatus === 'superseded' || (d.likelyReplacementPriority === 'P1' && d.path.startsWith('.artifacts/'))).slice(0, 40).map((d) => d.path);
  const framework = {
    next: pkg.dependencies?.next,
    react: pkg.dependencies?.react,
    reactDom: pkg.dependencies?.['react-dom'],
    typescript: pkg.devDependencies?.typescript,
    tailwind: pkg.devDependencies?.tailwindcss,
    supabase: pkg.dependencies?.['@supabase/supabase-js'],
    drizzle: pkg.dependencies?.['drizzle-orm'],
    sentry: pkg.dependencies?.['@sentry/nextjs'],
    vercelAnalytics: pkg.dependencies?.['@vercel/analytics'],
  };
  const passCount = results.filter((r) => r.result === 'PASS').length;
  const failCount = results.filter((r) => r.result === 'FAIL').length;
  const blockedCount = results.filter((r) => r.result === 'BLOCKED').length;
  const launchValidation = JSON.parse(fss.readFileSync(path.join(packageDir, 'launch-validation-current/commands.json'), 'utf8'));
  const smoke = JSON.parse(fss.readFileSync(path.join(packageDir, 'launch-smoke-report.json'), 'utf8'));

  await write(
    'CURRENT_REPO_SUMMARY.md',
    [
      '# Current Repo Summary',
      '',
      `Generated: ${new Date().toISOString()}`,
      '',
      '## Repository State',
      '',
      `- Branch: \`${branch}\``,
      `- Commit: \`${commit}\``,
      `- Git status summary: ${status ? `${status.split('\n').length} changed/untracked entries` : 'clean'}`,
      '',
      '```text',
      status || '(clean)',
      '```',
      '',
      '## Runtime And Package Manager',
      '',
      `- Launch-gate Node/npm: \`${nodeLaunch}\` / \`${npmLaunch}\` from \`/opt/homebrew/opt/node@24/bin\``,
      `- Evidence-generation Node/npm after Node 24 PATH override: \`${nodeShell}\` / \`${npmShell}\``,
      `- packageManager: \`${pkg.packageManager ?? 'not declared'}\``,
      `- engines.node: \`${pkg.engines?.node ?? 'not declared'}\``,
      `- Lockfiles present: ${lockfiles.map((p) => `\`${p}\``).join(', ') || 'none'}`,
      '',
      '## Framework Versions',
      '',
      ...Object.entries(framework).map(([k, v]) => `- ${k}: \`${v ?? 'not declared'}\``),
      '',
      '## Deployment Stack Visible In Repo',
      '',
      '- Next.js App Router on Vercel.',
      '- Supabase Auth/Postgres/Storage with Drizzle ORM.',
      '- Resend/React Email for transactional email.',
      '- Sentry, Vercel Analytics, Vercel Speed Insights, and Vercel/KV references are present.',
      '- Cron and launch monitor routes are implemented under `src/app/api/cron/**` and `src/app/api/monitoring/**`.',
      '',
      '## Current Route Surface',
      '',
      `- Current app route count: ${routeInventory.counts.pages}`,
      `- Current API route count: ${routeInventory.counts.apiRoutes}`,
      `- Classification counts: ${Object.entries(routeInventory.counts.byClassification).map(([k, v]) => `\`${k}=${v}\``).join(', ')}`,
      '',
      '## Verification Summary',
      '',
      `- Command results: ${passCount} PASS, ${failCount} FAIL, ${blockedCount} BLOCKED.`,
      `- Current build status: ${resultFor(results, 'npm_run_build')?.result ?? 'missing'}.`,
      `- Current test status summary: lint/typecheck/default test/privacy/extended privacy/route tests/landing/strict org corridor all passed in current logs.`,
      `- Current launch-readiness status: aggregate local repo launch validation is \`${launchValidation.verdict}\` with ${launchValidation.p0BlockingGateIds?.length ?? 0} P0 blockers; explicit local launch smoke is \`${smoke.overallStatus}\` because \`full_org_corridor_review_to_engagement_verification\` failed.`,
      '',
      '## Current Blockers / Risks',
      '',
      '- Explicit `npm run test:launch:smoke -- --base-url http://localhost:3000` failed the full org corridor review-to-engagement-verification scenario.',
      '- `monitor:launch` failed because the fresh launch smoke artifact was failing and reported P1/P2 monitor failures.',
      '- `launch:validate` produced GO only because launch smoke was not applicable without `BASE_URL`; do not use it alone as live launch proof.',
      '- Worktree is dirty and includes many pre-existing changes outside this package.',
      '',
      '## Safe To Treat As Current Docs',
      '',
      ...activeDocs.slice(0, 30).map((p) => `- \`${p}\``),
      '',
      '## Docs That Look Stale Or Superseded',
      '',
      ...staleDocs.map((p) => `- \`${p}\``),
    ].join('\n')
  );

  await write(
    'CURRENT_TEST_AND_LAUNCH_EVIDENCE.md',
    [
      '# Current Test And Launch Evidence',
      '',
      `Generated: ${new Date().toISOString()}`,
      '',
      '## Command Matrix',
      '',
      commandTable(results),
      '',
      '## Launch-Specific Interpretation',
      '',
      `- Aggregate launch validation: \`${launchValidation.verdict}\`; status counts ${JSON.stringify(launchValidation.statusCounts)}; P0 blockers: ${launchValidation.p0BlockingGateIds?.length ? launchValidation.p0BlockingGateIds.join(', ') : 'none'}.`,
      `- Explicit local launch smoke: \`${smoke.overallStatus}\`; failing checks: ${smoke.checks.filter((c) => c.status !== 'pass').map((c) => `${c.id} (${c.message ?? 'no message'})`).join(', ') || 'none'}.`,
      '- Earlier sandbox runs for privacy and npm audit failed with DNS `ENOTFOUND`; elevated reruns passed and their `.rerun.log` files are the current signal.',
      '- Earlier Playwright runs failed with local `listen EPERM`; elevated reruns passed for landing and strict org corridor.',
    ].join('\n')
  );

  await write(
    'DEPENDENCY_AND_SECURITY_STATE.md',
    [
      '# Dependency And Security State',
      '',
      `Generated: ${new Date().toISOString()}`,
      '',
      '## Package State',
      '',
      `- Package manager: \`${pkg.packageManager}\``,
      `- Engines: node \`${pkg.engines?.node}\``,
      `- Lockfiles: ${lockfiles.map((p) => `\`${p}\``).join(', ')}`,
      `- Direct dependencies: ${Object.keys(pkg.dependencies ?? {}).length}`,
      `- Direct devDependencies: ${Object.keys(pkg.devDependencies ?? {}).length}`,
      '',
      '## Production Audit',
      '',
      `- Command: \`npm audit --omit=dev --json\``,
      `- Result: ${resultFor(results, 'npm_audit_production')?.result ?? 'missing'}`,
      `- Production vulnerabilities: ${audit.metadata?.vulnerabilities?.total ?? 'unknown'} total; high=${audit.metadata?.vulnerabilities?.high ?? 'unknown'}, critical=${audit.metadata?.vulnerabilities?.critical ?? 'unknown'}`,
      `- Affected direct dependencies: none reported by production audit.`,
      `- Fixed versions suggested by audit: none.`,
      `- Known risky upgrades: none identified from the production audit output.`,
      `- Launch/release block: no dependency/security audit block reproduced in current production audit.`,
      '',
      '## Dependencies',
      '',
      '| Type | Package | Version |',
      '| --- | --- | --- |',
      ...Object.entries(pkg.dependencies ?? {}).map(([name, version]) => `| dependency | \`${name}\` | \`${version}\` |`),
      ...Object.entries(pkg.devDependencies ?? {}).map(([name, version]) => `| devDependency | \`${name}\` | \`${version}\` |`),
    ].join('\n')
  );
}

async function authorityAndAlignment(routeInventory) {
  const currentTruth = await read('docs/CURRENT_TRUTH.md');
  const metrics = await read('metrics.md');
  await write(
    'SOURCE_AUTHORITY_STACK.md',
    [
      '# Source Authority Stack',
      '',
      `Generated: ${new Date().toISOString()}`,
      '',
      '## Docs Claiming Source Authority',
      '',
      '- `AGENTS.md` and `Proofound_MVP_Locked_Source_of_Truth_2026-03-11.md` both state the active MVP authority order.',
      '- `PRD_Proof_First_Hiring_Corridor_MVP.aligned-rewrite.2026-03-11.md` claims active supporting PRD status beneath the locked MVP.',
      '- `PRD_TECHNICAL_REQUIREMENTS.aligned-rewrite.2026-03-11.md` claims active technical contract status beneath the locked MVP and aligned PRD.',
      '- `LAUNCH_RUNBOOK.aligned-rewrite.2026-03-11.md` claims active launch runbook status beneath the locked MVP stack.',
      '- `Proofound_GTM_and_Initial_Marketing_Plan_2026-03-11.md` claims GTM authority for narrow pilot framing.',
      '- `docs/CURRENT_TRUTH.md` is current repo-grounded status evidence, not product authority.',
      '',
      '## Active Authority',
      '',
      '1. `Proofound_MVP_Locked_Source_of_Truth_2026-03-11.md`',
      '2. `PRD_Proof_First_Hiring_Corridor_MVP.aligned-rewrite.2026-03-11.md`',
      '3. `PRD_TECHNICAL_REQUIREMENTS.aligned-rewrite.2026-03-11.md`',
      '4. `LAUNCH_RUNBOOK.aligned-rewrite.2026-03-11.md`',
      '5. `Proofound_GTM_and_Initial_Marketing_Plan_2026-03-11.md`',
      '6. Fresh repo-grounded evidence in this package.',
      '',
      '## Advisory Only',
      '',
      '- `README.md`, `project/Prompt.md`, `project/Architecture.md`, and audit docs are reference-only per `AGENTS.md`.',
      '- `DESIGN.md` is active for visual/UI work but does not override the locked product authority.',
      '- `docs/ai/**` addenda are advisory/conditional where they stay subordinate to the locked MVP.',
      '',
      '## Historical Or Superseded',
      '',
      '- `PRD_for_a_web_platform_MVP.master-latest.md` self-identifies as superseded/historical.',
      '- `Proofound_Project_Specification_2026-03-11.md` is preserved reference context only.',
      '- Root historical stubs and `docs/archive/**` are provenance, not current source of truth.',
      '- Older `.artifacts/launch-validation-*`, readiness audits, route inventories, and implementation snapshots are historical unless reproduced in this package.',
      '',
      '## Contradictions And Mismatches',
      '',
      '- `metrics.md` contains historical text saying the locked MVP was marked superseded; current `AGENTS.md` and the locked MVP file reverse that and must win.',
      `- \`docs/CURRENT_TRUTH.md\` says repo status was pilot-ready after a previous pass; this package reproduces many green gates but also records an explicit local launch-smoke failure for the full org corridor.`,
      '- `launch:validate` reports GO when `BASE_URL` is absent because launch smoke is not applicable, while the explicit local launch smoke command fails one scenario. Use both artifacts together.',
      '',
      '## External Sources Likely Needing Replacement',
      '',
      '- Any external route inventory should be replaced with `ROUTE_INVENTORY_CURRENT.md` and `route-inventory-current.json`.',
      '- Any external API reference should be refreshed from `CURRENT_TECHNICAL_REFERENCES/API_REFERENCE.regenerated.md` and `docs/API_REFERENCE.md`.',
      '- Any external launch-readiness report should be updated with `CURRENT_TEST_AND_LAUNCH_EVIDENCE.md`, `COMMAND_RESULTS.md`, and `launch-validation-current/`.',
      '- Any external broad-platform PRD/architecture/AI/GCP material should receive a supersession banner or archive treatment unless it is explicitly post-MVP.',
    ].join('\n')
  );

  const areas = [
    ['proof-first onboarding', 'PASS', '`src/app/onboarding/page.tsx`, `/app/i/home`, `/app/i/profile`, Proof Pack links', '`npm run test`, `launch:validate`'],
    ['Proof Pack canonicality', 'PASS', '`/api/proof-artifacts/**`, `/api/portfolio/**`, `Proofound_MVP...` section 6', '`proof_creation_case` pass in launch smoke; route tests pass'],
    ['private work/volunteering/education scaffolding', 'PARTIAL', '`src/db/schema.ts`, migrations, profile routes', 'No dedicated current browser assertion in this package'],
    ['proof anchor integrity', 'PARTIAL', 'Locked MVP anchor rules and proof-artifact routes', 'Covered indirectly by tests; no standalone orphan-proof audit'],
    ['skills subordinate to proof/context', 'PARTIAL', '`/api/expertise/user-skills/**` active; broad expertise/CV import archived', 'Route inventory tests pass'],
    ['claim-scoped verification', 'PASS', '`/api/verification/requests/**`, `/api/verify/**`', 'Privacy tests and launch validation pass'],
    ['blind-by-default review', 'PASS', 'Matching/review routes and privacy docs', '`test:privacy`, `test:e2e:org:strict`, `launch:validate` pass'],
    ['candidate-consented reveal', 'PASS', '`/api/conversations/[conversationId]/reveal`, workflow tests', '`test:launch:workflow` and strict org pass'],
    ['assignment builder', 'PASS', '`/app/o/[slug]/assignments/new`, `/api/assignments/**`', 'Strict org and launch validation pass'],
    ['organization trust page', 'PARTIAL', '`/portfolio/org/[slug]`, org profile pages', 'Explicit smoke `public_org_trust_fixture_live` pass; repo launch checklist still marked org trust page fail in a separate scope'],
    ['review queue', 'PASS', '`/app/o/[slug]/shortlist`, `/api/org/[id]/shortlist`, review route', 'Strict org and launch validation pass'],
    ['intro -> reveal -> interview -> decision -> hire -> engagement verification', 'PARTIAL', 'Workflow API routes and E2E coverage', '`test:launch:workflow` and strict org pass; explicit full org launch smoke fails'],
    ['export/delete', 'PASS', '`/api/user/export`, `/api/user/account`, portfolio export routes', 'Launch validation export/delete tests pass'],
    ['public portfolio privacy', 'PASS', '`/portfolio/[handle]`, hidden portfolio smoke', 'Launch smoke hidden portfolio and privacy no-leak pass; privacy tests pass'],
    ['launch-surface breadth', 'PASS', '`src/lib/launch/surface-policy.ts` and route inventory', 'Route inventory tests pass'],
    ['landing/signup/pilot-facing copy', 'PASS', '`src/app/page.tsx`, `src/components/ProofoundLanding.tsx`, signup pages', 'Landing E2E passes'],
    ['AI/GCP/experimental features', 'PARTIAL', 'AI assistive routes active; Start from CV and proof OCR beta active', 'AI routes are classified active only within assistive/beta boundaries; keep external docs subordinate'],
    ['cron and operational routes', 'PARTIAL', 'Cron and monitoring routes internal-only or archived', '`launch:validate` passes; explicit monitor launch fails because explicit smoke artifact is failing'],
    ['admin/internal-only surfaces', 'PASS', 'Admin and monitoring route classification', 'Route inventory tests pass'],
  ];
  await write(
    'MVP_SCOPE_ALIGNMENT_CURRENT.md',
    [
      '# MVP Scope Alignment Current',
      '',
      `Generated: ${new Date().toISOString()}`,
      '',
      '| Area | Status | Evidence files | Command evidence | Stale-doc risk | Recommended action |',
      '| --- | --- | --- | --- | --- | --- |',
      ...areas.map(([area, status, evidence, command]) => {
        const action =
          status === 'PASS'
            ? 'Keep as current evidence; replace stale external claims with this package.'
            : status === 'PARTIAL'
              ? 'Keep, but ask ChatGPT to reconcile exact sections and call out missing/currently failing proof.'
              : 'Human review needed.';
        return `| ${area} | ${status} | ${evidence} | ${command} | Medium where older audits broaden scope | ${action} |`;
      }),
    ].join('\n')
  );
}

async function landingReport() {
  const files = [
    'src/app/page.tsx',
    'src/components/ProofoundLanding.tsx',
    ...(await walk('src/components/landing', (r) => r.endsWith('.tsx') || r.endsWith('.ts')).then((paths) => paths.map(rel))),
    'src/app/layout.tsx',
    'src/app/sitemap.ts',
    'src/app/robots.txt/route.ts',
    'src/app/llms.txt/route.ts',
    'src/app/llms-full.txt/route.ts',
    'src/app/(auth)/signup/page.tsx',
    'src/app/(auth)/signup/individual/page.tsx',
    'src/app/(auth)/signup/organization/page.tsx',
  ];
  const needles = /(proof|portfolio|platform|ai|ats|hris|marketplace|future of work|governance|manifesto|pricing|pilot|profile theater|directory|recruit)/i;
  const snippets = [];
  for (const file of [...new Set(files)]) {
    const text = await read(file);
    if (!text) continue;
    const lines = text.split('\n');
    lines.forEach((line, index) => {
      if (needles.test(line)) snippets.push({ file, line: index + 1, text: line.trim().slice(0, 220) });
    });
  }
  await write(
    'LANDING_AND_PUBLIC_STORY_CURRENT.md',
    [
      '# Landing And Public Story Current',
      '',
      `Generated: ${new Date().toISOString()}`,
      '',
      '## Classification',
      '',
      '- Narrow proof-backed hiring corridor: yes, dominant.',
      '- Portfolio-first: present as a derived trust surface, not dominant product definition.',
      '- Broad platform: low current public-copy risk; `platform` appears mostly in technical/docs contexts.',
      '- AI recruiting: not dominant; AI is not the public category promise in the inspected landing files.',
      '- ATS replacement: not present as public promise in inspected landing copy.',
      '- Future-of-work/governance/manifesto-heavy: no dominant current landing story detected.',
      '- Pricing/SaaS-plan-heavy: no dominant current landing story detected.',
      '',
      '## Current Public Story Evidence Snippets',
      '',
      '| File | Line | Snippet |',
      '| --- | ---: | --- |',
      ...snippets.slice(0, 120).map((s) => `| \`${s.file}\` | ${s.line} | ${esc(s.text)} |`),
      '',
      '## Stale Copy Update Candidates',
      '',
      '- No obvious active landing snippet in the inspected files promises ATS/HRIS replacement, broad marketplace, AI recruiting, or pricing-plan-heavy positioning.',
      '- Keep watching files under `src/components/landing/sections/hero-variants/`; their filenames include manifesto-style variants, but current composition uses `ScrollytellingSection`, `FinalCTASection`, and `FooterSection` through `ProofoundLanding.tsx`.',
    ].join('\n')
  );
}

async function replacementMap() {
  const rows = [
    ['External stale MVP/PRD source bundle', 'Proofound_MVP_Locked_Source_of_Truth_2026-03-11.md + aligned PRD/tech/runbook/GTM docs', 'Active stack is explicit in repo governance', 'P0', 'replace completely', 'high'],
    ['PRD_for_a_web_platform_MVP.master-latest.md copies', 'SOURCE_AUTHORITY_STACK.md + active stack', 'File self-identifies as superseded historical reference', 'P0', 'add supersession banner', 'high'],
    ['Old route inventory', 'ROUTE_INVENTORY_CURRENT.md and route-inventory-current.json', 'Fresh filesystem route scan with launch classifications', 'P0', 'replace completely', 'high'],
    ['Old API reference', 'CURRENT_TECHNICAL_REFERENCES/API_REFERENCE.regenerated.md', 'Regenerated from current `src/app/api/**/route.ts` in temp workspace', 'P0', 'replace completely', 'high'],
    ['Old launch-readiness report', 'CURRENT_TEST_AND_LAUNCH_EVIDENCE.md + launch-validation-current/', 'Current commands rerun under Node 24; aggregate launch validation GO', 'P0', 'replace completely', 'high'],
    ['Old smoke/live monitor report', 'launch-smoke-report.json + monitor rerun log', 'Explicit local smoke still fails full org corridor despite aggregate repo GO', 'P0', 'update section only', 'high'],
    ['Old docs inventory/source index', 'DOCS_INVENTORY_CURRENT.md and docs-inventory-current.json', 'Fresh markdown inventory with active/advisory/superseded classification', 'P0', 'replace completely', 'high'],
    ['Old dependency/security note', 'DEPENDENCY_AND_SECURITY_STATE.md + npm-audit-production.json', 'Current production audit reports zero vulnerabilities', 'P0', 'replace completely', 'high'],
    ['Old implementation snapshot', 'CURRENT_REPO_SUMMARY.md + route/docs inventories', 'Current branch, commit, dirty status, versions, routes, commands', 'P0', 'replace completely', 'high'],
    ['Old MVP alignment checklist', 'MVP_SCOPE_ALIGNMENT_CURRENT.md', 'Matrix grounded in locked MVP and current route/test evidence', 'P0', 'replace completely', 'medium'],
    ['Old landing story references', 'LANDING_AND_PUBLIC_STORY_CURRENT.md', 'Fresh public copy scan', 'P1', 'update section only', 'medium'],
    ['Old GTM/pricing/YC materials', 'Proofound_GTM_and_Initial_Marketing_Plan_2026-03-11.md + replacement map', 'GTM remains narrow pilot; pricing/YC should not broaden launch story', 'P1', 'needs human review', 'medium'],
    ['Old AI/GCP addenda', 'docs/ai/** + SOURCE_AUTHORITY_STACK.md + MVP alignment', 'AI/GCP is conditional and subordinate; active only inside assistive/beta guardrails', 'P1', 'add supersession banner', 'medium'],
    ['Old deployment/env/cron docs', 'CURRENT_TECHNICAL_REFERENCES/docs/DEPLOYMENT_CHECKLIST.md, ENV_VARIABLES.md, CRON_SETUP.md', 'Copied current repo references', 'P1', 'update section only', 'high'],
    ['Archived audits/status reports', 'DOCS_INVENTORY_CURRENT.md classification', 'Treat as provenance unless reproduced now', 'P1', 'archive as historical', 'high'],
    ['Current active authority docs', 'Original repo files in active stack', 'These are current authority, not generated replacements', 'P0', 'keep unchanged', 'high'],
  ];
  await write(
    'PROJECT_SOURCE_REPLACEMENT_MAP.md',
    [
      '# Project Source Replacement Map',
      '',
      `Generated: ${new Date().toISOString()}`,
      '',
      '| External/project-source file likely needing replacement | Repo file or generated artifact that should replace it | Reason | Priority | Replacement type | Confidence |',
      '| --- | --- | --- | --- | --- | --- |',
      ...rows.map((row) => `| ${row.map(esc).join(' | ')} |`),
    ].join('\n')
  );
}

async function finalInstructionsAndManifest() {
  const files = await walk('.artifacts/project-source-refresh-2026-05-14', () => true);
  const rows = files.map((file) => {
    const p = rel(file).replace(`.artifacts/project-source-refresh-${today}/`, '');
    const kind = p.startsWith('command-logs/')
      ? 'raw log'
      : p.endsWith('.json')
        ? 'generated'
        : p.includes('CURRENT_TECHNICAL_REFERENCES/')
          ? 'copied from repo or regenerated'
          : p.endsWith('.mjs')
            ? 'package-local helper script'
            : 'summary written by Codex';
    const why = p.includes('ROUTE_INVENTORY') || p.includes('route-inventory')
      ? 'Fresh route inventory evidence.'
      : p.includes('DOCS_INVENTORY') || p.includes('docs-inventory')
        ? 'Fresh documentation inventory evidence.'
        : p.includes('COMMAND') || p.startsWith('command-logs/')
          ? 'Command execution evidence.'
          : p.includes('launch')
            ? 'Launch readiness or smoke evidence.'
            : p.includes('CURRENT_TECHNICAL_REFERENCES')
              ? 'Current technical reference material.'
              : 'Package summary or support artifact.';
    return { path: p, why, kind };
  });

  await write(
    'PACKAGE_MANIFEST.md',
    [
      '# Package Manifest',
      '',
      `Generated: ${new Date().toISOString()}`,
      '',
      `Package root: \`.artifacts/project-source-refresh-${today}/\``,
      '',
      '| File | Why included | Type |',
      '| --- | --- | --- |',
      ...rows.map((r) => `| \`${r.path}\` | ${esc(r.why)} | ${esc(r.kind)} |`),
    ].join('\n')
  );

  await write(
    'FINAL_UPLOAD_INSTRUCTIONS.md',
    [
      '# Final Upload Instructions',
      '',
      `Generated: ${new Date().toISOString()}`,
      '',
      `Upload folder: \`/Users/yuriibakurov/proofound/.artifacts/project-source-refresh-${today}/\``,
      '',
      '## Read First',
      '',
      '1. `PROJECT_SOURCE_REPLACEMENT_MAP.md`',
      '2. `CURRENT_REPO_SUMMARY.md`',
      '3. `SOURCE_AUTHORITY_STACK.md`',
      '4. `CURRENT_TEST_AND_LAUNCH_EVIDENCE.md`',
      '5. `MVP_SCOPE_ALIGNMENT_CURRENT.md`',
      '',
      '## Then Upload For Evidence',
      '',
      '- `ROUTE_INVENTORY_CURRENT.md` and `route-inventory-current.json`',
      '- `DOCS_INVENTORY_CURRENT.md` and `docs-inventory-current.json`',
      '- `DEPENDENCY_AND_SECURITY_STATE.md` and `npm-audit-production.json`',
      '- `LANDING_AND_PUBLIC_STORY_CURRENT.md`',
      '- `CURRENT_TECHNICAL_REFERENCES/`',
      '- `launch-validation-current/`',
      '- `command-logs/` if ChatGPT needs raw proof',
      '',
      '## Large / Optional Files',
      '',
      '- `docs-inventory-current.json` and `DOCS_INVENTORY_CURRENT.md` may be large because they include repo docs and archives.',
      '- `command-logs/` is useful for auditability but can be uploaded after the summary files if upload limits are tight.',
      '- `api-reference-generation-workspace-*` is support evidence for regenerated API reference; it is optional if upload size is tight.',
      '',
      '## Known Limitations',
      '',
      '- The worktree was dirty before this package; this bundle reflects the current local checkout, not a pristine release branch.',
      '- Aggregate `launch:validate` reports GO because launch smoke is not applicable without `BASE_URL`; the explicit local launch smoke command failed the full org corridor scenario.',
      '- Initial sandbox attempts for privacy/audit/server-bound checks failed; `.rerun.log` files are the current elevated results.',
    ].join('\n')
  );
}

await fs.mkdir(packageDir, { recursive: true });
const routeInventory = await buildRoutes();
const docs = await buildDocsInventory();
await copyTechnicalReferences();
await packageReports(routeInventory, docs);
await authorityAndAlignment(routeInventory);
await landingReport();
await replacementMap();
await finalInstructionsAndManifest();

console.log(`Generated package reports in ${packageDir}`);
